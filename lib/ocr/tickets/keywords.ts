/** Helpers texte des tickets (purs). */
import { normalizeText } from '../text';

/** Texte normalisé pour chercher des mots-clés : « BANK 0F » → « bank of ». */
export function kw(text: string): string {
  return normalizeText(text).replace(/(?<=[a-z])0|0(?=[a-z])/g, 'o').replace(/['’`]/g, ' ').replace(/\s+/g, ' ');
}

/** Chiffres seuls d'un fragment (« 3186 04 » → `318604`), O/o lus pour 0. */
export function digitsOf(text: string): string {
  return text.replace(/[Oo]/g, '0').replace(/[iIl|!]/g, '1').replace(/\D/g, '');
}

/** Corrige les chiffres lus au milieu des mots : « D1GUE » → « DIGUE », « AKD2 » inchangé. */
export function fixWords(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => (/[A-Za-z].*[01].*[A-Za-z]/.test(w) && /^[A-Za-z01]+$/.test(w) ? w.replace(/1/g, 'I').replace(/0/g, 'O') : w))
    .join(' ')
    .trim();
}

/** Part de lettres d'une ligne (0 à 1), espaces exclus. */
export function letterRatio(text: string): number {
  const t = text.replace(/\s+/g, '');
  if (!t) return 0;
  return (t.match(/[A-Za-zÀ-ÿ]/g)?.length ?? 0) / t.length;
}

/** Texte après le libellé (après « : » sinon après le mot-clé). */
export function afterLabel(text: string, label: RegExp): string {
  const colon = text.indexOf(':');
  if (colon >= 0) return text.slice(colon + 1);
  const m = label.exec(kw(text));
  return m ? text.slice(Math.min(text.length, (m.index ?? 0) + m[0].length)) : '';
}
