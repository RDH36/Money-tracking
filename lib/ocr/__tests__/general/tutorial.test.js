// Tuto vidéo de l'import : code pur (lib/ocr/tutorial.ts), hook de drapeau (mini moteur de hooks) et câblage.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '../../../..');
const { TUTORIAL_SEEN_KEY, tutorialLang, shouldAutoPlayTutorial } = require(`${process.env.OCR_OUT}/tutorial.js`);
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('tutorialLang : en -> en, tout le reste -> fr (fr, mg, vide, null)', () => {
  assert.equal(tutorialLang('en'), 'en');
  assert.equal(tutorialLang('en-US'), 'en');
  assert.equal(tutorialLang('EN'), 'en');
  assert.equal(tutorialLang('fr'), 'fr');
  assert.equal(tutorialLang('fr-FR'), 'fr');
  assert.equal(tutorialLang('mg'), 'fr');
  for (const l of ['', null, undefined, 'de', 'xx']) assert.equal(tutorialLang(l), 'fr');
});

test('shouldAutoPlayTutorial : seulement quand le drapeau est lu ET absent', () => {
  assert.equal(shouldAutoPlayTutorial(false), true);
  assert.equal(shouldAutoPlayTutorial(true), false);
  assert.equal(shouldAutoPlayTutorial(null), false);
});

