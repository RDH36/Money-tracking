/**
 * Utility functions for handling decimal amount input
 * Accepts both dot (.) and comma (,) as decimal separator
 * Internally stores as dot for calculations
 */

/**
 * Formats a raw input string for display, allowing decimal input with dot or comma
 * - Converts commas to dots
 * - Keeps only digits and one dot
 * - Limits to 2 decimal places
 */
export function formatAmountInput(value: string): string {
  // Convert commas to dots for unified handling
  let normalized = value.replace(/,/g, '.');

  // Remove all characters except digits and dots
  normalized = normalized.replace(/[^\d.]/g, '');

  // Handle multiple dots - keep only the first one
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit decimal to 2 digits
  const [integerPart, decimalPart] = normalized.split('.');
  if (decimalPart !== undefined) {
    return `${integerPart}.${decimalPart.slice(0, 2)}`;
  }

  return normalized;
}

/**
 * Parses an amount string and returns the value in CENTS
 * Accepts both dot and comma as decimal separator
 * Example: "5.99" or "5,99" returns 599 (cents)
 */
export function parseAmount(value: string): number {
  if (!value) return 0;

  // Convert comma to dot before parsing
  const normalized = value.replace(/,/g, '.');
  const floatValue = parseFloat(normalized);
  if (isNaN(floatValue)) return 0;

  // Convert to cents (multiply by 100 and round to avoid floating point issues)
  return Math.round(floatValue * 100);
}

/**
 * Gets the numeric value from a string (as float, NOT cents)
 * Useful for validation (checking if > 0)
 * Accepts both dot and comma as decimal separator
 */
export function getNumericValue(value: string): number {
  if (!value) return 0;

  // Convert comma to dot before parsing
  const normalized = value.replace(/,/g, '.');
  const floatValue = parseFloat(normalized);
  return isNaN(floatValue) ? 0 : floatValue;
}

/**
 * Converts a display amount string to cents for storage
 * Example: "5000" or "5000.80" returns 500000 or 500080
 */
export function toCents(value: string): number {
  return parseAmount(value);
}

/**
 * Formats a raw amount string for human display, always French-style:
 * space for thousands, comma for decimal. Examples:
 *   "1234567"   -> "1 234 567"
 *   "1234.5"    -> "1 234,5"
 *   "1234."     -> "1 234,"
 *   ""          -> "0"
 */
export function formatAmountDisplay(raw: string): string {
  if (!raw) return '0';
  const intStr = (raw.includes('.') ? raw.split('.')[0] : raw) || '0';
  const intNum = Number(intStr);
  if (Number.isNaN(intNum)) return '0';

  const formattedInt = intNum
    .toLocaleString('fr-FR', { useGrouping: true })
    .replace(/[\u202F\u00A0]/g, ' ');

  if (raw.includes('.')) {
    const decPart = raw.split('.')[1] ?? '';
    return `${formattedInt},${decPart}`;
  }
  return formattedInt;
}

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
