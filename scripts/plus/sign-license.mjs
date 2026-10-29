#!/usr/bin/env node
/**
 * Signature LOCALE des jetons Mitsitsy Plus (lot 0 : codes bêta, sans serveur).
 * Hors bundle : jamais importé par l'app. La clé PRIVÉE vit hors du dépôt.
 *
 *   node scripts/plus/sign-license.mjs keygen
 *   node scripts/plus/sign-license.mjs sign --exp 2027-01-31 [--plan beta] [--flags beta,gift] [--lid <12 hex>]
 *   node scripts/plus/sign-license.mjs sign --lifetime --plan lifetime
 *
 * Options communes : --key <chemin> (défaut ~/.config/mitsitsy/plus-ed25519.key,
 * ou $MITSITSY_PLUS_KEY).
 *
 * Format (identique à lib/premium/token.ts) : 12 octets de charge utile
 * [lid 6][plan 1][exp 2 BE][issued 2 BE][flags 1] + signature Ed25519 (64 o),
 * en base64url sans remplissage (102 caractères). `exp` et `issued` = jours
 * depuis le 2026-01-01 ; exp 0xFFFF = à vie. Le jeton est valide jusqu'au jour
 * `exp` inclus.
 */
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nacl = require('tweetnacl');

const PLANS = { month: 1, year: 2, lifetime: 3, beta: 4 };
const FLAGS = { founder: 1, gift: 2, beta: 4 };
const EPOCH_UTC = Date.UTC(2026, 0, 1);
const LIFETIME = 0xffff;

function fail(msg) {
  console.error(`Erreur : ${msg}`);
  process.exit(1);
}

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const name = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[name] = true;
    else { out[name] = next; i++; }
  }
  return out;
}

function keyPath(opts) {
  return opts.key || process.env.MITSITSY_PLUS_KEY || join(homedir(), '.config', 'mitsitsy', 'plus-ed25519.key');
}

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function dayIndex(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) fail(`date invalide « ${ymd} » (attendu AAAA-MM-JJ)`);
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const back = new Date(t);
  if (back.getUTCMonth() !== +m[2] - 1) fail(`date invalide « ${ymd} »`);
  const d = Math.round((t - EPOCH_UTC) / 86_400_000);
  if (d < 0 || d >= LIFETIME) fail(`date hors limites « ${ymd} »`);
  return d;
}

function todayYmd() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function keygen(opts) {
  const path = keyPath(opts);
  if (existsSync(path)) fail(`une clé existe déjà dans ${path} (jamais écrasée)`);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const pair = nacl.sign.keyPair();
  writeFileSync(path, Buffer.from(pair.secretKey).toString('base64') + '\n', { mode: 0o600 });
  chmodSync(path, 0o600);
  console.log(`Clé privée écrite dans ${path} (droits 600). Ne la copie jamais dans le dépôt.`);
  console.log(`Clé PUBLIQUE (à mettre dans constants/app.ts, LICENSE_PUBLIC_KEY) :`);
  console.log(b64url(pair.publicKey));
}

function loadSecret(opts) {
  const path = keyPath(opts);
  if (!existsSync(path)) fail(`clé privée introuvable : ${path} (lance d'abord « keygen »)`);
  const secret = Buffer.from(readFileSync(path, 'utf8').trim(), 'base64');
  if (secret.length !== 64) fail(`fichier de clé invalide : ${path}`);
  return new Uint8Array(secret);
}

function sign(opts) {
  const plan = opts.plan || 'beta';
  if (!(plan in PLANS)) fail(`plan inconnu « ${plan} » (${Object.keys(PLANS).join(', ')})`);
  const lifetime = opts.lifetime === true || plan === 'lifetime';
  if (!lifetime && typeof opts.exp !== 'string') fail('--exp AAAA-MM-JJ obligatoire (sauf --lifetime)');
  const exp = lifetime ? LIFETIME : dayIndex(opts.exp);
  const issued = dayIndex(todayYmd());
  let flags = plan === 'beta' ? FLAGS.beta : 0;
  if (typeof opts.flags === 'string') {
    for (const f of opts.flags.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!(f in FLAGS)) fail(`drapeau inconnu « ${f} » (${Object.keys(FLAGS).join(', ')})`);
      flags |= FLAGS[f];
    }
  }
  let lid;
  if (typeof opts.lid === 'string') {
    if (!/^[0-9a-f]{12}$/i.test(opts.lid)) fail('--lid attend 12 caractères hexadécimaux');
    lid = Buffer.from(opts.lid, 'hex');
  } else lid = randomBytes(6);

  const payload = new Uint8Array(12);
  payload.set(lid, 0);
  payload[6] = PLANS[plan];
  payload[7] = exp >> 8; payload[8] = exp & 0xff;
  payload[9] = issued >> 8; payload[10] = issued & 0xff;
  payload[11] = flags;
  const sig = nacl.sign.detached(payload, loadSecret(opts));
  const token = b64url(new Uint8Array([...payload, ...sig]));

  if (opts.json) {
    console.log(JSON.stringify({ token, lid: Buffer.from(lid).toString('hex'), plan, exp: lifetime ? null : opts.exp, flags }));
    return;
  }
  console.log(`lid      ${Buffer.from(lid).toString('hex')}`);
  console.log(`plan     ${plan}${lifetime ? ' (à vie)' : `, valide jusqu'au ${opts.exp} inclus`}`);
  console.log(`jeton    ${token}`);
  console.log(`lien     moneytracking://plus/activate?l=${token}`);
}

const opts = args(process.argv.slice(2));
const cmd = opts._[0];
if (cmd === 'keygen') keygen(opts);
else if (cmd === 'sign') sign(opts);
else {
  console.log('Usage : sign-license.mjs keygen | sign --exp AAAA-MM-JJ [--plan beta|month|year|lifetime] [--flags founder,gift,beta] [--lid hex12] [--key chemin] [--json]');
  process.exit(cmd ? 1 : 0);
}