// --- hook useImportTutorial avec un mini moteur ---
function loadHook(db) {
  const src = read('hooks/ocr/useImportTutorial.ts');
  const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const slots = [];
  const effects = [];
  let idx = 0;
  const react = {
    useState: (init) => {
      const i = idx++;
      if (!(i in slots)) slots[i] = init;
      return [slots[i], (v) => { slots[i] = v; }];
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => { effects.push(fn); },
  };
  const stubs = {
    react,
    '@/lib/database': { useSQLiteContext: () => db },
    '@/lib/ocr/tutorial': require(`${process.env.OCR_OUT}/tutorial.js`),
  };
  const m = { exports: {} };
  new Function('require', 'module', 'exports', js)((n) => stubs[n], m, m.exports);
  const render = () => {
    idx = 0;
    effects.length = 0;
    const out = m.exports.useImportTutorial();
    const pending = [...effects];
    return { out, pending };
  };
  return { render };
}
const tick = () => new Promise((r) => setImmediate(r));
function fakeDb(row, { failRead = false, failWrite = false } = {}) {
  const calls = { get: [], run: [] };
  return {
    calls,
    getFirstAsync: async (sql, p) => { calls.get.push([sql, p]); if (failRead) throw new Error('boom'); return row; },
    runAsync: async (sql, p) => { calls.run.push([sql, p]); if (failWrite) throw new Error('boom'); },
  };
}
async function mount(db) {
  const h = loadHook(db);
  let r = h.render();
  r.pending.forEach((e) => e());
  await tick();
  r = h.render();
  return { h, r };
}

test('hook : base neuve (aucune ligne) -> tuto auto ; avant lecture -> pas de tuto', async () => {
  const db = fakeDb(undefined);
  const h = loadHook(db);
  const first = h.render();
  assert.equal(first.out.shouldAutoPlay, false);
  first.pending.forEach((e) => e());
  await tick();
  assert.equal(h.render().out.shouldAutoPlay, true);
  assert.deepStrictEqual(db.calls.get[0][1], [TUTORIAL_SEEN_KEY]);
});

test('hook : drapeau présent (utilisateur ayant déjà vu) -> pas de tuto auto', async () => {
  const { r } = await mount(fakeDb({ value: '2026-11-11T10:00:00.000Z' }));
  assert.equal(r.out.shouldAutoPlay, false);
});

test('hook : erreur de lecture -> jamais de tuto auto, import jamais bloqué', async () => {
  const origErr = console.error; console.error = () => {};
  try {
    const { r } = await mount(fakeDb(undefined, { failRead: true }));
    assert.equal(r.out.shouldAutoPlay, false);
  } finally { console.error = origErr; }
});

test('hook : markSeen écrit INSERT OR REPLACE sur settings (aucune autre table), cache -> plus de tuto', async () => {
  const db = fakeDb(undefined);
  const { h, r } = await mount(db);
  assert.equal(r.out.shouldAutoPlay, true);
  await r.out.markSeen();
  assert.equal(db.calls.run.length, 1);
  const [sql, p] = db.calls.run[0];
  assert.match(sql, /^INSERT OR REPLACE INTO settings \(key, value, updated_at\) VALUES \(\?, \?, \?\)$/);
  assert.equal(p[0], TUTORIAL_SEEN_KEY);
  assert.ok(p[1] && !Number.isNaN(Date.parse(p[1])));
  assert.equal(h.render().out.shouldAutoPlay, false);
});

test('hook : écriture en échec -> pas d exception, pas de second tuto dans la session', async () => {
  const origErr = console.error; console.error = () => {};
  try {
    const { h, r } = await mount(fakeDb(undefined, { failWrite: true }));
    await r.out.markSeen();
    assert.equal(h.render().out.shouldAutoPlay, false);
  } finally { console.error = origErr; }
});

test('hook : drapeau posé pendant la lecture de la base -> le drapeau gagne', async () => {
  let release;
  const db = fakeDb(undefined);
  db.getFirstAsync = () => new Promise((res) => { release = () => res(undefined); });
  const h = loadHook(db);
  const first = h.render();
  first.pending.forEach((e) => e());
  await first.out.markSeen();
  release();
  await tick();
  assert.equal(h.render().out.shouldAutoPlay, false);
});

// --- câblage (source) ---
test('clé du drapeau distincte de celle de l intro, et aucune migration ajoutée', () => {
  assert.equal(TUTORIAL_SEEN_KEY, 'ocr_import_tutorial_seen_at');
  assert.notEqual(TUTORIAL_SEEN_KEY, 'ocr_import_intro_seen_at');
  assert.doesNotMatch(read('hooks/ocr/useImportTutorial.ts'), /CREATE|ALTER|DROP|DELETE/i);
});

test('modale : onEnd gardé par ref done, pause à la fermeture, retour Android = passer, lecture au onShow', () => {
  const s = read('components/ocr-import/entry/ImportTutorialModal.tsx');
  assert.match(s, /if \(done\.current\) return;\s*done\.current = true;/);
  assert.match(s, /player\.pause\(\)/);
  assert.match(s, /onRequestClose=\{\(\) => finish\('skipped'\)\}/);
  assert.match(s, /animationType="none"/);
  assert.match(s, /onShow=\{onShow\}/);
  assert.match(s, /\{shown \? \(\s*<VideoView/);
  assert.match(s, /minHeight: 44/);
  assert.match(s, /'playToEnd'/);
  assert.doesNotMatch(s, /Alert/);
  assert.match(s, /tuto-import-fr\.mp4/);
  assert.match(s, /tuto-import-en\.mp4/);
});

test('entrée : quota d abord, tuto auto avant l intro, PostHog sans texte utilisateur', () => {
  const s = read('components/ocr-import/ImportCaptureEntry.tsx');
  const onPress = s.slice(s.indexOf('const onPress'), s.indexOf('const continueFromIntro'));
  assert.ok(onPress.indexOf('setQuotaOpen(true)') < onPress.indexOf("showTutorial('auto'"));
  assert.match(onPress, /else start\(action\)/);
  assert.match(s, /showTutorial\('manual', null\)/);
  for (const m of s.matchAll(/posthog\.capture\('import_tutorial_\w+', (\{[^}]*\})/g)) {
    assert.doesNotMatch(m[1], /label|text|uri|name|note/);
  }
  assert.doesNotMatch(s, /Alert\.alert/);
});

test('i18n : tutorial.watch/skip présents en fr, en, mg', () => {
  for (const l of ['fr', 'en', 'mg']) {
    const j = JSON.parse(read(`lib/i18n/translations/${l}.json`));
    assert.ok(j.ocrImport.tutorial.watch && j.ocrImport.tutorial.skip, l);
  }
});
