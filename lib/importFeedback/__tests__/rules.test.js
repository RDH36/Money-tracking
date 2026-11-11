const test = require('node:test');
const assert = require('node:assert');
const R = require(process.env.FEEDBACK_OUT + '/index.js');

const form = (o = {}) => ({ feeling: 'ok', comment: '', email: '', consent: false, ...o });

test('validateSurvey : avis sans e-mail accepté (email null)', () => {
  assert.deepStrictEqual(R.validateSurvey(form()), { ok: true, email: null });
  assert.deepStrictEqual(R.validateSurvey(form({ email: '   ' })), { ok: true, email: null });
});

test('validateSurvey : ressenti obligatoire', () => {
  assert.deepStrictEqual(R.validateSurvey(form({ feeling: null })), { ok: false, error: 'feelingMissing' });
});

test('validateSurvey : e-mail sans consentement refusé', () => {
  assert.deepStrictEqual(R.validateSurvey(form({ email: 'nom@exemple.com' })), { ok: false, error: 'consentMissing' });
});

test('validateSurvey : e-mail invalide refusé (même consenti)', () => {
  for (const email of ['nom', 'nom@', '@exemple.com', 'nom@exemple', 'nom@exemple..com', 'no m@exemple.com', 'a@b.c', 'nom@exemple.com.', 'a@@b.com']) {
    assert.deepStrictEqual(R.validateSurvey(form({ email, consent: true })), { ok: false, error: 'emailInvalid' }, email);
  }
  const long = 'a'.repeat(250) + '@exemple.com';
  assert.strictEqual(R.validateSurvey(form({ email: long, consent: true })).ok, false);
});

test('validateSurvey : consentement coché sans e-mail refusé', () => {
  assert.deepStrictEqual(R.validateSurvey(form({ consent: true })), { ok: false, error: 'emailMissing' });
  assert.deepStrictEqual(R.validateSurvey(form({ consent: true, email: '  ' })), { ok: false, error: 'emailMissing' });
});

test('validateSurvey : e-mail valide + consentement, espaces rognés', () => {
  assert.deepStrictEqual(R.validateSurvey(form({ email: '  nom@exemple.com  ', consent: true })), { ok: true, email: 'nom@exemple.com' });
  assert.strictEqual(R.validateSurvey(form({ email: 'prenom.nom+tag@sous.exemple.co', consent: true })).ok, true);
});

const base = { prevUsed: 2, used: 3, limit: 3, unlimited: false, answered: false, laterAt: null, now: new Date(2026, 10, 11, 10, 0) };

test('shouldAutoPrompt : seulement au franchissement du quota', () => {
  assert.strictEqual(R.shouldAutoPrompt(base), true);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, prevUsed: 0, used: 1 }), false);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, prevUsed: 1, used: 2 }), false);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, prevUsed: 3, used: 4 }), false, 'déjà au quota : pas de boucle');
  assert.strictEqual(R.shouldAutoPrompt({ ...base, prevUsed: 1, used: 3 }), true, 'saut 1 -> 3');
  assert.strictEqual(R.shouldAutoPrompt({ ...base, prevUsed: 2, used: 4 }), true, 'saut 2 -> 4');
});

test('shouldAutoPrompt : illimité, déjà répondu', () => {
  assert.strictEqual(R.shouldAutoPrompt({ ...base, unlimited: true }), false);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, answered: true }), false);
});

test('shouldAutoPrompt : « Plus tard » à 6 j non, 7 j oui, date corrompue ignorée', () => {
  const day = 24 * 3600 * 1000;
  const later = (d) => new Date(base.now.getTime() - d * day).toISOString();
  assert.strictEqual(R.shouldAutoPrompt({ ...base, laterAt: later(0) }), false);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, laterAt: later(6) }), false);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, laterAt: later(7) }), true);
  assert.strictEqual(R.shouldAutoPrompt({ ...base, laterAt: 'n importe quoi' }), true);
});

test('betaCardState : 1/3, 2/3, 3/3, bornes', () => {
  const c = { loaded: true, unlimited: false, answered: false, used: 1, limit: 3 };
  assert.deepStrictEqual(R.betaCardState(c), { progress: 1, limit: 3, ready: false });
  assert.deepStrictEqual(R.betaCardState({ ...c, used: 2 }), { progress: 2, limit: 3, ready: false });
  assert.deepStrictEqual(R.betaCardState({ ...c, used: 3 }), { progress: 3, limit: 3, ready: true });
  assert.deepStrictEqual(R.betaCardState({ ...c, used: 7 }), { progress: 3, limit: 3, ready: true });
  assert.deepStrictEqual(R.betaCardState({ ...c, used: 0 }), { progress: 0, limit: 3, ready: false });
  assert.deepStrictEqual(R.betaCardState({ ...c, used: -2 }), { progress: 0, limit: 3, ready: false });
});

test('betaCardState : masquée (non chargé, illimité, répondu, limite 0)', () => {
  const c = { loaded: true, unlimited: false, answered: false, used: 3, limit: 3 };
  assert.strictEqual(R.betaCardState({ ...c, loaded: false }), null);
  assert.strictEqual(R.betaCardState({ ...c, unlimited: true }), null);
  assert.strictEqual(R.betaCardState({ ...c, answered: true }), null);
  assert.strictEqual(R.betaCardState({ ...c, limit: 0 }), null);
});

test('betaReminderDate : J+2 à 12 h 30 heure locale, fin de mois et après 12 h 30', () => {
  const d = R.betaReminderDate(new Date(2026, 9, 30, 14, 45, 12));
  assert.deepStrictEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()], [2026, 10, 1, 12, 30, 0]);
  const e = R.betaReminderDate(new Date(2026, 11, 31, 9, 0));
  assert.deepStrictEqual([e.getFullYear(), e.getMonth(), e.getDate(), e.getHours(), e.getMinutes()], [2027, 0, 2, 12, 30]);
});

test('reminderPlan : programme, ou null selon avis / off / permission / date passée / absence de lecture', () => {
  const first = new Date(2026, 10, 10, 20, 0).toISOString();
  const i = { firstReadAt: first, answered: false, frequency: '1h', granted: true, now: new Date(2026, 10, 11, 9, 0) };
  const p = R.reminderPlan(i);
  assert.deepStrictEqual([p.getDate(), p.getHours(), p.getMinutes()], [12, 12, 30]);
  assert.strictEqual(R.reminderPlan({ ...i, answered: true }), null);
  assert.strictEqual(R.reminderPlan({ ...i, frequency: 'off' }), null);
  assert.ok(R.reminderPlan({ ...i, frequency: 'evening' }));
  assert.ok(R.reminderPlan({ ...i, frequency: undefined }));
  assert.strictEqual(R.reminderPlan({ ...i, granted: false }), null);
  assert.strictEqual(R.reminderPlan({ ...i, firstReadAt: null }), null);
  assert.strictEqual(R.reminderPlan({ ...i, firstReadAt: 'xx' }), null);
  assert.strictEqual(R.reminderPlan({ ...i, now: new Date(2026, 10, 12, 12, 30, 0) }), null, 'date passée (égalité)');
  assert.ok(R.reminderPlan({ ...i, now: new Date(2026, 10, 12, 12, 29) }));
});

test('clés de réglages et clé de sondage', () => {
  assert.strictEqual(R.IMPORT_SURVEY_KEY, 'import_g1');
  assert.strictEqual(R.FEEDBACK_KEYS.rewardedAt, 'import_feedback_rewarded_at');
});
