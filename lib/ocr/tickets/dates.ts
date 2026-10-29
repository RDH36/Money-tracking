/** Dates des tickets : « 14-03-26 », « 21/03/26 », « 2026-03-22 », « 22/03/2026 ». */
import { fixDigits } from './amount';

function ymd(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const ISO_RE = /(?<!\d)(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/g;
const DMY_RE = /(?<!\d)(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})(?![\d])/g;

/** Toutes les dates lisibles du texte, dans l'ordre (jour avant mois). */
export function findDates(text: string): string[] {
  const t = fixDigits(text);
  const found: { at: number; date: string }[] = [];
  for (const m of t.matchAll(ISO_RE)) {
    const d = ymd(+m[1], +m[2], +m[3]);
    if (d) found.push({ at: m.index ?? 0, date: d });
  }
  const iso = t.replace(ISO_RE, (s) => ' '.repeat(s.length));
  for (const m of iso.matchAll(DMY_RE)) {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    const d = ymd(year, +m[2], +m[1]);
    if (d) found.push({ at: m.index ?? 0, date: d });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.date);
}

/** Date plausible pour une opération : au plus le lendemain d'aujourd'hui. */
export function isPlausibleDate(date: string, today: string): boolean {
  const d = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10) + 1));
  return date <= d.toISOString().slice(0, 10);
}
