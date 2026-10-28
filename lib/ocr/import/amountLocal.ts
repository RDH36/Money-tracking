/** Montant au format local de la devise, pour la feuille de modification de l'import. */
import { formatAmountInput } from '@/lib/amountInput';

/** Séparateurs de la devise (« 1 111,1 » en fr-MG, « 1,111.1 » en en-US). */
function separators(locale: string): { group: string; decimal: string } {
  const sample = (1111.1).toLocaleString(locale, { minimumFractionDigits: 1 });
  return { group: sample.length === 7 ? sample.charAt(1) : '', decimal: sample.charAt(sample.length - 2) };
}

/** Valeur brute (« 70540.53 ») → affichage local (« 70 540,53 »). */
export function formatAmountLocal(raw: string, locale: string): string {
  const { group, decimal } = separators(locale);
  const [int, dec] = raw.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return dec === undefined ? grouped : `${grouped}${decimal}${dec}`;
}

/** Saisie au format local → valeur brute avec un point décimal. */
export function parseAmountLocal(text: string, locale: string): string {
  const { group, decimal } = separators(locale);
  let s = group ? text.split(group).join('') : text;
  s = s.replace(/\s/g, '');
  if (decimal !== '.') s = s.split(decimal).join('.');
  return formatAmountInput(s);
}
