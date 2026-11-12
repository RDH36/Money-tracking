const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const o = process.env.OCR_OUT;
const { buildReviewItems, applyPatch, withAccountForAll } = require(`${o}/import/review.js`);
const { headerAccountId, isCashOnlyImport, governedByHeader } = require(`${o}/import/account/headerAccount.js`);

const ROOT = path.resolve(__dirname, '../../../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const op = (p = {}) => ({
  source: 'mcb', reference: 'FT1', date: '2026-10-28', label: 'T', note: 'T',
  amount: -1000, currency: 'MGA', kind: 'expense', merchant: 'T', categoryHint: null, uncertain: [], ...p,
});
const ticket = (ref) => ({ op: op({ reference: ref, payment: 'cash', source: 'ticket' }), duplicate: null });
const bank = (ref) => ({ op: op({ reference: ref }), duplicate: null });
const mk = (list, cashId = 'cash') => buildReviewItems(list, {
  history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId,
});

test('b1 : ligne sans compte manuel prend le compte du haut', () => {
  const r = withAccountForAll(mk([bank('A'), bank('B')]), 'epargne', 'cash');
  assert.ok(r.every((i) => i.accountId === 'epargne'));
});

test('b2 : ligne au compte choisi à la main garde son compte', () => {
  const items = mk([bank('A'), bank('B')]);
  items[0] = applyPatch(items[0], { accountId: 'perso' });
  const r = withAccountForAll(items, 'epargne', 'cash');
  assert.strictEqual(r[0].accountId, 'perso');
  assert.strictEqual(r[1].accountId, 'epargne');
  assert.strictEqual(headerAccountId(r, 'cash'), 'epargne');
});

test('b2 : accountManual vrai seulement si le compte change, et collant', () => {
  let i = mk([bank('A')])[0];
  i = applyPatch(i, { accountId: 'bank', label: 'x' });
  assert.strictEqual(i.accountManual, false);
  i = applyPatch(i, { accountId: 'perso' });
  assert.strictEqual(i.accountManual, true);
  i = applyPatch(i, { accountId: 'perso', label: 'y' });
  assert.strictEqual(i.accountManual, true);
  i = applyPatch(i, { label: 'z' });
  assert.strictEqual(i.accountManual, true);
  i = applyPatch(i, { accountId: 'bank' });
  assert.strictEqual(i.accountManual, true);
});

test('b3 : import 100 % tickets espèces -> Espèce proposé en haut', () => {
  const items = mk([ticket('T1'), ticket('T2')]);
  assert.ok(isCashOnlyImport(items, 'cash'));
  assert.strictEqual(headerAccountId(items, 'cash'), 'cash');
  const r = withAccountForAll(items, 'bank', 'cash');
  assert.ok(r.every((i) => i.accountId === 'bank'));
  assert.strictEqual(headerAccountId(r, 'cash'), 'bank');
});

test('b3 : tickets dont un manuel -> en-tête suit les autres ; tous manuels -> null, sans effet', () => {
  const items = mk([ticket('T1'), ticket('T2')]);
  items[0] = applyPatch(items[0], { accountId: 'perso' });
  assert.strictEqual(headerAccountId(items, 'cash'), 'cash');
  const r = withAccountForAll(items, 'bank', 'cash');
  assert.strictEqual(r[0].accountId, 'perso');
  assert.strictEqual(r[1].accountId, 'bank');
  items[1] = applyPatch(items[1], { accountId: 'autre' });
  assert.strictEqual(headerAccountId(items, 'cash'), null);
  assert.deepStrictEqual(withAccountForAll(items, 'bank', 'cash'), items);
});

test('b4 : sans compte espèces, comportement d\'avant', () => {
  const items = mk([ticket('T1'), ticket('T2')], null);
  assert.strictEqual(isCashOnlyImport(items, null), false);
  assert.strictEqual(headerAccountId(items, null), null);
  assert.deepStrictEqual(withAccountForAll(items, 'epargne', null), items);
  const mixed = mk([bank('A'), ticket('T')], null);
  assert.strictEqual(headerAccountId(mixed, null), 'bank');
  const r = withAccountForAll(mixed, 'epargne', null);
  assert.strictEqual(r[0].accountId, 'epargne');
  assert.strictEqual(r[1].accountId, mixed[1].accountId);
});

test('import mixte : le haut gouverne la banque, les tickets gardent Espèce', () => {
  const items = mk([bank('A'), ticket('T')]);
  assert.strictEqual(isCashOnlyImport(items, 'cash'), false);
  assert.strictEqual(headerAccountId(items, 'cash'), 'bank');
  const r = withAccountForAll(items, 'epargne', 'cash');
  assert.strictEqual(r[0].accountId, 'epargne');
  assert.strictEqual(r[1].accountId, 'cash');
  assert.strictEqual(governedByHeader(items, 'cash').length, 1);
});

test('liste vide : pas d\'import espèces, en-tête null', () => {
  assert.strictEqual(isCashOnlyImport([], 'cash'), false);
  assert.strictEqual(headerAccountId([], 'cash'), null);
});

test('retrait : contrepartie gérée comme avant', () => {
  const items = mk([{ op: op({ reference: 'R', kind: 'transfer' }), duplicate: null }]);
  assert.strictEqual(items[0].counterAccountId, 'cash');
  const r = withAccountForAll(items, 'cash', 'cash');
  assert.strictEqual(r[0].counterAccountId, null);
  assert.strictEqual(withAccountForAll(r, 'bank', 'cash')[0].counterAccountId, 'cash');
});

test('a : libellé de la fiche = « Libellé » / « Label »', () => {
  const fr = JSON.parse(read('lib/i18n/translations/fr.json'));
  const en = JSON.parse(read('lib/i18n/translations/en.json'));
  assert.strictEqual(fr.ocrImport.edit.bankLabel, 'Libellé');
  assert.strictEqual(en.ocrImport.edit.bankLabel, 'Label');
  assert.match(read('components/ocr-import/edit/EditOperationSheet.tsx'), /ocrImport\.edit\.bankLabel/);
});

test('c : catégorie system-income traduite via add.income dans l\'indice de doublon', () => {
  const src = read('app/import/capture.tsx');
  assert.match(src, /id === 'system-income'\)\s*return t\('add\.income'\)/);
  const iSys = src.indexOf("'system-income'");
  const iGet = src.indexOf('getCategoryDisplayName(c.id');
  assert.ok(iSys > 0 && iSys < iGet);
});

test('câblage : ReviewSummary reçoit cashId, le hook le renvoie', () => {
  assert.match(read('app/import/capture.tsx'), /cashId=\{imp\.cashId\}/);
  assert.match(read('hooks/ocr/useCaptureImport.ts'), /cashId: cashIdRef\.current/);
  assert.match(read('components/ocr-import/review/ReviewSummary.tsx'), /headerAccountId\(items, cashId\)/);
});
