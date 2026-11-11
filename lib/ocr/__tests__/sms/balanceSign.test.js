const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
const norm = (s) => s.replace(/[  ]/g, ' ');

/** Extrait formatMoneyFr (et son formateur) de constants/designTokensV2.ts sans charger React. */
function loadFormat() {
  const src = read('constants/designTokensV2.ts');
  const fmt = src.match(/const numberFormatterFr = [^\n]+/)[0];
  const fn = src.match(/export function formatMoneyFr[\s\S]*?\n\}/)[0].replace('export ', '');
  const js = ts.transpileModule(`${fmt}\n${fn}\nmodule.exports = formatMoneyFr;`, {
    compilerOptions: { module: 'commonjs', target: 'es2020' },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', js)(mod);
  return mod.exports;
}
const formatMoneyFr = loadFormat();

test('formatMoneyFr retire le signe (le « − » est ajouté par l’appelant)', () => {
  assert.equal(norm(formatMoneyFr(-1250000)), '12 500');
  assert.equal(norm(formatMoneyFr(1250000)), '12 500');
  assert.equal(formatMoneyFr(0), '0');
});

test('BalanceHeroCard : « − » seulement si négatif, masquage inchangé', () => {
  const src = read('components/dashboard/sections/BalanceHeroCard.tsx');
  const line = src.match(/const balanceText = [^\n]+/)[0];
  const js = ts.transpileModule(
    `const f = (balanceHidden, totalBalance, formatMoneyFr) => { ${line.replace(/;$/, '')}; return balanceText; }; module.exports = f;`,
    { compilerOptions: { module: 'commonjs', target: 'es2020' } },
  ).outputText;
  const mod = { exports: {} };
  new Function('module', js)(mod);
  const text = (hidden, v) => norm(mod.exports(hidden, v, formatMoneyFr));
  assert.equal(text(false, -1250000), '−12 500');
  assert.equal(text(false, 1250000), '12 500');
  assert.equal(text(false, 0), '0');
  assert.equal(text(true, -1250000), '••••••');
  assert.equal(text(true, 5), '••••••');
});
