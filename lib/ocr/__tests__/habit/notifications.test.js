// Mode de rappel 'evening' : coupe série/défi/quête, laisse les autres modes identiques.
const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

const ROOT = join(__dirname, '../../../..');

function load() {
  const sched = new Map(); // identifier -> request
  const calls = [];
  const N = {
    SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date', TIME_INTERVAL: 'timeInterval', WEEKLY: 'weekly' },
    AndroidImportance: { DEFAULT: 3, HIGH: 4 },
    setNotificationChannelAsync: async () => {},
    setNotificationHandler: () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getAllScheduledNotificationsAsync: async () => [...sched.values()],
    cancelScheduledNotificationAsync: async (id) => { calls.push(['cancel', id]); sched.delete(id); },
    cancelAllScheduledNotificationsAsync: async () => { sched.clear(); },
    scheduleNotificationAsync: async (req) => {
      calls.push(['schedule', req.identifier]);
      sched.set(req.identifier, { identifier: req.identifier, content: req.content, trigger: req.trigger });
      return req.identifier;
    },
  };
  const i18n = { t: (k) => k, default: null };
  i18n.default = i18n;
  const stubs = {
    'expo-notifications': N,
    'react-native': { Platform: { OS: 'android' } },
    './i18n': { __esModule: true, default: { t: (k) => k }, LANGUAGES: [{ code: 'fr' }, { code: 'en' }] },
    '../i18n': { __esModule: true, default: { t: (k) => k } },
  };
  const cache = {};
  const loadTs = (rel) => {
    if (cache[rel]) return cache[rel].exports;
    const src = readFileSync(join(ROOT, rel), 'utf8');
    const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020', esModuleInterop: true } }).outputText;
    const mod = { exports: {} };
    cache[rel] = mod;
    const req = (n) => {
      if (n === './habit/eveningReminder') return loadTs('lib/habit/eveningReminder.ts');
      if (n === './deferSlot') return loadTs('lib/habit/deferSlot.ts');
      if (n in stubs) return stubs[n];
      throw new Error(`import inattendu ${n} (${rel})`);
    };
    new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
    return mod.exports;
  };
  return { n: loadTs('lib/notifications.ts'), ev: loadTs('lib/habit/eveningReminder.ts'), sched, calls };
}

test('mode evening : rappel quotidien 19 h (data.type evening_reminder), aucun rappel de saisie', async () => {
  const { n, sched } = load();
  await n.scheduleReminders('evening');
  const r = sched.get('evening-reminder');
  assert.ok(r, 'rappel du soir programmé');
  assert.strictEqual(r.trigger.type, 'daily');
  assert.deepStrictEqual([r.trigger.hour, r.trigger.minute], [19, 0]);
  assert.strictEqual(r.content.data.type, 'evening_reminder');
  assert.strictEqual(r.content.data.once, false);
  assert.ok(!sched.has('expense-reminder'));
});

test('mode evening : série, défi et quête existants sont annulés, et ne se reprogramment plus', async () => {
  const { n, sched } = load();
  await n.scheduleReminders('4h');
  await n.scheduleStreakReminder('t', 'b');
  await n.scheduleDailyChallengeReminder('t', 'b');
  await n.scheduleQuestProgressReminder('t', 'b');
  const before = [...sched.keys()];
  assert.ok(before.length >= 4, `rappels 4h + série + défi + quête : ${before}`);
  await n.scheduleReminders('evening');
  assert.deepStrictEqual([...sched.keys()], ['evening-reminder']);
  await n.scheduleStreakReminder('t', 'b');
  await n.scheduleDailyChallengeReminder('t', 'b');
  await n.scheduleQuestProgressReminder('t', 'b');
  assert.deepStrictEqual([...sched.keys()], ['evening-reminder']);
});

test('modes ≠ evening : série, défi, quête et rappel de saisie programmés comme avant', async () => {
  for (const f of ['1h', '2h', '4h', 'off']) {
    const { n, sched, ev } = load();
    await n.scheduleReminders(f);
    assert.strictEqual(ev.isEveningMode(), false);
    assert.ok(!sched.has('evening-reminder'), f);
    assert.strictEqual(sched.has('expense-reminder'), f !== 'off', f);
    const before = sched.size;
    await n.scheduleStreakReminder('t', 'b');
    await n.scheduleDailyChallengeReminder('t', 'b');
    await n.scheduleQuestProgressReminder('t', 'b');
    assert.strictEqual(sched.size, before + 3, f);
  }
});

test('mode evening → 1h : le drapeau retombe, série reprogrammable, rappel du soir annulé', async () => {
  const { n, sched, ev } = load();
  await n.scheduleReminders('evening');
  assert.strictEqual(ev.isEveningMode(), true);
  await n.scheduleReminders('1h');
  assert.strictEqual(ev.isEveningMode(), false);
  assert.ok(!sched.has('evening-reminder'));
  assert.ok(sched.has('expense-reminder'));
  await n.scheduleStreakReminder('t', 'b');
  assert.ok([...sched.values()].some((r) => r.content.data?.type === 'streak_reminder' || /streak/.test(r.identifier)));
});

test('annulation du rappel quotidien du soir : le rappel unique (data.once) reste', async () => {
  const { n, sched, ev } = load();
  await ev.scheduleEveningDailyReminder();
  await ev.scheduleEveningOnceReminder(new Date(2030, 0, 1, 21, 0, 0));
  assert.ok(sched.has('evening-reminder') && sched.has('evening-reminder-once'));
  assert.strictEqual(sched.get('evening-reminder-once').content.data.once, true);
  await ev.cancelEveningDailyReminder();
  assert.ok(!sched.has('evening-reminder'));
  assert.ok(sched.has('evening-reminder-once'));
  // changement de réglage (evening → off) : le quotidien part, l'unique reste
  await ev.scheduleEveningDailyReminder();
  await n.scheduleReminders('off');
  assert.ok(!sched.has('evening-reminder'));
  assert.ok(sched.has('evening-reminder-once'));
});

test('annulation Android : un quotidien du soir avec un autre identifiant est aussi retiré (data.type)', async () => {
  const { sched, ev } = load();
  sched.set('uuid-xyz', { identifier: 'uuid-xyz', content: { data: { type: 'evening_reminder', once: false } } });
  sched.set('autre', { identifier: 'autre', content: { data: { type: 'weekly_report' } } });
  sched.set('sans-data', { identifier: 'sans-data', content: {} });
  await ev.cancelEveningDailyReminder();
  assert.deepStrictEqual([...sched.keys()].sort(), ['autre', 'sans-data']);
});

test('rappels hebdo et échéances : non touchés par le changement de mode', async () => {
  const { n, sched } = load();
  sched.set('weekly-report', { identifier: 'weekly-report', content: { data: { type: 'weekly_report' } } });
  sched.set('planif-reminder-1', { identifier: 'planif-reminder-1', content: { data: { type: 'planification_reminder' } } });
  for (const f of ['evening', '2h', 'off', 'evening']) await n.scheduleReminders(f);
  assert.ok(sched.has('weekly-report') && sched.has('planif-reminder-1'));
});
