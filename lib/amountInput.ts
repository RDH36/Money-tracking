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
