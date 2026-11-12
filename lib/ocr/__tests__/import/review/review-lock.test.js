const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { buildReviewItems, isLocked, toggleItem, draftsToSave, applyPatch } = require(`${o}/import/review.js`);

// Fixtures inventées (aucune donnée réelle).
const op = (p = {}) => ({
  source: 'mcb', reference: 'FT00000AAAA1', date: '2026-10-28', label: 'DB vente carte TEST',
  note: 'TEST', amount: -1000000, currency: 'MGA', kind: 'expense', merchant: 'TEST',
  categoryHint: null, uncertain: [], ...p,
});
const ctx = { history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash' };
const items = (dups) => buildReviewItems(dups.map((duplicate, i) => ({ op: op({ reference: `FT0000${i}AAAA` }), duplicate })), ctx);

test('buildReviewItems : tout doublon est décoché, le reste coché', () => {
  const r = items(['reference', 'similar', 'batch', null]);
  assert.deepStrictEqual(r.map((i) => i.selected), [false, false, false, true]);
});

test('isLocked : seulement « reference »', () => {
  const r = items(['reference', 'similar', 'batch', null]);
  assert.deepStrictEqual(r.map(isLocked), [true, false, false, false]);
});

test('toggleItem : sans effet sur reference (même cochée de force)', () => {
  const [ref] = items(['reference']);
  assert.strictEqual(toggleItem(ref), ref);
  const forced = { ...ref, selected: true };
  assert.strictEqual(toggleItem(forced).selected, true);
});

test('toggleItem : bascule sur similar / batch / null, sans muter', () => {
  for (const d of ['similar', 'batch', null]) {
    const [i] = items([d]);
    const on = toggleItem(i);
    assert.strictEqual(on.selected, !i.selected);
    assert.strictEqual(toggleItem(on).selected, i.selected);
    assert.notStrictEqual(on, i);
  }
});

test('draftsToSave : exclut reference même selected=true', () => {
  const [ref] = items(['reference']);
  assert.deepStrictEqual(draftsToSave([{ ...ref, selected: true }]), []);
});

test('draftsToSave : forceDuplicate vrai pour similar/batch, faux pour null', () => {
  const r = items(['similar', 'batch', null]).map((i) => ({ ...i, selected: true }));
  assert.deepStrictEqual(draftsToSave(r).map((i) => i.forceDuplicate), [true, true, false]);
});

test('draftsToSave : ignore les lignes décochées ou invalides', () => {
  const [a, b] = items(['similar', null]);
  assert.deepStrictEqual(draftsToSave([a, { ...b, selected: true, amount: 0 }]), []);
  assert.strictEqual(draftsToSave([{ ...a, selected: true }]).length, 1);
});

test('applyPatch : reference + montant changé → badge et blocage conservés, rien enregistré', () => {
  const [ref] = items(['reference']);
  const r = applyPatch(ref, { amount: 2000000 });
  assert.strictEqual(r.amount, 2000000);
  assert.strictEqual(r.duplicate, 'reference');
  assert.strictEqual(r.selected, false);
  assert.deepStrictEqual(draftsToSave([r]), []);
});

test('applyPatch : reference reste décochée même si le patch demande selected=true', () => {
  const [ref] = items(['reference']);
  const r = applyPatch(ref, { amount: 5, selected: true });
  assert.strictEqual(r.selected, false);
  assert.strictEqual(applyPatch(ref, { selected: true }).selected, false);
  assert.deepStrictEqual(draftsToSave([applyPatch(ref, { selected: true })]), []);
});

test('applyPatch : similar / batch + montant changé → badge retiré', () => {
  for (const d of ['similar', 'batch']) {
    const [i] = items([d]);
    const r = applyPatch(i, { amount: 2000000 });
    assert.strictEqual(r.duplicate, null);
    assert.strictEqual(r.amount, 2000000);
  }
});

test('applyPatch : similar cochée puis montant changé → reste cochée, forceDuplicate faux', () => {
  const [i] = items(['similar']);
  const r = applyPatch({ ...i, selected: true }, { amount: 3000000 });
  assert.strictEqual(r.selected, true);
  assert.strictEqual(draftsToSave([r])[0].forceDuplicate, false);
});

test('applyPatch : duplicate null inchangé, selected conservé', () => {
  const [i] = items([null]);
  const r = applyPatch(i, { amount: 2000000 });
  assert.strictEqual(r.duplicate, null);
  assert.strictEqual(r.selected, true);
});

test('applyPatch : sans changement de montant (note, catégorie, même montant) → doublon conservé', () => {
  for (const d of ['reference', 'similar', 'batch']) {
    const [i] = items([d]);
    for (const patch of [{ note: 'autre' }, { categoryId: 'c1' }, { amount: i.amount }]) {
      const r = applyPatch(i, patch);
      assert.strictEqual(r.duplicate, d);
      assert.strictEqual(r.selected, i.selected);
    }
  }
});

test('applyPatch : ne mute pas l\'entrée', () => {
  const [i] = items(['similar']);
  const snap = JSON.stringify(i);
  applyPatch(i, { amount: 9 });
  assert.strictEqual(JSON.stringify(i), snap);
});
