import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { usePostHog } from 'posthog-react-native';
import { EVENING_REMINDER_TYPE } from '@/lib/habit/eveningReminder';

/** Taps déjà traités (le même peut arriver par l'écouteur ET au démarrage). */
const handled = new Set<string>();

/**
 * Tap sur le rappel du soir → onglet Ajouter avec le bandeau du jour.
 * Monté dans les onglets (onboarding fini, appli déverrouillée), démarrage à
 * froid compris. Les autres notifications : rien ne change (aucun effet).
 */
export function EveningReminderTapListener() {
  const posthog = usePostHog();

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const { request, date } = response.notification;
      const data = request.content?.data as { type?: string } | null | undefined;
      if (data?.type !== EVENING_REMINDER_TYPE) return;
      const id = `${request.identifier}:${date}`;
      if (handled.has(id)) return;
      handled.add(id);
      try { Notifications.clearLastNotificationResponse(); } catch {}
      posthog.capture('reminder_evening_opened');
      router.push({ pathname: '/(tabs)/add', params: { source: 'reminder_evening', t: String(Date.now()) } });
    };
    handle(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [posthog]);

  return null;
}
