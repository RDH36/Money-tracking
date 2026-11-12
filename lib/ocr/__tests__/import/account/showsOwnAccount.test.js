const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const o = process.env.OCR_OUT;
const { buildReviewItems, applyPatch, withAccountForAll } = require(`${o}/import/review.js`);
const { headerAccountId, showsOwnAccount } = require(`${o}/import/account/headerAccount.js`);

const ROOT = path.resolve(__dirname, '../../../../..');

const op = (p = {}) => ({
  source: 'mcb', reference: 'FT1', date: '2026-10-28', label: 'T', note: 'T',
  amount: -1000, currency: 'MGA', kind: 'expense', merchant: 'T', categoryHint: null, uncertain: [], ...p,
});
const ctx = { history: [], validCategoryIds: new Set(['c1']), bankId: 'bank', cashId: 'cash' };
const mixed = () => buildReviewItems([
  { op: op({ reference: 'A1' }), duplicate: null },
  { op: op({ reference: 'A2' }), duplicate: null },
  { op: op({ reference: 'A3', payment: 'cash', source: 'ticket' }), duplicate: null },
], ctx);
const shown = (items, cashId = 'cash') => {
  const h = headerAccountId(items, cashId);
  return items.map((i) => showsOwnAccount(i, h));
};

test('lignes toutes sur le compte d\'en-tête : aucun compte affiché', () => {
  const items = buildReviewItems([
    { op: op({ reference: 'A1' }), duplicate: null }, { op: op({ reference: 'A2' }), duplicate: null },
  ], ctx);
  assert.deepStrictEqual(shown(items), [false, false]);
});

test('en-tête null (comptes différents) : toutes les lignes affichent leur compte', () => {
  const items = mixed().slice(0, 2).map((i, k) => ({ ...i, accountId: k ? 'bank' : 'other' }));
  assert.strictEqual(headerAccountId(items, 'cash'), null);
  assert.deepStrictEqual(shown(items), [true, true]);
});

test('compte changé dans la fiche : seule cette ligne affiche son compte', () => {
  const items = mixed().slice(0, 2);
  const k = items[0].key;
  const r = items.map((i) => (i.key === k ? applyPatch(i, { accountId: 'other' }, []) : i));
  assert.strictEqual(r[0].accountManual, true);
  // la ligne manuelle n'est pas gouvernée : l'en-tête reste celui de l'autre ligne
  assert.strictEqual(headerAccountId(r, 'cash'), 'bank');
  assert.deepStrictEqual(shown(r), [true, false]);
});

test('en-tête changé après un choix manuel : la ligne manuelle garde et affiche son compte', () => {
  const items = mixed().slice(0, 2);
  const manual = [applyPatch(items[0], { accountId: 'other' }, []), items[1]];
  const r = withAccountForAll(manual, 'third', 'cash');
  assert.strictEqual(r[0].accountId, 'other');
  assert.strictEqual(r[1].accountId, 'third');
  assert.strictEqual(headerAccountId(r, 'cash'), 'third');
  assert.deepStrictEqual(shown(r), [true, false]);
});

test('ticket espèces d\'un import mixte : affiche le compte espèces', () => {
  const items = mixed();
  assert.strictEqual(headerAccountId(items, 'cash'), 'bank');
  assert.deepStrictEqual(shown(items), [false, false, true]);
  assert.strictEqual(items[2].accountId, 'cash');
});

test('import 100 % espèces : l\'en-tête est le compte espèces, rien de plus par ligne', () => {
  const items = buildReviewItems([
    { op: op({ reference: 'T1', payment: 'cash', source: 'ticket' }), duplicate: null },
    { op: op({ reference: 'T2', payment: 'cash', source: 'ticket' }), duplicate: null },
  ], ctx);
  assert.deepStrictEqual(shown(items), [false, false]);
});

test('liste vide et compte nul : pas d\'exception', () => {
  assert.strictEqual(headerAccountId([], null), null);
  assert.strictEqual(showsOwnAccount({ accountId: null }, null), false);
});

// Entrée 2.2.0 du Quoi de neuf : 6 clés présentes en fr/en/mg.
test('changelog 2.2.0 : en tête, 6 clés (4 added, 2 fixed), textes fr/en/mg non vides', () => {
  const src = fs.readFileSync(path.join(ROOT, 'constants/changelog.ts'), 'utf8');
  const first = src.match(/export const CHANGELOG[^=]*=\s*\[\s*\{\s*version:\s*"([^"]+)"[\s\S]*?changes:\s*\[([\s\S]*?)\]/);
  assert.ok(first, 'entrée de tête introuvable');
  assert.strictEqual(first[1], '2.2.0');
  const changes = [...first[2].matchAll(/type:\s*"(\w+)",\s*key:\s*"changelog\.(\w+)"/g)].map((m) => [m[1], m[2]]);
  assert.deepStrictEqual(changes, [
    ['added', 'importCaptures'], ['added', 'importTutorial'], ['added', 'inAppUpdates'], ['added', 'eveningReminder'],
    ['fixed', 'negativeSign'], ['fixed', 'noCameraDevices'],
  ]);
  for (const lang of ['fr', 'en', 'mg']) {
    const json = JSON.parse(fs.readFileSync(path.join(ROOT, `lib/i18n/translations/${lang}.json`), 'utf8'));
    for (const [, k] of changes) {
      assert.ok(typeof json.changelog[k] === 'string' && json.changelog[k].trim().length > 10, `${lang}.changelog.${k}`);
      assert.ok(!/achat|Plus\b|quota|prix|price|purchase/i.test(json.changelog[k]) || k === 'x', `${lang}.${k} parle d'achat`);
    }
  }
  const app = fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8');
  assert.match(app, /"version":\s*"2\.2\.0"/);
});
