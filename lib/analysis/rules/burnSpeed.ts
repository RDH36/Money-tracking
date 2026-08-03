import type { Rule } from '../types';
import { clampWeight, formatAr, formatPct } from '../format';

/** Seuil par défaut (sous 3 cycles d'historique) : part du revenu dépensée
 *  dans les 7 premiers jours au-delà de laquelle on le signale. */
const BURN_THRESHOLD = 0.35;

/**
 * Vitesse de dépense en début de cycle. Se tait si le revenu est nul
 * (`burnSpeed === null`). Fait chiffré, sans jugement : « X % du revenu dépensé
 * dans les 7 premiers jours ».
 */
export const burnSpeedRule: Rule = (i) => {
  if (i.burnSpeed === null) return null;
  if (i.burnSpeed < BURN_THRESHOLD) return null;

  const first7 = Math.round(i.burnSpeed * i.income);
  const weight = clampWeight(i.burnSpeed * 80 + 10, 30, 95);
  const severity = i.burnSpeed >= 0.6 ? 'urgent' : i.burnSpeed >= 0.45 ? 'watch' : 'info';

  return {
    id: 'burnSpeed',
    severity,
    weight,
    titleKey: 'analysis.burnSpeed.title',
    params: { rate: formatPct(i.burnSpeed) },
    evidence: `${formatAr(first7)} ÷ ${formatAr(i.income)} = ${formatPct(i.burnSpeed)}`,
  };
};
