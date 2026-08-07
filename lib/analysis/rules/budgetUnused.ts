import type { Rule } from '../types';
import { ceilToThousandAr, clampWeight, formatAr } from '../format';

/** Ne juger l'usage d'un budget qu'une fois le cycle bien avancé. */
const MIN_PROGRESS = 0.7;
/** Utilisation maximale pour parler de budget sous-utilisé. */
const MAX_USE = 0.3;
/** Plafond minimal considéré (× microThreshold) — ignorer les mini-budgets. */
const MIN_LIMIT_MULTIPLE = 5;

/**
 * Budget jamais approché : un plafond utilisé à 12 % ne protège rien et fausse
 * la lecture des budgets. Action : l'abaisser au projeté + 20 % de marge.
 */
export const budgetUnusedRule: Rule = (i, cycle) => {
  if (cycle.elapsedRatio < MIN_PROGRESS) return null;
  const minLimit = i.microThreshold * MIN_LIMIT_MULTIPLE;
  const candidates = i.budgets.filter(
    (b) => b.limit >= minLimit && b.spent / b.limit <= MAX_USE
  );
  if (candidates.length === 0) return null;

  // Le plus grand plafond inutile est le plus trompeur.
  const top = candidates.reduce((a, b) => (b.limit - b.spent > a.limit - a.spent ? b : a));
  const pct = Math.round((top.spent / top.limit) * 100);
  const newLimit = ceilToThousandAr(Math.max(top.projected * 1.2, minLimit));

  return {
    id: `budgetUnused:${top.categoryId}`,
    severity: 'info',
    weight: clampWeight(20 + (1 - top.spent / top.limit) * 25, 20, 50),
    titleKey: 'analysis.budgetUnused.title',
    params: { category: top.categoryName ?? '', pct },
    evidence: `${formatAr(top.spent)} / ${formatAr(top.limit)} = ${pct} %`,
    action: {
      type: 'createBudget',
      labelKey: 'analysis.action.lowerBudget',
      labelParams: { category: top.categoryName ?? '', amount: formatAr(newLimit) },
      payload: { categoryId: top.categoryId, limit: newLimit },
    },
  };
};
