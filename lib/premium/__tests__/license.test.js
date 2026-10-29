// Licence Plus : vérification hors ligne. UNIQUEMENT une paire de clés de TEST générée ici.
const { test, before } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { Buffer } = require('node:buffer');
const premium = require(join(process.env.PREMIUM_OUT, 'index.js'));

const script = join(process.env.ROOT, 'scripts/plus/sign-license.mjs');
let dir, keyFile, pub, otherPub;
const run = (...a) => execFileSync('node', [script, ...a], { encoding: 'utf8' });
const sign = (...a) => JSON.parse(run('sign', '--key', keyFile, '--json', ...a)).token;
const day = (y, m, d) => new Date(y, m - 1, d, 15, 0, 0);

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'plus-test-'));
  keyFile = join(dir, 'a.key');
  pub = run('keygen', '--key', keyFile).trim().split('\n').pop();
  otherPub = run('keygen', '--key', join(dir, 'b.key')).trim().split('\n').pop();
});

test('jeton valide : accepté, champs décodés, droit ocr_unlimited', () => {
  const t = sign('--exp', '2027-01-31', '--plan', 'beta');
  const r = premium.verifyLicense(t, { publicKey: pub, now: day(2026, 10, 29) });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.license.plan, 'beta');
  assert.strictEqual(r.license.expiresOn, '2027-01-31');
  assert.strictEqual(r.license.flags.beta, true);
  assert.strictEqual(premium.hasEntitlement(r.license, 'ocr_unlimited'), true);
  assert.strictEqual(premium.hasEntitlement(null, 'ocr_unlimited'), false);
});

test('dernier jour inclus, lendemain expiré (licence renvoyée pour le message)', () => {
  const t = sign('--exp', '2026-11-30');
  assert.strictEqual(premium.verifyLicense(t, { publicKey: pub, now: day(2026, 11, 30) }).ok, true);
  const r = premium.verifyLicense(t, { publicKey: pub, now: day(2026, 12, 1) });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'expired');
  assert.strictEqual(r.license.expiresOn, '2026-11-30');
});

test('1 caractère falsifié (chaque zone du jeton) → invalid ou malformed, jamais ok', () => {
  const t = sign('--exp', '2027-01-31');
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  for (const pos of [0, 5, 9, 10, 11, 40, 100]) {
    const c = t[pos] === 'A' ? 'B' : 'A';
    const bad = t.slice(0, pos) + c + t.slice(pos + 1);
    const r = premium.verifyLicense(bad, { publicKey: pub, now: day(2026, 10, 29) });
    assert.strictEqual(r.ok, false, `position ${pos}`);
    assert.ok(['invalid', 'malformed'].includes(r.reason));
  }
  assert.ok(alpha.length === 64);
});

test('falsifier la date d\'expiration (octets exp) est refusé', () => {
  const t = sign('--exp', '2026-11-01');
  const bytes = Buffer.from(t.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  bytes[7] = 0x03; // exp rallongé
  const forged = bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const r = premium.verifyLicense(forged, { publicKey: pub, now: day(2026, 10, 29) });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'invalid');
});

test('mal formé : vide, court, long, hors alphabet, espaces seuls', () => {
  const t = sign('--exp', '2027-01-31');
  for (const bad of ['', '   ', 'abc', t.slice(0, 50), t + 'AAAA', t.slice(0, 100) + '!!', 'é'.repeat(102), '?l=']) {
    const r = premium.verifyLicense(bad, { publicKey: pub, now: day(2026, 10, 29) });
    assert.strictEqual(r.ok, false, JSON.stringify(bad));
    assert.strictEqual(r.reason, 'malformed', JSON.stringify(bad));
  }
});

test('mauvaise clé publique ou clé publique illisible → invalid', () => {
  const t = sign('--exp', '2027-01-31');
  assert.strictEqual(premium.verifyLicense(t, { publicKey: otherPub, now: day(2026, 10, 29) }).reason, 'invalid');
  assert.strictEqual(premium.verifyLicense(t, { publicKey: 'xx', now: day(2026, 10, 29) }).ok, false);
  assert.strictEqual(premium.verifyLicense(t, { publicKey: '', now: day(2026, 10, 29) }).ok, false);
});

test('horloge reculée : exp comparé à max(aujourd\'hui, maxSeenDay)', () => {
  const t = sign('--exp', '2026-11-30');
  const seen = premium.localDayIndex(day(2026, 12, 15));
  const back = day(2026, 11, 10); // l'horloge a été reculée
  assert.strictEqual(premium.verifyLicense(t, { publicKey: pub, now: back }).ok, true);
  assert.strictEqual(premium.verifyLicense(t, { publicKey: pub, now: back, maxSeenDay: seen }).reason, 'expired');
  // maxSeenDay plus ancien que l'horloge : ne rend rien de plus
  const old = premium.localDayIndex(day(2026, 10, 1));
  assert.strictEqual(premium.verifyLicense(t, { publicKey: pub, now: day(2026, 12, 2), maxSeenDay: old }).reason, 'expired');
  assert.strictEqual(premium.verifyLicense(t, { publicKey: pub, now: back, maxSeenDay: null }).ok, true);
});

test('lien profond complet collé (…?l=jeton), avec espaces et retours à la ligne', () => {
  const t = sign('--exp', '2027-01-31');
  const o = { publicKey: pub, now: day(2026, 10, 29) };
  assert.strictEqual(premium.verifyLicense(`moneytracking://plus/activate?l=${t}`, o).ok, true);
  assert.strictEqual(premium.verifyLicense(`  moneytracking://plus/activate?l=${t}&x=1#f\n`, o).ok, true);
  assert.strictEqual(premium.verifyLicense(`${t.slice(0, 30)}\n ${t.slice(30)}`, o).ok, true);
  assert.strictEqual(premium.extractToken(`a?l=${t}`), t);
  assert.strictEqual(premium.extractToken('a?l=%E0%A4%A'), '%E0%A4%A'); // % invalide : ne jette pas
});

test('à vie : jamais expiré, même en 2099 ; plan lifetime', () => {
  const t = sign('--lifetime', '--plan', 'lifetime');
  const r = premium.verifyLicense(t, { publicKey: pub, now: day(2099, 1, 1), maxSeenDay: 60000 });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.license.expiresOn, null);
  assert.strictEqual(r.license.plan, 'lifetime');
});

test('licenseChannel : beta / gift / manual', () => {
  const o = { publicKey: pub, now: day(2026, 10, 29) };
  const ch = (...a) => premium.licenseChannel(premium.verifyLicense(sign('--exp', '2027-01-31', ...a), o).license);
  assert.strictEqual(ch('--plan', 'beta'), 'beta');
  assert.strictEqual(ch('--plan', 'year', '--flags', 'gift'), 'gift');
  assert.strictEqual(ch('--plan', 'year'), 'manual');
});
