/**
 * Configuration du sondage "sauvegarde cloud" (feature payante en validation).
 * Les tranches de prix sont DIFFÉRENTES par devise (Ariary / Euro / Dollar).
 */

export type WantsFeature = 'yes' | 'maybe' | 'no';
export type SyncMode = 'auto' | 'auto_custom' | 'manual';

/** Tranches de prix proposées par devise, pour le mensuel et l'annuel. */
export const PRICE_TIERS: Record<string, { monthly: number[]; yearly: number[] }> = {
  MGA: { monthly: [2000, 5000, 10000, 20000], yearly: [20000, 50000, 100000, 200000] },
  EUR: { monthly: [1, 2, 3, 5], yearly: [10, 20, 30, 50] },
  USD: { monthly: [1, 2, 3, 5], yearly: [10, 20, 30, 50] },
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
