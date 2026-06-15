import type { TFunction } from 'i18next';
import { getCurrencyByCode } from '@/constants/currencies';
import {
  WANTS_OPTIONS, SYNC_MODE_OPTIONS, getPriceTiers, PRICE_NONE, PRICE_MORE,
} from '@/constants/cloudBackupSurvey';

/**
 * Formate un montant RÉEL (ex. 5000 → « 5 000 Ar », 5 → « 5 € » / « $5 »).
 * On n'utilise PAS formatCurrency() : elle divise par 100 (montants en centimes)
 * et force 2 décimales — inadapté à des paliers de prix entiers.
 */
function formatPrice(amount: number, currencyCode: string): string {
  const c = getCurrencyByCode(currencyCode);
  const n = amount.toLocaleString(c.locale, { maximumFractionDigits: 0 });
  return c.symbolPosition === 'before' ? `${c.symbol}${n}` : `${n} ${c.symbol}`;
}

export interface SurveyOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

export interface SurveyStep {
  key: 'wants' | 'priceMonthly' | 'priceYearly' | 'syncMode';
  question: string;
  options: SurveyOption[];
}

function buildPriceOptions(
  currencyCode: string,
  period: 'monthly' | 'yearly',
  t: TFunction
): SurveyOption[] {
  const tiers = getPriceTiers(currencyCode)[period];
  const max = tiers[tiers.length - 1];
  return [
    { value: PRICE_NONE, label: t('cloudSurvey.priceNone') },
    ...tiers.map((a) => ({ value: String(a), label: formatPrice(a, currencyCode) })),
    { value: PRICE_MORE, label: t('cloudSurvey.priceMore', { amount: formatPrice(max, currencyCode) }) },
  ];
}

/** Construit les 4 étapes du sondage avec libellés i18n et tranches selon la devise. */
export function buildSurveySteps(currencyCode: string, t: TFunction): SurveyStep[] {
  return [
    {
      key: 'wants',
      question: t('cloudSurvey.q1'),
      options: WANTS_OPTIONS.map((o) => ({
        value: o.key, icon: o.icon,
        label: t(`cloudSurvey.wants_${o.key}`),
        sublabel: t(`cloudSurvey.wants_${o.key}_sub`),
      })),
    },
    { key: 'priceMonthly', question: t('cloudSurvey.q2'), options: buildPriceOptions(currencyCode, 'monthly', t) },
    { key: 'priceYearly', question: t('cloudSurvey.q3'), options: buildPriceOptions(currencyCode, 'yearly', t) },
    {
      key: 'syncMode',
      question: t('cloudSurvey.q4'),
      options: SYNC_MODE_OPTIONS.map((o) => ({
        value: o.key, icon: o.icon,
        label: t(`cloudSurvey.sync_${o.key}`),
        sublabel: t(`cloudSurvey.sync_${o.key}_sub`),
      })),
    },
  ];
}
