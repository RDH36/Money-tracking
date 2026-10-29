import type { TFunction } from 'i18next';
import type { License } from '@/lib/premium';

/** `YYYY-MM-DD` → « 31 janvier 2027 » dans la langue de l'app. */
export function formatDay(ymd: string, locale: string): string {
  const d = new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** « Pass bêta jusqu'au 31 janvier 2027 » ou « Pass bêta, à vie ». */
export function licenseLine(license: License, t: TFunction, locale: string): string {
  const plan = t(`plus.plans.${license.plan}`);
  return license.expiresOn
    ? t('plus.until', { plan, date: formatDay(license.expiresOn, locale) })
    : t('plus.lifetimeLine', { plan });
}
