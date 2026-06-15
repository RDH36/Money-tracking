import type { TFunction } from 'i18next';
import { formatCurrency } from '@/lib/currency';
import {
  WANTS_OPTIONS, SYNC_MODE_OPTIONS, getPriceTiers, PRICE_NONE, PRICE_MORE,
} from '@/constants/cloudBackupSurvey';

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
    ...tiers.map((a) => ({ value: String(a), label: formatCurrency(a, currencyCode) })),
    { value: PRICE_MORE, label: t('cloudSurvey.priceMore', { amount: formatCurrency(max, currencyCode) }) },
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
