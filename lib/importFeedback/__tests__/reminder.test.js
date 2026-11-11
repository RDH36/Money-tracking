const test = require('node:test');
const assert = require('node:assert');
const Rem = require(process.env.FEEDBACK_OUT + '/reminder.js');

function fakeApi({ granted = true, ids = [] } = {}) {
  const scheduled = new Map(ids.map((i) => [i, null]));
  const log = [];
  return {
    scheduled, log,
    async isGranted() { log.push('granted?'); return granted; },
    async listScheduledIds() { return [...scheduled.keys()]; },
    async cancel(id) { log.push(['cancel', id]); scheduled.delete(id); },
    async scheduleAt(id, date, type) { log.push(['schedule', id, type]); scheduled.set(id, date); },
  };
}
const first = new Date(2026, 10, 10, 20, 0).toISOString();
const input = (o = {}) => ({ firstReadAt: first, answered: false, frequency: '1h', now: new Date(2026, 10, 11, 9, 0), ...o });

test('identifiant et type propres au rappel', () => {
  assert.strictEqual(Rem.IMPORT_BETA_REMINDER_ID, 'import-beta-reminder');
  assert.strictEqual(Rem.IMPORT_BETA_REMINDER_TYPE, 'import_beta');
});

test('programme une fois à J+2 12 h 30, jamais deux fois, jamais décalé', async () => {
  const api = fakeApi();
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input()), 'scheduled');
  const d = api.scheduled.get('import-beta-reminder');
  assert.deepStrictEqual([d.getDate(), d.getHours(), d.getMinutes()], [12, 12, 30]);
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ firstReadAt: new Date(2026, 10, 11, 8, 0).toISOString() })), 'kept');
  assert.strictEqual(api.log.filter((l) => l[0] === 'schedule').length, 1);
  assert.strictEqual(api.scheduled.get('import-beta-reminder'), d);
});

test('deux synchronisations simultanées : une seule programmation', async () => {
  const api = fakeApi();
  const r = await Promise.all([Rem.syncImportBetaReminder(api, input()), Rem.syncImportBetaReminder(api, input())]);
  assert.deepStrictEqual(r.sort(), ['kept', 'scheduled']);
  assert.strictEqual(api.log.filter((l) => l[0] === 'schedule').length, 1);
});

test('avis envoyé : annule, sans même demander la permission', async () => {
  const api = fakeApi({ ids: ['import-beta-reminder'] });
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ answered: true })), 'cancelled');
  assert.strictEqual(api.scheduled.size, 0);
  assert.strictEqual(api.log.includes('granted?'), false);
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ answered: true })), 'none');
});

test('rappels coupés (off) : annule ; réactivé avant l\'échéance : reprogramme', async () => {
  const api = fakeApi();
  await Rem.syncImportBetaReminder(api, input());
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ frequency: 'off' })), 'cancelled');
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ frequency: 'evening' })), 'scheduled');
});

test('permission absente : rien (et ne la demande pas) ; annule un rappel existant', async () => {
  const api = fakeApi({ granted: false });
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input()), 'none');
  assert.strictEqual(api.log.some((l) => l[0] === 'schedule'), false);
  const api2 = fakeApi({ granted: false, ids: ['import-beta-reminder'] });
  assert.strictEqual(await Rem.syncImportBetaReminder(api2, input()), 'cancelled');
});

test('pas de première lecture ou échéance passée : rien programmé', async () => {
  const api = fakeApi();
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ firstReadAt: null })), 'none');
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input({ now: new Date(2026, 10, 13, 8, 0) })), 'none');
  assert.strictEqual(api.scheduled.size, 0);
});

test('ne touche jamais aux autres notifications', async () => {
  const api = fakeApi({ ids: ['evening-daily', 'expense-reminder'] });
  await Rem.syncImportBetaReminder(api, input());
  await Rem.syncImportBetaReminder(api, input({ answered: true }));
  assert.deepStrictEqual([...api.scheduled.keys()].sort(), ['evening-daily', 'expense-reminder']);
});

test('erreur de l\'API : la file continue, résultat none', async () => {
  const api = fakeApi();
  api.isGranted = async () => { throw new Error('x'); };
  assert.strictEqual(await Rem.syncImportBetaReminder(api, input()), 'none');
  const ok = fakeApi();
  assert.strictEqual(await Rem.syncImportBetaReminder(ok, input()), 'scheduled');
});
