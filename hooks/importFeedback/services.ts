import * as Notifications from 'expo-notifications';
import i18n from '@/lib/i18n';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/app';
import { checkInternetConnection } from '@/lib/network';
import {
  FEEDBACK_KEYS, readFeedbackState, sendPendingSurvey, writeFeedbackSetting,
  type SendResult, type SettingsDb, type SurveyTransport,
} from '@/lib/importFeedback';
import { syncImportBetaReminder, type ReminderApi } from '@/lib/importFeedback/reminder';
import { useImportFeedbackStore } from './store';

const transport: SurveyTransport = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  isOnline: checkInternetConnection,
};

const reminderApi: ReminderApi = {
  isGranted: async () => (await Notifications.getPermissionsAsync()).status === 'granted',
  listScheduledIds: async () =>
    (await Notifications.getAllScheduledNotificationsAsync()).map((r) => r.identifier),
  cancel: (id) => Notifications.cancelScheduledNotificationAsync(id),
  scheduleAt: async (id, date, type) => {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: i18n.t('betaTester.reminder.title'),
        body: i18n.t('betaTester.reminder.body'),
        data: { type },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  },
};

/** Relit l'état en base et met le store à jour. */
export async function hydrateImportFeedback(db: SettingsDb) {
  const state = await readFeedbackState(db);
  useImportFeedbackStore.getState().set({
    loaded: true, rewardedAt: state.rewardedAt, laterAt: state.laterAt, firstReadAt: state.firstReadAt,
  });
  return state;
}

/** Programme ou annule le rappel J+2 selon l'état en base et le réglage de rappels. */
export async function syncBetaReminder(db: SettingsDb, frequency: string | null | undefined): Promise<void> {
  try {
    const state = await readFeedbackState(db);
    await syncImportBetaReminder(reminderApi, {
      firstReadAt: state.firstReadAt, answered: !!state.rewardedAt, frequency, now: new Date(),
    });
  } catch (err) {
    console.error('Syncing beta reminder failed:', err);
  }
}

/** Note la date de la première lecture d'import (une seule fois). */
export async function markFirstRead(db: SettingsDb): Promise<void> {
  const state = await readFeedbackState(db);
  if (state.firstReadAt) return;
  const now = new Date().toISOString();
  await writeFeedbackSetting(db, FEEDBACK_KEYS.firstReadAt, now);
  useImportFeedbackStore.getState().set({ firstReadAt: now });
}

/** Envoie l'avis en attente (lancement de l'app, ou juste après la validation). */
export function flushPendingSurvey(db: SettingsDb): Promise<SendResult> {
  return sendPendingSurvey(db, transport);
}
