import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EaseView } from 'react-native-ease';
import { useV2 } from '@/constants/designTokensV2';

interface GiftButtonProps {
  onPress?: () => void;
}

type Sparkle = { top?: number; left?: number; right?: number; bottom?: number; size: number; phase: number };

const SPARKLES: Sparkle[] = [
  { top: -4, right: -3, size: 11, phase: 0 },
  { top: 6, left: -5, size: 8, phase: 1 },
  { bottom: -3, right: 4, size: 7, phase: 2 },
];

const SHINE = '#FBBF24';

/** Gift icon button with twinkling star sparkles, linking to the other-apps page. */
export function GiftButton({ onPress }: GiftButtonProps) {
  const v2 = useV2();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 650);
    return () => clearInterval(id);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: v2.brandTint,
        borderWidth: 1,
        borderColor: v2.brand + '33',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="gift" size={18} color={v2.brand} />
      {SPARKLES.map((s, i) => {
        const on = (tick + s.phase) % 2 === 0;
        return (
          <EaseView
            key={i}
            animate={{ opacity: on ? 1 : 0.15, scale: on ? 1 : 0.4 }}
            transition={{ type: 'timing', duration: 450, easing: 'easeOut' }}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              right: s.right,
              bottom: s.bottom,
            }}
          >
            <Ionicons name="sparkles" size={s.size} color={SHINE} />
          </EaseView>
        );
      })}
    </Pressable>
  );
}
