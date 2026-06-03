import { useCallback, useEffect, useRef, useState } from 'react';
import { View, AppState, type AppStateStatus } from 'react-native';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore } from '@/stores/settingsStore';
import { hasPin, clearPin } from '@/lib/appLock';
import { LockScreen } from './LockScreen';

/**
 * Wraps the app and shows the full-screen lock when the app lock is enabled.
 * Locks on cold start and whenever the app returns from the background.
 */
export function LockGate({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const appLockEnabled = useSettingsStore((s) => s.appLockEnabled);
  const isInitialized = useSettingsStore((s) => s.isInitialized);

  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const didColdStart = useRef(false);

  const setLockedSafe = useCallback((value: boolean) => {
    lockedRef.current = value;
    setLocked(value);
  }, []);

  // Self-heal: lock enabled but no PIN stored would trap the user with a code
  // they never set. Disable the lock instead.
  const selfHeal = useCallback(async () => {
    await clearPin();
    try {
      const now = new Date().toISOString();
      for (const key of ['app_lock_enabled', 'app_lock_biometric']) {
        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          [key, '0', now, '0', now]
        );
      }
    } catch {
      // ignore
    }
    useSettingsStore.getState().setAppLockEnabled(false);
    useSettingsStore.getState().setAppLockBiometric(false);
  }, [db]);

  // Cold start.
  useEffect(() => {
    if (!isInitialized || didColdStart.current) return;
    didColdStart.current = true;
    if (!useSettingsStore.getState().appLockEnabled) return;
    (async () => {
      if (!(await hasPin())) {
        await selfHeal();
        return;
      }
      setLockedSafe(true);
    })();
  }, [isInitialized, selfHeal, setLockedSafe]);

  // Re-lock when backgrounded.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (!useSettingsStore.getState().appLockEnabled) return;
      if (next === 'background' || next === 'inactive') {
        setLockedSafe(true);
      }
    });
    return () => sub.remove();
  }, [setLockedSafe]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked && appLockEnabled ? <LockScreen onUnlock={() => setLockedSafe(false)} /> : null}
    </View>
  );
}
