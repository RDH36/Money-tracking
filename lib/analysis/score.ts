/**
 * Scoring : évalue toutes les règles, écarte les constats rejetés, trie par
 * poids, et ne garde que le strict nécessaire — 3 constats maximum, 1 action.
 *
 * Phase 6 : l'INTENTION (pourquoi l'utilisateur lance l'analyse) et son
 * OBJECTIF pondèrent le tri — le moteur reste déterministe, seuls les poids
 * bougent. Re-scorer est gratuit : aucune requête, les indicateurs sont déjà
 * en mémoire.
 */
import type { Cycle, Indicators, Insight, InsightAction, Rule } from './types';
import { RULES, makeGoalGapRule } from './rules';

/** Nombre maximum de constats affichés. */
export const MAX_INSIGHTS = 3;

/** La raison du lancement — choisie via les chips en tête d'écran. */
export type AnalysisIntent = 'overview' | 'overspend' | 'budgets' | 'savings';
/** L'objectif durable de l'utilisateur — demandé à la première ouverture. */
export type AnalysisGoal = 'saveAmount' | 'keepBudgets' | 'understand';

export interface ScoreOptions {
  intent?: AnalysisIntent;
  goal?: AnalysisGoal | null;
  /** Cible mensuelle (centimes) — requis pour goal `saveAmount`. */
  goalAmount?: number | null;
}

/** Règles favorisées par intention (id de base, avant le `:`). */
const INTENT_BOOST: Record<AnalysisIntent, string[]> = {
  overview: [],
  overspend: ['burnSpeed', 'microSpending', 'categoryDrift', 'projection'],
  budgets: ['budgetOverrun', 'budgetUnused'],
  savings: ['savingsRate', 'goalGap', 'fixedCosts'],
};
const INTENT_BONUS = 30;
const GOAL_BONUS = 15;

export interface ScoreResult {
  /** Constats retenus, au plus `MAX_INSIGHTS`, triés par poids décroissant. */
  insights: Insight[];
  /** L'unique action : celle du constat de plus fort poids qui en propose une. */
  action: InsightAction | null;
  /** Vrai si moins de 2 constats se déclenchent (mode « mois calme »). */
  calmMonth: boolean;
}

export function scoreInsights(
  indicators: Indicators,
  cycle: Cycle,
  dismissedIds: string[] = [],
  opts: ScoreOptions = {}
): ScoreResult {
  const dismissed = new Set(dismissedIds);

  const rules: Rule[] = [...RULES];
  if (opts.goal === 'saveAmount' && opts.goalAmount && opts.goalAmount > 0) {
    rules.push(makeGoalGapRule(opts.goalAmount));
  }

  const fired = rules
    .map((rule) => rule(indicators, cycle))
    .filter((insight): insight is Insight => insight !== null)
    .filter((insight) => !dismissed.has(insight.id))
    .map((insight) => {
      const base = insight.id.split(':')[0];
      let weight = insight.weight;
      if (opts.intent && INTENT_BOOST[opts.intent].includes(base)) weight += INTENT_BONUS;
      if (opts.goal === 'keepBudgets' && (base === 'budgetOverrun' || base === 'budgetUnused')) {
        weight += GOAL_BONUS;
      }
      return weight === insight.weight ? insight : { ...insight, weight: Math.min(100, weight) };
    })
    .sort((a, b) => b.weight - a.weight);

  const insights = fired.slice(0, MAX_INSIGHTS);
  const action = insights.find((insight) => insight.action)?.action ?? null;
  const calmMonth = fired.length < 2;

  return { insights, action, calmMonth };
}
