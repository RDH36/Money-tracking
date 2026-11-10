const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const P = require(path.join(process.env.APPUPDATE_OUT, 'policy.js'));
const ROOT = process.env.ROOT;
const info = (o = {}) => ({ available: true, versionCode: 5, stalenessDays: 2, flexibleAllowed: true, downloaded: false, ...o });
const reduce = (phase, ...events) => events.reduce((p, e) => P.updateReducer(p, e), phase);

test('reducer : parcours nominal', () => {
  assert.equal(reduce('idle', { type: 'check' }), 'checking');
  assert.equal(reduce('checking', { type: 'checked', info: info() }), 'available');
  assert.equal(reduce('available', { type: 'accepted' }), 'downloading');
  assert.equal(reduce('downloading', { type: 'progress' }), 'downloading');
  assert.equal(reduce('downloading', { type: 'downloaded' }), 'downloaded');
});

test('reducer : à jour, flexible interdit, erreur, déjà téléchargé', () => {
  assert.equal(P.updateReducer('checking', { type: 'checked', info: info({ available: false }) }), 'latest');
  assert.equal(P.updateReducer('checking', { type: 'checked', info: info({ flexibleAllowed: false }) }), 'unavailable');
  assert.equal(P.updateReducer('checking', { type: 'error' }), 'unavailable');
  assert.equal(P.updateReducer('checking', { type: 'checked', info: info({ downloaded: true, available: false }) }), 'downloaded');
});

test('reducer : un téléchargement en cours ou fini survit à une revérification ou une erreur', () => {
  for (const ph of ['downloading', 'downloaded']) {
    assert.equal(P.updateReducer(ph, { type: 'check' }), ph);
    assert.equal(P.updateReducer(ph, { type: 'error' }), ph);
  }
  assert.equal(P.updateReducer('downloading', { type: 'checked', info: info() }), 'downloading');
  assert.equal(P.updateReducer('downloaded', { type: 'accepted' }), 'downloaded');
  assert.equal(P.updateReducer('downloaded', { type: 'progress' }), 'downloaded');
});

test('reducer : refus et échec', () => {
  assert.equal(P.updateReducer('downloading', { type: 'declined' }), 'idle');
  assert.equal(P.updateReducer('available', { type: 'declined' }), 'idle');
  assert.equal(P.updateReducer('downloaded', { type: 'declined' }), 'downloaded');
  assert.equal(P.updateReducer('latest', { type: 'declined' }), 'latest');
  assert.equal(P.updateReducer('downloading', { type: 'failed' }), 'idle');
});

const H = 3600 * 1000;
const base = { now: 1_000_000_000_000, lastPromptAt: null, onboardingCompleted: true, blocked: false };

test('canAutoPrompt : jamais pendant l\'onboarding ni si bloqué', () => {
  assert.equal(P.canAutoPrompt(base), true);
  assert.equal(P.canAutoPrompt({ ...base, onboardingCompleted: false }), false);
  assert.equal(P.canAutoPrompt({ ...base, blocked: true }), false);
  assert.equal(P.canAutoPrompt({ ...base, lastPromptAt: null, onboardingCompleted: false, blocked: true }), false);
});

test('canAutoPrompt : limite de 24 h (bornes)', () => {
  const at = (ago) => P.canAutoPrompt({ ...base, lastPromptAt: base.now - ago });
  assert.equal(at(0), false);
  assert.equal(at(23 * H), false);
  assert.equal(at(24 * H - 1), false);
  assert.equal(at(24 * H), true);
  assert.equal(at(100 * H), true);
});

test('canAutoPrompt : valeurs corrompues ou horloge reculée', () => {
  assert.equal(P.canAutoPrompt({ ...base, lastPromptAt: NaN }), true);
  assert.equal(P.canAutoPrompt({ ...base, lastPromptAt: Infinity }), true);
  assert.equal(P.canAutoPrompt({ ...base, lastPromptAt: base.now + 5 * H }), true);
});

test('manualResult', () => {
  for (const ph of ['latest', 'available', 'downloading', 'downloaded']) assert.equal(P.manualResult(ph), ph);
  for (const ph of ['idle', 'checking', 'unavailable']) assert.equal(P.manualResult(ph), 'unavailable');
});

test('selectUpdateModule : faux module inactif hors __DEV__', () => {
  const fake = (m) => ({ fake: m });
  const native = { native: true };
  assert.equal(P.selectUpdateModule(native, false, 'available', fake), native);
  assert.equal(P.selectUpdateModule(null, false, 'latest', fake), null);
  assert.deepEqual(P.selectUpdateModule(native, true, 'available', fake), { fake: 'available' });
  assert.deepEqual(P.selectUpdateModule(null, true, 'latest', fake), { fake: 'latest' });
  assert.equal(P.selectUpdateModule(native, true, undefined, fake), native);
  assert.equal(P.selectUpdateModule(native, true, 'bogus', fake), native);
  assert.equal(P.selectUpdateModule(null, true, '', fake), null);
});

