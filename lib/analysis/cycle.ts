/**
 * Bornes de cycle : mois calendaire (`calendar` / `irregular`) ou de paye à
 * paye (`payday`, Phase 7).
 *
 * On construit les bornes en heure LOCALE puis on les sérialise en ISO UTC —
 * exactement le pattern de `getLocalMonthBounds` (useBudgets), volontairement
 * conservé : les requêtes comparent `transaction_date` (ISO UTC) à ces bornes.
 * Fonctions pures : `now` et les réglages sont injectables pour la testabilité.
 * C'est le SEUL endroit qui décide des bornes ; tout consommateur d'un `Cycle`
 * suit sans modification.
 */
import { DEFAULT_CYCLE_SETTINGS, type Cycle, type CycleSettings } from './types';

const DAY_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Nombre de jours du mois (année, index de mois 0–11). */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Date locale 'YYYY-MM-DD'. */
function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Jour de paye effectif : mode `payday` avec un jour valide 1–31, sinon `null`. */
function effectivePayDay(settings: CycleSettings): number | null {
  if (settings.mode !== 'payday' || settings.payDay == null) return null;
  const d = Math.round(settings.payDay);
  return d >= 1 && d <= 31 ? d : null;
}

/**
 * Date de paye (minuit local) du mois donné : `min(payDay, joursDuMois)`.
 * `monthIndex` peut déborder (négatif ou > 11) : `new Date` normalise l'année.
 */
function payDate(year: number, monthIndex: number, payDay: number): Date {
  const norm = new Date(year, monthIndex, 1);
  const y = norm.getFullYear();
  const m = norm.getMonth();
  return new Date(y, m, Math.min(payDay, daysInMonth(y, m)));
}

/** Nombre de jours entiers entre deux minuits locaux (robuste aux changements d'heure). */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * Cycle générique [start, end[ (minuits locaux). `today` (minuit local) borne
 * les jours écoulés du cycle courant ; absent → cycle passé complet.
 */
function buildCycle(start: Date, end: Date, label: string, today?: Date): Cycle {
  const totalDays = Math.max(1, daysBetween(start, end));
  const elapsedDays = today ? Math.min(totalDays, Math.max(1, daysBetween(start, today) + 1)) : totalDays;
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label,
    totalDays,
    elapsedDays,
    elapsedRatio: elapsedDays / totalDays,
    isCurrent: today != null,
  };
}

/** Cycle calendaire du mois (année, index de mois, éventuellement débordant). */
function calendarCycle(year: number, monthIndex: number, today?: Date): Cycle {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1); // borne exclue
  return buildCycle(start, end, `${start.getFullYear()}-${pad2(start.getMonth() + 1)}`, today);
}

/** Cycle de paye démarrant à la paye du mois (année, index de mois débordant). */
function paydayCycle(year: number, monthIndex: number, payDay: number, today?: Date): Cycle {
  const start = payDate(year, monthIndex, payDay);
  const end = payDate(year, monthIndex + 1, payDay); // borne exclue
  return buildCycle(start, end, localIsoDate(start), today);
}

/** Année / index de mois (locaux) de la paye qui ouvre le cycle contenant `today`. */
function currentPayMonth(today: Date, payDay: number): { year: number; monthIndex: number } {
  const y = today.getFullYear();
  const m = today.getMonth();
  // La paye de ce mois est-elle déjà passée ? Sinon le cycle a démarré le mois d'avant.
  return payDate(y, m, payDay) <= today ? { year: y, monthIndex: m } : { year: y, monthIndex: m - 1 };
}

/**
 * Cycle courant. `elapsedDays` s'arrête à aujourd'hui (jamais 0), d'où un
 * `elapsedRatio` dans ]0,1] utilisable pour les projections.
 *
 * Mode `payday` (jour d) : `start` = dernière paye ≤ aujourd'hui, `end` = paye
 * suivante ; `label` = date ISO locale de `start`. Ex. payDay 28, le 7 août 2026
 * → 28 juil. → 27 août, label '2026-07-28', elapsedDays 11, totalDays 31.
 */
export function getCurrentCycle(now: Date = new Date(), settings: CycleSettings = DEFAULT_CYCLE_SETTINGS): Cycle {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const payDay = effectivePayDay(settings);
  if (payDay == null) return calendarCycle(today.getFullYear(), today.getMonth(), today);
  const { year, monthIndex } = currentPayMonth(today, payDay);
  return paydayCycle(year, monthIndex, payDay, today);
}

/**
 * Les `n` cycles complets qui précèdent celui contenant l'ancre (aujourd'hui
 * par défaut), du plus récent au plus ancien. Pour ancrer sur un cycle donné,
 * passer `cycleAnchorDate(cycle)` — jamais une date de bord (ambiguïté de fuseau).
 */
export function getPreviousCycles(
  n: number,
  anchor: Date = new Date(),
  settings: CycleSettings = DEFAULT_CYCLE_SETTINGS
): Cycle[] {
  const today = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const payDay = effectivePayDay(settings);
  const base = payDay == null ? { year: today.getFullYear(), monthIndex: today.getMonth() } : currentPayMonth(today, payDay);
  const cycles: Cycle[] = [];
  for (let i = 1; i <= n; i++) {
    // Index de mois négatif → `new Date` normalise l'année dans les helpers.
    cycles.push(
      payDay == null
        ? calendarCycle(base.year, base.monthIndex - i)
        : paydayCycle(base.year, base.monthIndex - i, payDay)
    );
  }
  return cycles;
}

/**
 * Date locale (midi) au milieu du cycle : ancre sûre pour `getPreviousCycles`,
 * quel que soit le mode. Remplace le parsing du `label`.
 */
export function cycleAnchorDate(cycle: Cycle): Date {
  const s = new Date(cycle.start); // minuit local du début, relu dans le fuseau courant
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + Math.floor(cycle.totalDays / 2), 12);
}

function safeLocaleDate(d: Date, lang: string, opts: Intl.DateTimeFormatOptions, fallback: string): string {
  try {
    return d.toLocaleDateString(lang, opts);
  } catch {
    return fallback;
  }
}

/**
 * Libellé lisible du cycle : « juillet 2026 » en calendaire (label 'YYYY-MM'),
 * « 28 juil. → 27 août » de paye à paye (label 'YYYY-MM-DD', dernier jour inclus).
 */
export function formatCycleRange(cycle: Cycle, lang: string): string {
  const start = new Date(cycle.start);
  if (cycle.label.length === 7) {
    return safeLocaleDate(start, lang, { month: 'long', year: 'numeric' }, cycle.label);
  }
  const last = new Date(start.getFullYear(), start.getMonth(), start.getDate() + cycle.totalDays - 1);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const from = safeLocaleDate(start, lang, opts, `${pad2(start.getDate())}/${pad2(start.getMonth() + 1)}`);
  const to = safeLocaleDate(last, lang, opts, `${pad2(last.getDate())}/${pad2(last.getMonth() + 1)}`);
  return `${from} → ${to}`;
}
