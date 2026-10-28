/** Helpers texte partagés par les parseurs et l'anti-doublon (purs). */

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Minuscules, sans accents, espaces simples. */
export function normalizeText(s: string): string {
  return stripAccents(s).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Mots génériques des libellés bancaires : ignorés pour comparer deux libellés.
const STOPWORDS = new Set([
  'db', 'vente', 'carte', 'etrangere', 'locale', 'sur', 'de', 'du', 'la', 'le', 'les',
  'des', 'recus', 'recu', 'banque', 'confrere', 'ref', 'bnk', 'mga', 'et', 'en', 'au',
]);

/** Mots significatifs (≥ 3 caractères, sans chiffres seuls ni mots génériques). */
export function significantTokens(s: string): string[] {
  return normalizeText(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOPWORDS.has(w));
}

/**
 * Recouvrement de deux libellés : part des mots du plus court présents dans
 * l'autre (0 à 1). « Retrait » vs « Retrait GAB BOAMGXB » → 1.
 */
export function labelOverlap(a: string, b: string): number {
  const ta = new Set(significantTokens(a));
  const tb = new Set(significantTokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let common = 0;
  for (const w of small) if (large.has(w)) common++;
  return common / small.size;
}

/** `YYYY-MM-DD` d'une date locale. */
export function toYmd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Écart en jours entre deux `YYYY-MM-DD` (valeur absolue). */
export function daysBetween(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round(Math.abs(da - db) / 86_400_000);
}

/** true si la couleur `#rrggbb` est nettement verte (montants crédités). */
export function isGreenish(hex: string | null | undefined): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return g > r + 40 && g > b + 10;
}

/** true si la couleur est mesurée et non verte (texte noir/gris). */
export function isNeutralColor(hex: string | null | undefined): boolean {
  return !!hex && /^#[0-9a-f]{6}$/i.test(hex) && !isGreenish(hex);
}
