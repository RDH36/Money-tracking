import type { Rule } from '../types';
import { clampWeight, formatAr } from '../format';

/** Seuils par défaut : nombre de micro-dépenses et part des dépenses totales. */
const MIN_COUNT = 10;
const MIN_SHARE = 0.1;

/**
 * Accumulation de petites dépenses (< microThreshold, dérivé du revenu). Se
 * tait s'il n'y a pas de dépenses. Fait chiffré : « N petites dépenses · total ».
 */
export const microSpendingRule: Rule = (i) => {
  if (i.expenses <= 0) return null;
  if (i.microCount < MIN_COUNT) return null;

  const share = i.microTotal / i.expenses;
  if (share < MIN_SHARE) return null;

  const weight = clampWeight(share * 80 + 20, 20, 80);
  const severity = share >= 0.3 ? 'watch' : 'info';

  return {
    id: 'microSpending',
    severity,
    weight,
    titleKey: 'analysis.microSpending.title',
    params: { count: i.microCount, total: formatAr(i.microTotal) },
    evidence: `${i.microCount} × < ${formatAr(i.microThreshold)} = ${formatAr(i.microTotal)}`,
  };
};
