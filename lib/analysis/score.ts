/**
 * Scoring : évalue toutes les règles, écarte les constats rejetés, trie par
 * poids, et ne garde que le strict nécessaire — 3 constats maximum, 1 action.
 *
 * Fonction pure : aucune DB, aucun hook. La table `analysis_dismissed` arrive
 * en Phase 4 ; en attendant, `dismissedIds` est passé vide.
 */
import type { Cycle, Indicators, Insight, InsightAction } from './types';
import { RULES } from './rules';

/** Nombre maximum de constats affichés. */
export const MAX_INSIGHTS = 3;

export interface ScoreResult {
  /** Constats retenus, au plus `MAX_INSIGHTS`, triés par poids décroissant. */
  insights: Insight[];
  /** L'unique action : celle du constat de plus fort poids qui en propose une. */
  action: InsightAction | null;
  /**
   * Vrai si moins de 2 constats se déclenchent. Un mois sans problème est une
   * information (l'écran bascule en mode « mois calme »), pas un échec.
   */
  calmMonth: boolean;
}

export function scoreInsights(
  indicators: Indicators,
  cycle: Cycle,
  dismissedIds: string[] = []
): ScoreResult {
  const dismissed = new Set(dismissedIds);

  const fired = RULES.map((rule) => rule(indicators, cycle))
    .filter((insight): insight is Insight => insight !== null)
    .filter((insight) => !dismissed.has(insight.id))
    .sort((a, b) => b.weight - a.weight);

  const insights = fired.slice(0, MAX_INSIGHTS);
  const action = insights.find((insight) => insight.action)?.action ?? null;
  const calmMonth = fired.length < 2;

  return { insights, action, calmMonth };
}
