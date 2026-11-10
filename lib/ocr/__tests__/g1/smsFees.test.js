const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parseSms } = require(`${o}/index.js`);
const { suggestCategory } = require(`${o}/suggest.js`);

const T = '2026-11-10';
const SEND = 'Votre transfert de 10000 Ar vers le 0320000001 est reussi. Frais: 200 Ar. Nouveau Solde: 8800 Ar. Trans Id: PP260629.1010.F33333 Orange Money';
const VALID = new Set(['bills', 'other', 'food']);

test('frais SMS : Factures imposé, même si l\'historique range « Frais Orange Money » en Autre', () => {
  const [main, fee] = parseSms(SEND, T);
  assert.strictEqual(fee.fixedCategory, true);
  const history = [{ note: 'Frais Orange Money', categoryId: 'other' }];
  assert.strictEqual(suggestCategory(fee, history, VALID), 'bills');
  assert.strictEqual(suggestCategory(fee, [], VALID), 'bills');
  assert.ok(!main.fixedCategory);
});

test('catégorie imposée absente de la liste : retombe sur l\'historique, puis rien', () => {
  const [, fee] = parseSms(SEND, T);
  const history = [{ note: 'Frais Orange Money', categoryId: 'other' }];
  assert.strictEqual(suggestCategory(fee, history, new Set(['other'])), 'other');
  assert.strictEqual(suggestCategory(fee, [], new Set(['food'])), null);
});

test('autres opérations : l\'historique garde la priorité, revenu sans catégorie', () => {
  const op = { source: 'generic', date: T, amount: -100, kind: 'expense', merchant: 'BOUTIQUE TEST', note: 'BOUTIQUE TEST', categoryHint: 'food' };
  assert.strictEqual(suggestCategory(op, [{ note: 'BOUTIQUE TEST', categoryId: 'other' }], VALID), 'other');
  assert.strictEqual(suggestCategory(op, [], VALID), 'food');
  const [, , ...none] = parseSms(SEND, T);
  assert.strictEqual(none.length, 0);
  assert.strictEqual(suggestCategory({ ...op, kind: 'income', fixedCategory: true }, [], VALID), null);
});
