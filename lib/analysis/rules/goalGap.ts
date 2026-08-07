import type { Insight, Rule } from '../types';
import { clampWeight, formatAr } from '../format';

/**
 * Écart à l'objectif d'épargne mensuel de l'utilisateur (goal `saveAmount`).
 * Fabrique : le montant cible vient des réglages, pas des indicateurs — la
 * règle reste pure, le contexte est injecté à la construction.
 * Se tait sans revenu (« gardé » n'a alors pas de sens).
 */
export function makeGoalGapRule(goalAmount: number): Rule {
  return (i) => {
    if (goalAmount <= 0) return null;
    if (i.income <= 0) return null;

    const kept = i.keptAmount;
    if (kept >= goalAmount) {
      const reached: Insight = {
        id: 'goalGap',
        severity: 'info',
        weight: 40,
        titleKey: 'analysis.goalGap.reached',
        params: { kept: formatAr(kept), goal: formatAr(goalAmount) },
        evidence: `${formatAr(kept)} ≥ ${formatAr(goalAmount)}`,
      };
      return reached;
    }

    const pct = Math.max(0, Math.round((kept / goalAmount) * 100));
    const gap = goalAmount - kept;
    const behind: Insight = {
      id: 'goalGap',
      severity: kept < goalAmount / 2 ? 'watch' : 'info',
      weight: clampWeight(45 + (1 - kept / goalAmount) * 35, 45, 85),
      titleKey: 'analysis.goalGap.behind',
      params: { goal: formatAr(goalAmount), kept: formatAr(kept), pct: `${pct} %` },
      evidence: `${formatAr(kept)} ÷ ${formatAr(goalAmount)} = ${pct} %`,
      action: {
        type: 'createTransfer',
        labelKey: 'analysis.action.transferAmount',
        labelParams: { amount: formatAr(gap) },
        payload: { amount: gap },
      },
    };
    return behind;
  };
}
