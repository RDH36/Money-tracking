// Lot « habitude d'abord » : textes sans vente (limite d'import, habit.*), Plus masqué, pas d'Alert natif.
const { test } = require('node:test');
const assert = require('node:assert');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = process.env.ROOT;
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const flat = (o, p = '', out = {}) => {
  for (const k in o) typeof o[k] === 'object' ? flat(o[k], `${p}${k}.`, out) : (out[p + k] = o[k]);
  return out;
};
const langs = ['fr', 'en'].map((l) => [l, flat(JSON.parse(read(`lib/i18n/translations/${l}.json`)))]);
const scoped = (k) => /^ocrImport\.(limit|quota)\./.test(k) || /^habit\./.test(k);
// « illimité » : clé historique du compteur, cachée quand Plus est masqué (testé plus bas).
const ALLOWED_UNLIMITED = new Set(['ocrImport.quota.unlimited']);

const BANNED = [
  [/[€$£]|\bAr\b|\bMGA\b|\bariary\b|\d\s?%|\bEUR\b|\bUSD\b/i, 'prix, devise ou pourcentage'],
  [/\b(achet\w*|pay(e|er|ez|ant|ement)\w*|abonn\w*|essai\w*|renouvel\w*|souscri\w*|tarif\w*|prix|promo\w*|remise)/i, 'vente (fr)'],
  [/\b(buy|purchase|subscri\w*|trial|renew\w*|price|pricing|pay(ment)?|checkout|discount|billing|upgrade)\b/i, 'vente (en)'],
  [/https?:\/\/|mitsitsy\.app|www\.|\.com\b/i, 'URL ou lien'],
  [/\bcod(e|es)\b/i, 'code'],
  [/premium|\billimit\w*|\bunlimited\b|\bpro\b/i, 'premium / illimité'],
  // « Plus » produit : majuscule hors début de « Plus tard / Plus souvent » (adverbe légitime)
  [/\bPlus\b(?!\s+(tard|souvent|d['’]|de\b|rien))/, 'Plus (produit)'],
];

test('textes ocrImport.limit.*, ocrImport.quota.*, habit.* : aucune trace de vente, fr et en', () => {
  const hits = [];
  for (const [l, t] of langs) for (const [k, v] of Object.entries(t)) {
    if (!scoped(k) || ALLOWED_UNLIMITED.has(k)) continue;
    for (const [re, why] of BANNED) if (re.test(String(v))) hits.push(`${l}:${k} (${why}) « ${v} »`);
  }
  assert.deepStrictEqual(hits, []);
});

test('ocrImport.limit.* et habit.* : mêmes clés en fr et en, non vides', () => {
  const keys = (t) => Object.keys(t).filter((k) => /^ocrImport\.limit\.|^habit\./.test(k)).sort();
  assert.deepStrictEqual(keys(langs[1][1]), keys(langs[0][1]));
  assert.ok(keys(langs[0][1]).length >= 20);
  for (const [l, t] of langs) for (const k of keys(t)) assert.ok(String(t[k]).trim(), `${l}:${k} vide`);
});

test('clés du lot utilisées par le code : toutes présentes en fr et en', () => {
  const files = ['components/habit/FirstExpenseHeader.tsx', 'components/habit/DeferConfirmSheet.tsx', 'components/habit/EveningBanner.tsx',
    'components/habit/HabitPromptSheet.tsx', 'components/ocr-import/entry/QuotaReachedContent.tsx', 'components/ocr-import/states/QuotaBlockedView.tsx',
    'components/ocr-import/entry/QuotaReachedSheet.tsx', 'components/onboarding/v2/BalanceFooter.tsx', 'components/settings/NotificationsSection.tsx',
    'app/onboarding/balance.tsx'];
  const miss = [];
  for (const f of files) {
    for (const m of read(f).matchAll(/\bt\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g)) {
      const k = m[1];
      for (const [l, t] of langs) {
        const ok = k in t || `${k}_one` in t || `${k}_other` in t;
        if (!ok) miss.push(`${l}:${k} (${f})`);
      }
    }
  }
  assert.deepStrictEqual(miss, []);
});

test('Plus masqué : PLUS_ENABLED = false et chaque affichage « code » / dialogue Plus est gardé', () => {
  assert.match(read('constants/app.ts'), /export const PLUS_ENABLED(: boolean)? = false;/);
  const reached = read('components/ocr-import/entry/QuotaReachedSheet.tsx');
  assert.match(reached, /PLUS_ENABLED \? <DialogGhostBtn label=\{t\('plus\.enterCode'\)\}/);
  const blocked = read('components/ocr-import/states/QuotaBlockedView.tsx');
  assert.match(blocked, /PLUS_ENABLED \? <DialogGhostBtn label=\{t\('plus\.enterCode'\)\}/);
  assert.match(blocked, /PLUS_ENABLED \? \(\s*<>\s*<RedeemCodeSheet/);
  const entry = read('components/ocr-import/ImportCaptureEntry.tsx');
  assert.match(entry, /quota\.loaded && \(PLUS_ENABLED \|\| !quota\.unlimited\)/);
  assert.match(entry, /PLUS_ENABLED \? \(\s*<>?\s*<RedeemCodeSheet/);
  assert.match(read('app/(tabs)/settings.tsx'), /\{PLUS_ENABLED \? <PlusSettingsRow \/> : null\}/);
  assert.match(read('app/plus/activate.tsx'), /if \(!PLUS_ENABLED\) return <Redirect href="\/" \/>/);
  // aucun autre usage visible de plus.* hors composants Plus
  for (const f of ['components/ocr-import/entry/QuotaReachedContent.tsx', 'components/habit/HabitPromptSheet.tsx', 'components/habit/DeferConfirmSheet.tsx']) {
    assert.doesNotMatch(read(f), /plus\.|PlusActivated|RedeemCode/, f);
  }
});

test('licences existantes : droits illimités toujours honorés quand Plus est masqué', () => {
  const entry = read('components/ocr-import/ImportCaptureEntry.tsx');
  // le compteur est caché, mais le blocage reste conditionné à !unlimited (planReads gère l'illimité)
  assert.match(read('app/import/capture.tsx'), /plan\.blocked && !quota\.unlimited/);
  assert.ok(entry.includes('quota.unlimited'));
});

test('aucun Alert.alert dans les fichiers du lot', () => {
  const files = ['app/onboarding/balance.tsx', 'app/(tabs)/add.tsx', 'components/habit/AddScreenTop.tsx', 'components/habit/DeferConfirmSheet.tsx',
    'components/habit/EveningBanner.tsx', 'components/habit/EveningReminderTapListener.tsx', 'components/habit/FirstExpenseHeader.tsx',
    'components/habit/HabitPromptSheet.tsx', 'hooks/habit/useDeferReminder.ts', 'hooks/habit/useHabitPrompt.ts', 'hooks/habit/useAddEntryMode.ts',
    'components/onboarding/v2/BalanceFooter.tsx', 'components/ocr-import/entry/QuotaReachedContent.tsx', 'components/ocr-import/states/QuotaBlockedView.tsx'];
  for (const f of files) {
    assert.ok(existsSync(join(ROOT, f)), f);
    assert.doesNotMatch(read(f), /\bAlert\s*\.\s*alert|from 'react-native'[^;]*\bAlert\b/, f);
  }
});

test('onboarding : écran catégories supprimé, 7 crans, catégories par défaut + other, 1re dépense', () => {
  assert.ok(!existsSync(join(ROOT, 'app/onboarding/categories.tsx')));
  assert.match(read('components/onboarding/v2/Primitives.tsx'), /total = 7/);
  const b = read('app/onboarding/balance.tsx');
  assert.match(b, /router\.replace\('\/add\?source=onboarding'\)/);
  assert.match(b, /onboarding_completed', \{\s*categories_selected: selectedCategories\.size,\s*balance_skipped: skipped/);
  assert.match(b, /onboarding_balance_skipped/);
  assert.match(b, /onboarding_balance_viewed/);
  assert.match(b, /skipped \? '0' : bankBalance \|\| '0'/);
  const c = read('constants/categories.ts');
  assert.match(c, /new Set\(DEFAULT_CATEGORIES\.map\(\(c\) => c\.id\)\);\s*ids\.add\('other'\)/);
});

test('V27 : DATABASE_VERSION 27 et startVersion lu avant la première migration', () => {
  const m = read('lib/database/migrations.ts');
  assert.match(m, /const DATABASE_VERSION = 27;/);
  assert.ok(m.indexOf('const startVersion = currentVersion;') < m.indexOf('if (currentVersion < 1)'));
  assert.match(m, /migrateToV27\(db, startVersion\)/);
});

test('mode Ajouter : source lue une fois, nettoyée, oubliée au blur ; onboarding seulement avec 0 transaction', () => {
  const h = read('hooks/habit/useAddEntryMode.ts');
  assert.match(h, /router\.setParams\(\{ source: undefined, t: undefined \}\)/);
  assert.match(h, /useFocusEffect\(useCallback\(\(\) => \(\) => setSource\(undefined\), \[\]\)\)/);
  assert.match(h, /source === 'onboarding' && \(txCount \?\? 0\) === 0/);
  assert.match(h, /source === 'reminder_evening' \? 'reminder' : 'normal'/);
  assert.match(h, /deleted_at IS NULL/);
  const add = read('app/(tabs)/add.tsx');
  assert.match(add, /autoFocus=\{entryMode !== 'onboarding'\}/);
  assert.match(add, /useAddEntryMode\(\)/);
  assert.match(read('components/habit/AddScreenTop.tsx'), /<AddTransactionHeader title=\{t\('add\.newTransaction'\)\} \/>/);
});

test('fichiers du lot : ≤ 250 lignes', () => {
  const files = ['app/(tabs)/add.tsx', 'app/(tabs)/history.tsx', 'app/onboarding/balance.tsx',
    'components/ocr-import/ImportCaptureEntry.tsx', 'components/ocr-import/states/QuotaBlockedView.tsx', 'components/settings/NotificationsSection.tsx',
    'hooks/habit/useHabitPrompt.ts', 'lib/habit/eveningReminder.ts'];
  for (const f of files) assert.ok(read(f).split('\n').length <= 250, f);
});
