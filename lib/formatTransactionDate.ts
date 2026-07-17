/**
 * Formatage de la date/heure d'une transaction, partagé par toutes les cartes
 * de transaction de l'app (historique, dashboard, calendrier, détail catégorie…)
 * pour un affichage uniforme.
 */

/** Heure seule, ex. « 17:37 ». */
export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/** Date complète + heure, ex. « 11 juil. 2026, 17:37 ». */
export function formatTransactionDateTime(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });
    return `${date}, ${formatTime(iso)}`;
  } catch {
    return '';
  }
}
