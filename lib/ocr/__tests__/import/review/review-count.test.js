const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { buildReviewItems, applyPatch, countToSave, draftsToSave } = require(`${o}/import/review.js`);

// Fixtures inventées (aucune donnée réelle).
const op = (p = {}) => ({
  source: 'mcb', reference: 'FT00000AAAA1', date: '2026-10-28', label: 'DB vente carte TEST',
  note: 'TEST', amount: -1000000, currency: 'MGA', kind: 'expense', merchant: 'TEST',
  categoryHint: null, uncertain: [], ...p,
});
const ctx = { history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash' };
const items = (dups) => buildReviewItems(dups.map((duplicate, i) => ({ op: op({ reference: `FT0000${i}AAAA` }), duplicate })), ctx);

test('applyPatch : similar / batch + montant changé → badge tombé ET ligne cochée', () => {
  for (const d of ['similar', 'batch']) {
    const [i] = items([d]);
    assert.strictEqual(i.selected, false);
    const r = applyPatch(i, { amount: 2000000 });
    assert.strictEqual(r.duplicate, null);
    assert.strictEqual(r.selected, true);
    assert.strictEqual(draftsToSave([r])[0].forceDuplicate, false);
  }
});

test('applyPatch : montant identique ou patch sans montant → badge et décochage conservés', () => {
  for (const d of ['similar', 'batch']) {
    const [i] = items([d]);
    for (const patch of [{ amount: i.amount }, { note: 'x' }, { categoryId: 'c1' }]) {
      const r = applyPatch(i, patch);
      assert.strictEqual(r.duplicate, d);
      assert.strictEqual(r.selected, false);
    }
  }
});

test('applyPatch : reference + montant changé → reste bloquée et décochée', () => {
  const [ref] = items(['reference']);
  const r = applyPatch(ref, { amount: 2000000 });
  assert.strictEqual(r.duplicate, 'reference');
  assert.strictEqual(r.selected, false);
});

test('applyPatch : patch sans `selected` n\'écrase pas le choix de l\'utilisateur', () => {
  const [ok] = items([null]);
  const unchecked = { ...ok, selected: false };
  assert.strictEqual(applyPatch(unchecked, { amount: 5, note: 'y' }).selected, false);
  assert.strictEqual(applyPatch({ ...ok, selected: true }, { note: 'y' }).selected, true);
});

test('applyPatch : selected explicite respecté après badge tombé', () => {
  const [i] = items(['similar']);
  assert.strictEqual(applyPatch(i, { amount: 7, selected: false }).selected, false);
});

test('countToSave : 0 pour liste vide, doublons décochés, bloquées', () => {
  assert.strictEqual(countToSave([]), 0);
  assert.strictEqual(countToSave(items(['reference', 'similar', 'batch'])), 0);
});

test('countToSave : compte les nouvelles + doublons cochés, pas les bloquées', () => {
  const [ref, sim, bat, neu] = items(['reference', 'similar', 'batch', null]);
  assert.strictEqual(countToSave([{ ...ref, selected: true }, { ...sim, selected: true }, bat, neu]), 2);
  assert.strictEqual(countToSave([sim, { ...bat, selected: true }]), 1);
});

test('countToSave : ignore les lignes cochées invalides et égale draftsToSave', () => {
  const [a, b, c] = items([null, 'similar', null]);
  const list = [{ ...a, amount: 0 }, { ...b, selected: true, accountId: null }, c];
  assert.strictEqual(countToSave(list), 1);
  assert.strictEqual(countToSave(list), draftsToSave(list).length);
});
