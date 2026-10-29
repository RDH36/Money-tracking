/**
 * Vérification HORS LIGNE d'un jeton Mitsitsy Plus (Ed25519, tweetnacl).
 * Pur : la clé publique, la date et la date max déjà vue sont injectées.
 */
import * as nacl from 'tweetnacl';
import { decodeBase64Url, dayIndexToYmd, extractToken, LIFETIME_DAY, localDayIndex, parseToken } from './token';
import type { License, LicenseCheck } from './types';

export interface VerifyOptions {
  /** Clé publique Ed25519 en base64url (32 octets). */
  publicKey: string;
  now?: Date;
  /**
   * Plus grand index de jour déjà vu sur ce téléphone : reculer l'horloge ne
   * rallonge pas un pass (`exp` comparé à max(aujourd'hui, maxSeenDay)).
   */
  maxSeenDay?: number | null;
}

export function verifyLicense(input: string, opts: VerifyOptions): LicenseCheck {
  const raw = parseToken(extractToken(input));
  if (!raw || !raw.plan) return { ok: false, reason: 'malformed' };
  const key = decodeBase64Url(opts.publicKey);
  if (!key || key.length !== nacl.sign.publicKeyLength) return { ok: false, reason: 'invalid' };
  if (!nacl.sign.detached.verify(raw.payload, raw.signature, key)) return { ok: false, reason: 'invalid' };

  const license: License = {
    lid: raw.lid,
    plan: raw.plan,
    expiresOn: raw.expDay === LIFETIME_DAY ? null : dayIndexToYmd(raw.expDay),
    issuedOn: dayIndexToYmd(raw.issuedDay),
    flags: raw.flags,
  };
  if (raw.expDay !== LIFETIME_DAY) {
    const today = Math.max(localDayIndex(opts.now ?? new Date()), opts.maxSeenDay ?? -Infinity);
    if (today > raw.expDay) return { ok: false, reason: 'expired', license };
  }
  return { ok: true, license };
}
