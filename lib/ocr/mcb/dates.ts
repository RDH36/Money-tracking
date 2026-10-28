/** Dates MCB Juice : en-têtes « 28 oct. 2026 » et date julienne des références. */
import { normalizeText } from '../text';

// Préfixes de mois (FR abrégés de l'appli, plus EN si l'appli est en anglais).
const MONTHS: [string, number][] = [
  ['janv', 1], ['jan', 1], ['fevr', 2], ['fev', 2], ['feb', 2], ['mars', 3], ['mar', 3],
  ['avr', 4], ['apr', 4], ['mai', 5], ['may', 5], ['juin', 6], ['jun', 6], ['juil', 7],
  ['jul', 7], ['aout', 8], ['aou', 8], ['aug', 8], ['sept', 9], ['sep', 9], ['oct', 10],
  ['nov', 11], ['dec', 12],
];

function monthFromWord(word: string): number | null {
  const w = word.replace(/\./g, '');
  for (const [prefix, month] of MONTHS) {
    if (w === prefix || (w.startsWith(prefix) && w.length <= prefix.length + 2)) return month;
  }
  return null;
}

function ymd(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** « 28 oct. 2026 » → `2026-10-28`, sinon null. Tolère O/o lus à la place de 0. */
export function parseDateHeader(text: string): string | null {
  const m = /^([\do]{1,2})\s+([a-z]{3,5})\.?\s+([\do]{4})$/.exec(normalizeText(text));
  if (!m) return null;
  const month = monthFromWord(m[2]);
  if (!month) return null;
  const digits = (s: string) => +s.replace(/o/g, '0');
  const year = digits(m[3]);
  if (year < 2000 || year > 2100) return null;
  return ymd(year, month, digits(m[1]));
}

/**
 * Les références T24 « FT26301QW7K2 » portent la date comptable : AA + jour
 * de l'année (26 → 2026, 301 → 28 oct.). Sert de repli quand l'en-tête de
 * date n'est pas visible et de contrôle croisé sinon.
 */
export function dateFromReference(ref: string | null): string | null {
  const m = ref ? /^[A-Z]{2}(\d{2})(\d{3})/.exec(ref) : null;
  if (!m) return null;
  const year = 2000 + +m[1];
  const dayOfYear = +m[2];
  if (dayOfYear < 1 || dayOfYear > 366) return null;
  const d = new Date(Date.UTC(year, 0, dayOfYear));
  if (d.getUTCFullYear() !== year) return null;
  return ymd(year, d.getUTCMonth() + 1, d.getUTCDate());
}
