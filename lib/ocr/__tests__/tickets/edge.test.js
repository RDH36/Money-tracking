const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parsePage, detectSource, dedupeOperations, externalRefOf, canonicalRef } = require(`${o}/index.js`);
const { parseTicketAmount, isAmountOnly } = require(`${o}/tickets/amount.js`);
const { findDates, isPlausibleDate } = require(`${o}/tickets/dates.js`);
const { buildReviewItems, isPaidCash } = require(`${o}/import/review.js`);
const fx = require(`${o}/__fixtures__/ticketPages.js`);
const mcb = require(`${o}/__fixtures__/mcbPages.js`);

const edit = (page, from, to) => ({ ...page, lines: page.lines.map((l) => ({ ...l, text: l.text.replace(from, to) })) });
const without = (page, re) => ({ ...page, lines: page.lines.filter((l) => !re.test(l.text)) });

test('montants : zéro, vide, milliers, décimales tronquées', () => {
  assert.strictEqual(parseTicketAmount('0.00 MGA').cents, 0);
  assert.strictEqual(parseTicketAmount('MGA'), null);
  assert.strictEqual(parseTicketAmount(''), null);
  assert.strictEqual(parseTicketAmount('1.500').cents, 150000); // 3 chiffres : milliers
  assert.strictEqual(parseTicketAmount('1 000 000.00').cents, 100000000);
  assert.strictEqual(parseTicketAmount('Ar 1.250.000').cents, 125000000);
  assert.strictEqual(parseTicketAmount('12,5').uncertain, true);
  assert.strictEqual(parseTicketAmount('60,000.00 MGA').uncertain, false);
  assert.strictEqual(parseTicketAmount('A56.000').uncertain, false);
  assert.ok(isAmountOnly('0.00 MGA'));
  assert.ok(!isAmountOnly('MONTANT 12'));
});

test('dates : invalides refusées, 4 chiffres, O lu pour 0, plausibilité', () => {
  assert.deepStrictEqual(findDates('31/02/26'), []);
  assert.deepStrictEqual(findDates('2026-13-01'), []);
  assert.deepStrictEqual(findDates('22/03/2026'), ['2026-03-22']);
  assert.deepStrictEqual(findDates('1O/1O/26'), ['2026-10-10']);
  assert.deepStrictEqual(findDates('le 01-10-26 et 2026-10-02'), ['2026-10-01', '2026-10-02']);
  assert.ok(isPlausibleDate('2026-10-30', '2026-10-29'));
  assert.ok(!isPlausibleDate('2026-10-31', '2026-10-29'));
});

test('GAB : frais = 2e opération dépense, réf. suffixée', () => {
  let p = edit(fx.GAB_PAGE, 'MONTANT FRAIS: 0.00 MGA', 'MONTANT FRAIS: 1,000.00 MGA');
  p = edit(p, 'MONTANT DEBITE: 60,000.00', 'MONTANT DEBITE: 61,000.00');
  const r = parsePage(p);
  assert.strictEqual(r.operations.length, 2);
  const [t, f] = r.operations;
  assert.deepStrictEqual([t.kind, t.amount, f.kind, f.amount, f.reference], ['transfer', -6000000, 'expense', -100000, `${t.reference}-frais`]);
});

test('GAB : montant débité incohérent => montant marqué incertain, jamais faux sûr', () => {
  const r = parsePage(edit(fx.GAB_PAGE, 'MONTANT DEBITE: 60,000.00', 'MONTANT DEBITE: 80,000.00'));
  assert.ok(r.operations.length === 0 || r.operations[0].uncertain.includes('amount'));
});

test('GAB : retrait à 0.00 ou sans date => aucune opération', () => {
  assert.strictEqual(parsePage(edit(fx.GAB_PAGE, "RETRAIT D'ARGENT: 60,000.00", "RETRAIT D'ARGENT: 0.00")).operations.length, 0);
  assert.strictEqual(parsePage(edit(fx.GAB_PAGE, '14-03-26', 'xx-xx-xx')).operations.length === 0
    || parsePage(edit(fx.GAB_PAGE, '14-03-26', 'xx-xx-xx')).operations[0].uncertain.includes('date'), true);
});

test('GAB : sans code d\'autorisation => réf. absente et marquée', () => {
  const r = parsePage(without(fx.GAB_PAGE, /AUTORISATION/));
  const op = r.operations[0];
  assert.ok(op.reference === null && op.uncertain.includes('reference'));
});

