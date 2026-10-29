/**
 * Format du jeton long (identique à scripts/plus/sign-license.mjs) :
 * 12 octets [lid 6][plan 1][exp 2 BE][issued 2 BE][flags 1] + signature
 * Ed25519 de 64 octets, en base64url sans remplissage (102 caractères).
 * `exp` / `issued` = jours depuis le 2026-01-01 ; exp 0xFFFF = à vie.
 */
import type { LicenseFlags, PlusPlan } from './types';

export const PAYLOAD_BYTES = 12;
export const SIGNATURE_BYTES = 64;
export const TOKEN_BYTES = PAYLOAD_BYTES + SIGNATURE_BYTES;
export const LIFETIME_DAY = 0xffff;

const EPOCH_UTC = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const PLAN_CODES: Record<number, PlusPlan> = { 1: 'month', 2: 'year', 3: 'lifetime', 4: 'beta' };

export interface RawToken {
  payload: Uint8Array;
  signature: Uint8Array;
  lid: string;
  plan: PlusPlan | null;
  expDay: number;
  issuedDay: number;
  flags: LicenseFlags;
}

/** base64url strict (sans remplissage) ; null si un caractère est hors alphabet. */
export function decodeBase64Url(s: string): Uint8Array | null {
  if (s.length % 4 === 1) return null;
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of s) {
    const v = B64URL.indexOf(ch);
    if (v < 0) return null;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

/**
 * Texte collé par l'utilisateur → jeton nu. Accepte le lien profond complet
 * (`…?l=<jeton>`) et ignore les espaces / retours à la ligne du copier-coller.
 */
export function extractToken(input: string): string {
  const s = input.replace(/\s+/g, '');
  const m = /[?&]l=([^&#]*)/.exec(s);
  if (!m) return s;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/** Index de jour depuis le 2026-01-01 d'une date LOCALE (minuit local ignoré). */
export function localDayIndex(d: Date): number {
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH_UTC) / DAY_MS);
}

export function dayIndexToYmd(day: number): string {
  return new Date(EPOCH_UTC + day * DAY_MS).toISOString().slice(0, 10);
}

/** Découpe le jeton ; null s'il n'a pas la bonne forme (longueur, alphabet). */
export function parseToken(token: string): RawToken | null {
  const bytes = decodeBase64Url(token);
  if (!bytes || bytes.length !== TOKEN_BYTES) return null;
  const payload = bytes.slice(0, PAYLOAD_BYTES);
  const hex = Array.from(payload.slice(0, 6), (b) => b.toString(16).padStart(2, '0')).join('');
  const f = payload[11];
  return {
    payload,
    signature: bytes.slice(PAYLOAD_BYTES),
    lid: hex,
    plan: PLAN_CODES[payload[6]] ?? null,
    expDay: (payload[7] << 8) | payload[8],
    issuedDay: (payload[9] << 8) | payload[10],
    flags: { founder: (f & 1) !== 0, gift: (f & 2) !== 0, beta: (f & 4) !== 0 },
  };
}
