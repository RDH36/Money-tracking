import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n, { LANGUAGES } from './i18n';

export type ReminderFrequency = 'off' | '1h' | '2h' | '4h';

// Notification identifiers
const EXPENSE_REMINDER_ID = 'expense-reminder';
const STREAK_REMINDER_ID = 'gamif-streak';
const CHALLENGE_REMINDER_ID = 'gamif-challenge';
const WEEKLY_SUMMARY_ID = 'gamif-weekly';
const QUEST_PROGRESS_ID = 'gamif-quest-progress';

const REMINDER_KEYS = ['reminder1', 'reminder2', 'reminder3', 'reminder4'] as const;

const EXPENSE_REMINDER_DATA_TYPE = 'expense_reminder';

// Collected across all supported languages so a language switch can still cancel
// stale reminders that were scheduled under a previous locale.
function getAllReminderTitles(): Set<string> {
  const titles = new Set<string>();
  for (const lang of LANGUAGES) {
    for (const key of REMINDER_KEYS) {
      const value = i18n.t(`notifications.${key}Title`, { lng: lang.code });
      if (typeof value === 'string') titles.add(value);
    }
  }
  return titles;
}

function getRandomMessage() {
  const key = REMINDER_KEYS[Math.floor(Math.random() * REMINDER_KEYS.length)];
  return {
    title: i18n.t(`notifications.${key}Title`),
    body: i18n.t(`notifications.${key}Body`),
  };
}

/**
 * Cancels every currently scheduled expense reminder. We cannot rely solely on
 * `cancelScheduledNotificationAsync(EXPENSE_REMINDER_ID)` because on Android,
 * expo-notifications does not always honor a custom `identifier` for repeating
 * `TIME_INTERVAL` triggers — it stores the notification under an auto-generated
 * UUID instead. That caused the "reminder fires twice" bug: on each reschedule
 * the old one stayed alive because the identifier-based cancel matched nothing,
 * and a fresh reminder was added alongside it. We also match on `data.type` and
 * on the known reminder titles to clean up stale entries from previous sessions.
 */
async function cancelExistingExpenseReminders(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const allTitles = getAllReminderTitles();
    for (const req of scheduled) {
      const data = req.content?.data as { type?: string } | null | undefined;
      const title = req.content?.title;
      const matches =
        req.identifier === EXPENSE_REMINDER_ID ||
        data?.type === EXPENSE_REMINDER_DATA_TYPE ||
        (typeof title === 'string' && allTitles.has(title));
      if (matches) {
        try {
          await Notifications.cancelScheduledNotificationAsync(req.identifier);
        } catch {}
      }
    }
  } catch {}
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
  // Always cancel any existing expense reminder (identifier-based cancel alone
  // is unreliable on Android for TIME_INTERVAL triggers — see helper comment).
  await cancelExistingExpenseReminders();

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
      data: { type: EXPENSE_REMINDER_DATA_TYPE },
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
        title: `📅 ${i18n.t('notifications.planReminderTitle')}`,
        body: `"${title}" ${i18n.t('notifications.planTomorrow')}`,
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
        title: `⏰ ${i18n.t('notifications.deadlineToday')}`,
        body: `"${title}" ${i18n.t('notifications.planToday')}`,
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
      title: `🚨 ${i18n.t('notifications.planExpiredTitle')}`,
      body: `"${title}" ${i18n.t('notifications.planExpired')}`,
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

/**
 * Schedule a single reminder when the user is close to completing a quest step.
 * Fires the next day at 18h to encourage them to push to the next milestone.
 */
export async function scheduleQuestProgressReminder(
  title: string,
  body: string
): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(QUEST_PROGRESS_ID); } catch {}
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(18, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: QUEST_PROGRESS_ID,
    content: { title, body, data: { type: 'quest_progress' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
  });
}

export async function cancelQuestProgressReminder(): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(QUEST_PROGRESS_ID); } catch {}
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
