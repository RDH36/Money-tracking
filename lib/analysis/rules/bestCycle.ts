import type { Insight, Rule } from '../types';
import { clampWeight, formatPct } from '../format';

/** Écart minimal sous le meilleur cycle pour l'afficher comme repère. */
const MARGIN = 0.03;

/**
 * Compare le taux d'épargne courant au meilleur des 6 cycles précédents. Se
 * tait si le revenu est nul (`savingsRate === null`) ou sans historique. Deux
 * cas : soit c'est un nouveau record (positif), soit un repère atteignable.
 */
export const bestCycleRule: Rule = (i) => {
  if (i.savingsRate === null || i.bestCycle === null) return null;

  const cur = i.savingsRate;
  const best = i.bestCycle.savingsRate;

  if (cur > best) {
    const record: Insight = {
      id: 'bestCycle:record',
      severity: 'info',
      weight: 30,
      titleKey: 'analysis.bestCycle.record',
      params: { rate: formatPct(cur) },
      evidence: `${formatPct(cur)} > ${formatPct(best)}`,
    };
    return record;
  }

  if (best - cur < MARGIN) return null; // trop proche : rien à signaler

  const reference: Insight = {
    id: 'bestCycle:reference',
    severity: 'info',
    weight: clampWeight((best - cur) * 60 + 15, 15, 60),
    titleKey: 'analysis.bestCycle.reference',
    params: { best: formatPct(best), month: i.bestCycle.label },
    evidence: `${formatPct(cur)} vs ${formatPct(best)}`,
  };
  return reference;
};
