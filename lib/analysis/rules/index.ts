/**
 * Registre des règles du moteur d'analyse (Phase 2).
 * Chaque règle est une fonction pure `(Indicators, Cycle) => Insight | null`.
 * L'ordre n'importe pas : `score.ts` trie par poids.
 *
 * `noSpendStreak` n'est plus enregistrée : les « jours sans dépense » sont un
 * artefact de saisie en rafale (l'utilisateur note ses dépenses par paquets),
 * pas un fait sur son argent. Le fichier reste, hors registre.
 */
import type { Rule } from '../types';
import { savingsRateRule } from './savingsRate';
import { projectionRule } from './projection';
import { burnSpeedRule } from './burnSpeed';
import { fixedCostsRule } from './fixedCosts';
import { categoryDriftRule } from './categoryDrift';
import { bestCycleRule } from './bestCycle';
import { microSpendingRule } from './microSpending';
import { budgetOverrunRule } from './budgetOverrun';
import { budgetUnusedRule } from './budgetUnused';
import { topCategoryRule } from './topCategory';

export const RULES: Rule[] = [
  savingsRateRule,
  projectionRule,
  burnSpeedRule,
  fixedCostsRule,
  categoryDriftRule,
  bestCycleRule,
  microSpendingRule,
  budgetOverrunRule,
  budgetUnusedRule,
  topCategoryRule,
];

export {
  savingsRateRule,
  projectionRule,
  burnSpeedRule,
  fixedCostsRule,
  categoryDriftRule,
  bestCycleRule,
  microSpendingRule,
  budgetOverrunRule,
  budgetUnusedRule,
  topCategoryRule,
};
export { makeGoalGapRule } from './goalGap';
