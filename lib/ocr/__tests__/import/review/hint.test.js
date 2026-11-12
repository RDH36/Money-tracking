// duplicateHint (ligne sous le libellé) et matchId/match de dedupe.
const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { dedupeOperations } = require(`${o}/index.js`);
const { buildReviewItems, duplicateHint } = require(`${o}/import/review.js`);

const op = (p = {}) => ({
  source: 'mcb', reference: 'FT26301QW7K2', date: '2026-10-28', label: 'DB vente carte', note: 'SPOTIFY',
  amount: -2190000, currency: 'MGA', kind: 'expense', merchant: 'SPOTIFY', categoryHint: null, uncertain: [], ...p,
});
const tx = (p = {}) => ({ id: 't1', type: 'expense', amount: 2190000, date: '2026-10-28', note: null, externalRef: null, isTransfer: false, ...p });
const ctx = { history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash' };
const fmt = {
  money: (c) => `${c / 100} Ar`,
  date: (d) => `d:${d}`,
  category: (id) => (id === 'cat1' ? 'Abonnements' : null),
};
const item = (dup, match) => buildReviewItems([{ op: op(), duplicate: dup, matchId: match?.id ?? null, match: match ?? null }], ctx)[0];

test('dedupe : reference → matchId/match de la transaction trouvée', () => {
  const t = tx({ externalRef: 'mcb:FT26301QW7K2' });
  const r = dedupeOperations([op()], [t]).items[0];
  assert.strictEqual(r.duplicate, 'reference');
  assert.strictEqual(r.matchId, 't1');
  assert.strictEqual(r.match, t);
});

test('dedupe : similar → transaction similaire ; batch et nouvelle → null', () => {
  const t = tx({ id: 'tx9', note: 'Spotify' });
  const [a] = dedupeOperations([op({ reference: null })], [t]).items;
  assert.strictEqual(a.duplicate, 'similar');
  assert.deepStrictEqual([a.matchId, a.match], ['tx9', t]);
  const r = dedupeOperations([op({ reference: null, label: 'DB vente carte etrangere 1234 SPOTIFY' }), op({ reference: null, label: 'DB vente carte etrangere 1234 SPOTIFY' })], []).items;
  assert.strictEqual(r[1].duplicate, 'batch');
  assert.deepStrictEqual([r[1].matchId, r[1].match], [null, null]);
  assert.deepStrictEqual([r[0].matchId, r[0].match], [null, null]);
});

test('buildReviewItems recopie matchId/match', () => {
  const t = tx();
  const i = item('similar', t);
  assert.strictEqual(i.matchId, 't1');
  assert.strictEqual(i.match, t);
});

test('duplicateHint : reference et batch ont une clé fixe sans paramètre', () => {
  assert.deepStrictEqual(duplicateHint(item('reference'), fmt), { key: 'ocrImport.hint.reference' });
  assert.deepStrictEqual(duplicateHint(item('batch'), fmt), { key: 'ocrImport.hint.batch' });
});

test('duplicateHint : nouvelle opération → rien', () => {
  assert.strictEqual(duplicateHint(item(null), fmt), null);
});

test('duplicateHint similar : note + montant + date de la transaction trouvée', () => {
  const h = duplicateHint(item('similar', tx({ note: '  Café  ', amount: 500000 })), fmt);
  assert.deepStrictEqual(h, { key: 'ocrImport.hint.similar', params: { what: 'Café 5000 Ar', date: 'd:2026-10-28' } });
});

test('duplicateHint similar : note vide → nom de catégorie ; ni note ni catégorie → montant seul', () => {
  assert.strictEqual(duplicateHint(item('similar', tx({ note: null, categoryId: 'cat1' })), fmt).params.what, 'Abonnements 21900 Ar');
  assert.strictEqual(duplicateHint(item('similar', tx({ note: '   ', categoryId: 'cat1' })), fmt).params.what, 'Abonnements 21900 Ar');
  assert.strictEqual(duplicateHint(item('similar', tx({ note: null, categoryId: 'inconnue' })), fmt).params.what, '21900 Ar');
  assert.strictEqual(duplicateHint(item('similar', tx({ note: null })), fmt).params.what, '21900 Ar');
});

test('duplicateHint similar sans transaction liée : pas de ligne (pas de crash)', () => {
  assert.strictEqual(duplicateHint(item('similar'), fmt), null);
});
