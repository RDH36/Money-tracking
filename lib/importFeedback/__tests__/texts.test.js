// Textes betaTester.* (fr + en) et garde-fous du code du lot : Google Play, e-mail, PostHog, règles du dépôt.
const test = require('node:test');
const assert = require('node:assert');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = process.env.ROOT;
const flat = (o, p = '', out = {}) => {
  for (const k in o) typeof o[k] === 'object' ? flat(o[k], `${p}${k}.`, out) : (out[p + k] = o[k]);
  return out;
};
const load = (l) => flat(JSON.parse(readFileSync(join(ROOT, `lib/i18n/translations/${l}.json`), 'utf8')));
const fr = load('fr');
const en = load('en');
const beta = (t) => Object.entries(t).filter(([k]) => k.startsWith('betaTester.'));
const src = (p) => readFileSync(join(ROOT, p), 'utf8');

test('betaTester : mêmes clés en fr et en, aucune valeur vide', () => {
  const kf = beta(fr).map(([k]) => k).sort();
  const ke = beta(en).map(([k]) => k).sort();
  assert.deepStrictEqual(ke, kf);
  assert.ok(kf.length > 30);
  for (const [k, v] of [...beta(fr), ...beta(en)]) assert.ok(String(v).trim(), k);
  for (const k of ['betaTester.errors.save', 'betaTester.errors.emailMissing', 'betaTester.errors.consentMissing',
    'betaTester.errors.emailInvalid', 'betaTester.errors.feelingMissing']) assert.ok(fr[k] && en[k], k);
});

test('betaTester : variables {{...}} identiques fr/en', () => {
  const vars = (s) => (String(s).match(/{{\w+}}/g) || []).sort().join();
  for (const [k, v] of beta(fr)) assert.strictEqual(vars(en[k]), vars(v), k);
});

