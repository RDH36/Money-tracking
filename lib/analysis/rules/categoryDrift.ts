import type { Rule } from '../types';
import { clampWeight, formatAr } from '../format';

/** Dérive minimale signalée : dépense ≥ 1,3× la moyenne de la catégorie. */
const MIN_DRIFT = 1.3;

/**
 * La catégorie la plus au-dessus de sa propre habitude ce cycle. Chaque
 * `drift` vaut `null` sans historique exploitable → ces catégories sont
 * ignorées (jamais traitées comme 0). Propose de poser un budget au niveau de
 * la moyenne passée.
 */
export const categoryDriftRule: Rule = (i) => {
  const candidates = i.categoryDrift.filter(
    (d) => d.drift !== null && d.drift >= MIN_DRIFT && d.categoryName !== null && d.avgPrevious !== null
  );
  if (candidates.length === 0) return null;

  const top = candidates.reduce((a, b) => (b.drift! > a.drift! ? b : a));
  const drift = top.drift!;
  const overPct = Math.round((drift - 1) * 100);
  const weight = clampWeight((drift - 1) * 60 + 20, 20, 90);
  const severity = drift >= 2 ? 'urgent' : drift >= 1.5 ? 'watch' : 'info';

  return {
    id: `categoryDrift:${top.categoryId}`,
    severity,
    weight,
    titleKey: 'analysis.categoryDrift.title',
    params: { category: top.categoryName as string, pct: overPct },
    evidence: `${formatAr(top.cycleSpend)} ÷ ${formatAr(top.avgPrevious as number)} = ${Math.round(drift * 100)} %`,
    action: {
      type: 'createBudget',
      labelKey: 'analysis.action.budget',
      payload: { categoryId: top.categoryId, limit: Math.round(top.avgPrevious as number) },
    },
  };
};
