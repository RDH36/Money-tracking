import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useSQLiteContext } from '@/lib/database';
import { useSettings } from '@/hooks/useSettings';
import type { ReminderFrequency } from '@/lib/notifications';
import {
  DISTINCT_ENTRY_DAYS_SQL,
  HABIT_PROMPT_SHOWN_KEY,
  REMINDER_ORIGIN_KEY,
  isHabitPromptEligible,
} from '@/lib/habit/habitPrompt';

/** Laisse passer les modales de l'accueil (niveau, déblocage) d'abord. */
const CHECK_DELAY_MS = 1500;

/**
 * Proposition unique « 3 jours de saisie » sur l'accueil. Vérifiée à chaque
 * focus ; jamais ouverte quand une autre modale de l'accueil est affichée.
 */
export function useHabitPrompt(blocked: boolean) {
  const db = useSQLiteContext();
  const posthog = usePostHog();
  const { reminderFrequency, setReminderFrequency } = useSettings();
  const [open, setOpen] = useState(false);
  const blockedRef = useRef(blocked);
  const doneRef = useRef(false);
  useEffect(() => { blockedRef.current = blocked; }, [blocked]);

  const check = useCallback(async () => {
    if (doneRef.current || blockedRef.current || reminderFrequency !== 'evening') return;
    const get = (key: string) =>
      db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
    const [origin, shown, days] = await Promise.all([
      get(REMINDER_ORIGIN_KEY),
      get(HABIT_PROMPT_SHOWN_KEY),
      db.getFirstAsync<{ n: number }>(DISTINCT_ENTRY_DAYS_SQL),
    ]);
    const eligible = isHabitPromptEligible({
      reminderFrequency,
      reminderOrigin: origin?.value,
      alreadyShown: !!shown,
      distinctDays: days?.n ?? 0,
    });
    if (!eligible || blockedRef.current || doneRef.current) return;
    doneRef.current = true;
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', [
      HABIT_PROMPT_SHOWN_KEY, new Date().toISOString(), new Date().toISOString(),
    ]);
    posthog.capture('reminder_habit_prompt_shown');
    setOpen(true);
  }, [db, posthog, reminderFrequency]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => { check().catch(() => {}); }, CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [check]));

  /** `choice` = 'evening' : on garde le soir (aussi au glisser vers le bas). */
  const submit = async (choice: ReminderFrequency) => {
    setOpen(false);
    if (choice === reminderFrequency) return;
    posthog.capture('reminder_frequency_changed', {
      from: reminderFrequency, to: choice, source: 'habit_prompt',
    });
    await setReminderFrequency(choice);
  };

  return { open, submit };
}