test('GAB : deux tickets identiques sur la photo => rien', () => {
  const dup = { ...fx.GAB_PAGE, width: 3000, lines: [...fx.GAB_PAGE.lines, ...fx.GAB_PAGE.lines.map((l) => ({ ...l, left: l.left + 1500, right: l.right + 1500 }))] };
  assert.strictEqual(parsePage(dup).operations.length, 0);
});

test('TPE : annulation/remboursement non importé comme dépense', () => {
  const p = { ...fx.TPE_PAGE, lines: [...fx.TPE_PAGE.lines, { text: 'ANNULATION', left: 300, top: 5, right: 600, bottom: 40, block: 99 }] };
  assert.strictEqual(parsePage(p).operations.length, 0);
});

test('TPE sans STAN : réf. partielle marquée incertaine', () => {
  const r = parsePage(without(fx.TPE_PAGE, /STAN/i));
  if (r.operations.length) assert.ok(r.operations[0].uncertain.includes('reference') || r.operations[0].reference);
});

test('caisse : sans total => pas d\'opération ; sous-total ignoré ; espèces par défaut', () => {
  const noTotal = { ...fx.RECEIPT_PAGE, lines: fx.RECEIPT_PAGE.lines.filter((l) => !/montant du/i.test(l.text)) };
  assert.strictEqual(parsePage(noTotal).operations.length, 0);
  const r = parsePage(fx.RECEIPT_PAGE);
  assert.strictEqual(r.operations[0].kind, 'expense');
  assert.ok(r.operations[0].amount < 0);
  const noCard = { ...fx.RECEIPT_PAGE, lines: fx.RECEIPT_PAGE.lines.filter((l) => !/card|carte|visa|cb\b/i.test(l.text)) };
  const r2 = parsePage(noCard);
  assert.strictEqual(r2.operations[0].payment, 'cash');
});

test('détection : le générique ne vole ni MCB, ni GAB, ni TPE, même pivotés', () => {
  for (const [page, id] of [[mcb.MCB_RECENT_PAGE, 'mcb'], [mcb.MCB_LIST_PAGE, 'mcb'], [fx.GAB_PAGE, 'boa-gab'], [fx.GAB_TILTED_PAGE, 'boa-gab'], [fx.TPE_PAGE, 'bmoi-tpe']]) {
    assert.strictEqual(detectSource(page).id, id);
    assert.strictEqual(parsePage(page).source, id);
  }
  assert.strictEqual(parsePage(mcb.MCB_RECENT_PAGE).operations.length > 0, true);
  assert.strictEqual(detectSource({ width: 100, height: 100, lines: [] }), null);
  assert.strictEqual(parsePage({ width: 100, height: 100, lines: [] }).source, null);
});

test('pivotée 90° dans les deux sens : TPE et caisse relus', () => {
  const cw = (p) => ({ width: p.height, height: p.width, lines: p.lines.map((l) => ({ ...l, left: l.top, right: l.bottom, top: p.width - l.right, bottom: p.width - l.left })) });
  const ccw = (p) => ({ width: p.height, height: p.width, lines: p.lines.map((l) => ({ ...l, left: p.height - l.bottom, right: p.height - l.top, top: l.left, bottom: l.right })) });
  for (const rot of [cw, ccw]) {
    assert.strictEqual(parsePage(rot(fx.TPE_PAGE)).operations[0]?.amount, -4870000);
    assert.strictEqual(parsePage(rot(fx.RECEIPT_PAGE)).operations[0]?.amount, -5600000);
  }
});

const ex = (over) => ({ id: 't', type: 'expense', amount: 4870000, date: '2026-03-21', note: null, externalRef: null, isTransfer: false, ...over });

