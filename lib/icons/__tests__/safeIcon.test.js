// Icône de compte sûre : helper pur + vraie police Ionicons.
const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { safeIconName } = require(process.env.ICONS_OUT + '/safeIcon.js');

const ROOT = process.env.ROOT;
const glyphs = JSON.parse(readFileSync(join(ROOT, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'), 'utf8'));

test('la vraie police : bank absent ; wallet, wallet-outline, card, cash, flask-outline présents', () => {
  assert.ok(!('bank' in glyphs));
  for (const n of ['wallet', 'wallet-outline', 'card', 'cash', 'flask-outline']) assert.ok(n in glyphs, n);
});

test('nom valide inchangé (vraie glyphMap)', () => {
  for (const n of ['wallet', 'wallet-outline', 'card', 'cash', 'flask-outline']) {
    assert.strictEqual(safeIconName(n, glyphs, 'wallet'), n);
  }
});

test('nom absent de la police, vide, null, undefined, non-chaîne : repli', () => {
  for (const bad of ['bank', '', ' ', 'Wallet', null, undefined, 0, 42, true, {}, [], ['wallet'], () => 'wallet', NaN]) {
    assert.strictEqual(safeIconName(bad, glyphs, 'wallet-outline'), 'wallet-outline', String(bad));
  }
});

test('propriétés héritées d\'Object.prototype : repli (hasOwnProperty)', () => {
  for (const bad of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf', 'isPrototypeOf']) {
    assert.strictEqual(safeIconName(bad, glyphs, 'wallet'), 'wallet', bad);
  }
});

test('le repli demandé est respecté, glyphes vides : repli', () => {
  assert.strictEqual(safeIconName('bank', glyphs, 'wallet'), 'wallet');
  assert.strictEqual(safeIconName('bank', glyphs, 'wallet-outline'), 'wallet-outline');
  assert.strictEqual(safeIconName('wallet', {}, 'card'), 'card');
});

test('accountIcon.ts : repli par défaut wallet, délègue à safeIconName avec Ionicons.glyphMap', () => {
  const s = readFileSync(join(ROOT, 'lib/icons/accountIcon.ts'), 'utf8');
  assert.match(s, /fallback: IoniconName = 'wallet'/);
  assert.match(s, /safeIconName\(icon, Ionicons\.glyphMap, fallback\)/);
});

test('aucun account.icon / acc.icon passé tel quel à Ionicons ; les 6 écrans utilisent accountIconName', () => {
  const files = ['components/AccountList.tsx', 'components/ValidatePlanificationDialog.tsx', 'components/add/pickers/AccountPickerV2.tsx',
    'components/add/pickers/TransferFormV2.tsx', 'components/dashboard/sections/AccountsCarousel.tsx', 'components/settings/AccountsSection.tsx'];
  for (const f of files) {
    const s = readFileSync(join(ROOT, f), 'utf8');
    assert.match(s, /accountIconName\(/, f);
    assert.match(s, /from '@\/lib\/icons\/accountIcon'/, f);
    assert.doesNotMatch(s, /\b(account|acc)\.icon as\b/, f);
    assert.doesNotMatch(s, /name=\{(?:\()?(account|acc)\.icon/, f);
  }
});
