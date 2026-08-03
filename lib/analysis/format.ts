/**
 * Formatage NEUTRE (indépendant de la langue) pour le champ `evidence` des
 * insights : le calcul doit être lisible et identique dans les 3 langues, donc
 * uniquement des chiffres et des symboles mathématiques (÷ × = % + −), jamais
 * de mots. Le message lisible, lui, passe par i18n (`titleKey` + `params`).
 */

/** Centimes → montant en Ariary, chiffres groupés par milliers avec une espace. */
export function formatAr(centimes: number): string {
  const ar = Math.round(centimes / 100);
  const sign = ar < 0 ? '−' : '';
  const grouped = Math.abs(ar)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return sign + grouped;
}

/** Ratio → pourcentage entier suivi de « % » (ex. 0.173 → "17 %"). */
export function formatPct(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

/** Borne un entier dans [lo, hi]. */
export function clampWeight(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
