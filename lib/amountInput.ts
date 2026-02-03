/**
 * Utility functions for handling decimal amount input
 * Uses dot (.) as decimal separator
 */

/**
 * Formats a raw input string for display, allowing decimal input with dot
 * - Keeps only digits and one dot
 * - Limits to 2 decimal places
 */
export function formatAmountInput(value: string): string {
  // Remove all characters except digits and dots
  let normalized = value.replace(/[^\d.]/g, '');

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
 * Parses an amount string and returns the value in cents
 * - Returns an integer (cents)
 */
export function parseAmountToCents(value: string): number {
  if (!value) return 0;

  const floatValue = parseFloat(value);
  if (isNaN(floatValue)) return 0;

  // Round to avoid floating point issues
  return Math.round(floatValue * 100);
}

/**
 * Gets the numeric value from a string
 * Useful for validation (checking if > 0)
 */
export function getNumericValue(value: string): number {
  if (!value) return 0;

  const floatValue = parseFloat(value);
  return isNaN(floatValue) ? 0 : floatValue;
}
