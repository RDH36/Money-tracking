import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from '@/lib/database';
import { canAutoPrompt, PROMPTED_AT_KEY } from '@/lib/appUpdate/policy';
import { useAppUpdateStore } from '@/stores/appUpdateStore';

/** Délai après l'arrivée sur l'accueil : les feuilles d'accueil (habitude…) s'ouvrent d'abord. */
const SETTLE_MS = 4000;

/**
 * Vérification automatique depuis l'accueil : au plus 1 fenêtre / 24 h, jamais
 * pendant l'onboarding ni par-dessus une feuille ouverte (`blocked`).
 */
export function useAutoUpdateCheck(blocked: boolean) {
  const db = useSQLiteContext();
  const blockedRef = useRef(blocked);
  useEffect(() => {
    blockedRef.current = blocked;
  }, [blocked]);
  const done = useRef(false);

  useFocusEffect(useCallback(() => {
    if (done.current) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rows = await db.getAllAsync<{ key: string; value: string }>(
          'SELECT key, value FROM settings WHERE key IN (?, ?)', ['onboarding_completed', PROMPTED_AT_KEY],
        );
        const get = (k: string) => rows.find((r) => r.key === k)?.value;
        const last = get(PROMPTED_AT_KEY);
        const ok = canAutoPrompt({
          now: Date.now(),
          lastPromptAt: last ? Number(last) : null,
          onboardingCompleted: get('onboarding_completed') === 'true',
          blocked: blockedRef.current,
        });
        if (cancelled || !ok) return;
        done.current = true;
        const phase = await useAppUpdateStore.getState().check('auto');
        if (phase === 'available') {
          await db.runAsync('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
            [PROMPTED_AT_KEY, String(Date.now()), new Date().toISOString()],);
        }
      } catch (err) {
        console.warn('Auto update check failed:', err);
      }
    }, SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [db]));
}
