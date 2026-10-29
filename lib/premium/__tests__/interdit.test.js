// INTERDIT 1-8 : aucune vente (prix, achat, paiement, abonnement, URL, moyens de paiement) dans le lot Plus.
const { test } = require('node:test');
const assert = require('node:assert');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = process.env.ROOT;
const flat = (o, p = '', out = {}) => {
  for (const k in o) typeof o[k] === 'object' ? flat(o[k], `${p}${k}.`, out) : (out[p + k] = o[k]);
  return out;
};
const langs = ['fr', 'en', 'mg'].map((l) => [l, flat(JSON.parse(readFileSync(join(ROOT, `lib/i18n/translations/${l}.json`), 'utf8')))]);
const scoped = (k) => /^plus\./.test(k) || /^ocrImport\.(quota|bulk|hint)\./.test(k);

const BANNED = [
  [/[€$£]|\bAr\b|\bMGA\b|\bariary\b|\d\s?%|\bEUR\b|\bUSD\b/i, 'prix, devise ou pourcentage'],
  [/\b(achet\w*|pay(e|er|ez|ant|ement)\w*|abonn\w*|essai\w*|renouvel\w*|obten\w*|souscri\w*|tarif\w*|prix|promo\w*|remise|gratuit(ement)?\b.*\bensuite)/i, 'verbe/mot de vente (fr)'],
  [/\b(buy|purchase|subscri\w*|trial|renew\w*|price|pricing|pay(ment)?|checkout|discount|billing|upgrade)\b/i, 'mot de vente (en)'],
  [/\b(mividy|mandoa|fividianana|fandoavana|sarany|vidiny|andrana|manavao|fanasaraham-bola)\b/i, 'mot de vente (mg)'],
  [/mvola|orange\s*money|airtel|goalpay|whatsapp|\+?261\s?\d|\b03\d[\s\d]{7,}/i, 'moyen de paiement ou numéro'],
  [/https?:\/\/|mitsitsy\.app|www\./i, 'URL'],
];

test('traductions plus.* et ocrImport.{quota,bulk,hint}.* sans vente, en fr/en/mg', () => {
  const hits = [];
  for (const [l, t] of langs) for (const [k, v] of Object.entries(t)) {
    if (!scoped(k)) continue;
    for (const [re, why] of BANNED) if (re.test(String(v))) hits.push(`${l}:${k} (${why}) « ${v} »`);
  }
  assert.deepStrictEqual(hits, []);
});

test('plus.* : mêmes clés en fr, en et mg', () => {
  const keys = (t) => Object.keys(t).filter((k) => /^plus\.|^ocrImport\.(quota|bulk|hint)\./.test(k)).sort();
  assert.deepStrictEqual(keys(langs[1][1]), keys(langs[0][1]));
  assert.deepStrictEqual(keys(langs[2][1]), keys(langs[0][1]));
  assert.ok(keys(langs[0][1]).length > 30);
});

test('E4 : l\'écran quota n\'a aucune phrase Plus, « Saisir à la main » + « Saisir un code »', () => {
  for (const [, t] of langs) {
    for (const k of ['ocrImport.quota.reachedTitle', 'ocrImport.quota.reachedBody', 'ocrImport.quota.manual']) {
      assert.ok(t[k] && !/plus/i.test(t[k]), k);
    }
    assert.ok(t['plus.enterCode']);
  }
});

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : /\.(tsx?|mjs)$/.test(n) && !/__tests__/.test(p) && out.push(p);
  }
  return out;
}

test('code du lot : aucune URL mitsitsy.app ni moyen de paiement, aucun Alert.alert', () => {
  const files = [
    ...walk(join(ROOT, 'lib/premium')), ...walk(join(ROOT, 'hooks/premium')), ...walk(join(ROOT, 'components/plus')),
    ...walk(join(ROOT, 'app/plus')), join(ROOT, 'app/+native-intent.tsx'), join(ROOT, 'stores/premiumStore.ts'),
    join(ROOT, 'components/ocr-import/entry/QuotaReachedSheet.tsx'), join(ROOT, 'components/ocr-import/states/QuotaBlockedView.tsx'),
    join(ROOT, 'components/ocr-import/review/BulkToggle.tsx'),
  ];
  const hits = [];
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    if (/mitsitsy\.app|mvola|airtel|goalpay|whatsapp|orange\s*money/i.test(s)) hits.push(`${f} : URL ou paiement`);
    if (/Alert\.alert/.test(s)) hits.push(`${f} : Alert.alert`);
    if (s.split('\n').length > 250) hits.push(`${f} : > 250 lignes`);
  }
  assert.deepStrictEqual(hits, []);
});

test('le jeton voyage dans la sauvegarde : plus_license / plus_clock_max / ocr_reads_* non exclus', () => {
  const src = readFileSync(join(ROOT, 'lib/backup/constants.ts'), 'utf8');
  const block = /EXCLUDED_SETTING_KEYS\s*=\s*\[([\s\S]*?)\]/.exec(src)[1];
  assert.ok(!/plus_|ocr_reads/.test(block));
});
