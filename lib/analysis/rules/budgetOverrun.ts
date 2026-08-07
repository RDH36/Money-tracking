import type { Insight, Rule } from '../types';
import { ceilToThousandAr, clampWeight, formatAr } from '../format';

/**
 * Budget dépassé (fait avéré) ou en trajectoire de dépassement (projection).
 * C'est la seule donnée où l'utilisateur a déjà exprimé une intention — un
 * dépassement est donc toujours pertinent. Action : relever le budget à la
 * projection (un budget systématiquement dépassé est un budget faux).
 */
export const budgetOverrunRule: Rule = (i, cycle) => {
  const candidates = i.budgets.filter((b) => b.spent >= b.limit || b.projected >= b.limit);
  if (candidates.length === 0) return null;

  const top = candidates.reduce((a, b) => (b.projected / b.limit > a.projected / a.limit ? b : a));
  const exceeded = top.spent >= top.limit;
  const ratio = top.projected / top.limit;
  const newLimit = ceilToThousandAr(Math.max(top.projected, top.spent));
  const action: Insight['action'] = {
    type: 'createBudget',
    labelKey: 'analysis.action.raiseBudget',
    labelParams: { category: top.categoryName ?? '', amount: formatAr(newLimit) },
    payload: { categoryId: top.categoryId, limit: newLimit },
  };

  if (exceeded) {
    const insight: Insight = {
      id: `budgetOverrun:${top.categoryId}`,
      severity: 'urgent',
      weight: clampWeight(55 + (ratio - 1) * 60, 55, 95),
      titleKey: 'analysis.budgetOverrun.exceeded',
      params: { category: top.categoryName ?? '', amount: formatAr(top.spent - top.limit) },
      evidence: `${formatAr(top.spent)} / ${formatAr(top.limit)}`,
      action,
    };
    return insight;
  }
  // Trajectoire (cycle courant uniquement : sur un cycle passé projected = spent).
  const insight: Insight = {
    id: `budgetOverrun:${top.categoryId}`,
    severity: 'watch',
    weight: clampWeight(45 + (ratio - 1) * 50, 45, 85),
    titleKey: 'analysis.budgetOverrun.pace',
    params: {
      category: top.categoryName ?? '',
      projected: formatAr(top.projected),
      limit: formatAr(top.limit),
    },
    evidence: `${formatAr(top.spent)} ÷ ${Math.round(cycle.elapsedRatio * 100)} % = ${formatAr(top.projected)}`,
    action,
  };
  return insight;
};
