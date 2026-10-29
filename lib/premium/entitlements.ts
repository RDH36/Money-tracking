/** Droits Plus accordés par une licence valide (lot 0 : seul `ocr_unlimited` est branché). */
import type { Entitlement, License } from './types';

const ALL: readonly Entitlement[] = [
  'ocr_unlimited', 'ton_mois_full', 'unlimited_accounts', 'unlimited_categories', 'plus_themes', 'cloud_backup',
];

/** Tous les plans donnent tous les droits ; `license` doit déjà être vérifiée et non expirée. */
export function entitlementsOf(license: License | null): readonly Entitlement[] {
  return license ? ALL : [];
}

export function hasEntitlement(license: License | null, entitlement: Entitlement): boolean {
  return entitlementsOf(license).includes(entitlement);
}

/** Canal d'analytics d'un jeton long (lot 0 : pas de code court). */
export function licenseChannel(license: License): 'beta' | 'gift' | 'manual' {
  if (license.flags.beta || license.plan === 'beta') return 'beta';
  return license.flags.gift ? 'gift' : 'manual';
}
