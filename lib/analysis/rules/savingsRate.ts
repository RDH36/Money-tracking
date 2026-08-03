import type { InsightAction, Rule } from '../types';
import { clampWeight, formatAr, formatPct } from '../format';

/**
 * Ce que l'utilisateur a gardé ce cycle. Se tait si le revenu est nul
 * (`savingsRate === null`) — on n'affiche jamais « 0 % » pour une absence de
 * revenu. Propose de mettre de côté l'écart avec son meilleur cycle.
 */
export const savingsRateRule: Rule = (i) => {
  if (i.savingsRate === null) return null;

  const rate = i.savingsRate;
  const weight = clampWeight((1 - rate) * 55, 20, 90);
  const severity = rate < 0 ? 'urgent' : rate < 0.05 ? 'watch' : 'info';

  // Cible = garder au niveau du meilleur cycle passé ; l'action ne s'attache
  // que si un virement positif a du sens.
  let action: InsightAction | undefined;
  const target = i.bestCycle ? Math.round(i.income * i.bestCycle.savingsRate) : Math.round(i.income * 0.1);
  const gap = target - i.keptAmount;
  if (i.income > 0 && gap > 0) {
    action = {
      type: 'createTransfer' as const,
      labelKey: 'analysis.action.transfer',
      payload: { amount: gap },
    };
  }

  return {
    id: 'savingsRate',
    severity,
    weight,
    titleKey: 'analysis.savingsRate.title',
    params: { kept: formatAr(i.keptAmount), rate: formatPct(rate) },
    evidence: `${formatAr(i.keptAmount)} ÷ ${formatAr(i.income)} = ${formatPct(rate)}`,
    action,
  };
};
