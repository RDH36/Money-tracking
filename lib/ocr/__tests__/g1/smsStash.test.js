const test = require('node:test');
const assert = require('node:assert');
const { stashPastedSms, initialCaptureState } = require(`${process.env.OCR_OUT}/import/pickFlow.js`);

const SMS = 'MVola: Vous avez envoye 25 000 Ar a RAKOTO Jean (0340000000) le 05/11/26. Ref: 1234567890';

test('param sms = clé sans texte (ni nom, ni numéro, ni montant)', () => {
  const key = stashPastedSms(SMS);
  assert.match(key, /^p\d+$/);
  for (const frag of ['RAKOTO', '0340000000', '25 000', 'MVola', '1234567890']) assert.ok(!key.includes(frag));
});

test('la clé rend le texte à l écran d import', () => {
  const key = stashPastedSms(SMS);
  const s = initialCaptureState({ sms: key });
  assert.strictEqual(s.status, 'ready');
  assert.strictEqual(s.text, SMS);
  assert.strictEqual(s.source, 'sms');
  assert.ok(!s.key.includes('RAKOTO'));
});

test('clé inconnue, ancienne ou texte brut → pas d état sms', () => {
  const old = stashPastedSms(SMS);
  stashPastedSms('autre'); // un nouveau collage remplace l ancien
  for (const sms of ['p99999', old, SMS, 'x']) {
    const s = initialCaptureState({ sms });
    assert.ok(s.text === undefined, sms);
    assert.notStrictEqual(s.source, 'sms');
  }
});

test('deux collages → deux clés différentes', () => {
  assert.notStrictEqual(stashPastedSms(SMS), stashPastedSms(SMS));
});