const BANNED = [
  [/[€$£]|\bAr\b|\bMGA\b|\d\s?%|\bEUR\b|\bUSD\b/i, 'prix ou devise'],
  [/\b(achet\w*|acquér\w*|pay(e|er|ez|ant|ement)\w*|abonn\w*|essai gratuit|période d'essai|renouvel\w*|souscri\w*|tarif\w*|prix|promo\w*|remise|premium|plus\b(?=\s*:))/i, 'vente (fr)'],
  [/\b(buy|purchase|subscri\w*|trial|renew\w*|price|pricing|pay(ment)?|checkout|discount|billing|upgrade|premium)\b/i, 'vente (en)'],
  [/code d'activation|activation code|play store|google play|note|étoiles?|\bstars?\b|rating|rate us|noter/i, 'activation / Play Store / note'],
  [/https?:\/\/|mitsitsy\.app|www\./i, 'URL'],
  [/\btu gagnes?\b|\bgagne\w*|\byou win\b|\byou('| wi)ll win\b|\bwinner\b|\bguaranteed\b|garanti\w*/i, 'récompense garantie'],
];

test('betaTester : aucun mot de vente, d\'achat, de prix, de note Play, de gain garanti ; tutoiement', () => {
  const hits = [];
  for (const [l, t] of [['fr', fr], ['en', en]]) {
    for (const [k, v] of beta(t)) for (const [re, why] of BANNED) if (re.test(String(v))) hits.push(`${l}:${k} (${why}) « ${v} »`);
  }
  assert.deepStrictEqual(hits, []);
  for (const [k, v] of beta(fr)) assert.doesNotMatch(String(v), /\b(vous|votre|vos|veuillez)\b/i, k);
});

test('betaTester : le tirage ne promet rien de certain (au sort, e-mail, version future)', () => {
  const info = fr['betaTester.draw.info'];
  assert.match(info, /tirées? au sort/);
  assert.match(info, /10 personnes/);
  assert.match(info, /avant la prochaine mise à jour/);
  assert.match(info, /par e-mail/);
  assert.match(info, /prochaine version/);
  assert.match(fr['betaTester.success.draw'], /Si tu es tiré au sort/);
  assert.match(en['betaTester.success.draw'], /If you are drawn/);
  assert.match(fr['betaTester.draw.optional'], /sans e-mail/);
});

function walk(dir, out = []) {
  for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (e.isDirectory()) { if (e.name !== '__tests__') walk(join(dir, e.name), out); } else if (/\.tsx?$/.test(e.name)) out.push(join(dir, e.name));
  }
  return out;
}
const lotFiles = ['lib/importFeedback', 'hooks/importFeedback', 'components/import-feedback'].flatMap((d) => walk(d));

test('code du lot : pas d\'Alert.alert, pas de champ de code, fichiers <= 250 lignes, dossiers <= 7 fichiers', () => {
  assert.ok(lotFiles.length >= 15);
  for (const f of lotFiles) {
    const s = src(f);
    assert.doesNotMatch(s, /Alert\.alert|from 'react-native'[^;]*\bAlert\b/, f);
    assert.ok(s.split('\n').length <= 250, `${f} > 250 lignes`);
    assert.doesNotMatch(s, /activationCode|activation_code|useActivation|plus\.enterCode|Purchases|RevenueCat|react-native-iap/i, f);
  }
  for (const d of ['lib/importFeedback', 'hooks/importFeedback', 'components/import-feedback']) {
    const n = readdirSync(join(ROOT, d), { withFileTypes: true }).filter((e) => e.isFile()).length;
    assert.ok(n <= 7, `${d} : ${n} fichiers`);
  }
});

test('code du lot : seul lien externe = le règlement du tirage', () => {
  const urls = [];
  for (const f of lotFiles) for (const m of src(f).matchAll(/https?:\/\/[^\s'"`)]+/g)) urls.push(`${f}:${m[0]}`);
  assert.deepStrictEqual(urls, ['components/import-feedback/SurveyDrawStep.tsx:https://www.mitsitsy.app/tirage']);
});

test('PostHog : ni e-mail ni commentaire dans les propriétés des événements', () => {
  for (const f of lotFiles) {
    const s = src(f);
    for (const m of s.matchAll(/posthog\??\.capture\(([^;]*?)\);/gs)) {
      const cleaned = m[1].replace('draw_optin: check.email !== null', '').replace('form.comment.trim().length > 0', '');
      assert.doesNotMatch(cleaned, /e-?mail|\bcomment\b|payload|\bform\.(email|comment)/i,`${f} : ${m[1]}`);
    }
  }
  const hook = src('hooks/importFeedback/useImportFeedback.ts');
  assert.match(hook, /has_comment: form\.comment\.trim\(\)\.length > 0/);
  assert.match(hook, /draw_optin: check\.email !== null/);
});

test('l\'avis est écrit en local et récompense posée AVANT l\'envoi réseau ; e-mail seulement si validé', () => {
  const hook = src('hooks/importFeedback/useImportFeedback.ts');
  const iq = hook.indexOf('queueSurvey(db, payload)');
  const ir = hook.indexOf('FEEDBACK_KEYS.rewardedAt');
  const iflush = hook.indexOf('flushPendingSurvey(db)');
  assert.ok(iq > 0 && iq < ir && ir < iflush);
  assert.match(hook, /email: check\.email/);
  assert.match(hook, /validateSurvey\(form\)/);
});

test('package.json : aucune dépendance ajoutée par le lot', () => {
  const pkg = JSON.parse(src('package.json'));
  for (const d of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) assert.doesNotMatch(d, /survey|iap|purchases/i);
});

test('capture.tsx : montants négatifs avec « − » (U+2212), appelants sans double signe', () => {
  const cap = src('app/import/capture.tsx');
  assert.match(cap, /formatCurrency\(cents, currency\.code\)\.replace\('-', '\\u2212'\)/);
  const row = src('components/ocr-import/review/OperationRow.tsx');
  assert.match(row, /\$\{isCredit \? '\+' : '−'\}\$\{formatMoney\(item\.amount\)\}/);
  const sum = src('components/ocr-import/review/ReviewSummary.tsx');
  assert.match(sum, /\\u2212\$\{formatMoney\(Math\.abs\(b\.projected\)\)\}/);
  assert.match(sum, /formatMoney\(Math\.abs\(b\.projected\)\)/);
  assert.doesNotMatch(src('components/add/pickers/AccountPickerV2.tsx'), /['"`]-\$\{formatMoney/);
});

test('ReviewSummary : les chips par type ne comptent que les lignes cochées', () => {
  const s = src('components/ocr-import/review/ReviewSummary.tsx');
  assert.match(s, /const picked = fresh\.filter\(\(i\) => i\.selected\)/);
  for (const [key, kind] of [['expenses', 'expense'], ['incomes', 'income'], ['withdrawals', 'transfer']]) {
    assert.match(s, new RegExp(`key: '${key}', count: picked\\.filter\\(\\(i\\) => i\\.kind === '${kind}'\\)\\.length`));
  }
  assert.match(s, /key: 'known', count: items\.filter\(\(i\) => i\.duplicate === 'reference'\)/);
});

test('rappel : identifiant sans croisement avec les annuleurs existants', () => {
  const n = src('lib/notifications.ts') + src('lib/habit/eveningReminder.ts');
  assert.doesNotMatch(n, /import-beta|import_beta/);
  const tap = src('components/habit/EveningReminderTapListener.tsx');
  assert.match(tap, /data\?\.type !== EVENING_REMINDER_TYPE\) return/);
  const evening = /EVENING_REMINDER_TYPE = '([^']+)'/.exec(src('lib/habit/eveningReminder.ts'))[1];
  assert.notStrictEqual(evening, 'import_beta');
});
