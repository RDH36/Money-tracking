import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';

const STATE_KEY = 'cloud_backup_survey_state';
const ANSWERS_KEY = 'cloud_backup_survey_answers';

export type SavedAnswers = Record<string, string>;

/**
 * Suit l'état du sondage "sauvegarde cloud" (non vu / répondu / masqué) et
 * mémorise les dernières réponses pour pouvoir les modifier depuis les réglages.
 * Persisté dans la table settings → reste entre les lancements.
 */
export function useCloudBackupSurvey() {
  const db = useSQLiteContext();
  const [resolved, setResolved] = useState(true); // caché tant qu'on ne sait pas
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswers | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rows = await db.getAllAsync<{ key: string; value: string }>(
          'SELECT key, value FROM settings WHERE key IN (?, ?)',
          [STATE_KEY, ANSWERS_KEY]
        );
        const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        setResolved(!!map[STATE_KEY]);
        if (map[ANSWERS_KEY]) {
          try { setSavedAnswers(JSON.parse(map[ANSWERS_KEY])); } catch { /* ignore */ }
        }
      } catch {
        setResolved(true);
      }
    })();
  }, [db]);

  const writeSetting = useCallback(
    async (key: string, value: string) => {
      const now = new Date().toISOString();
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
        [key, value, now]
      );
    },
    [db]
  );

  const markAnswered = useCallback(
    async (answers: SavedAnswers) => {
      setResolved(true);
      setSavedAnswers(answers);
      try {
        await writeSetting(STATE_KEY, 'answered');
        await writeSetting(ANSWERS_KEY, JSON.stringify(answers));
      } catch (err) {
        console.error('Error saving cloud backup survey answers:', err);
      }
    },
    [writeSetting]
  );

  const dismiss = useCallback(async () => {
    setResolved(true);
    try {
      await writeSetting(STATE_KEY, 'dismissed');
    } catch (err) {
      console.error('Error dismissing cloud backup survey:', err);
    }
  }, [writeSetting]);

  return { shouldShow: !resolved, savedAnswers, markAnswered, dismiss };
}
