// app/+native-intent.tsx : le jeton du lien profond ne doit jamais finir dans la route.
const { test } = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const ts = require('typescript');

function load(plusEnabled) {
  const src = readFileSync(join(process.env.ROOT, 'app/+native-intent.tsx'), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const state = { pending: undefined };
  const stubs = {
    '@/constants/app': { PLUS_ENABLED: plusEnabled },
    '@/stores/premiumStore': { usePremiumStore: { getState: () => ({ setPendingLink: (t) => { state.pending = t; } }) } },
  };
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', js)((n) => stubs[n], mod, mod.exports);
  return { redirect: mod.exports.redirectSystemPath, state };
}
const TOKEN = 'abcDEF123-_' + 'x'.repeat(91);

test('lien profond Plus : jeton mis de côté, route sans paramètre', () => {
  const { redirect, state } = load(true);
  for (const path of [
    `moneytracking://plus/activate?l=${TOKEN}`,
    `/plus/activate?l=${TOKEN}`,
    `plus/activate?l=${TOKEN}&utm=1`,
  ]) {
    state.pending = undefined;
    const out = redirect({ path, initial: false });
    assert.strictEqual(out, '/plus/activate', path);
    assert.ok(!out.includes(TOKEN));
    assert.strictEqual(state.pending, TOKEN);
  }
});

test('lien Plus sans jeton : route sans paramètre, jeton vide', () => {
  const { redirect, state } = load(true);
  assert.strictEqual(redirect({ path: 'moneytracking://plus/activate', initial: true }), '/plus/activate');
  assert.strictEqual(state.pending, '');
});

test('jeton encodé en pourcentage : décodé', () => {
  const { redirect, state } = load(true);
  redirect({ path: '/plus/activate?l=ab%2Dcd', initial: false });
  assert.strictEqual(state.pending, 'ab-cd');
});

test('jeton mal encodé (%) : ne doit PAS finir dans la route', () => {
  const { redirect } = load(true);
  const out = redirect({ path: `/plus/activate?l=${TOKEN}%E0%A4%A`, initial: false });
  assert.ok(!out.includes(TOKEN), `jeton laissé dans la route : ${out}`);
});

test('variante de chemin (slash final) : jeton hors de la route', () => {
  const { redirect } = load(true);
  for (const path of [`/plus/activate/?l=${TOKEN}`, `moneytracking://plus/activate/?l=${TOKEN}`]) {
    assert.ok(!redirect({ path, initial: false }).includes(TOKEN), path);
  }
});

test('autres liens profonds inchangés', () => {
  const { redirect, state } = load(true);
  for (const path of ['/', '/import/capture?uris=%5B%5D', 'moneytracking://settings', '/plus', '/plus/other?l=1', '/(tabs)/settings']) {
    assert.strictEqual(redirect({ path, initial: false }), path);
  }
  assert.strictEqual(state.pending, undefined);
});

test('PLUS_ENABLED faux : tout passe inchangé et rien n\'est mis de côté', () => {
  const { redirect, state } = load(false);
  const p = `/plus/activate?l=${TOKEN}`;
  assert.strictEqual(redirect({ path: p, initial: false }), p);
  assert.strictEqual(state.pending, undefined);
});
