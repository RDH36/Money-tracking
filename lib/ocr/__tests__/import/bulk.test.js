// « Tout cocher » : bulkAction / applyBulk (pur).
const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { buildReviewItems, bulkAction, applyBulk } = require(`${o}/import/review.js`);

const op = (p = {}) => ({
  source: 'mcb', reference: 'FT00000AAAA1', date: '2026-10-28', label: 'DB TEST', note: 'TEST', amount: -1000000,
  currency: 'MGA', kind: 'expense', merchant: 'TEST', categoryHint: null, uncertain: [], ...p,
});
const ctx = { history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash' };
const build = (dups) => buildReviewItems(dups.map((duplicate, i) => ({ op: op({ reference: `FT0000${i}AAAA` }), duplicate, matchId: null, match: null })), ctx);
const keys = (items) => new Set(items.map((i) => i.key));
const sel = (items) => items.map((i) => i.selected);

test('bulkAction : rien de cochable (liste vide, que des « Déjà enregistrée »)', () => {
  assert.deepStrictEqual(bulkAction([]), { action: 'none', duplicates: 0 });
  assert.strictEqual(bulkAction(build(['reference', 'reference'])).action, 'none');
});

test('bulkAction : nouvelles décochées → selectNew, avec le nombre de doublons en attente', () => {
  const items = build([null, null, 'similar', 'batch']).map((i) => (i.duplicate === null ? { ...i, selected: false } : i));
  assert.deepStrictEqual(bulkAction(items), { action: 'selectNew', duplicates: 2 });
});

test('bulkAction : nouvelles cochées + doublons non cochés → selectDuplicates ; tout coché → clear', () => {
  const items = build([null, 'similar', 'batch', 'reference']);
  assert.deepStrictEqual(bulkAction(items), { action: 'selectDuplicates', duplicates: 2 });
  const all = items.map((i) => (i.duplicate === 'reference' ? i : { ...i, selected: true }));
  assert.deepStrictEqual(bulkAction(all), { action: 'clear', duplicates: 0 });
});

test('bulkAction : sans nouvelle opération, que des doublons → selectDuplicates puis clear', () => {
  const items = build(['similar', 'batch']);
  assert.strictEqual(bulkAction(items).action, 'selectDuplicates');
  assert.strictEqual(bulkAction(items.map((i) => ({ ...i, selected: true }))).action, 'clear');
});

test('applyBulk : cycle complet coche nouvelles → coche doublons → décoche tout, « reference » jamais touchée', () => {
  let items = build([null, null, 'similar', 'batch', 'reference']).map((i) => (i.duplicate === null ? { ...i, selected: false } : i));
  const ref = items[4];
  const all = keys(items);
  items = applyBulk(items, all);
  assert.deepStrictEqual(sel(items), [true, true, false, false, false]);
  items = applyBulk(items, all);
  assert.deepStrictEqual(sel(items), [true, true, true, true, false]);
  items = applyBulk(items, all);
  assert.deepStrictEqual(sel(items), [false, false, false, false, false]);
  assert.strictEqual(items[4], ref);
});

test('applyBulk : « reference » cochée de force reste cochée (jamais modifiée), même au « clear »', () => {
  const items = build([null, 'reference']).map((i) => ({ ...i, selected: true }));
  const out = applyBulk(items, keys(items));
  assert.strictEqual(out[1], items[1]);
  assert.strictEqual(out[0].selected, false);
});

test('applyBulk : seules les clés données bougent (groupe de date) et la décision vient du groupe', () => {
  const base = build([null, null, 'similar']);
  base[0] = { ...base[0], selected: false };
  base[1] = { ...base[1], selected: false };
  const group = new Set([base[0].key]); // groupe d'une seule ligne
  const out = applyBulk(base, group);
  assert.deepStrictEqual(sel(out), [true, false, false]);
  assert.strictEqual(out[1], base[1]);
  assert.strictEqual(out[2], base[2]);
});

test('applyBulk : ne mute pas l\'entrée, renvoie la même liste quand rien n\'est cochable', () => {
  const items = build(['reference']);
  assert.strictEqual(applyBulk(items, keys(items)), items);
  const items2 = build([null, 'similar']);
  const snapshot = JSON.stringify(items2);
  applyBulk(items2, keys(items2));
  assert.strictEqual(JSON.stringify(items2), snapshot);
});

test('applyBulk : clé inconnue ou groupe vide = aucun changement', () => {
  const items = build([null, 'similar']);
  assert.deepStrictEqual(sel(applyBulk(items, new Set())), sel(items));
  assert.deepStrictEqual(sel(applyBulk(items, new Set(['zzz']))), sel(items));
});
