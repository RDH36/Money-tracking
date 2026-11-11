const test = require('node:test');
const assert = require('node:assert');
const R = require(process.env.FEEDBACK_OUT + '/index.js');

function fakeDb() {
  const rows = new Map();
  return {
    rows,
    async getAllAsync(sql, params) {
      return params.filter((k) => rows.has(k)).map((key) => ({ key, value: rows.get(key) }));
    },
    async runAsync(sql, params) {
      rows.set(params[0], params[1]);
    },
  };
}
const PENDING = 'import_g1_survey_pending';
const REJECTS = 'import_g1_survey_rejects';
const tr = (status, o = {}) => ({ url: 'https://srv.exemple.com', anonKey: 'cle', isOnline: async () => true, fetchImpl: async () => ({ ok: false, status }), ...o });
const ok = { url: 'https://srv.exemple.com', anonKey: 'cle', isOnline: async () => true, fetchImpl: async () => ({ ok: true, status: 201 }) };
const queue = async (db) => R.queueSurvey(db, { survey_key: 'import_g1', response: { comment: 'test' } });

test('constantes : clé des refus et seuil de 3', () => {
  assert.strictEqual(R.FEEDBACK_KEYS.rejects, REJECTS);
  assert.strictEqual(R.MAX_SURVEY_REJECTS, 3);
});

for (const status of [400, 401, 403, 404, 422, 499]) {
  test(`refus ${status} x3 : kept, kept, puis dropped (pending et compteur vidés)`, async () => {
    const db = fakeDb();
    await queue(db);
    assert.strictEqual(await R.sendPendingSurvey(db, tr(status)), 'kept');
    assert.strictEqual(db.rows.get(REJECTS), '1');
    assert.strictEqual(await R.sendPendingSurvey(db, tr(status)), 'kept');
    assert.strictEqual(db.rows.get(REJECTS), '2');
    assert.ok(db.rows.get(PENDING));
    assert.strictEqual(await R.sendPendingSurvey(db, tr(status)), 'dropped');
    assert.ok(!db.rows.get(PENDING));
    assert.ok(!db.rows.get(REJECTS));
    // plus aucun renvoi
    let n = 0;
    const t = tr(400, { fetchImpl: async () => { n++; return { ok: false, status: 400 }; } });
    assert.strictEqual(await R.sendPendingSurvey(db, t), 'none');
    assert.strictEqual(n, 0);
  });
}

test('rewardedAt jamais touché par un abandon', async () => {
  const db = fakeDb();
  await R.writeFeedbackSetting(db, R.FEEDBACK_KEYS.rewardedAt, '2026-11-11T08:00:00.000Z');
  await queue(db);
  for (let i = 0; i < 3; i++) await R.sendPendingSurvey(db, tr(400));
  assert.strictEqual(db.rows.get(R.FEEDBACK_KEYS.rewardedAt), '2026-11-11T08:00:00.000Z');
});

test('5xx, 408, 429, hors ligne, exception : kept sans toucher au compteur (même répétés)', async () => {
  const cases = [tr(500), tr(503), tr(408), tr(429), tr(400, { isOnline: async () => false }),
    tr(400, { fetchImpl: async () => { throw new Error('réseau'); } }), tr(400, { url: '' })];
  for (const t of cases) {
    const db = fakeDb();
    await queue(db);
    for (let i = 0; i < 5; i++) assert.strictEqual(await R.sendPendingSurvey(db, t), 'kept');
    assert.ok(db.rows.get(PENDING));
    assert.ok(!db.rows.get(REJECTS));
  }
});

test('refus passagers entre deux refus : le compteur ne bouge pas', async () => {
  const db = fakeDb();
  await queue(db);
  await R.sendPendingSurvey(db, tr(400));
  await R.sendPendingSurvey(db, tr(500));
  await R.sendPendingSurvey(db, tr(429));
  assert.strictEqual(db.rows.get(REJECTS), '1');
});

test('succès après 1 refus : sent, pending et compteur vidés ; un nouveau refus repart de 1', async () => {
  const db = fakeDb();
  await queue(db);
  await R.sendPendingSurvey(db, tr(400));
  await R.sendPendingSurvey(db, tr(400));
  assert.strictEqual(await R.sendPendingSurvey(db, ok), 'sent');
  assert.ok(!db.rows.get(PENDING));
  assert.ok(!db.rows.get(REJECTS));
  await queue(db);
  assert.strictEqual(await R.sendPendingSurvey(db, tr(400)), 'kept');
  assert.strictEqual(db.rows.get(REJECTS), '1');
});

test('queueSurvey remet le compteur à vide (nouvel avis après des refus)', async () => {
  const db = fakeDb();
  await queue(db);
  await R.sendPendingSurvey(db, tr(400));
  await R.sendPendingSurvey(db, tr(400));
  await queue(db);
  assert.ok(!db.rows.get(REJECTS));
  assert.strictEqual(await R.sendPendingSurvey(db, tr(400)), 'kept');
  assert.strictEqual(await R.sendPendingSurvey(db, tr(400)), 'kept');
  assert.strictEqual(await R.sendPendingSurvey(db, tr(400)), 'dropped');
});

test('sans avis en attente : none, aucun fetch', async () => {
  const db = fakeDb();
  assert.strictEqual(await R.sendPendingSurvey(db, tr(400, { fetchImpl: async () => assert.fail('pas de fetch') })), 'none');
});
