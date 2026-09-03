/**
 * Verdict du cycle : la réponse en un mot à « ça va ? » qui ouvre l'écran
 * « Ton mois ». Fonction pure sur les indicateurs, sans DB ni React.
 *
 * Statut :
 * - `unknown` : revenu inconnu (`income <= 0`) — rien à comparer, on ne juge pas ;
 * - `red`     : dépenses supérieures au revenu (`kept < 0`) ;
 * - `orange`  : moins de 5 % du revenu gardé ;
 * - `green`   : sinon.
 *
 * Jamais NaN : `rate` vaut `null` quand le revenu est nul.
 */
import type { Indicators } from './types';

export type VerdictStatus = 'green' | 'orange' | 'red' | 'unknown';

/** Sous ce taux d'épargne, le cycle passe à l'orange. */
const ORANGE_RATE = 0.05;

export interface Verdict {
  status: VerdictStatus;
  /** `revenus − dépenses`, en centimes (négatif si dépassement). */
  kept: number;
  /** Taux gardé, ou `null` si revenu inconnu. */
  rate: number | null;
  /** Taux du meilleur des 6 cycles précédents, ou `null` sans historique. */
  bestRate: number | null;
  /** Étiquette du meilleur cycle (`YYYY-MM` ou `YYYY-MM-DD`), ou `null`. */
  bestLabel: string | null;
  /** Vrai si `kept`/`rate` reposent sur un revenu attendu, pas saisi. */
  incomeEstimated: boolean;
}

export function getVerdict(i: Indicators): Verdict {
  const base = {
    kept: i.keptAmount,
    bestRate: i.bestCycle?.savingsRate ?? null,
    bestLabel: i.bestCycle?.label ?? null,
    incomeEstimated: i.incomeEstimated,
  };

  if (i.income <= 0) return { ...base, status: 'unknown', rate: null };

  const rate = i.keptAmount / i.income;
  const status: VerdictStatus = i.keptAmount < 0 ? 'red' : rate < ORANGE_RATE ? 'orange' : 'green';
  return { ...base, status, rate };
}
