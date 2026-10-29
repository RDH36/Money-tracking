/** Mitsitsy Plus : types de la licence (pur, sans dépendance native). */

export type PlusPlan = 'month' | 'year' | 'lifetime' | 'beta';

export type Entitlement =
  | 'ocr_unlimited'
  | 'ton_mois_full'
  | 'unlimited_accounts'
  | 'unlimited_categories'
  | 'plus_themes'
  | 'cloud_backup';

export interface LicenseFlags {
  founder: boolean;
  gift: boolean;
  beta: boolean;
}

/** Licence décodée d'un jeton dont la signature est valide. */
export interface License {
  /** Identifiant de licence, 12 caractères hexadécimaux. */
  lid: string;
  plan: PlusPlan;
  /** Dernier jour de validité inclus, `YYYY-MM-DD` ; null = à vie. */
  expiresOn: string | null;
  /** Jour d'émission, `YYYY-MM-DD`. */
  issuedOn: string;
  flags: LicenseFlags;
}

export type LicenseError = 'malformed' | 'invalid' | 'expired';

export type LicenseCheck =
  | { ok: true; license: License }
  | { ok: false; reason: LicenseError; license?: License };
