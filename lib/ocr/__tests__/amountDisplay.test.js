const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/** Charge amountInput.ts + les fonctions pures toDisplay/fromDisplay de FieldBlock.tsx (non exportées). */
function load() {
  const cut = (src, name) => {
    const m = new RegExp(`(?:^|\\n)((?:/\\*\\*(?:(?!\\*/)[^])*\\*/\\n)?function ${name}\\b[^]*?\\n\\})`).exec(src);
    assert.ok(m, `fonction ${name} introuvable dans FieldBlock.tsx`);
    return m[1];
  };
  const fb = read('components/ocr-import/edit/FieldBlock.tsx');
  const code = ['separators', 'toDisplay', 'fromDisplay'].map((n) => cut(fb, n)).join('\n');
  const amount = ts.transpileModule(read('lib/amountInput.ts'), { compilerOptions: { module: 'commonjs' } }).outputText;
  const body = ts.transpileModule(code, { compilerOptions: { module: 'commonjs' } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', amount)(mod, mod.exports);
  const { formatAmountInput } = mod.exports;
  return new Function('formatAmountInput', `${body}; return { toDisplay, fromDisplay };`)(formatAmountInput);
}
const { toDisplay, fromDisplay } = load();
const FR = 'fr-MG', FRFR = 'fr-FR', EN = 'en-US';
const norm = (s) => s.replace(/[  ]/g, ' ');

test('toDisplay : groupes et décimale selon la locale', () => {
  assert.equal(norm(toDisplay('70540.53', FR)), '70 540,53');
  assert.equal(norm(toDisplay('70540.53', FRFR)), '70 540,53');
  assert.equal(toDisplay('70540.53', EN), '70,540.53');
  assert.equal(toDisplay('1234567', EN), '1,234,567');
});

test('toDisplay : vide, petit, virgule finale conservée', () => {
  assert.equal(toDisplay('', EN), '');
  assert.equal(toDisplay('0', FR), '0');
  assert.equal(toDisplay('999', EN), '999');
  assert.equal(toDisplay('70540.', EN), '70,540.');
  assert.equal(norm(toDisplay('70540.', FR)), '70 540,');
  assert.equal(toDisplay('0.5', EN), '0.5');
});

test('fromDisplay : retour à la valeur brute, séparateurs insécables compris', () => {
  assert.equal(fromDisplay('70 540,53', FR), '70540.53');
  assert.equal(fromDisplay('70 540,53', FR), '70540.53'); // U+202F
  assert.equal(fromDisplay('70 540,53', FRFR), '70540.53'); // U+00A0
  assert.equal(fromDisplay('70,540.53', EN), '70540.53');
  assert.equal(fromDisplay('', EN), '');
});

test('fromDisplay : virgule finale, 2 décimales max, caractères parasites', () => {
  assert.equal(fromDisplay('70 540,', FR), '70540.');
  assert.equal(fromDisplay('1,5', FR), '1.5');
  assert.equal(fromDisplay('1,234', FR), '1.23');
  assert.equal(fromDisplay('12abc3', EN), '123');
});

test('aller-retour toDisplay → fromDisplay', () => {
  for (const loc of [FR, FRFR, EN]) {
    for (const raw of ['0', '5', '1234', '70540.53', '1000000.5', '12.', '100.00']) {
      assert.equal(fromDisplay(toDisplay(raw, loc), loc), raw, `${loc} ${raw}`);
    }
  }
});

test('historique : tri et filtres sur transaction_date avec repli created_at', () => {
  assert.match(read('hooks/useTransactions.ts'), /ORDER BY COALESCE\(t\.transaction_date, t\.created_at\) DESC, t\.created_at DESC/);
  assert.match(read('app/(tabs)/history.tsx'), /isSameDay\(tx\.transaction_date \|\| tx\.created_at, now\)/);
  assert.match(read('app/transactions.tsx'), /new Date\(tx\.transaction_date \|\| tx\.created_at\)/);
  assert.match(read("components/transactions/TransactionsList.tsx"), /item\.transaction\.transaction_date \|\| item\.transaction\.created_at/);
});