test('anti-doublon : MCB ↔ MCB avec autre réf. inchangé, source sans préfixe ignorée', () => {
  const [tpe] = parsePage(fx.TPE_PAGE).operations;
  const mcbOp = { ...tpe, source: 'mcb', reference: 'FT26074AAAAA', note: 'x', label: 'x' };
  assert.strictEqual(dedupeOperations([mcbOp], [ex({ externalRef: 'mcb:FT26074BBBBB' })]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([mcbOp], [ex({ externalRef: 'FT26074BBBBB' })]).items[0].duplicate, null);
});

test('anti-doublon : sens, écart de date, montant', () => {
  const [tpe] = parsePage(fx.TPE_PAGE).operations;
  const mcbTx = ex({ externalRef: 'mcb:FT1' });
  assert.strictEqual(dedupeOperations([tpe], [mcbTx]).items[0].duplicate, 'similar');
  assert.strictEqual(dedupeOperations([tpe], [{ ...mcbTx, date: '2026-03-22' }]).items[0].duplicate, 'similar');
  assert.strictEqual(dedupeOperations([tpe], [{ ...mcbTx, date: '2026-03-23' }]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([tpe], [{ ...mcbTx, type: 'income' }]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([tpe], [{ ...mcbTx, amount: 4870001 }]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([tpe], [{ ...mcbTx, isTransfer: true }]).items[0].duplicate, null);
});

test('anti-doublon : retrait GAB ↔ jambe revenu MCB ne compte pas, jambe dépense oui', () => {
  const [gab] = parsePage(fx.GAB_PAGE).operations;
  const base = { amount: 6000000, date: '2026-03-14', externalRef: 'mcb:FT1', isTransfer: true };
  assert.strictEqual(dedupeOperations([gab], [ex({ ...base, type: 'income' })]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([gab], [ex({ ...base, type: 'expense' })]).items[0].duplicate, 'similar');
});

test('anti-doublon : réimport du même ticket => « reference », pour chaque source', () => {
  for (const page of [fx.GAB_PAGE, fx.TPE_PAGE, fx.RECEIPT_PAGE]) {
    const [op] = parsePage(page).operations;
    const ref = externalRefOf(op);
    assert.ok(ref && ref.startsWith(`${op.source}:`));
    const tx = ex({ amount: Math.abs(op.amount), date: op.date, externalRef: ref });
    assert.strictEqual(dedupeOperations([op], [tx]).items[0].duplicate, 'reference');
    // lot : même ticket photographié 2 fois => fusion
    assert.strictEqual(dedupeOperations([op, op], []).merged, 1);
  }
});

test('références construites : formats annoncés', () => {
  assert.match(externalRefOf(parsePage(fx.GAB_PAGE).operations[0]), /^boa-gab:\d+-\d+-\d+$/);
  assert.match(externalRefOf(parsePage(fx.TPE_PAGE).operations[0]), /^bmoi-tpe:\d+-\d+$/);
  assert.match(externalRefOf(parsePage(fx.RECEIPT_PAGE).operations[0]), /^receipt:[a-z0-9]+-\d{4}-\d{2}-\d{2}-\d+$/);
  assert.strictEqual(canonicalRef('boa-gab:2000-41-27'), canonicalRef('BOA-GAB:2000-41-27'));
});

test('anti-doublon lot : mêmes montants mais même source et même jour => comportement MCB intact', () => {
  const [a] = parsePage(fx.TPE_PAGE).operations;
  const b = { ...a, reference: null, date: '2026-03-22' };
  const c = { ...a, reference: null };
  // même source, dates différentes : pas un doublon de lot (règle MCB : même date)
  assert.strictEqual(dedupeOperations([{ ...a, reference: null }, b], []).items[1].duplicate, null);
  assert.strictEqual(dedupeOperations([{ ...a, reference: null }, c], []).items[1].duplicate, 'batch');
});

test('comptes proposés : espèces → compte espèces, carte/MCB → banque, GAB → transfert banque→espèces', () => {
  const ctx = { history: [], validCategoryIds: new Set(['other', 'food']), bankId: 'bank', cashId: 'cash' };
  const cashOp = { ...parsePage(fx.RECEIPT_PAGE).operations[0], payment: 'cash' };
  const card = parsePage(fx.TPE_PAGE).operations[0];
  const gab = parsePage(fx.GAB_PAGE).operations[0];
  const items = buildReviewItems(dedupeOperations([cashOp, card, gab], []).items, ctx);
  const byKind = Object.fromEntries(items.map((i) => [i.op.source, i]));
  assert.strictEqual(byKind.receipt.accountId, 'cash');
  assert.ok(isPaidCash(byKind.receipt));
  assert.strictEqual(byKind['bmoi-tpe'].accountId, 'bank');
  assert.ok(!isPaidCash(byKind['bmoi-tpe']));
  assert.deepStrictEqual([byKind['boa-gab'].accountId, byKind['boa-gab'].counterAccountId, byKind['boa-gab'].direction], ['bank', 'cash', 'debit']);
  // sans compte espèces : retombe sur la banque
  const noCash = buildReviewItems([{ op: cashOp, duplicate: null }], { ...ctx, cashId: null });
  assert.strictEqual(noCash[0].accountId, 'bank');
  // MCB inchangé
  const m = parsePage(mcb.MCB_RECENT_PAGE).operations;
  for (const i of buildReviewItems(dedupeOperations(m, []).items, ctx)) assert.strictEqual(i.accountId, 'bank');
});
