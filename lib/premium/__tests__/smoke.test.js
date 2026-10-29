// Contrôle minimal (Lyra complète) : un jeton signé par le script est accepté.
const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const { mkdtempSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const nacl = require('tweetnacl');
const premium = require(join(process.env.PREMIUM_OUT, 'index.js'));

test('jeton du script de signature vérifié avec la clé publique de test', () => {
  const dir = mkdtempSync(join(tmpdir(), 'plus-key-'));
  const key = join(dir, 'test.key');
  const script = join(process.env.ROOT, 'scripts/plus/sign-license.mjs');
  const pub = execFileSync('node', [script, 'keygen', '--key', key], { encoding: 'utf8' }).trim().split('\n').pop();
  const out = JSON.parse(execFileSync('node', [script, 'sign', '--key', key, '--exp', '2027-01-31', '--json'], { encoding: 'utf8' }));
  assert.ok(nacl);
  const ok = premium.verifyLicense(out.token, { publicKey: pub, now: new Date(2026, 9, 29) });
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.license.expiresOn, '2027-01-31');
  assert.strictEqual(premium.verifyLicense(out.token, { publicKey: pub, now: new Date(2027, 1, 1) }).reason, 'expired');
  assert.strictEqual(out.token.length, 102);
});
