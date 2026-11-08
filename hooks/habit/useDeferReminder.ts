import { useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { requestNotificationPermissions } from '@/lib/notifications';
import { deferSlot, lateEveningDate, EVENING_HOUR, type DeferSlot } from '@/lib/habit/deferSlot';
import {
  scheduleEveningDailyReminder,
  scheduleEveningOnceReminder,
} from '@/lib/habit/eveningReminder';
import { useSettingsStore } from '@/stores/settingsStore';

export interface DeferResult {
  slot: DeferSlot;
  granted: boolean;
}

function slotDate(slot: DeferSlot, now: Date): Date {
  if (slot === 'tonight_21') return lateEveningDate(now);
  const d = new Date(now);
  if (slot === 'tomorrow_19') d.setDate(d.getDate() + 1);
  d.setHours(EVENING_HOUR, 0, 0, 0);
  return d;
}

/**
 * « Rappelle-moi ce soir » (1re dépense) : permission, rappel du soir
 * quotidien garanti, rappel unique à 21 h entre 19 h et 21 h.
 */
export function useDeferReminder() {
  const posthog = usePostHog();
  const [result, setResult] = useState<DeferResult | null>(null);
  const [busy, setBusy] = useState(false);

  const defer = async () => {
    if (busy) return;
    setBusy(true);
    const now = new Date();
    const slot = deferSlot(now);
    let granted = false;
    try {
      granted = await requestNotificationPermissions();
      if (granted) {
        if (useSettingsStore.getState().reminderFrequency === 'evening') {
          await scheduleEveningDailyReminder();
          if (slot === 'tonight_21') await scheduleEveningOnceReminder(lateEveningDate(now));
        } else {
          // Mode de rappel choisi autrement (rare) : un rappel unique suffit.
          await scheduleEveningOnceReminder(slotDate(slot, now));
        }
      }
    } catch (err) {
      console.warn('Scheduling the evening reminder failed:', err);
    }
    posthog.capture('first_expense_deferred', { slot, permission: granted ? 'granted' : 'denied' });
    setResult({ slot, granted });
    setBusy(false);
  };

  return { defer, busy, result, clear: () => setResult(null) };
}
