function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function localeTag(lang: string): string {
  if (lang.startsWith('fr')) return 'fr-FR';
  if (lang.startsWith('mg')) return 'mg-MG';
  return 'en-US';
}

export function formatDateLabelFr(d: Date, lang: string = 'fr'): string {
  const tag = localeTag(lang);
  const weekday = capitalize(
    new Intl.DateTimeFormat(tag, { weekday: 'long' }).format(d)
  );
  const dayMonth = new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'long',
  }).format(d);
  return `${weekday} · ${dayMonth}`;
}

export function formatMonthLabelFr(d: Date, lang: string = 'fr'): string {
  const tag = localeTag(lang);
  return capitalize(
    new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' }).format(d)
  );
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Premier budget dépassé du tableau de bord, prêt pour le hero. */
export function pickOverspend<B extends { category: { name: string }; spent: number; budgetLimit: number | null }>(
  overspent: B[]
): { name: string; overshoot: number } | undefined {
  const first = overspent[0];
  if (!first || !first.budgetLimit) return undefined;
  return { name: first.category.name, overshoot: first.spent - first.budgetLimit };
}

/** Nom affiché d'un compte : les comptes par défaut sont traduits. */
export function accountDisplayName(
  a: { is_default: number; type: string; name: string },
  t: (key: string) => string
): string {
  return a.is_default === 1 ? (a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')) : a.name;
}
