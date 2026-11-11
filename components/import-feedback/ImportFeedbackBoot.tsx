import { useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useReminderFrequency } from '@/stores/settingsStore';
import { flushPendingSurvey, syncBetaReminder } from '@/hooks/importFeedback/services';

/**
 * Sans rendu, monté une fois au lancement : envoie l'avis resté en attente
 * (réponse donnée hors ligne) et réaligne le rappel J+2 sur le réglage de
 * rappels (coupé → annulé, réactivé avant l'échéance → reprogrammé).
 */
export function ImportFeedbackBoot() {
  const db = useSQLiteContext();
  const frequency = useReminderFrequency();

  useEffect(() => {
    flushPendingSurvey(db).catch(() => {});
  }, [db]);

  useEffect(() => {
    syncBetaReminder(db, frequency);
  }, [db, frequency]);

  return null;
}
