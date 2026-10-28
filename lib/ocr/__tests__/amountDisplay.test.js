const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/** Charge lib/ocr/import/amountLocal.ts (formatAmountLocal / parseAmountLocal), avec lib/amountInput.ts. */
function load() {
  const cjs = (p) => ts.transpileModule(read(p), { compilerOptions: { module: 'commonjs' } }).outputText;
  const base = { exports: {} };
  new Function('module', 'exports', cjs('lib/amountInput.ts'))(base, base.exports);
  const mod = { exports: {} };
  const req = (id) => { if (id === '@/lib/amountInput') return base.exports; throw new Error(id); };
  new Function('module', 'exports', 'require', cjs('lib/ocr/import/amountLocal.ts'))(mod, mod.exports, req);
  return { toDisplay: mod.exports.formatAmountLocal, fromDisplay: mod.exports.parseAmountLocal };
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
