import type { Rule } from '../types';
import { clampWeight, formatAr } from '../format';

/**
 * Trajectoire de dépense : à ce rythme, combien d'ici la fin du mois. N'a de
 * sens que sur le cycle courant et tant qu'il reste assez de mois devant pour
 * que la projection diffère du réalisé (sinon c'est juste le total).
 */
export const projectionRule: Rule = (i, cycle) => {
  if (!cycle.isCurrent) return null;
  if (cycle.elapsedRatio >= 0.85) return null;
  if (i.expenses <= 0) return null;

  const weight = clampWeight((1 - cycle.elapsedRatio) * 45 + 15, 15, 65);

  return {
    id: 'projection',
    severity: 'info',
    weight,
    titleKey: 'analysis.projection.title',
    params: { projected: formatAr(i.projectedEnd) },
    // ex. « 500 000 ÷ 29 × 31 = 534 000 »
    evidence: `${formatAr(i.expenses)} ÷ ${cycle.elapsedDays} × ${cycle.totalDays} = ${formatAr(i.projectedEnd)}`,
  };
};
