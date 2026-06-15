/**
 * Configuration du sondage "sauvegarde cloud" (feature payante en validation).
 * Les tranches de prix sont DIFFÉRENTES par devise (Ariary / Euro / Dollar).
 */

export type WantsFeature = 'yes' | 'maybe' | 'no';
export type SyncMode = 'auto' | 'auto_custom' | 'manual';

/** Tranches de prix proposées par devise, pour le mensuel et l'annuel. */
// Montants RÉELS (pas en centimes). Le formatage se fait dans options.ts.
export const PRICE_TIERS: Record<string, { monthly: number[]; yearly: number[] }> = {
  MGA: { monthly: [3000, 5000, 10000, 15000, 20000], yearly: [30000, 50000, 100000, 150000, 200000] },
  EUR: { monthly: [3, 5, 10, 15], yearly: [30, 50, 100, 150] },
  USD: { monthly: [3, 5, 10, 15], yearly: [30, 50, 100, 150] },
};

/** Devise de repli quand la devise de l'utilisateur n'a pas de barème dédié. */
export const FALLBACK_TIER_CURRENCY = 'USD';

export function getPriceTiers(currencyCode: string) {
  return PRICE_TIERS[currencyCode] ?? PRICE_TIERS[FALLBACK_TIER_CURRENCY];
}

/** Valeurs sentinelles stockées en plus des montants chiffrés. */
export const PRICE_NONE = 'none'; // ne paierait pas
export const PRICE_MORE = 'more'; // prêt à payer plus que la tranche max

export const WANTS_OPTIONS: { key: WantsFeature; icon: string }[] = [
  { key: 'yes', icon: 'heart' },
  { key: 'maybe', icon: 'help-circle' },
  { key: 'no', icon: 'close-circle' },
];

export const SYNC_MODE_OPTIONS: { key: SyncMode; icon: string }[] = [
  { key: 'auto', icon: 'sync' },
  { key: 'auto_custom', icon: 'options' },
  { key: 'manual', icon: 'hand-left' },
];
