/**
 * Bornes de cycle (mois calendaire, v1).
 *
 * On construit les bornes en heure LOCALE puis on les sérialise en ISO UTC —
 * exactement le pattern de `getLocalMonthBounds` (useBudgets), volontairement
 * conservé : les requêtes comparent `transaction_date` (ISO UTC) à ces bornes.
 * Fonctions pures : `now` est injectable pour la testabilité.
 */
import type { Cycle } from './types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Nombre de jours du mois (année, index de mois 0–11). */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Construit un cycle passé (complet) à partir de son année / index de mois. */
function pastCycle(year: number, monthIndex: number): Cycle {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1); // borne exclue
  const totalDays = daysInMonth(year, monthIndex);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${year}-${pad2(monthIndex + 1)}`,
    totalDays,
    elapsedDays: totalDays,
    elapsedRatio: 1,
    isCurrent: false,
  };
}

/**
 * Cycle courant. `elapsedDays` s'arrête à aujourd'hui (jamais 0), d'où un
 * `elapsedRatio` dans ]0,1] utilisable pour les projections.
 */
export function getCurrentCycle(now: Date = new Date()): Cycle {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  const totalDays = daysInMonth(year, monthIndex);
  const elapsedDays = Math.min(totalDays, Math.max(1, now.getDate()));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${year}-${pad2(monthIndex + 1)}`,
    totalDays,
    elapsedDays,
    elapsedRatio: elapsedDays / totalDays,
    isCurrent: true,
  };
}

/**
 * Les `n` cycles complets qui précèdent l'ancre (le mois courant par défaut),
 * du plus récent au plus ancien. `anchor` peut être une date quelconque du
 * mois de référence ; on n'utilise que son année / mois local.
 *
 * Pour analyser un cycle passé, passer une date au milieu de ce mois
 * (ex. `new Date(year, monthIndex, 15)`) — sans ambiguïté de fuseau.
 */
export function getPreviousCycles(n: number, anchor: Date = new Date()): Cycle[] {
  const baseYear = anchor.getFullYear();
  const baseMonth = anchor.getMonth();
  const cycles: Cycle[] = [];
  for (let i = 1; i <= n; i++) {
    // new Date(year, month - i, 1) normalise les débordements d'année.
    const d = new Date(baseYear, baseMonth - i, 1);
    cycles.push(pastCycle(d.getFullYear(), d.getMonth()));
  }
  return cycles;
}
