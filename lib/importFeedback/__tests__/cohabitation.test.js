// Cohabitation du rappel J+2 « Testeur bêta » avec les rappels de dépense (lib/notifications.ts, NON modifié).
// On charge le VRAI lib/notifications.ts (transpilé) avec un faux expo-notifications et les vraies traductions.
const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const Module = require('node:module');
const ts = require(join(process.env.ROOT, 'node_modules/typescript'));
const Rem = require(process.env.FEEDBACK_OUT + '/reminder.js');

const ROOT = process.env.ROOT;
const LANGS = ['fr', 'en', 'mg'];
const flat = (o, p = '', out = {}) => {
  for (const k in o) typeof o[k] === 'object' ? flat(o[k], `${p}${k}.`, out) : (out[p + k] = o[k]);
  return out;
};
const tr = Object.fromEntries(LANGS.map((l) => [l, flat(JSON.parse(readFileSync(join(ROOT, `lib/i18n/translations/${l}.json`), 'utf8')))]));
const i18n = {
  lang: 'fr',
  t(key, o = {}) { const l = o.lng || this.lang; return tr[l][key] ?? tr.fr[key] ?? key; },
};

/** Faux expo-notifications : liste planifiée en mémoire. */
function fakeNotifications(initial = []) {
  const list = new Map(initial.map((r) => [r.identifier, r]));
  return {
    list,
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
    AndroidImportance: { DEFAULT: 3 },
    setNotificationHandler() {},
    setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getAllScheduledNotificationsAsync: async () => [...list.values()],
    cancelScheduledNotificationAsync: async (id) => { list.delete(id); },
    cancelAllScheduledNotificationsAsync: async () => { list.clear(); },
    scheduleNotificationAsync: async ({ identifier, content }) => { list.set(identifier, { identifier, content }); },
  };
}

function loadNotifications(N) {
  const file = join(ROOT, 'lib/notifications.ts');
  const out = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const stubs = {
    'expo-notifications': N,
    'react-native': { Platform: { OS: 'ios' } },
    './i18n': { __esModule: true, default: i18n, LANGUAGES: LANGS.map((code) => ({ code })) },
    './habit/eveningReminder': {
      cancelEveningDailyReminder: async () => {}, isEveningMode: () => false,
      scheduleEveningDailyReminder: async () => {}, setEveningMode() {},
    },
  };
  const m = new Module(file);
  m.filename = file;
  m.paths = Module._nodeModulePaths(join(ROOT, 'lib'));
  m.require = (id) => (id in stubs ? stubs[id] : require(id));
  m._compile(out, file);
  return m.exports;
}

const betaReq = () => ({
  identifier: Rem.IMPORT_BETA_REMINDER_ID,
  content: { title: i18n.t('betaTester.reminder.title'), body: i18n.t('betaTester.reminder.body'), data: { type: Rem.IMPORT_BETA_REMINDER_TYPE } },
});
const expenseReq = (id, lang = 'fr', key = 'reminder1') => ({
  identifier: id,
  content: { title: i18n.t(`notifications.${key}Title`, { lng: lang }), body: 'x', data: { type: 'expense_reminder' } },
});

test('(a) replanifier 1 h / 2 h / 4 h / le soir / off : le J+2 reste, les anciens rappels de dépense partent', async () => {
  for (const freq of ['1h', '2h', '4h', 'evening', 'off']) {
    const N = fakeNotifications([betaReq(), expenseReq('expense-reminder'), expenseReq('uuid-android-1', 'en', 'reminder3'), expenseReq('uuid-2', 'mg', 'reminder2')]);
    const lib = loadNotifications(N);
    await lib.scheduleReminders(freq);
    assert.ok(N.list.has('import-beta-reminder'), `J+2 perdu après ${freq}`);
    assert.strictEqual(N.list.get('import-beta-reminder').content.data.type, 'import_beta');
    assert.strictEqual(N.list.has('uuid-android-1'), false);
    assert.strictEqual(N.list.has('uuid-2'), false);
    if (['1h', '2h', '4h'].includes(freq)) assert.ok(N.list.has('expense-reminder'));
  }
});

test('(a) enchaînement 1 h -> 2 h -> 4 h : un seul rappel de dépense, le J+2 intact', async () => {
  const N = fakeNotifications([betaReq()]);
  const lib = loadNotifications(N);
  for (const f of ['1h', '2h', '4h']) await lib.scheduleReminders(f);
  assert.deepStrictEqual([...N.list.keys()].sort(), ['expense-reminder', 'import-beta-reminder']);
});

