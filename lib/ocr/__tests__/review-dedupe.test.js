const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { dedupeOperations, parsePage, externalRefOf } = require(`${o}/index.js`);
const { buildReviewItems } = require(`${o}/import/review.js`);

// Fixtures inventées (aucune donnée réelle).
const op = (p = {}) => ({
  source: 'mcb', reference: 'FT26301QW7K2', date: '2026-10-28', label: 'DB vente carte etrangere 1234 SPOTIFY',
  note: 'SPOTIFY', amount: -2190000, currency: 'MGA', kind: 'expense', merchant: 'SPOTIFY',
  categoryHint: null, uncertain: [], ...p,
});
const tx = (p = {}) => ({
  id: 't1', type: 'expense', amount: 2190000, date: '2026-10-28', note: null,
  externalRef: null, isTransfer: false, ...p,
});
const L = (text, top, left = 48, extra = {}) =>
  ({ text, left, top, right: left + 400, bottom: top + 30, color: '#181818', ...extra });
const page = (lines) => ({ width: 1080, height: 2400, lines });

test('« | » au milieu d’un mot du libellé → « I »', () => {
  const r = parsePage(page([
    L('12 oct. 2026', 100),
    L('Retrait sur GAB confrere 551203', 180),
    L('BNIMGXB-GAB-2-|VOSY', 235),
    L('Ref: FT26285KD3P1\\BNK', 285),
    L('MGA -150 000,00', 360, 695),
  ]));
  const o1 = r.operations[0];
  assert.ok(o1.label.includes('GAB-2-IVOSY'));
  assert.ok(!o1.label.includes('|') && !o1.note.includes('|'));
  assert.strictEqual(o1.kind, 'transfer');
  assert.strictEqual(o1.amount, -15000000);
});

const ctx = (cats) => ({ history: [], validCategoryIds: new Set(cats), bankId: 'b', cashId: 'c' });
const review = (ops, cats) => buildReviewItems(ops.map((x) => ({ op: x, duplicate: null })), ctx(cats));

test('dépense sans suggestion → « other » si présent, sinon null', () => {
  assert.strictEqual(review([op({ merchant: 'XYZ', note: 'XYZ' })], ['other'])[0].categoryId, 'other');
  assert.strictEqual(review([op({ merchant: 'XYZ', note: 'XYZ' })], ['food'])[0].categoryId, null);
});

test('revenu et transfert : jamais de catégorie « other »', () => {
  const [inc, tr] = review([
    op({ kind: 'income', amount: 500000, reference: 'FT26301AAAAA' }),
    op({ kind: 'transfer', reference: 'FT26301BBBBB', amount: -100000 }),
  ], ['other']);
  assert.strictEqual(inc.categoryId, null);
  assert.strictEqual(inc.direction, 'credit');
  assert.strictEqual(inc.counterAccountId, null);
  assert.strictEqual(tr.categoryId, null);
  assert.strictEqual(tr.counterAccountId, 'c');
  assert.strictEqual(tr.direction, 'debit');
});

test('doublon → décoché, non doublon → coché', () => {
  const items = buildReviewItems(
    [{ op: op(), duplicate: 'reference' }, { op: op({ reference: 'FT26301ZZZZZ' }), duplicate: null }],
    ctx(['other'])
  );
  assert.deepStrictEqual(items.map((i) => i.selected), [false, true]);
});

test('référence lue avec O au lieu de 0 : fusion dans le lot et doublon en base', () => {
  const a = op({ reference: 'FT26301QW7K2' });
  const b = op({ reference: 'FT263O1QW7K2' });
  const r = dedupeOperations([a, b], []);
  assert.strictEqual(r.items.length, 1);
  assert.strictEqual(r.merged, 1);
  const inDb = dedupeOperations([b], [tx({ externalRef: externalRefOf(a), id: 'x' })]);
  assert.strictEqual(inDb.items[0].duplicate, 'reference');
  // stocké avec la lecture erronée, ré-importé avec la bonne
  const rev = dedupeOperations([a], [tx({ externalRef: 'mcb:FT262748K3DO' })]);
  assert.strictEqual(rev.items[0].duplicate, null);
  const rev2 = dedupeOperations([op({ reference: 'FT262748K3D0' })], [tx({ externalRef: 'mcb:FT262748K3DO' })]);
  assert.strictEqual(rev2.items[0].duplicate, 'reference');
});

test('référence avec espace au milieu : lue sans espace, donc identique', () => {
  const r = parsePage(page([
    L('12 oct. 2026', 100),
    L('DB vente carte etrangere 123456 BOLT', 180),
    L('Ref: FT262 748 K3DO\\BNK', 235),
    L('MGA -12 340,00', 310, 695),
  ]));
  assert.strictEqual(r.operations.length, 1);
  assert.strictEqual(r.operations[0].reference, 'FT262748K3DO');
});

test('deux retraits identiques (même date), références différentes : ni fusion ni doublon, même en base', () => {
  const w = (ref) => op({
    kind: 'transfer', reference: ref, amount: -15000000, label: 'Retrait sur GAB 551203 ANALAKELY', note: 'Retrait GAB',
  });
  const r = dedupeOperations([w('FT26301AAAAA'), w('FT26301CCCCC')], []);
  assert.strictEqual(r.items.length, 2);
  assert.deepStrictEqual(r.items.map((i) => i.duplicate), [null, null]);
  const exBase = [tx({ amount: 15000000, isTransfer: true, externalRef: 'mcb:FT26301AAAAA' })];
  assert.deepStrictEqual(dedupeOperations([w('FT26301CCCCC')], exBase).items.map((i) => i.duplicate), [null]);
});

test('opération coupée en haut (montant seul) et en bas (libellé + réf sans montant) : partial, non importées', () => {
  const r = parsePage(page([
    L('MGA -9 000,00', 60, 695),
    L('12 oct. 2026', 200),
    L('DB vente carte etrangere 123456 BOLT', 280),
    L('Ref: FT26285AB12C\\BNK', 335),
    L('MGA -12 340,00', 410, 695),
    L('09 oct. 2026', 600),
    L('DB vente carte etrangere 654321 SPOTIFY', 680),
    L('Ref: FT26282TT4WZ\\BNK', 735),
  ]));
  assert.strictEqual(r.operations.length, 1);
  assert.strictEqual(r.operations[0].reference, 'FT26285AB12C');
  assert.strictEqual(r.partial, 2);
});

test('montants en centimes, débit/crédit, GAB = transfert, salaire = revenu', () => {
  const r = parsePage(page([
    L('28 oct. 2026', 100),
    L('Virement recus Banque Confrere ACME', 180),
    L('Salaire Octobre', 230),
    L('Ref: FT26301HN4VA\\BNK', 280),
    L('MGA 1 735 000,00', 350, 640, { color: '#21966d' }),
    L('Retrait sur GAB confrere 551203', 480),
    L('Ref: FT26301QW7K2\\BNK', 530),
    L('MGA -318 270,64', 600, 640),
  ]));
  const [sal, gab] = r.operations;
  assert.strictEqual(sal.kind, 'income');
  assert.strictEqual(sal.amount, 173500000);
  assert.strictEqual(gab.kind, 'transfer');
  assert.strictEqual(gab.amount, -31827064);
});
