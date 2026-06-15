import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';

const STATE_KEY = 'cloud_backup_survey_state';

/**
 * Suit l'état du sondage "sauvegarde cloud" (non vu / répondu / masqué).
 * Persisté dans la table settings pour rester caché entre les lancements.
 * La bannière du dashboard ne s'affiche que tant que l'état est vide.
 */
export function useCloudBackupSurvey() {
  const db = useSQLiteContext();
  const [resolved, setResolved] = useState(true); // caché tant qu'on ne sait pas

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM settings WHERE key = ?',
          [STATE_KEY]
        );
        setResolved(!!row?.value);
      } catch {
        setResolved(true);
      }
    })();
  }, [db]);

  const persist = useCallback(
    async (value: 'answered' | 'dismissed') => {
      setResolved(true);
      try {
        const now = new Date().toISOString();
        await db.runAsync(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
          [STATE_KEY, value, now]
        );
      } catch (err) {
        console.error('Error persisting cloud backup survey state:', err);
      }
    },
    [db]
  );

  const markAnswered = useCallback(() => persist('answered'), [persist]);
  const dismiss = useCallback(() => persist('dismissed'), [persist]);

  return { shouldShow: !resolved, markAnswered, dismiss };
}
