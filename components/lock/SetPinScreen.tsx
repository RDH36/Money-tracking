import { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useV2 } from '@/constants/designTokensV2';
import { PIN_LENGTH, MAX_PIN_ATTEMPTS } from '@/constants/appLock';
import { verifyPin } from '@/lib/appLock';
import { PinDots } from './PinDots';
import { PinPad } from './PinPad';

type Step = 'verify' | 'new' | 'confirm';

interface SetPinScreenProps {
  /** Require the current PIN before setting a new one (change flow). */
  requireOld?: boolean;
  /** Called with the confirmed new PIN. */
  onDone: (pin: string) => void;
  onCancel: () => void;
}

/** Full-screen flow to create or change the PIN. */
export function SetPinScreen({ requireOld, onDone, onCancel }: SetPinScreenProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(requireOld ? 'verify' : 'new');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const shake = (msg: string) => {
    setShaking(true);
    setError(msg);
    setPin('');
    setTimeout(() => setShaking(false), 500);
  };

  const onDigitPress = useCallback(
    (digit: string) => {
      setPin((prev) => {
        const next = prev + digit;
        if (next.length < PIN_LENGTH) return next;
        setTimeout(async () => {
          if (step === 'verify') {
            if (await verifyPin(next)) {
              setStep('new');
              setPin('');
              setError('');
            } else {
              const a = attempts + 1;
              setAttempts(a);
              if (a >= MAX_PIN_ATTEMPTS) onCancel();
              else shake(t('privacyV2.wrongPinCount', { left: MAX_PIN_ATTEMPTS - a }));
            }
          } else if (step === 'new') {
            setNewPin(next);
            setStep('confirm');
            setPin('');
            setError('');
          } else {
            if (next === newPin) onDone(next);
            else {
              shake(t('privacyV2.pinMismatch'));
              setStep('new');
              setNewPin('');
            }
          }
        }, 50);
        return next;
      });
    },
    [step, attempts, newPin, t, onDone, onCancel]
  );

  const title =
    step === 'verify'
      ? t('privacyV2.enterOldPin')
      : step === 'new'
        ? t('privacyV2.setPinEnter')
        : t('privacyV2.setPinConfirm');

  return (
    <View
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999, elevation: 9999, backgroundColor: v2.bgBase,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Pressable
        onPress={onCancel}
        hitSlop={10}
        style={{ position: 'absolute', top: insets.top + 12, left: 20 }}
      >
        <Ionicons name="arrow-back" size={24} color={v2.ink} />
      </Pressable>

      <Ionicons name="lock-closed-outline" size={32} color={v2.ink} style={{ marginBottom: 10 }} />
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 4, color: v2.ink }}>{title}</Text>
      <Text style={{ fontSize: 14, color: error ? v2.bad : v2.inkMuted }}>
        {error || t('privacyV2.pinHint')}
      </Text>

      <PinDots length={PIN_LENGTH} filled={pin.length} shaking={shaking} />

      <PinPad onDigitPress={onDigitPress} onDeletePress={() => setPin((p) => p.slice(0, -1))} />
    </View>
  );
}
