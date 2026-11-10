/**
 * Mises à jour dans l'app (Google Play In-App Updates, mode FLEXIBLE seul) :
 * logique pure, testée. Aucun texte ici (i18n), aucune URL, aucun achat.
 */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
/** Clé `settings` : dernière ouverture automatique de la fenêtre (ms epoch). */
export const PROMPTED_AT_KEY = 'app_update_prompted_at';

export interface UpdateInfo {
  available: boolean;
  versionCode: number;
  stalenessDays: number | null;
  flexibleAllowed: boolean;
  downloaded: boolean;
}

export type UpdatePhase =
  | 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'latest' | 'unavailable';

export type UpdateEvent =
  | { type: 'check' }
  | { type: 'checked'; info: UpdateInfo }
  | { type: 'error' }
  | { type: 'accepted' }
  | { type: 'declined' }
  | { type: 'progress' }
  | { type: 'downloaded' }
  | { type: 'failed' };

/** Machine d'états de la mise à jour flexible. */
export function updateReducer(phase: UpdatePhase, event: UpdateEvent): UpdatePhase {
  switch (event.type) {
    case 'check':
      // Un téléchargement en cours ou fini n'est pas perdu par une nouvelle vérification.
      return phase === 'downloading' || phase === 'downloaded' ? phase : 'checking';
    case 'checked': {
      const { info } = event;
      if (info.downloaded) return 'downloaded';
      if (phase === 'downloading') return phase;
      if (!info.available) return 'latest';
      return info.flexibleAllowed ? 'available' : 'unavailable';
    }
    case 'error':
      return phase === 'downloading' || phase === 'downloaded' ? phase : 'unavailable';
    case 'accepted':
    case 'progress':
      return phase === 'downloaded' ? phase : 'downloading';
    case 'declined':
      return phase === 'available' || phase === 'downloading' ? 'idle' : phase;
    case 'downloaded':
      return 'downloaded';
    case 'failed':
      return 'idle';
  }
}

export interface AutoPromptInput {
  now: number;
  /** Dernière ouverture automatique (ms), null si jamais. */
  lastPromptAt: number | null;
  onboardingCompleted: boolean;
  /** Une autre feuille / fenêtre est ouverte, ou l'accueil n'est pas affiché. */
  blocked: boolean;
}

/** Vérification automatique : au plus 1 fois / 24 h, jamais pendant l'onboarding ni par-dessus une feuille. */
export function canAutoPrompt({ now, lastPromptAt, onboardingCompleted, blocked }: AutoPromptInput): boolean {
  if (!onboardingCompleted || blocked) return false;
  if (lastPromptAt === null || !Number.isFinite(lastPromptAt)) return true;
  // Horloge reculée (date changée à la main) : on ne bloque pas indéfiniment.
  if (lastPromptAt > now) return true;
  return now - lastPromptAt >= ONE_DAY_MS;
}

/** Résultat d'une vérification manuelle (ligne Réglages), pour PostHog et l'affichage. */
export function manualResult(phase: UpdatePhase): 'latest' | 'available' | 'downloading' | 'downloaded' | 'unavailable' {
  if (phase === 'latest' || phase === 'available' || phase === 'downloading' || phase === 'downloaded') return phase;
  return 'unavailable';
}

/** Choix du module : le faux module (simulation) n'existe qu'en développement. */
export function selectUpdateModule<T>(native: T | null, isDev: boolean, fakeMode: string | undefined, makeFake: (mode: 'available' | 'latest') => T): T | null {
  if (isDev && (fakeMode === 'available' || fakeMode === 'latest')) return makeFake(fakeMode);
  return native;
}

/** Pastille au-dessus des onglets : téléchargement en cours, ou « prête » après « Plus tard ». */
export function pillState(phase: UpdatePhase, readyDismissed: boolean, promptOpen: boolean): 'downloading' | 'ready' | null {
  if (promptOpen) return null;
  if (phase === 'downloading') return 'downloading';
  if (phase === 'downloaded' && readyDismissed) return 'ready';
  return null;
}
