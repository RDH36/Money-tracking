/**
 * Montants MCB Juice : « MGA -348 120,45 » (débit) / « MGA 1 850 000,00 »
 * (crédit, en vert). Espace des milliers, virgule décimale, centimes en
 * exposant : l'OCR peut les coller, les séparer d'une espace ou les rendre
 * dans une ligne à part (fournie ici via `superscript`).
 */

export interface ParsedAmount {
  /** Valeur absolue en centimes. */
  cents: number;
  /** true si un signe moins est lu. */
  negative: boolean;
  currency: string;
  /** true si les centimes ou le groupement des milliers sont douteux. */
  uncertain: boolean;
}

// Corps du montant : chiffres, séparateurs, et les lectures OCR des centimes
// en exposant (« 00 » lu « oo », « °° » ou « " »).
const AMOUNT_RE = /\b(MGA|EUR|USD)\s*([-‐‑–—−~]?)\s*(\d[\d\s.,'’"”″°oO]*)/i;

/** true si la ligne ressemble à un montant (« MGA ... chiffres »). */
export function isAmountLine(text: string): boolean {
  return AMOUNT_RE.test(text);
}

/** Centimes en exposant lus seuls : « 31 », « 00 », « OO », « oo ». */
export function asSuperscriptCents(text: string): string | null {
  const t = text.trim().replace(/[oO°]/g, '0');
  return /^\d{2}$/.test(t) ? t : null;
}

// Un seul groupe (« 21900 », espace des milliers non lue) reste sûr ; plusieurs
// groupes mal formés trahissent un chiffre perdu ou en trop.
function groupsAreValid(groups: string[]): boolean {
  if (groups.length <= 1) return true;
  return groups[0].length <= 3 && groups.slice(1).every((g) => g.length === 3);
}

/** Centimes lus après la virgule : `"` = deux zéros en exposant, o/° = 0. */
function readDecimals(raw: string): string | null {
  const digits = raw
    .replace(/\s+/g, '')
    .replace(/["”″]/g, '00')
    .replace(/[oO°'’]/g, '0')
    .replace(/\D/g, '');
  if (digits.length === 0) return null;
  // « 00 » en exposant souvent fusionné en un seul « 0 ».
  return digits === '0' ? '00' : digits.slice(0, 2);
}

export function parseAmount(text: string, superscript?: string | null): ParsedAmount | null {
  const m = AMOUNT_RE.exec(text);
  if (!m) return null;
  const currency = m[1].toUpperCase();
  const negative = m[2] !== '';
  const body = m[3].trim();

  let decimals: string | null = null;
  const comma = body.indexOf(',');
  const intRaw = comma >= 0 ? body.slice(0, comma) : body;
  if (comma >= 0) decimals = readDecimals(body.slice(comma + 1));
  const intPart = intRaw
    .replace(/[oO]/g, '0')
    .replace(/["”″°]/g, '')
    .replace(/[.'’]/g, ' ');

  let groups = intPart.trim().split(/\s+/).filter(Boolean);
  if (comma < 0 && !superscript && groups.length > 1) {
    // Pas de virgule lue : « 348 120 45 » ou « 348 12045 » → centimes collés.
    const last = groups[groups.length - 1];
    if (last.length === 2) {
      decimals = last;
      groups = groups.slice(0, -1);
    } else if (last.length === 5) {
      decimals = last.slice(3);
      groups = [...groups.slice(0, -1), last.slice(0, 3)];
    }
  }
  if (groups.length === 0) return null;

  let uncertain = !groupsAreValid(groups);
  if (decimals === null) decimals = superscript ?? null;
  if (decimals === null) {
    uncertain = true;
    decimals = '00';
  } else if (decimals.length === 1) {
    uncertain = true;
    decimals = `${decimals}0`;
  }

  const units = parseInt(groups.join(''), 10);
  if (!Number.isFinite(units)) return null;
  return { cents: units * 100 + parseInt(decimals, 10), negative, currency, uncertain };
}
