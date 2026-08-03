import type { Rule } from '../types';
import { clampWeight, formatAr, formatPct } from '../format';

/** Confiance minimale pour retenir une récurrence dans le calcul des coûts fixes. */
const MIN_CONFIDENCE = 0.75;

/**
 * Poids des dépenses récurrentes détectées dans le revenu. Se tait si le revenu
 * est nul. Ne compte que les récurrences suffisamment sûres (confidence ≥ 0.75)
 * — recalcule donc la part, sans se fier au `fixedShare` global des indicateurs.
 */
export const fixedCostsRule: Rule = (i) => {
  if (i.income <= 0) return null;

  const solid = i.recurring.filter((r) => r.confidence >= MIN_CONFIDENCE);
  if (solid.length === 0) return null;

  const fixedSum = solid.reduce((s, r) => s + r.avgAmount, 0);
  const share = fixedSum / i.income;
  const weight = clampWeight(share * 90, 20, 90);
  const severity = share >= 0.6 ? 'urgent' : share >= 0.4 ? 'watch' : 'info';

  return {
    id: 'fixedCosts',
    severity,
    weight,
    titleKey: 'analysis.fixedCosts.title',
    params: { count: solid.length, share: formatPct(share) },
    evidence: `${formatAr(fixedSum)} ÷ ${formatAr(i.income)} = ${formatPct(share)}`,
  };
};
