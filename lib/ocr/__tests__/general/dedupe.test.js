const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { dedupeOperations, canonicalRef, externalRefOf } = require(`${o}/index.js`);
const { buildReviewItems, isDraftValid } = require(`${o}/import/review.js`);

const op = (p = {}) => ({
  source: 'mcb', reference: 'FT26301QW7K2', date: '2026-10-28', label: 'DB vente carte etrangere 1234 SPOTIFY',
  note: 'SPOTIFY', amount: -2190000, currency: 'MGA', kind: 'expense', merchant: 'SPOTIFY',
  categoryHint: 'bills', uncertain: [], ...p,
});
const tx = (p = {}) => ({
  id: 't1', type: 'expense', amount: 2190000, date: '2026-10-28', note: null,
  externalRef: null, isTransfer: false, ...p,
});

test('canonicalRef : O/0 et I/1 confondus', () => {
  assert.strictEqual(canonicalRef('FT26301QW7K2'), canonicalRef('FT263O1QW7K2'));
  assert.strictEqual(canonicalRef('FT26301QW7K2'), canonicalRef('ft26301qw7k2'));
  assert.notStrictEqual(canonicalRef('FT26301QW7K2'), canonicalRef('FT26301QW7K3'));
});

test('externalRefOf : préfixe source, null sans référence', () => {
  assert.strictEqual(externalRefOf(op()), 'mcb:FT26301QW7K2');
  assert.strictEqual(externalRefOf(op({ reference: null })), null);
});

test('référence connue en base → doublon "reference"', () => {
  const r = dedupeOperations([op()], [tx({ externalRef: 'mcb:FT263O1QW7K2' })]);
  assert.strictEqual(r.items[0].duplicate, 'reference');
});

test('même référence dans le lot → fusionnée', () => {
  const r = dedupeOperations([op(), op()], []);
  assert.strictEqual(r.items.length, 1);
  assert.strictEqual(r.merged, 1);
});

test('deux retraits GAB identiques, réfs différentes → pas fusionnés', () => {
  const a = op({ kind: 'transfer', label: 'Retrait sur GAB 551203 ANALAKELY', note: 'Retrait GAB', reference: 'FT26301AAAAA' });
  const b = { ...a, reference: 'FT26301BBBBB' };
  const r = dedupeOperations([a, b], []);
  assert.strictEqual(r.items.length, 2);
  assert.strictEqual(r.items[1].duplicate, null);
});

test('sans réf : lot même montant/date/libellé → doublon "batch"', () => {
  const r = dedupeOperations([op({ reference: null }), op({ reference: null })], []);
  assert.strictEqual(r.items[1].duplicate, 'batch');
});

test("saisie manuelle proche (±1 j, libellé) → 'similar', ne sert qu'une fois", () => {
  const existing = [tx({ date: '2026-10-27', note: 'Spotify' })];
  const r = dedupeOperations([op({ reference: 'FT26301AAAAA' }), op({ reference: 'FT26301BBBBB' })], existing);
  assert.strictEqual(r.items[0].duplicate, 'similar');
  assert.strictEqual(r.items[1].duplicate, null);
});

test('hors tolérance, autre montant, libellé ou type différents → pas doublon', () => {
  assert.strictEqual(dedupeOperations([op()], [tx({ date: '2026-10-25' })]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([op()], [tx({ amount: 2190001 })]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([op()], [tx({ note: 'Loyer appartement' })]).items[0].duplicate, null);
  assert.strictEqual(dedupeOperations([op()], [tx({ type: 'income' })]).items[0].duplicate, null);
});

test('transaction déjà importée avec une autre réf → pas "similar"', () => {
  const r = dedupeOperations([op()], [tx({ externalRef: 'mcb:FT26299ZZZZZ' })]);
  assert.strictEqual(r.items[0].duplicate, null);
});

test('retrait GAB vs ligne de transfert existante', () => {
  const g = op({ kind: 'transfer', amount: -15000000, note: 'Retrait GAB', label: 'Retrait GAB' });
  const ex = [tx({ type: 'expense', amount: 15000000, isTransfer: true, note: 'Retrait' })];
  assert.strictEqual(dedupeOperations([g], ex).items[0].duplicate, 'similar');
  assert.strictEqual(dedupeOperations([g], [tx({ amount: 15000000 })]).items[0].duplicate, null);
});

const ctx = { history: [{ note: 'spotify', categoryId: 'ent' }], validCategoryIds: new Set(['bills', 'ent']), bankId: 'b', cashId: 'c' };

test('brouillons : doublon décoché, historique > mot-clé, transfert → espèces', () => {
  const ops = dedupeOperations([
    op(),
    op({ kind: 'transfer', reference: 'FT26301AAAAA', amount: -100, merchant: null, categoryHint: null }),
    op({ reference: 'FT26301BBBBB', merchant: 'NETFLIX', note: 'NETFLIX' }),
  ], [tx({ externalRef: 'mcb:FT26301QW7K2' })]).items;
  const items = buildReviewItems(ops, ctx);
  assert.strictEqual(items[0].selected, false);
  assert.strictEqual(items[1].selected, true);
  assert.strictEqual(items[1].counterAccountId, 'c');
  assert.strictEqual(items[1].direction, 'debit');
  assert.strictEqual(items[0].categoryId, 'ent');
  assert.strictEqual(items[2].categoryId, 'bills');
  assert.strictEqual(items[2].amount, 2190000);
});

test('catégorie inexistante ignorée ; validité des comptes', () => {
  const items = buildReviewItems([{ op: op(), duplicate: null }], { ...ctx, history: [], validCategoryIds: new Set() });
  assert.strictEqual(items[0].categoryId, null);
  assert.strictEqual(isDraftValid({ ...items[0], accountId: null }), false);
  assert.strictEqual(isDraftValid({ ...items[0], kind: 'transfer', counterAccountId: 'b' }), false);
  assert.strictEqual(isDraftValid({ ...items[0], kind: 'transfer', counterAccountId: 'c' }), true);
  assert.strictEqual(isDraftValid({ ...items[0], amount: 0 }), false);
});