test('source : index.ts passe __DEV__ au sélecteur', () => {
  const src = fs.readFileSync(path.join(ROOT, 'modules/mitsitsy-update/index.ts'), 'utf8');
  assert.match(src, /selectUpdateModule\(\s*native,\s*__DEV__/);
});

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('source : aucun mode immédiat, aucun Alert.alert, aucune URL dans le code de mise à jour', () => {
  const files = [
    'lib/appUpdate/policy.ts', 'stores/appUpdateStore.ts', 'modules/mitsitsy-update/index.ts', 'modules/mitsitsy-update/fake.ts',
    'components/app-update/AppUpdateHost.tsx', 'components/app-update/UpdateSettingsRow.tsx',
    'components/app-update/useAutoUpdateCheck.ts',
    'modules/mitsitsy-update/android/src/main/java/expo/modules/mitsitsyupdate/MitsitsyUpdateModule.kt',
  ];
  for (const f of files) {
    const src = strip(read(f));
    assert.doesNotMatch(src, /IMMEDIATE/i, f);
    assert.doesNotMatch(src, /Alert\.alert/, f);
    assert.doesNotMatch(src, /https?:\/\/|market:\/\/|play\.google\.com|Linking\./, f);
  }
  assert.match(read('modules/mitsitsy-update/android/src/main/java/expo/modules/mitsitsyupdate/MitsitsyUpdateModule.kt'), /AppUpdateType\.FLEXIBLE/);
});

test('i18n : appUpdate complet en fr/en/mg, sans lien, prix, achat ni Plus', () => {
  const keys = (o) => Object.keys(o).sort();
  const dicts = ['fr', 'en', 'mg'].map((l) => JSON.parse(read(`lib/i18n/translations/${l}.json`)).appUpdate);
  for (const d of dicts) assert.ok(d, 'bloc appUpdate manquant');
  assert.deepEqual(keys(dicts[1]), keys(dicts[0]));
  assert.deepEqual(keys(dicts[2]), keys(dicts[0]));
  for (const d of dicts) {
    for (const [k, v] of Object.entries(d)) {
      assert.ok(typeof v === 'string' && v.trim(), k);
      const text = v.replace(/Plus tard|Plus tard/g, '');
      assert.doesNotMatch(text, /https?:|www\.|\.com|Google Play|Play Store|play\.google|\bPlus\b|premium|prix|price|€|\bAr\b|payer|pay\b|achat|buy|purchase|abonnement|subscri/i, k + ': ' + v);
    }
  }
});

test('onboarding : le hook automatique lit onboarding_completed et applique la limite 24 h', () => {
  const src = read('components/app-update/useAutoUpdateCheck.ts');
  assert.match(src, /onboarding_completed/);
  assert.match(src, /canAutoPrompt/);
  assert.match(src, /PROMPTED_AT_KEY/);
});

test('pillState : toutes phases x readyDismissed x promptOpen', () => {
  const phases = ['idle', 'checking', 'available', 'latest', 'unavailable', 'downloading', 'downloaded'];
  for (const ph of phases) {
    for (const dismissed of [false, true]) {
      for (const open of [false, true]) {
        let want = null;
        if (!open && ph === 'downloading') want = 'downloading';
        if (!open && ph === 'downloaded' && dismissed) want = 'ready';
        assert.equal(P.pillState(ph, dismissed, open), want, `${ph} dismissed=${dismissed} open=${open}`);
      }
    }
  }
});

test('pillState : jamais en même temps que la fenêtre « prête » (downloaded && !readyDismissed)', () => {
  assert.equal(P.pillState('downloaded', false, false), null);
});

test('pastille : textes fr/en/mg avec % interpolé, ease et pas de Reanimated', () => {
  for (const l of ['fr', 'en', 'mg']) {
    const d = JSON.parse(read(`lib/i18n/translations/${l}.json`)).appUpdate;
    assert.match(d.pillDownloadingPct, /\{\{pct\}\}/, l);
    assert.ok(d.pillReady && d.pillDownloading, l);
  }
  const src = read('components/app-update/UpdateProgressPill.tsx');
  assert.match(src, /react-native-ease/);
  assert.doesNotMatch(src, /reanimated|Alert\.alert/);
  assert.match(src, /readyDismissed: false/);
});
