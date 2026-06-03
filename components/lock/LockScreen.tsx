import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EaseView } from 'react-native-ease';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore } from '@/stores/settingsStore';
import { useV2 } from '@/constants/designTokensV2';
import { PIN_LENGTH, RECOVERY_CODE_LENGTH, MAX_PIN_ATTEMPTS } from '@/constants/appLock';
import {
  authenticate,
  verifyPin,
  verifyRecoveryCode,
  getFailedAttempts,
  recordFailedAttempt,
  resetFailedAttempts,
  clearPin,
} from '@/lib/appLock';
import { PinDots } from './PinDots';
import { PinPad } from './PinPad';

type Mode = 'pin' | 'recovery';

interface LockScreenProps {
  onUnlock: () => void;
}

/** Full-screen lock: PIN entry, optional biometrics, developer recovery. */
export function LockScreen({ onUnlock }: LockScreenProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const db = useSQLiteContext();

  const [mode, setMode] = useState<Mode>('pin');
  const [pin, setPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const length = mode === 'recovery' ? RECOVERY_CODE_LENGTH : PIN_LENGTH;

  const finishUnlock = useCallback(async () => {
    await resetFailedAttempts();
    setUnlocked(true);
    setTimeout(onUnlock, 250);
  }, [onUnlock]);

  // On mount: enter recovery if attempts exhausted, else try biometrics.
  useEffect(() => {
    (async () => {
      if ((await getFailedAttempts()) >= MAX_PIN_ATTEMPTS) {
        setMode('recovery');
        return;
      }
      if (useSettingsStore.getState().appLockBiometric) {
        const ok = await authenticate(t('privacyV2.lockPrompt'));
        if (ok) finishUnlock();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shake = (msg: string) => {
    setShaking(true);
    setError(msg);
    setPin('');
    setTimeout(() => setShaking(false), 500);
  };

  const removeLockAndUnlock = useCallback(async () => {
    await clearPin();
    await resetFailedAttempts();
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
      // ignore — state updated below regardless
    }
    useSettingsStore.getState().setAppLockEnabled(false);
    useSettingsStore.getState().setAppLockBiometric(false);
    setUnlocked(true);
    setTimeout(onUnlock, 250);
  }, [db, onUnlock]);

  const onDigitPress = useCallback(
    (digit: string) => {
      setPin((prev) => {
        const next = prev + digit;
        if (next.length < length) return next;
        setTimeout(async () => {
          if (mode === 'recovery') {
            if (verifyRecoveryCode(next)) await removeLockAndUnlock();
            else shake(t('privacyV2.wrongRecovery'));
          } else if (await verifyPin(next)) {
            finishUnlock();
          } else {
            const count = await recordFailedAttempt();
            if (count >= MAX_PIN_ATTEMPTS) {
              setMode('recovery');
              shake(t('privacyV2.tooManyAttempts'));
            } else {
              shake(t('privacyV2.wrongPinCount', { left: MAX_PIN_ATTEMPTS - count }));
            }
          }
        }, 50);
        return next;
      });
    },
    [mode, length, t, finishUnlock, removeLockAndUnlock]
  );

  const title = mode === 'recovery' ? t('privacyV2.recoveryTitle') : t('privacyV2.lockTitle');
  const hint = mode === 'recovery' ? t('privacyV2.recoverySubtitle') : t('privacyV2.enterPin');

  return (
    <EaseView
      animate={{ opacity: unlocked ? 0 : 1 }}
      transition={{ type: 'timing', duration: 250, easing: 'easeOut' }}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999, elevation: 9999,
      }}
    >
      <View
        style={{
          flex: 1, backgroundColor: v2.bgBase,
          alignItems: 'center', justifyContent: 'center', paddingTop: 60,
        }}
      >
        <Ionicons name="lock-closed-outline" size={32} color={v2.ink} style={{ marginBottom: 10 }} />
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 4, color: v2.ink }}>{title}</Text>
        <Text style={{ fontSize: 14, color: error ? v2.bad : v2.inkMuted }}>{error || hint}</Text>

        <PinDots length={length} filled={pin.length} shaking={shaking} />

        <PinPad onDigitPress={onDigitPress} onDeletePress={() => setPin((p) => p.slice(0, -1))} />
      </View>
    </EaseView>
  );
}
