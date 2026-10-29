const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parsePage, detectSource, dedupeOperations } = require(`${o}/index.js`);
const { parseTicketAmount } = require(`${o}/tickets/amount.js`);
const { findDates } = require(`${o}/tickets/dates.js`);
const fx = require(`${o}/__fixtures__/ticketPages.js`);
const mcb = require(`${o}/__fixtures__/mcbPages.js`);

test('montants des tickets : US, espaces, point des milliers, « A » pour Ar', () => {
  assert.strictEqual(parseTicketAmount('60,000.00 MGA').cents, 6000000);
  assert.strictEqual(parseTicketAmount('48 700. 00 MGA').cents, 4870000);
  assert.strictEqual(parseTicketAmount('A56.000').cents, 5600000);
  assert.strictEqual(parseTicketAmount('Ar 56.000').cents, 5600000);
  assert.strictEqual(parseTicketAmount('1 500,50').cents, 150050);
  assert.strictEqual(parseTicketAmount('i0.417').cents, 1041700);
  assert.strictEqual(parseTicketAmount('20,00,000.00').uncertain, true);
});

test('dates des tickets : JJ-MM-AA, JJ/MM/AA, AAAA-MM-JJ', () => {
  assert.deepStrictEqual(findDates('4127 14-03-26 08:12:40'), ['2026-03-14']);
  assert.deepStrictEqual(findDates('21/03/26'), ['2026-03-21']);
  assert.deepStrictEqual(findDates('2026-03-22  7:28 PM'), ['2026-03-22']);
  assert.deepStrictEqual(findDates('05/28'), []);
});

test('GAB BOA droit : transfert, réf. GAB-tran-auth', () => {
  const r = parsePage(fx.GAB_PAGE);
  assert.strictEqual(r.source, 'boa-gab');
  assert.strictEqual(r.operations.length, 1);
  const op = r.operations[0];
  assert.deepStrictEqual([op.date, op.amount, op.kind, op.reference, op.uncertain],
    ['2026-03-14', -6000000, 'transfer', '20004417-4127-318604', []]);
});

test('GAB BOA incliné, 2e ticket coupé : valeurs appariées par rang', () => {
  const r = parsePage(fx.GAB_TILTED_PAGE);
  assert.strictEqual(r.operations.length, 1);
  const op = r.operations[0];
  assert.deepStrictEqual([op.date, op.amount, op.reference, op.uncertain],
    ['2026-03-02', -25000000, '20004417-5306-550713', []]);
});

test('TPE BMOI : dépense carte, marchand, réf. auth-STAN', () => {
  const r = parsePage(fx.TPE_PAGE);
  assert.strictEqual(r.source, 'bmoi-tpe');
  const [op] = r.operations;
  assert.deepStrictEqual([op.date, op.amount, op.kind, op.merchant, op.reference, op.payment, op.uncertain],
    ['2026-03-21', -4870000, 'expense', 'LE PETIT GRILL TANA', '246813-003571', 'card', []]);
});

test('ticket de caisse : total, carte, n° de commande, restauration', () => {
  const r = parsePage(fx.RECEIPT_PAGE, undefined);
  assert.strictEqual(r.source, 'receipt');
  const [op] = r.operations;
  assert.deepStrictEqual([op.date, op.amount, op.payment, op.categoryHint], ['2026-03-22', -5600000, 'card', 'food']);
  assert.match(op.reference, /-2026-03-22-0587$/);
  assert.ok(op.uncertain.includes('date')); // deux dates différentes lues sur le ticket
});

test('détection : aucune source ne vole l\'autre, MCB inchangé', () => {
  assert.strictEqual(detectSource(mcb.MCB_RECENT_PAGE).id, 'mcb');
  assert.strictEqual(detectSource(mcb.MCB_LIST_PAGE).id, 'mcb');
  assert.strictEqual(detectSource(fx.GAB_PAGE).id, 'boa-gab');
  assert.strictEqual(detectSource(fx.TPE_PAGE).id, 'bmoi-tpe');
  assert.strictEqual(detectSource(fx.RECEIPT_PAGE).id, 'receipt');
});

test('photo avec deux sortes de tickets : non reconnue', () => {
  const mixed = { width: 3000, height: 2000, lines: [...fx.TPE_PAGE.lines, ...fx.RECEIPT_PAGE.lines.map((l) => ({ ...l, left: l.left + 1500, right: l.right + 1500 }))] };
  assert.strictEqual(parsePage(mixed).source, null);
});

test('photo pivotée de 90° : relue dans le bon sens', () => {
  const p = fx.GAB_PAGE;
  const rotated = { width: p.height, height: p.width, lines: p.lines.map((l) => ({ ...l, left: p.height - l.bottom, right: p.height - l.top, top: l.left, bottom: l.right })) };
  const r = parsePage(rotated);
  assert.strictEqual(r.operations[0]?.amount, -6000000);
});

test('anti-doublon : ticket GAB face à une ligne MCB déjà importée', () => {
  const [op] = parsePage(fx.GAB_PAGE).operations;
  const tx = { id: 't1', type: 'expense', amount: 6000000, date: '2026-03-15', note: 'Retrait GAB X', externalRef: 'mcb:FT26074AAAAA', isTransfer: true };
  assert.strictEqual(dedupeOperations([op], [tx]).items[0].duplicate, 'similar');
  // Même source, autre référence : pas un doublon.
  assert.strictEqual(dedupeOperations([op], [{ ...tx, externalRef: 'boa-gab:1-2-3' }]).items[0].duplicate, null);
});

test('anti-doublon dans le lot : ticket de caisse + ticket carte du même achat', () => {
  const [card] = parsePage(fx.TPE_PAGE).operations;
  const [receipt] = parsePage(fx.RECEIPT_PAGE).operations;
  const r = dedupeOperations([receipt, { ...card, amount: receipt.amount, date: receipt.date }], []);
  assert.deepStrictEqual(r.items.map((i) => i.duplicate), [null, 'batch']);
});

test('anti-doublon : même ticket de caisse rephotographié (émetteur lu autrement)', () => {
  const [op] = parsePage(fx.RECEIPT_PAGE).operations;
  const tx = { id: 't1', type: 'expense', amount: 5600000, date: '2026-03-22', note: 'GR1LL TANA', externalRef: 'receipt:grlltan-2026-03-22-0587', isTransfer: false };
  assert.strictEqual(dedupeOperations([op], [tx]).items[0].duplicate, 'similar');
});
