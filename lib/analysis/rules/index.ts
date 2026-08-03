/**
 * Registre des règles du moteur d'analyse (Phase 2).
 * Chaque règle est une fonction pure `(Indicators, Cycle) => Insight | null`.
 * L'ordre n'importe pas : `score.ts` trie par poids.
 */
import type { Rule } from '../types';
import { savingsRateRule } from './savingsRate';
import { projectionRule } from './projection';
import { burnSpeedRule } from './burnSpeed';
import { fixedCostsRule } from './fixedCosts';
import { categoryDriftRule } from './categoryDrift';
import { bestCycleRule } from './bestCycle';
import { microSpendingRule } from './microSpending';
import { noSpendStreakRule } from './noSpendStreak';

export const RULES: Rule[] = [
  savingsRateRule,
  projectionRule,
  burnSpeedRule,
  fixedCostsRule,
  categoryDriftRule,
  bestCycleRule,
  microSpendingRule,
  noSpendStreakRule,
];

export {
  savingsRateRule,
  projectionRule,
  burnSpeedRule,
  fixedCostsRule,
  categoryDriftRule,
  bestCycleRule,
  microSpendingRule,
  noSpendStreakRule,
};
