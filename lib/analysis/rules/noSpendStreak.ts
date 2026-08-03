import type { Rule } from '../types';
import { clampWeight } from '../format';

/** Nombre minimal de jours sans dépense pour le signaler (fait positif). */
const MIN_DAYS = 5;

/**
 * Jours écoulés du cycle sans aucune dépense — fait positif, non moralisateur.
 * `noSpendDays` est toujours un nombre (jamais null), borné aux jours écoulés.
 */
export const noSpendStreakRule: Rule = (i, cycle) => {
  if (i.noSpendDays < MIN_DAYS) return null;

  const share = i.noSpendDays / cycle.elapsedDays;
  const weight = clampWeight(share * 50, 10, 50);

  return {
    id: 'noSpendStreak',
    severity: 'info',
    weight,
    titleKey: 'analysis.noSpendStreak.title',
    params: { days: i.noSpendDays, total: cycle.elapsedDays },
    evidence: `${i.noSpendDays} / ${cycle.elapsedDays}`,
  };
};
