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
