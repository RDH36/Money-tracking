const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { identicalGroups, accountsBelowZero } = require(`${o}/import/review.js`);

// Fixtures inventées.
const it = (key, over = {}) => ({
  key, kind: 'expense', direction: 'debit', amount: 5000, date: '2026-10-28',
  op: { note: 'Marie Test', fixedCategory: undefined }, ...over,
});
const withNote = (note) => ({ op: { note } });

test('identicalGroups : 2 identiques -> 1 groupe', () => {
  assert.deepStrictEqual(identicalGroups([it('a'), it('b')]), [['a', 'b']]);
});
test('identicalGroups : 3 identiques -> 1 groupe de 3, contrepartie insensible à la casse/espaces', () => {
  assert.deepStrictEqual(identicalGroups([it('a'), it('b', withNote(' MARIE test ')), it('c')]), [['a', 'b', 'c']]);
});
test('identicalGroups : autre contrepartie, autre jour, autre montant, autre sens, autre kind -> aucun groupe', () => {
  for (const over of [withNote('Jean'), { date: '2026-10-27' }, { amount: 5001 }, { direction: 'credit' }, { kind: 'income' }]) {
    assert.deepStrictEqual(identicalGroups([it('a'), it('b', over)]), []);
  }
});
test('identicalGroups : deux frais identiques exclus ; note vide exclue ; liste vide', () => {
  const fee = { op: { note: 'Frais', fixedCategory: 'fees' } };
  assert.deepStrictEqual(identicalGroups([it('a', fee), it('b', fee)]), []);
  assert.deepStrictEqual(identicalGroups([it('a', withNote('')), it('b', withNote('  '))]), []);
  assert.deepStrictEqual(identicalGroups([]), []);
});
test('identicalGroups : un frais ne rejoint pas le groupe de deux autres', () => {
  const fee = { op: { note: 'Marie Test', fixedCategory: 'fees' } };
  assert.deepStrictEqual(identicalGroups([it('a'), it('f', fee), it('b')]), [['a', 'b']]);
});

const sel = (over) => ({ selected: true, kind: 'expense', amount: 1000, direction: 'debit', accountId: 'c', counterAccountId: null, ...over });

test('cash sous 0 -> blocked', () => {
  const r = accountsBelowZero([sel()], [{ id: 'c', current_balance: 500, type: 'cash' }]);
  assert.deepStrictEqual(r, [{ accountId: 'c', projected: -500, blocked: true }]);
});
test('cash à 0 pile ou plus -> rien', () => {
  assert.deepStrictEqual(accountsBelowZero([sel()], [{ id: 'c', current_balance: 1000, type: 'cash' }]), []);
  assert.deepStrictEqual(accountsBelowZero([sel()], [{ id: 'c', current_balance: 5000, type: 'cash' }]), []);
});
test('bank sous 0 -> avertissement non bloquant', () => {
  const r = accountsBelowZero([sel()], [{ id: 'c', current_balance: 0, type: 'bank' }]);
  assert.deepStrictEqual(r, [{ accountId: 'c', projected: -1000, blocked: false }]);
});
test('type absent -> non bloquant ; ligne décochée -> rien', () => {
  assert.strictEqual(accountsBelowZero([sel()], [{ id: 'c', current_balance: 0 }])[0].blocked, false);
  assert.deepStrictEqual(accountsBelowZero([sel({ selected: false })], [{ id: 'c', current_balance: 0, type: 'cash' }]), []);
});
test('transfert vers le cash (crédit) ne bloque pas ; depuis le cash bloque', () => {
  const bal = [{ id: 'c', current_balance: 0, type: 'cash' }, { id: 'b', current_balance: 10000, type: 'bank' }];
  const t = (direction) => sel({ kind: 'transfer', accountId: 'b', counterAccountId: 'c', direction });
  assert.deepStrictEqual(accountsBelowZero([t('debit')], bal), []);
  assert.strictEqual(accountsBelowZero([t('credit')], bal)[0].blocked, true);
});
