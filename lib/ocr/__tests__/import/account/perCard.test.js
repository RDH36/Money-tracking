const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');

const o = process.env.OCR_OUT;
const review = require(`${o}/import/review.js`);
const { buildReviewItems, applyPatch, draftsToSave, accountsBelowZero, countToSave } = review;

const ROOT = path.resolve(__dirname, '../../../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// importNotice.ts : transpilé, '@/lib/ocr/import/review' redirigé vers le build.
function loadNotice() {
  const out = ts.transpileModule(read('components/ocr-import/review/importNotice.ts'), {
    compilerOptions: { module: 'commonjs', target: 'es2020' },
  }).outputText;
  const m = new Module('importNotice');
  m.require = (id) => (id === '@/lib/ocr/import/review' ? review : require(id));
  m._compile(out, 'importNotice.js');
  return m.exports;
}
const { buildImportNotice } = loadNotice();

const op = (p = {}) => ({
  source: 'mcb', reference: 'FT1', date: '2026-10-28', label: 'T', note: 'T',
  amount: -1000, currency: 'MGA', kind: 'expense', merchant: 'T', categoryHint: null, uncertain: [], ...p,
});
const mk = (list) => buildReviewItems(list.map((operation) => ({ op: operation, duplicate: null })), {
  history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash',
});
const accounts = [
  { id: 'bank', current_balance: 5000, type: 'bank' },
  { id: 'cash', current_balance: 2000, type: 'cash' },
  { id: 'epargne', current_balance: 100, type: 'savings' },
];
const t = (k, p) => (p ? `${k}:${JSON.stringify(p)}` : k);

test('changer le compte d\'UNE carte ne touche pas les autres, et marque accountManual', () => {
  const items = mk([op({ reference: 'A' }), op({ reference: 'B' }), op({ reference: 'C' })]);
  const next = items.map((i) => (i.key === items[1].key ? applyPatch(i, { accountId: 'epargne' }) : i));
  assert.deepStrictEqual(next.map((i) => i.accountId), ['bank', 'epargne', 'bank']);
  assert.deepStrictEqual(next.map((i) => i.accountManual), [false, true, false]);
});

test('sauvegarde : chaque carte part avec son propre compte (draftsToSave)', () => {
  const items = mk([op({ reference: 'A' }), op({ reference: 'B' }), op({ reference: 'T', payment: 'cash', source: 'ticket' })]);
  items[1] = applyPatch(items[1], { accountId: 'epargne' });
  assert.deepStrictEqual(draftsToSave(items).map((d) => d.accountId), ['bank', 'epargne', 'cash']);
});

test('dépense passée en espèces : blocage si le solde espèces devient < 0', () => {
  const items = mk([op({ reference: 'A', amount: -3000 })]);
  assert.strictEqual(accountsBelowZero(items, accounts).length, 0);
  const moved = [applyPatch(items[0], { accountId: 'cash' })];
  const r = accountsBelowZero(moved, accounts);
  assert.deepStrictEqual(r.map((b) => [b.accountId, b.blocked, b.projected]), [['cash', true, -1000]]);
  const { notice, cashBlocked } = buildImportNotice(t, moved, accounts, false, 0);
  assert.strictEqual(cashBlocked, true);
  assert.deepStrictEqual(notice, { text: 'ocrImport.cashBlockedSave', tone: 'bad' });
});

test('recalcul : renvoyer la carte vers la banque lève le blocage ; banque < 0 = avertissement sans blocage', () => {
  const items = mk([op({ reference: 'A', amount: -3000 })]);
  const cash = applyPatch(items[0], { accountId: 'cash' });
  const back = applyPatch(cash, { accountId: 'bank' });
  assert.strictEqual(buildImportNotice(t, [back], accounts, false, 0).cashBlocked, false);
  const big = applyPatch(items[0], { amount: 9000 });
  const r = accountsBelowZero([big], accounts);
  assert.deepStrictEqual(r.map((b) => [b.accountId, b.blocked]), [['bank', false]]);
  assert.strictEqual(buildImportNotice(t, [big], accounts, false, 0).cashBlocked, false);
});

test('carte décochée : le compte espèces ne bloque pas', () => {
  const items = mk([op({ reference: 'A', amount: -3000 })]);
  const off = { ...applyPatch(items[0], { accountId: 'cash' }), selected: false };
  assert.strictEqual(buildImportNotice(t, [off], accounts, false, 0).cashBlocked, false);
  assert.strictEqual(countToSave([off]), 0);
});

test('buildImportNotice : priorité espèces > échec > invalide > doublons, sinon rien', () => {
  const items = mk([op({ reference: 'A' })]);
  assert.strictEqual(buildImportNotice(t, items, accounts, false, 0).notice, null);
  assert.strictEqual(buildImportNotice(t, items, accounts, true, 2).notice.text, 'ocrImport.saveFailed');
  assert.deepStrictEqual(buildImportNotice(t, items, accounts, false, 2).notice, { text: 'ocrImport.invalid:{"count":2}', tone: 'bad' });
  const dup = [{ ...items[0], duplicate: 'similar', selected: true }];
  assert.deepStrictEqual(buildImportNotice(t, dup, accounts, false, 0).notice, { text: 'ocrImport.dupSelected:{"count":1}', tone: 'warn' });
});

test('virement : la puce ne propose pas la feuille compte, mais la feuille d\'édition', () => {
  const row = read('components/ocr-import/review/OperationRow.tsx');
  assert.match(row, /isTransfer \? onPress : onAccountPress/);
  assert.match(row, /isCredit \? '←' : '→'/);
  assert.match(row, /disabled=\{locked\}/);
  const items = mk([op({ reference: 'V', kind: 'transfer' })]);
  assert.strictEqual(items[0].counterAccountId, 'cash');
  assert.strictEqual(items[0].accountId, 'bank');
});

test('câblage : pas de sélecteur global, feuille branchée sur setAccountFor', () => {
  const cap = read('app/import/capture.tsx');
  assert.doesNotMatch(cap, /AccountPickerV2|setAccountForAll/);
  assert.match(cap, /imp\.setAccountFor\(accountKey, id\)/);
  assert.doesNotMatch(read('components/ocr-import/review/ReviewSummary.tsx'), /AccountPickerV2|onAccountChange/);
  assert.match(read('hooks/ocr/useCaptureImport.ts'), /applyPatch\(i, \{ accountId \}\)/);
  assert.match(read('components/ocr-import/review/OperationRow.tsx'), /<AccountChip/);
});
