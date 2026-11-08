import * as Notifications from 'expo-notifications';
import i18n from '../i18n';
import { EVENING_HOUR } from './deferSlot';

/**
 * Rappel « le soir » (mode de rappel 'evening') : une notification
 * quotidienne à 19 h. En mode 'evening', il remplace les rappels de série
 * (19 h), de défi (18 h) et de quête (18 h) : voir `isEveningMode`.
 */
export const EVENING_REMINDER_TYPE = 'evening_reminder';
const EVENING_DAILY_ID = 'evening-reminder';
const EVENING_ONCE_ID = 'evening-reminder-once';

let eveningMode = false;

/** Mis à jour par scheduleReminders (boot, changement de réglage). */
export function setEveningMode(on: boolean): void {
  eveningMode = on;
}

export function isEveningMode(): boolean {
  return eveningMode;
}

function content(once: boolean): Notifications.NotificationContentInput {
  return {
    title: i18n.t('notifications.eveningTitle'),
    body: i18n.t('notifications.eveningBody'),
    data: { type: EVENING_REMINDER_TYPE, once },
  };
}

/**
 * Annule le rappel quotidien du soir (pas le rappel unique de 21 h). Comme
 * pour les rappels de saisie, l'identifiant seul ne suffit pas sur Android
 * pour un déclencheur répété : on compare aussi data.type.
 */
export async function cancelEveningDailyReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const req of scheduled) {
      const data = req.content?.data as { type?: string; once?: boolean } | null | undefined;
      const daily = req.identifier === EVENING_DAILY_ID
        || (data?.type === EVENING_REMINDER_TYPE && data?.once !== true);
      if (daily) {
        try { await Notifications.cancelScheduledNotificationAsync(req.identifier); } catch {}
      }
    }
  } catch {}
}

/** Programme le rappel quotidien de 19 h (permission déjà accordée). */
export async function scheduleEveningDailyReminder(): Promise<void> {
  await cancelEveningDailyReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_DAILY_ID,
    content: content(false),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: EVENING_HOUR,
      minute: 0,
    },
  });
}

/** Rappel unique à `date` (créneau 21 h de « Rappelle-moi ce soir »). */
export async function scheduleEveningOnceReminder(date: Date): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(EVENING_ONCE_ID); } catch {}
  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ONCE_ID,
    content: content(true),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
