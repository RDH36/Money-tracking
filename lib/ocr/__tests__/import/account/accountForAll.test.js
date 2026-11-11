const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { buildReviewItems, withAccountForAll, isDraftValid, isPaidCash } = require(`${o}/import/review.js`);

// Fixtures inventées.
const op = (p = {}) => ({
  source: 'mcb', reference: 'FT00000AAAA1', date: '2026-10-28', label: 'TEST', note: 'TEST',
  amount: -1000000, currency: 'MGA', kind: 'expense', merchant: 'TEST', categoryHint: null, uncertain: [], ...p,
});
const ctx = { history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash' };
const build = () => buildReviewItems([
  { op: op({ reference: 'A1' }), duplicate: null },
  { op: op({ reference: 'A2', kind: 'transfer', amount: -2000000 }), duplicate: null },
  { op: op({ reference: 'A3', payment: 'cash', kind: 'expense', source: 'ticket' }), duplicate: null },
], ctx);

test('état initial : retrait avec contrepartie espèces, ticket payé en espèces sur le compte espèces', () => {
  const [exp, tr, cash] = build();
  assert.strictEqual(tr.counterAccountId, 'cash');
  assert.ok(isPaidCash(cash));
  assert.strictEqual(cash.accountId, 'cash');
  assert.ok(isDraftValid(exp) && isDraftValid(tr));
});

test('Banque -> Espèce : le retrait devient invalide, le ticket espèces ne bouge pas', () => {
  const r = withAccountForAll(build(), 'cash', 'cash');
  assert.strictEqual(r[0].accountId, 'cash');
  assert.strictEqual(r[1].accountId, 'cash');
  assert.strictEqual(r[1].counterAccountId, null);
  assert.strictEqual(isDraftValid(r[1]), false);
  assert.strictEqual(isDraftValid(r[0]), true);
  assert.deepStrictEqual(r[2], build()[2]);
});

test('Espèce puis Banque : la contrepartie revient, tout est valide', () => {
  const step1 = withAccountForAll(build(), 'cash', 'cash');
  const step2 = withAccountForAll(step1, 'bank', 'cash');
  assert.strictEqual(step2[1].counterAccountId, 'cash');
  assert.strictEqual(step2[1].accountId, 'bank');
  assert.ok(step2.every(isDraftValid));
});

test('contrepartie choisie à la main (autre compte) : gardée', () => {
  const items = build().map((i) => (i.kind === 'transfer' ? { ...i, counterAccountId: 'epargne' } : i));
  const r = withAccountForAll(items, 'bank', 'cash');
  assert.strictEqual(r[1].counterAccountId, 'epargne');
  const r2 = withAccountForAll(items, 'cash', 'cash');
  assert.strictEqual(r2[1].counterAccountId, 'epargne');
  assert.ok(isDraftValid(r2[1]));
});

test('contrepartie égale au compte choisi : vidée (comportement d avant)', () => {
  const items = build().map((i) => (i.kind === 'transfer' ? { ...i, counterAccountId: 'epargne' } : i));
  assert.strictEqual(withAccountForAll(items, 'epargne', 'cash')[1].counterAccountId, null);
});

test('cashId inconnu (null) : pas de contrepartie inventée', () => {
  const items = build().map((i) => (i.kind === 'transfer' ? { ...i, counterAccountId: null } : i));
  assert.strictEqual(withAccountForAll(items, 'bank', null)[1].counterAccountId, null);
});

test('dépenses : contrepartie inchangée (null), liste vide ok, sans mutation', () => {
  const items = build();
  const snap = JSON.stringify(items);
  const r = withAccountForAll(items, 'bank2', 'cash');
  assert.strictEqual(r[0].counterAccountId, null);
  assert.strictEqual(JSON.stringify(items), snap);
  assert.deepStrictEqual(withAccountForAll([], 'bank', 'cash'), []);
});

test('autres champs conservés (selected, categoryId, montant)', () => {
  const items = build().map((i) => ({ ...i, selected: false, categoryId: 'c1' }));
  const r = withAccountForAll(items, 'bank', 'cash');
  r.forEach((x, k) => { assert.strictEqual(x.selected, false); assert.strictEqual(x.amount, items[k].amount); });
  assert.strictEqual(r[0].categoryId, 'c1');
});
