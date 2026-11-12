// Petits détails 2.2.0 : conseil de l'écran d'ajout (addTipFor) et lignes « Tout cocher » de ReviewList.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '../../../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function loadAddTips() {
  const out = ts.transpileModule(read('components/add/feedback/addTips.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const m = { exports: {} };
  new Function('module', 'exports', 'require', out)(m, m.exports, require);
  return m.exports.addTipFor;
}
const addTipFor = loadAddTips();
const T = 'tips.add.transferMoney';
const N = 'tips.add.addNote';
const Q = 'tips.add.quickCategory';

test('transfert : transferMoney et addNote restent, quickCategory est remplacé', () => {
  assert.strictEqual(addTipFor(T, 'transfer', 'expense'), T);
  assert.strictEqual(addTipFor(N, 'transfer', 'expense'), N);
  // quickCategory est le dernier : la rotation reprend au début (transferMoney convient en transfert).
  assert.strictEqual(addTipFor(Q, 'transfer', 'expense'), T);
  assert.strictEqual(addTipFor(Q, 'transfer', 'income'), T);
});

test('Transaction + Dépense : les trois conseils (sauf transferMoney) sont gardés', () => {
  assert.strictEqual(addTipFor(N, 'transaction', 'expense'), N);
  assert.strictEqual(addTipFor(Q, 'transaction', 'expense'), Q);
  assert.notStrictEqual(addTipFor(T, 'transaction', 'expense'), T);
});

test('Transaction + Dépense : transferMoney bascule sur le suivant (addNote)', () => {
  assert.strictEqual(addTipFor(T, 'transaction', 'expense'), N);
});

test('Transaction + Revenu : jamais transferMoney ni quickCategory', () => {
  assert.strictEqual(addTipFor(T, 'transaction', 'income'), N);
  assert.strictEqual(addTipFor(Q, 'transaction', 'income'), N);
  assert.strictEqual(addTipFor(N, 'transaction', 'income'), N);
});

test('aucun mode/type ne montre un conseil hors sujet', () => {
  for (const mode of ['transaction', 'transfer']) {
    for (const type of ['expense', 'income']) {
      for (const tip of [T, N, Q]) {
        const r = addTipFor(tip, mode, type);
        assert.ok(r, `${tip} ${mode}/${type}`);
        if (mode !== 'transfer') assert.notStrictEqual(r, T);
        if (!(mode === 'transaction' && type === 'expense')) assert.notStrictEqual(r, Q);
      }
    }
  }
});

test('tip null ou vide : rien ; clé inconnue : laissée telle quelle (pas de filtre)', () => {
  assert.strictEqual(addTipFor(null, 'transaction', 'expense'), null);
  assert.strictEqual(addTipFor('', 'transfer', 'expense'), null);
  assert.strictEqual(addTipFor('tips.add.inconnu', 'transaction', 'expense'), 'tips.add.inconnu');
});

test("l'ordre de addTips suit la rotation de useTips('add')", () => {
  const hook = read('hooks/useTips.ts');
  const block = hook.slice(hook.indexOf("'tips.add.transferMoney'") - 20);
  const keys = [...block.matchAll(/'(tips\.add\.\w+)'/g)].map((x) => x[1]).slice(0, 3);
  assert.deepStrictEqual(keys, [T, N, Q]);
});

test('add.tsx passe mode et type à AddTipCard', () => {
  assert.match(read('app/(tabs)/add.tsx'), /<AddTipCard tip=\{currentTip\} mode=\{mode\} type=\{type\} \/>/);
});

const list = read('components/ocr-import/review/ReviewList.tsx');

test('ReviewList : le BulkToggle de date est rendu sans condition dans renderSectionHeader', () => {
  const header = list.slice(list.indexOf('renderSectionHeader'), list.indexOf('renderItem='));
  assert.match(header, /<BulkToggle items=\{section\.all\} onPress=\{onToggleMany\} scope=/);
  assert.ok(!/sections\.length/.test(header.replace(/section\.date === sections\[0\]\?\.date/, '')),
    'aucune condition sur le nombre de dates pour le toggle de date');
  assert.ok(!/\?\s*\(\s*<BulkToggle items=\{section\.all\}/.test(header));
});

test('ReviewList : la ligne globale ne se rend que pour plusieurs dates', () => {
  assert.match(list, /sections\.length > 1 \? \([\s\S]*?<BulkToggle items=\{items\}/);
  const m = list.match(/sections\.length > 1 \? \(([\s\S]*?)\) : null/);
  assert.ok(m && /<BulkToggle items=\{items\}/.test(m[1]), 'global dans la branche > 1, null sinon');
});

test('ReviewList : exactement deux BulkToggle (global + date), aucune autre condition', () => {
  assert.strictEqual((list.match(/<BulkToggle /g) || []).length, 2);
  assert.ok(!/sections\.length (>=|!==|===) /.test(list));
});

test('ReviewList : carte « identiques » à marge égale sur les 4 côtés', () => {
  assert.match(list, /marginBottom: 8, padding: 6, gap: 6, borderRadius: 18/);
  const card = list.slice(list.indexOf('padding: 6'), list.indexOf('copy-outline'));
  assert.ok(!/paddingVertical|paddingHorizontal: 4/.test(card.split('borderRadius: 18')[0]));
});
