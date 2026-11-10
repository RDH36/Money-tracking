/**
 * Montants du lecteur générique (relevés, applis, SMS) : « -MGA 17 999.99 »,
 * « + 50 000 Ar », « 1.250.000,00 MGA », « Ariary 25000 ». Un nombre n'est
 * retenu que s'il porte une devise, un signe ou un groupement des milliers
 * (pas les numéros de compte, heures, années). Les dates sont masquées avant.
 */
import { fixDigits } from '../tickets/amount';

export interface FoundAmount {
  /** Centimes, positif. */
  cents: number;
  /** -1 : « - » lu, 1 : « + » lu, 0 : sans signe. */
  sign: -1 | 0 | 1;
  /** Devise lue (`MGA`), null si absente. */
  currency: string | null;
  /** Groupes de milliers mal formés ou décimale tronquée. */
  uncertain: boolean;
  /** Position dans le texte (caractères), pour le contexte (« solde », « frais »). */
  start: number;
  end: number;
}

const CUR = '(MGA|Ariary|Ar|AR|Fmg)';
const NUM = '(\\d{1,3}(?:[ \\u00a0\\u202f.,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';
const SIGN = '([-‐‑–—−+]?)';
// Devise avant ou après le nombre, signe avant la devise ou avant le nombre.
const AMOUNT_RE = new RegExp(
  `${SIGN}\\s*(?:${CUR}\\.?\\s*${SIGN}\\s*)?${NUM}(?:\\s*${CUR}\\b)?`,
  'g'
);
// Dates et heures : masquées pour ne pas les lire comme des montants.
const DATE_LIKE = /(?<!\d)\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}(?!\d)|(?<!\d)\d{1,2}[:h]\d{2}(?::\d{2})?(?!\d)/g;

function blank(s: string): string {
  return ' '.repeat(s.length);
}

/** Valeur en centimes de « 17 999.99 », « 1.250.000,00 », « 25000 ». */
function toCents(body: string): { cents: number; uncertain: boolean } | null {
  const b = body.replace(/[  ]/g, ' ');
  let intPart = b;
  let decimals = '00';
  let uncertain = false;
  const m = /^(.*\d)([.,])(\d{1,2})$/.exec(b);
  if (m) {
    intPart = m[1];
    decimals = m[3].length === 1 ? `${m[3]}0` : m[3];
    if (m[3].length === 1) uncertain = true;
  }
  const groups = intPart.split(/[ .,]/).filter(Boolean);
  if (groups.length === 0) return null;
  if (groups.length > 1 && !groups.slice(1).every((g) => g.length === 3)) uncertain = true;
  const units = parseInt(groups.join(''), 10);
  if (!Number.isFinite(units)) return null;
  return { cents: units * 100 + parseInt(decimals, 10), uncertain };
}

/** Tous les montants plausibles du texte, dans l'ordre. */
export function findAmounts(text: string): FoundAmount[] {
  const t = fixDigits(text).replace(DATE_LIKE, blank);
  const found: FoundAmount[] = [];
  for (const m of t.matchAll(AMOUNT_RE)) {
    const signRaw = m[1] || m[3] || '';
    const currency = m[2] || m[5] || null;
    const body = m[4];
    const grouped = /\d[   .,]\d{3}(?!\d)/.test(body);
    if (!currency && !signRaw && !grouped) continue;
    // Signe seul sans devise ni milliers (« -12 ») : trop ambigu.
    if (!currency && !grouped) continue;
    const value = toCents(body.trim());
    if (!value || value.cents === 0) continue;
    const at = m.index ?? 0;
    found.push({
      cents: value.cents,
      sign: signRaw === '' ? 0 : signRaw === '+' ? 1 : -1,
      currency: currency ? 'MGA' : null,
      uncertain: value.uncertain,
      start: at,
      end: at + m[0].length,
    });
  }
  return found;
}

/** true si la ligne n'est (presque) qu'un montant : « -MGA 200 000.00 ». */
export function isAmountOnlyLine(text: string): boolean {
  const amounts = findAmounts(text);
  if (amounts.length !== 1) return false;
  const rest = text.slice(0, amounts[0].start) + text.slice(amounts[0].end);
  return (rest.match(/[A-Za-zÀ-ÿ]/g)?.length ?? 0) <= 3;
}
