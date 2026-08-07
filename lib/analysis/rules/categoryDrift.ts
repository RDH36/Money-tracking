import type { Rule } from '../types';
import { clampWeight, formatAr } from '../format';

/** Dérive minimale signalée : dépense ≥ 1,3× la moyenne de la catégorie. */
const MIN_DRIFT = 1.3;
/** Base historique minimale pour qu'une dérive soit un signal, pas du bruit. */
const MIN_BASE_MULTIPLE = 5; // × microThreshold
/** Écart absolu minimal, en part du revenu du cycle. */
const MIN_ABS_SHARE = 0.01;

/**
 * La catégorie la plus au-dessus de sa propre habitude ce cycle. Chaque
 * `drift` vaut `null` sans historique exploitable → ces catégories sont
 * ignorées (jamais traitées comme 0).
 *
 * Une dérive sur une base minuscule est du bruit, pas une information : on
 * écarte les catégories dont la moyenne historique est < microThreshold × 5,
 * ou dont l'écart absolu au réalisé est < 1 % du revenu du cycle. Le
 * plafonnement d'affichage (Phase 3) n'est qu'un filet de sécurité.
 *
 * Propose de poser un budget au niveau de la moyenne passée.
 */
export const categoryDriftRule: Rule = (i) => {
  const minBase = i.microThreshold * MIN_BASE_MULTIPLE;
  // Sans revenu saisi, le garde absolu se rabat sur les dépenses du cycle —
  // sinon il disparaît et n'importe quelle miette passe.
  const gapBase = i.income > 0 ? i.income : i.expenses;
  const minAbsGap = gapBase * MIN_ABS_SHARE;
  const candidates = i.categoryDrift.filter(
    (d) =>
      d.drift !== null &&
      d.drift >= MIN_DRIFT &&
      d.categoryName !== null &&
      d.avgPrevious !== null &&
      d.avgPrevious >= minBase &&
      d.cycleSpend - d.avgPrevious >= minAbsGap
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
      labelKey: 'analysis.action.budgetFor',
      labelParams: {
        category: top.categoryName as string,
        amount: formatAr(Math.round(top.avgPrevious as number)),
      },
      payload: { categoryId: top.categoryId, limit: Math.round(top.avgPrevious as number) },
    },
  };
};
