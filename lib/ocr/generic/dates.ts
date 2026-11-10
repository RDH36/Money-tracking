/**
 * Dates du lecteur générique : en-têtes de jour (« Aujourd'hui », « Hier »,
 * « Lundi 12 mars 2026 », « 12/03/2026 ») et dates dans le texte d'une
 * opération (« 30-10-2026- SUR PACK… », « le 05/11/26 à 14:32 »).
 */
import { normalizeText, toYmd } from '../text';
import { findDates } from '../tickets/dates';

const MONTHS: [RegExp, number][] = [
  [/^janv?|^jan$/, 1], [/^fe[vb]/, 2], [/^mar[s]?$|^mars/, 3], [/^avr|^apr/, 4], [/^mai$|^may$/, 5],
  [/^juin|^jun/, 6], [/^juil|^jul/, 7], [/^aou|^aug/, 8], [/^sep/, 9], [/^oct/, 10], [/^nov/, 11], [/^dec/, 12],
  // Malgache.
  [/^janoary/, 1], [/^febroary/, 2], [/^martsa/, 3], [/^aprily/, 4], [/^mey/, 5], [/^jona/, 6],
  [/^jolay/, 7], [/^aogositra/, 8], [/^septambra/, 9], [/^oktobra/, 10], [/^novambra/, 11], [/^desambra/, 12],
];
const WEEKDAYS = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday|alatsinainy|talata|alarobia|alakamisy|zoma|asabotsy|alahady)\s*,?\s*/;

function shift(today: string, days: number): string {
  const d = new Date(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10) + days);
  return toYmd(d);
}

function monthOf(word: string): number | null {
  const w = word.replace(/\./g, '');
  for (const [re, m] of MONTHS) if (re.test(w)) return m;
  return null;
}

/** « 12 mars 2026 », « 12 mars » (année du jour, ou la précédente si futur). */
export function parseWordDate(text: string, today: string): string | null {
  const m = /(?<!\d)(\d{1,2})(?:er)?\s+([a-z]{3,10})\.?(?:\s+(\d{4}))?(?!\d)/.exec(normalizeText(text));
  if (!m) return null;
  const month = monthOf(m[2]);
  if (!month) return null;
  let year = m[3] ? +m[3] : +today.slice(0, 4);
  const day = +m[1];
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (!m[3] && ymd > shift(today, 1)) year -= 1;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || year < 2000 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Ligne qui n'est qu'un en-tête de jour → date `YYYY-MM-DD`, sinon null.
 * Une ligne plus longue (libellé avec une date) n'est pas un en-tête.
 */
export function parseDayHeader(text: string, today: string): string | null {
  const t = normalizeText(text).replace(/['’`]/g, ' ').replace(/\s+/g, ' ');
  if (/^(aujourd hui|today|androany)$/.test(t)) return today;
  if (/^(hier|yesterday|omaly)$/.test(t)) return shift(today, -1);
  if (/^(avant-hier|avant hier|omaly kokoa)$/.test(t)) return shift(today, -2);
  const rest = t.replace(WEEKDAYS, '');
  if (rest.length > 22) return null;
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(rest)) return findDates(rest)[0] ?? null;
  if (/^\d{1,2}(er)?\s+[a-z]{3,10}\.?(\s+\d{4})?$/.test(rest)) return parseWordDate(rest, today);
  return null;
}

/** Première date lue dans le texte d'une opération (chiffres ou mois en lettres). */
export function dateInText(text: string, today: string): string | null {
  return findDates(text)[0] ?? parseWordDate(text, today);
}
