import { getCurrencyByCode, Currency } from '@/constants/currencies';

/**
 * Format an amount in cents to a localized currency string
 * @param amountInCents - The amount in cents (e.g., 150000 for 1500.00)
 * @param currencyCode - The currency code (MGA, EUR, USD)
 * @returns Formatted string (e.g., "1 500 Ar", "1 500,00 €", "$1,500.00")
 */
export function formatCurrency(amountInCents: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  const amount = amountInCents / 100;

  // Format number based on locale
  const formattedNumber = amount.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.code === 'MGA' ? 0 : 2,
    maximumFractionDigits: currency.code === 'MGA' ? 0 : 2,
  });

  // Position symbol based on currency
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currency.symbol}`;
  }
}

/**
 * Format a raw number (not cents) to a localized string without currency symbol
 * Used for input display
 * @param value - The raw number value
 * @param currencyCode - The currency code for locale
 * @returns Formatted string without symbol
 */
export function formatNumber(value: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  return value.toLocaleString(currency.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Get the currency symbol for a given code
 * @param currencyCode - The currency code
 * @returns The currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return getCurrencyByCode(currencyCode).symbol;
}
