import { PLUS_ENABLED } from '@/constants/app';
import { usePremiumStore } from '@/stores/premiumStore';

/**
 * Lien profond entrant `moneytracking://plus/activate?l=<jeton>` : le jeton est
 * mis de côté AVANT la navigation, pour qu'il n'apparaisse jamais dans les
 * paramètres de route (envoyés à PostHog par le suivi des écrans).
 * Tous les autres liens passent inchangés.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (!PLUS_ENABLED || !/(^|\/)plus\/activate\/?(\?|#|$)/.test(path.replace(/^[a-z]+:\/\//i, '/'))) return path;
  const raw = /[?&]l=([^&#]*)/.exec(path)?.[1] ?? '';
  let token = raw;
  try {
    token = decodeURIComponent(raw);
  } catch {
    // Encodage cassé : jeton gardé tel quel (il sera refusé), jamais remis dans la route.
  }
  usePremiumStore.getState().setPendingLink(token);
  return '/plus/activate';
}