test('(b) annuler le J+2 ne touche à aucun autre rappel', async () => {
  const others = [expenseReq('expense-reminder'), { identifier: 'gamif-streak', content: { title: 's', data: { type: 'streak_reminder' } } },
    { identifier: 'planif-reminder-1', content: { title: 'p', data: {} } }];
  const N = fakeNotifications([betaReq(), ...others]);
  const calls = [];
  const api = {
    isGranted: async () => true,
    listScheduledIds: async () => [...N.list.keys()],
    cancel: async (id) => { calls.push(id); await N.cancelScheduledNotificationAsync(id); },
    scheduleAt: async () => assert.fail('pas de programmation'),
  };
  const first = new Date(2026, 10, 10, 20, 0).toISOString();
  const r = await Rem.syncImportBetaReminder(api, { firstReadAt: first, answered: true, frequency: '1h', now: new Date(2026, 10, 11, 9, 0) });
  assert.strictEqual(r, 'cancelled');
  assert.deepStrictEqual(calls, ['import-beta-reminder']);
  assert.deepStrictEqual([...N.list.keys()].sort(), ['expense-reminder', 'gamif-streak', 'planif-reminder-1']);
});

test('(b) rappels coupés ou permission refusée : pas de J+2 programmé', async () => {
  const first = new Date(2026, 10, 10, 20, 0).toISOString();
  for (const [frequency, granted] of [['off', true], ['1h', false]]) {
    const N = fakeNotifications([expenseReq('expense-reminder')]);
    const api = {
      isGranted: async () => granted,
      listScheduledIds: async () => [...N.list.keys()],
      cancel: async (id) => N.cancelScheduledNotificationAsync(id),
      scheduleAt: async () => assert.fail('ne doit pas programmer'),
    };
    await Rem.syncImportBetaReminder(api, { firstReadAt: first, answered: false, frequency, now: new Date(2026, 10, 11, 9, 0) });
    assert.deepStrictEqual([...N.list.keys()], ['expense-reminder']);
  }
});

test('(c) le titre du J+2 (fr/en/mg effectifs) n\'est dans aucun titre annulé par titre', () => {
  const N = fakeNotifications();
  loadNotifications(N); // le module doit se charger tel quel
  const src = readFileSync(join(ROOT, 'lib/notifications.ts'), 'utf8');
  const keys = [...src.matchAll(/'(reminder\d)'/g)].map((m) => m[1]);
  assert.strictEqual(keys.length, 4);
  const reserved = new Set();
  for (const l of LANGS) for (const k of keys) reserved.add(i18n.t(`notifications.${k}Title`, { lng: l }));
  assert.ok(reserved.size >= 4);
  for (const l of LANGS) {
    const title = i18n.t('betaTester.reminder.title', { lng: l });
    assert.ok(!reserved.has(title), `${l} : « ${title} » serait annulé par titre`);
  }
  assert.strictEqual(tr.fr['betaTester.reminder.title'], '10 imports illimités à vie à gagner');
  assert.strictEqual(tr.en['betaTester.reminder.title'], '10 unlimited imports for life to win');
});

test('(c) le J+2 résiste réellement à l\'annulation par titre, dans chaque langue', async () => {
  for (const l of LANGS) {
    i18n.lang = l;
    const N = fakeNotifications([betaReq()]);
    await loadNotifications(N).scheduleReminders('2h');
    assert.ok(N.list.has('import-beta-reminder'), l);
  }
  i18n.lang = 'fr';
});

test('(d) cancelAllReminders : un seul appelant, la remise à zéro complète des réglages', () => {
  const { execSync } = require('node:child_process');
  const out = execSync('grep -rnE "cancelAllReminders|cancelAllScheduledNotificationsAsync" app components hooks lib --include="*.ts" --include="*.tsx"',
    { cwd: ROOT, encoding: 'utf8', shell: '/bin/bash' }).split('\n').filter((l) => l && !l.includes('__tests__'));
  const callers = out.filter((l) => !l.startsWith('lib/notifications.ts') && !/import \{/.test(l));
  assert.deepStrictEqual(callers.map((l) => l.split(':')[0]), ['app/(tabs)/settings.tsx']);
  const settings = readFileSync(join(ROOT, 'app/(tabs)/settings.tsx'), 'utf8');
  const i = settings.indexOf('await cancelAllReminders()');
  assert.ok(i > 0);
  const before = settings.slice(Math.max(0, i - 1500), i);
  assert.match(before, /DROP TABLE IF EXISTS/);
  assert.match(before, /migrateDatabase\(db\)/);
});

test('lib/notifications.ts : ne connaît pas le rappel bêta', () => {
  const s = readFileSync(join(ROOT, 'lib/notifications.ts'), 'utf8');
  assert.doesNotMatch(s, /import-beta|import_beta|betaTester/);
});
