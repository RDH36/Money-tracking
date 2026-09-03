import type { Rule } from '../types';
import { formatAr } from '../format';

/** Part des dépenses à partir de laquelle le premier poste pèse davantage. */
const HEAVY_SHARE = 0.4;

/**
 * Le premier poste de dépense du cycle : la catégorie qui pèse le plus, en
 * valeur absolue, dans les dépenses. Pur constat de structure (« la nourriture
 * est ton premier poste »), sans jugement ni action — savoir où part l'argent
 * est la première chose qu'un bilan doit dire.
 *
 * Se tait sans dépense, ou si aucune catégorie nommée n'a de dépense. Lit
 * `categoryDrift` (une entrée par catégorie du cycle, avec `cycleSpend`) sans
 * se soucier de `drift`, qui peut être `null` sans historique.
 */
export const topCategoryRule: Rule = (i) => {
  if (i.expenses <= 0) return null;

  const named = i.categoryDrift.filter((d) => d.categoryName !== null && d.cycleSpend > 0);
  if (named.length === 0) return null;

  const top = named.reduce((a, b) => (b.cycleSpend > a.cycleSpend ? b : a));
  const share = top.cycleSpend / i.expenses;
  const pct = Math.round(share * 100);

  return {
    id: `topCategory:${top.categoryId}`,
    severity: 'info',
    weight: share >= HEAVY_SHARE ? 50 : 35,
    titleKey: 'analysis.topCategory.title',
    bodyKey: 'analysis.topCategory.body',
    params: { category: top.categoryName as string, amount: formatAr(top.cycleSpend), pct },
    // ex. « 400 000 ÷ 1 502 774 = 27 % »
    evidence: `${formatAr(top.cycleSpend)} ÷ ${formatAr(i.expenses)} = ${pct} %`,
  };
};
