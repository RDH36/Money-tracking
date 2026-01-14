// Types pour les devises
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  symbolPosition: 'before' | 'after';
}

// Devises supportées
export const CURRENCIES: Currency[] = [
  {
    code: 'MGA',
    symbol: 'Ar',
    name: 'Ariary malgache',
    locale: 'fr-MG',
    symbolPosition: 'after',
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'fr-FR',
    symbolPosition: 'after',
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'Dollar américain',
    locale: 'en-US',
    symbolPosition: 'before',
  },
];

// Devise par défaut
export const DEFAULT_CURRENCY = 'MGA';

// Helper pour obtenir une devise par son code
export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
};
