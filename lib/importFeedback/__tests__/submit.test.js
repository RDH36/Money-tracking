const test = require('node:test');
const assert = require('node:assert');
const R = require(process.env.FEEDBACK_OUT + '/index.js');

/** Fausse table `settings` (clé -> valeur). */
function fakeDb() {
  const rows = new Map();
  return {
    rows,
    async getAllAsync(sql, params) {
      assert.match(sql, /FROM settings WHERE key IN/);
      return params.filter((k) => rows.has(k)).map((key) => ({ key, value: rows.get(key) }));
    },
    async runAsync(sql, params) {
      assert.match(sql, /INSERT OR REPLACE INTO settings/);
      rows.set(params[0], params[1]);
    },
  };
}

const now = new Date('2026-11-11T08:00:00.000Z');
const input = (o = {}) => ({
  feeling: 'ok', question: 'Q ?', answer: 'Correct', comment: '  un avis  ', email: null,
  consentText: 'J\'accepte', currency: 'MGA', appVersion: '2.2.0', platform: 'android', project: 'mitsitsy', now, ...o,
});
const transport = (fetchImpl, o = {}) => ({ url: 'https://srv.exemple.com', anonKey: 'cle', isOnline: async () => true, fetchImpl, ...o });

test('buildSurveyPayload : sans e-mail, pas de participation, e-mail null', () => {
  const p = R.buildSurveyPayload(input());
  assert.strictEqual(p.survey_key, 'import_g1');
  assert.strictEqual(p.email, null);
  assert.deepStrictEqual(p.response.draw, { participates: false });
  assert.strictEqual(p.response.comment, 'un avis');
  assert.strictEqual(p.response.items[0].value, 'ok');
  assert.strictEqual(p.currency, 'MGA');
  assert.strictEqual(p.device_platform, 'android');
  assert.strictEqual(JSON.stringify(p).includes('consent_text'), false);
});

test('buildSurveyPayload : e-mail consenti, commentaire vide -> null', () => {
  const p = R.buildSurveyPayload(input({ email: 'nom@exemple.com', comment: '   ' }));
  assert.strictEqual(p.email, 'nom@exemple.com');
  assert.strictEqual(p.response.comment, null);
  assert.deepStrictEqual(p.response.draw, {
    participates: true, consent: true, consent_text: 'J\'accepte', consent_at: now.toISOString(),
  });
});

test('queueSurvey puis envoi OK : POST feature_surveys, pending vidé', async () => {
  const db = fakeDb();
  const payload = R.buildSurveyPayload(input());
  await R.queueSurvey(db, payload);
  assert.strictEqual(db.rows.get('import_g1_survey_pending'), JSON.stringify(payload));
  const calls = [];
  const res = await R.sendPendingSurvey(db, transport(async (url, init) => { calls.push([url, init]); return { ok: true }; }));
  assert.strictEqual(res, 'sent');
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0][0], 'https://srv.exemple.com/rest/v1/feature_surveys');
  assert.strictEqual(calls[0][1].method, 'POST');
  assert.strictEqual(calls[0][1].headers.apikey, 'cle');
  assert.strictEqual(calls[0][1].body, JSON.stringify(payload));
  assert.strictEqual((await R.readFeedbackState(db)).pending, null);
  assert.strictEqual(await R.sendPendingSurvey(db, transport(async () => assert.fail('pas de renvoi'))), 'none');
});

test('avis jamais perdu : hors ligne, HTTP 500, exception fetch, URL vide, isOnline qui plante', async () => {
  const cases = [
    transport(async () => assert.fail('hors ligne : pas de fetch'), { isOnline: async () => false }),
    transport(async () => ({ ok: false, status: 500 })),
    transport(async () => { throw new Error('réseau'); }),
    transport(async () => assert.fail('URL vide : pas de fetch'), { url: '' }),
    transport(async () => ({ ok: true }), { isOnline: async () => { throw new Error('x'); } }),
  ];
  for (const t of cases) {
    const db = fakeDb();
    await R.queueSurvey(db, R.buildSurveyPayload(input()));
    const before = db.rows.get('import_g1_survey_pending');
    assert.strictEqual(await R.sendPendingSurvey(db, t), 'kept');
    assert.strictEqual(db.rows.get('import_g1_survey_pending'), before);
  }
});

test('reprise après échec : le même avis part au lancement suivant', async () => {
  const db = fakeDb();
  await R.queueSurvey(db, R.buildSurveyPayload(input()));
  assert.strictEqual(await R.sendPendingSurvey(db, transport(async () => ({ ok: false }))), 'kept');
  assert.strictEqual(await R.sendPendingSurvey(db, transport(async () => ({ ok: true }))), 'sent');
  assert.strictEqual((await R.readFeedbackState(db)).pending, null);
});

test('deux appels qui se croisent : un seul envoi', async () => {
  const db = fakeDb();
  await R.queueSurvey(db, R.buildSurveyPayload(input()));
  let n = 0;
  const slow = transport(async () => { n++; await new Promise((r) => setTimeout(r, 20)); return { ok: true }; });
  const [a, b] = await Promise.all([R.sendPendingSurvey(db, slow), R.sendPendingSurvey(db, slow)]);
  assert.strictEqual(n, 1);
  assert.deepStrictEqual([a, b], ['sent', 'sent']);
  assert.strictEqual(await R.sendPendingSurvey(db, slow), 'none');
});

test('lecture d état : rien en base, valeur vide = absente', async () => {
  const db = fakeDb();
  assert.deepStrictEqual(await R.readFeedbackState(db), { rewardedAt: null, laterAt: null, firstReadAt: null, pending: null, rejects: 0 });
  await R.writeFeedbackSetting(db, R.FEEDBACK_KEYS.rejects, '2');
  assert.strictEqual((await R.readFeedbackState(db)).rejects, 2);
  await R.writeFeedbackSetting(db, R.FEEDBACK_KEYS.rejects, 'abc');
  assert.strictEqual((await R.readFeedbackState(db)).rejects, 0);
  await R.clearFeedbackSetting(db, R.FEEDBACK_KEYS.rejects);
  await R.writeFeedbackSetting(db, R.FEEDBACK_KEYS.rewardedAt, '2026-11-11T08:00:00.000Z');
  await R.clearFeedbackSetting(db, R.FEEDBACK_KEYS.laterAt);
  const s = await R.readFeedbackState(db);
  assert.strictEqual(s.rewardedAt, '2026-11-11T08:00:00.000Z');
  assert.strictEqual(s.laterAt, null);
});
