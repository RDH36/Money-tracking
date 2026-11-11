const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { accountsBelowZero: below } = require(`${o}/import/review.js`);

// Fixtures inventées. Montants en centimes.
const it = (p) => ({ selected: true, kind: 'expense', amount: 1000, direction: 'debit', accountId: 'a', counterAccountId: null, ...p });
const bal = [{ id: 'a', current_balance: 5000 }, { id: 'b', current_balance: 2000 }, { id: 'c', current_balance: -300 }];

test('un compte passe sous zéro : solde projeté négatif', () => {
  assert.deepEqual(below([it({ amount: 8000 })], bal), [{ accountId: 'a', projected: -3000, blocked: false }]);
  assert.deepEqual(below([it({ amount: 3000 }), it({ amount: 3000 })], bal), [{ accountId: 'a', projected: -1000, blocked: false }]);
});

test('compte qui reste positif ou tombe pile à zéro : non signalé', () => {
  assert.deepEqual(below([it({ amount: 4000 })], bal), []);
  assert.deepEqual(below([it({ amount: 5000 })], bal), []);
  assert.deepEqual(below([], bal), []);
});

test('revenu compense la dépense', () => {
  assert.deepEqual(below([it({ amount: 8000 }), it({ kind: 'income', amount: 4000 })], bal), []);
});

test('ligne décochée ignorée', () => {
  assert.deepEqual(below([it({ amount: 8000, selected: false })], bal), []);
});

test('transfert : débit du compte source, crédit du compte destination', () => {
  const t = it({ kind: 'transfer', amount: 6000, direction: 'debit', accountId: 'a', counterAccountId: 'b' });
  assert.deepEqual(below([t], bal), [{ accountId: 'a', projected: -1000, blocked: false }]);
  const inbound = { ...t, direction: 'credit', accountId: 'b', counterAccountId: 'a' };
  assert.deepEqual(below([inbound], bal), [{ accountId: 'a', projected: -1000, blocked: false }]);
  assert.deepEqual(below([{ ...t, accountId: 'b', counterAccountId: 'a' }], bal), [{ accountId: 'b', projected: -4000, blocked: false }]);
});

test('changement de compte : le solde est calculé sur le compte choisi', () => {
  const r = below([it({ amount: 8000, accountId: 'b' })], bal);
  assert.deepEqual(r, [{ accountId: 'b', projected: -6000, blocked: false }]);
});

test('compte non touché mais déjà négatif : non signalé ; touché et encore négatif : signalé', () => {
  assert.deepEqual(below([it({ amount: 100 })], bal).map((x) => x.accountId), []);
  assert.deepEqual(below([it({ accountId: 'c', amount: 100 })], bal), [{ accountId: 'c', projected: -400, blocked: false }]);
});

test('compte inconnu ou null : pas d\'erreur', () => {
  assert.deepEqual(below([it({ accountId: 'zzz' }), it({ accountId: null })], bal), []);
  assert.deepEqual(below([it({ amount: 8000 })], []), []);
});
