import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { create } from 'zustand';
import { useSQLiteContext } from '@/lib/database';

/** Intro terminée (« Continuer » puis réponse à l'étape paye). */
const SEEN_KEY = 'ton_mois_intro_seen_at';
/** Intro auto-affichée une fois, même si l'utilisateur a choisi « Plus tard ». */
const SHOWN_KEY = 'ton_mois_intro_shown_at';

interface IntroState {
  loading: boolean;
  seen: boolean;
  shownOnce: boolean;
  hydrate: (seen: boolean, shownOnce: boolean) => void;
  setSeen: () => void;
  setShown: () => void;
}

/**
 * Store partagé : le tableau de bord et l'écran d'intro lisent le même état,
 * sinon « seen » resterait périmé sur le dashboard après le retour de l'intro.
 */
const useIntroStore = create<IntroState>((set) => ({
  loading: true,
  seen: false,
  shownOnce: false,
  hydrate: (seen, shownOnce) => set({ loading: false, seen, shownOnce }),
  setSeen: () => set({ seen: true, shownOnce: true }),
  setShown: () => set({ shownOnce: true }),
}));

export interface UseIntroMoisResult {
  /** Vrai tant que les deux clés n'ont pas été lues. */
  loading: boolean;
  /** L'intro a été parcourue jusqu'au bout. */
  seen: boolean;
  /** L'intro s'est déjà ouverte toute seule (on ne la force plus). */
  shownOnce: boolean;
  markShown: () => Promise<void>;
  markSeen: () => Promise<void>;
}

/**
 * État de l'introduction « Ton mois » (Phase 8). Deux horodatages dans
 * `settings` : lecture au montage, écriture par upsert simple — pas de
 * `withTransactionAsync`, il échoue sur la connexion principale partagée.
 */
export function useIntroMois(): UseIntroMoisResult {
  const db = useSQLiteContext();
  const { loading, seen, shownOnce, hydrate, setSeen, setShown } = useIntroStore();

  useEffect(() => {
    if (!loading) return;
    let alive = true;
    (async () => {
      try {
        const rows = await db.getAllAsync<{ key: string; value: string }>(
          'SELECT key, value FROM settings WHERE key IN (?, ?)',
          [SEEN_KEY, SHOWN_KEY]
        );
        if (!alive) return;
        hydrate(
          rows.some((r) => r.key === SEEN_KEY && !!r.value),
          rows.some((r) => r.key === SHOWN_KEY && !!r.value)
        );
      } catch (err) {
        console.error('Error reading intro state:', err);
        if (alive) hydrate(false, false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, loading, hydrate]);

  const write = useCallback(
    async (key: string) => {
      const now = new Date().toISOString();
      try {
        await db.runAsync(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
          [key, now, now]
        );
      } catch (err) {
        console.error('Error writing intro state:', err);
      }
    },
    [db]
  );

  const markShown = useCallback(async () => {
    setShown();
    await write(SHOWN_KEY);
  }, [setShown, write]);

  const markSeen = useCallback(async () => {
    setSeen();
    await write(SEEN_KEY);
  }, [setSeen, write]);

  return { loading, seen, shownOnce, markShown, markSeen };
}

/**
 * Ouvre l'intro toute seule UNE fois : dès que la carte d'entrée est visible
 * (données suffisantes), tant que l'intro n'a été ni parcourue ni déjà
 * affichée (« Plus tard » compte). Garde-fou par session via `useRef`.
 * Le tableau de bord n'est monté qu'après l'onboarding, et un compte neuf
 * n'a pas assez de données : aucune collision avec le premier parcours.
 */
export function useIntroMoisAutoOpen(entryVisible: boolean): UseIntroMoisResult {
  const intro = useIntroMois();
  const router = useRouter();
  const pushed = useRef(false);
  const { loading, seen, shownOnce, markShown } = intro;

  useEffect(() => {
    if (pushed.current || loading || seen || shownOnce || !entryVisible) return;
    pushed.current = true;
    markShown();
    router.push('/intro-mois' as any);
  }, [loading, seen, shownOnce, markShown, entryVisible, router]);

  return intro;
}
