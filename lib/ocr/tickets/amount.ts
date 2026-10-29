/**
 * Montants des tickets papier, tous formats : « 60,000.00 » (GAB, format US),
 * « 48 700.00 » (TPE), « A56.000 » / « Ar 56.000 » (caisse : point des
 * milliers), « 1 500,50 ». Règle : un séparateur final suivi de 2 chiffres
 * est décimal, suivi de 3 chiffres c'est un séparateur de milliers.
 */

export interface TicketAmount {
  /** Centimes, positif. */
  cents: number;
  /** Groupes de milliers mal formés ou décimale tronquée. */
  uncertain: boolean;
}

/** Lectures OCR courantes des chiffres collés à un nombre (O → 0, i/l/| → 1). */
export function fixDigits(s: string): string {
  let out = s;
  for (let pass = 0; pass < 2; pass++) {
    out = out
      .replace(/(?<=\d|\d[.,])[Oo]|[Oo](?=\d|[.,]\d)/g, '0')
      .replace(/(?<=\d)[iIl|!]|[iIl|!](?=\d)/g, '1');
  }
  return out;
}

// Nombre : chiffres et séparateurs (espaces autour des séparateurs tolérés).
const NUMBER_RE = /\d[\d\s.,]*\d|\d/g;

function groupsAreValid(groups: string[]): boolean {
  if (groups.length <= 1) return true;
  return groups[0].length >= 1 && groups[0].length <= 3 && groups.slice(1).every((g) => g.length === 3);
}

/** Lit le premier nombre du texte (devise « Ar », « A », « MGA » ignorée). */
export function parseTicketAmount(text: string): TicketAmount | null {
  const cleaned = fixDigits(text.replace(/\b(MGA|Ar|AR)\b/g, ' ').replace(/(^|\s)A(?=\d)/g, '$1'));
  const matches = cleaned.match(NUMBER_RE);
  if (!matches) return null;
  const body = matches[0].replace(/\s*([.,])\s*/g, '$1').trim();
  let intPart = body;
  let decimals = '00';
  let uncertain = false;
  const m = /^(.*\d)([.,])(\d+)$/.exec(body);
  if (m && m[3].length !== 3) {
    intPart = m[1];
    if (m[3].length === 2) decimals = m[3];
    else {
      uncertain = true;
      decimals = m[3].length === 1 ? `${m[3]}0` : m[3].slice(0, 2);
    }
  }
  const groups = intPart.split(/[\s.,]+/).filter(Boolean);
  if (groups.length === 0) return null;
  if (!groupsAreValid(groups)) uncertain = true;
  const units = parseInt(groups.join(''), 10);
  if (!Number.isFinite(units)) return null;
  return { cents: units * 100 + parseInt(decimals, 10), uncertain };
}

/** true si la ligne n'est (presque) qu'un montant : « 0.00 MGA », « A56.000 ». */
export function isAmountOnly(text: string): boolean {
  const t = text.replace(/\b(MGA|Ar|AR)\b/g, '').replace(/(^|\s)A(?=\d)/g, '$1').trim();
  return /^[\d\s.,OoiIl]+$/.test(t) && /\d/.test(t) && /[.,]/.test(t);
}
