/**
 * Utility functions for handling decimal amount input
 * Supports both dots and commas as decimal separators
 */

/**
 * Formats a raw input string for display, allowing decimal input
 * - Accepts both . and , as decimal separators
 * - Limits to 2 decimal places
 * - Formats the integer part with thousands separator (space)
 */
export function formatAmountInput(value: string): string {
  // Replace comma with dot for consistency
  let normalized = value.replace(',', '.');

  // Remove all characters except digits and dots
  normalized = normalized.replace(/[^\d.]/g, '');

  // Handle multiple dots - keep only the first one
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = normalized.split('.');

  if (!integerPart && !decimalPart) return '';

  // Format integer part with thousands separator
  const formattedInteger = integerPart
    ? parseInt(integerPart, 10).toLocaleString('fr-FR')
    : '0';

  // If there's a decimal part or the user just typed a dot
  if (decimalPart !== undefined) {
    // Limit decimal to 2 digits
    const limitedDecimal = decimalPart.slice(0, 2);
    return `${formattedInteger},${limitedDecimal}`;
  }

  return formattedInteger;
}

/**
 * Parses a formatted amount string and returns the value in cents
 * - Handles both . and , as decimal separators
 * - Returns an integer (cents)
 */
export function parseAmountToCents(value: string): number {
  if (!value) return 0;

  // Remove spaces (thousands separator)
  let cleaned = value.replace(/\s/g, '');

  // Replace comma with dot for parsing
  cleaned = cleaned.replace(',', '.');

  // Parse as float and multiply by 100 to get cents
  const floatValue = parseFloat(cleaned);

  if (isNaN(floatValue)) return 0;

  // Round to avoid floating point issues
  return Math.round(floatValue * 100);
}

/**
 * Gets the numeric value from a formatted string (not in cents)
 * Useful for validation (checking if > 0)
 */
export function getNumericValue(value: string): number {
  if (!value) return 0;

  // Remove spaces (thousands separator)
  let cleaned = value.replace(/\s/g, '');

  // Replace comma with dot for parsing
  cleaned = cleaned.replace(',', '.');

  const floatValue = parseFloat(cleaned);

  return isNaN(floatValue) ? 0 : floatValue;
}
