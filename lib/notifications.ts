import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type ReminderFrequency = 'off' | '1h' | '2h' | '4h';

// Notification identifiers
const EXPENSE_REMINDER_ID = 'expense-reminder';
const STREAK_REMINDER_ID = 'gamif-streak';
const CHALLENGE_REMINDER_ID = 'gamif-challenge';
const WEEKLY_SUMMARY_ID = 'gamif-weekly';

const REMINDER_MESSAGES = [
  { title: "N'oublie pas !", body: 'As-tu des dépenses à enregistrer ?' },
  { title: 'Petit rappel', body: 'Pense à noter tes dépenses récentes' },
  { title: '💰 Mitsitsy', body: "As-tu dépensé quelque chose aujourd'hui ?" },
  { title: 'Check rapide', body: 'Tes dépenses sont-elles à jour ?' },
];

function getRandomMessage() {
  return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Rappels',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14B8A6',
    });
    await Notifications.setNotificationChannelAsync('gamification', {
      name: 'Gamification',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function getIntervalHours(frequency: ReminderFrequency): number {
  switch (frequency) {
    case '1h':
      return 1;
    case '2h':
      return 2;
    case '4h':
      return 4;
    default:
      return 0;
  }
}

export async function scheduleReminders(frequency: ReminderFrequency): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(EXPENSE_REMINDER_ID); } catch {}

  if (frequency === 'off') return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const intervalHours = getIntervalHours(frequency);
  const message = getRandomMessage();

  await Notifications.scheduleNotificationAsync({
    identifier: EXPENSE_REMINDER_ID,
    content: {
      title: message.title,
      body: message.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: intervalHours * 60 * 60,
      repeats: true,
    },
  });
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

export async function schedulePlanificationDeadlineReminders(
  planificationId: string,
  title: string,
  deadline: Date
): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(9, 0, 0, 0);

  const oneDayBefore = new Date(deadlineDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);

  if (oneDayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Rappel planification',
        body: `"${title}" arrive à échéance demain !`,
        data: { planificationId, type: 'planification_reminder' },
      },
      identifier: `planif-reminder-${planificationId}`,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDayBefore,
      },
    });
  }

  if (deadlineDate > now) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Échéance aujourd\'hui',
        body: `"${title}" arrive à échéance aujourd'hui !`,
        data: { planificationId, type: 'planification_deadline' },
      },
      identifier: `planif-deadline-${planificationId}`,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: deadlineDate,
      },
    });
  }
}

export async function cancelPlanificationReminders(planificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`planif-reminder-${planificationId}`);
  await Notifications.cancelScheduledNotificationAsync(`planif-deadline-${planificationId}`);
  await Notifications.cancelScheduledNotificationAsync(`planif-expired-${planificationId}`);
}

export async function sendExpiredPlanificationNotification(
  planificationId: string,
  title: string
): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Planification expirée',
      body: `"${title}" a dépassé sa date butoir !`,
      data: { planificationId, type: 'planification_expired' },
    },
    identifier: `planif-expired-${planificationId}`,
    trigger: null,
  });
}

// --- Gamification notifications ---

export async function scheduleStreakReminder(title: string, body: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID); } catch {}
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const target = new Date();
  target.setHours(19, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_REMINDER_ID,
    content: { title, body, data: { type: 'streak_reminder' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
}

export async function cancelStreakReminder(): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(STREAK_REMINDER_ID); } catch {}
}

export async function scheduleDailyChallengeReminder(title: string, body: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(CHALLENGE_REMINDER_ID); } catch {}
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const target = new Date();
  target.setHours(18, 0, 0, 0);
  if (target <= now) return;

  await Notifications.scheduleNotificationAsync({
    identifier: CHALLENGE_REMINDER_ID,
    content: { title, body, data: { type: 'challenge_reminder' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
}

export async function cancelDailyChallengeReminder(): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(CHALLENGE_REMINDER_ID); } catch {}
}

export async function scheduleWeeklySummary(title: string, body: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID); } catch {}
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const nextSunday = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(10, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_SUMMARY_ID,
    content: { title, body, data: { type: 'weekly_summary' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextSunday },
  });
}

export async function cancelWeeklySummary(): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID); } catch {}
}
