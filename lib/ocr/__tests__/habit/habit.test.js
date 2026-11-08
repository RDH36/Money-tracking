// Lot « habitude d'abord » : deferSlot, éligibilité de la proposition, calcul du jour, migration V27.
const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { deferSlot, lateEveningDate } = require(`${o}/../habit/deferSlot.js`);
const hp = require(`${o}/../habit/habitPrompt.js`);
const { computeTodayStats, isSameDay } = require(`${o}/../habit/todayStats.js`);
const { migrateToV27 } = require(`${o}/../database/migrationV27.js`);
const { migrateDatabase } = require(`${o}/../database/migrations.js`);

const at = (h, m = 0, s = 0) => new Date(2026, 10, 8, h, m, s);

test('deferSlot : avant 19 h → ce soir 19 h ; 19 h-21 h → 21 h ; ≥ 21 h → demain 19 h', () => {
  assert.strictEqual(deferSlot(at(0, 0)), 'tonight_19');
  assert.strictEqual(deferSlot(at(8, 30)), 'tonight_19');
  assert.strictEqual(deferSlot(at(18, 59, 59)), 'tonight_19');
  assert.strictEqual(deferSlot(at(19, 0)), 'tonight_21');
  assert.strictEqual(deferSlot(at(20, 59, 59)), 'tonight_21');
  assert.strictEqual(deferSlot(at(21, 0)), 'tomorrow_19');
  assert.strictEqual(deferSlot(at(23, 59)), 'tomorrow_19');
});

test('lateEveningDate : 21:00:00 pile, même jour, sans muter now', () => {
  const now = at(19, 42, 10);
  const d = lateEveningDate(now);
  assert.deepStrictEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()], [2026, 10, 8, 21, 0, 0]);
  assert.strictEqual(now.getHours(), 19);
  assert.ok(d > now);
});

const base = { reminderFrequency: 'evening', reminderOrigin: 'new_install', alreadyShown: false, distinctDays: 3 };
test('proposition « 3 jours » : éligible seulement si tout est réuni', () => {
  assert.strictEqual(hp.isHabitPromptEligible(base), true);
  assert.strictEqual(hp.isHabitPromptEligible({ ...base, distinctDays: 12 }), true);
  assert.strictEqual(hp.isHabitPromptEligible({ ...base, distinctDays: 2 }), false);
  assert.strictEqual(hp.isHabitPromptEligible({ ...base, distinctDays: 0 }), false);
  assert.strictEqual(hp.isHabitPromptEligible({ ...base, alreadyShown: true }), false);
  for (const f of ['1h', '2h', '4h', 'off', null, undefined, '']) {
    assert.strictEqual(hp.isHabitPromptEligible({ ...base, reminderFrequency: f }), false, String(f));
  }
  // base existante : pas de reminder_origin
  for (const og of [null, undefined, '', 'migrated']) {
    assert.strictEqual(hp.isHabitPromptEligible({ ...base, reminderOrigin: og }), false, String(og));
  }
  assert.strictEqual(hp.isHabitPromptEligible({ ...base, distinctDays: NaN }), false);
});

test('SQL des jours distincts : heure locale, transactions non supprimées', () => {
  assert.match(hp.DISTINCT_ENTRY_DAYS_SQL, /COUNT\(DISTINCT date\(created_at, 'localtime'\)\)/);
  assert.match(hp.DISTINCT_ENTRY_DAYS_SQL, /deleted_at IS NULL/);
});

test('computeTodayStats : vide, transferts exclus, jour local, revenus hors compteur de dépenses', () => {
  const now = at(15);
  assert.deepStrictEqual(computeTodayStats([], now), { income: 0, expense: 0, count: 0, expenseCount: 0, net: 0 });
  const iso = (d) => d.toISOString();
  const txs = [
    { created_at: iso(at(1)), type: 'expense', amount: 100 },
    { created_at: iso(at(14)), type: 'expense', amount: 50 },
    { created_at: iso(at(9)), type: 'income', amount: 400 },
    { created_at: iso(at(10)), type: 'expense', amount: 999, transfer_id: 'tr1' },
    { created_at: iso(new Date(2026, 10, 7, 23, 59)), type: 'expense', amount: 7 },
    { created_at: iso(new Date(2026, 10, 9, 0, 0)), type: 'expense', amount: 7 },
    { created_at: 'pas une date', type: 'expense', amount: 7 },
    { created_at: iso(at(11)), type: 'autre', amount: 5 },
  ];
  assert.deepStrictEqual(computeTodayStats(txs, now), { income: 400, expense: 150, count: 4, expenseCount: 2, net: 250 });
  assert.strictEqual(isSameDay('pas une date', now), false);
});

function fakeDb(version) {
  const writes = [];
  const db = {
    version, writes, log: [],
    execAsync: async (sql) => { db.log.push(sql); const m = /user_version = (\d+)/.exec(sql); if (m) db.version = +m[1]; },
    runAsync: async (sql, values) => { writes.push({ sql, values }); },
    getFirstAsync: async () => ({ user_version: db.version }),
    getAllAsync: async () => [],
  };
  return db;
}

test('V27 base neuve (départ 0) : reminder_frequency=evening et reminder_origin=new_install', async () => {
  const db = fakeDb(0);
  await migrateToV27(db, 0);
  const kv = Object.fromEntries(db.writes.map((w) => [w.values[0], w.values[1]]));
  assert.deepStrictEqual(kv, { reminder_frequency: 'evening', reminder_origin: 'new_install' });
  assert.ok(db.writes.every((w) => /INSERT OR REPLACE INTO settings/.test(w.sql)));
});

test('V27 base existante (départ ≥ 1) : aucune écriture', async () => {
  for (const v of [1, 5, 25, 26]) {
    const db = fakeDb(v);
    await migrateToV27(db, v);
    assert.deepStrictEqual(db.writes, [], `départ ${v}`);
  }
});

test('migrateDatabase depuis v26 : version 27, aucune écriture reminder_* (1h/2h conservés)', async () => {
  const db = fakeDb(26);
  await migrateDatabase(db);
  assert.strictEqual(db.version, 27);
  assert.deepStrictEqual(db.writes.filter((w) => /reminder_/.test(JSON.stringify(w))), []);
});

test('migrateDatabase depuis 0 : startVersion capturé AVANT les migrations (evening posé une fois)', async () => {
  const db = fakeDb(0);
  // La base « avance » pendant les migrations : si V27 relisait user_version il ne verrait plus 0.
  const orig = db.execAsync;
  db.execAsync = async (sql) => { await orig(sql); if (/CREATE TABLE/i.test(sql)) db.version = Math.max(db.version, 1); };
  try { await migrateDatabase(db); } catch (e) { return assert.fail(`migration 0→27 sur faux db : ${e.message}`); }
  assert.strictEqual(db.version, 27);
  const freq = db.writes.filter((w) => w.values && w.values[0] === 'reminder_frequency');
  assert.strictEqual(freq.length, 1);
  assert.strictEqual(freq[0].values[1], 'evening');
  assert.ok(db.writes.some((w) => w.values && w.values[0] === 'reminder_origin' && w.values[1] === 'new_install'));
});
