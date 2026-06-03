import { View } from 'react-native';
import { EaseView } from 'react-native-ease';
import { useV2 } from '@/constants/designTokensV2';

interface PinDotsProps {
  length: number;
  filled: number;
  shaking: boolean;
}

/** Animated PIN dots with a shake on error (design ported from chat-private). */
export function PinDots({ length, filled, shaking }: PinDotsProps) {
  const v2 = useV2();
  return (
    <EaseView
      animate={{ translateX: shaking ? 10 : 0 }}
      transition={{ type: 'spring', damping: 4, stiffness: 400, mass: 0.5 }}
    >
      <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginVertical: 28 }}>
        {Array.from({ length }).map((_, i) => (
          <EaseView
            key={i}
            animate={{ scale: i < filled ? 1 : 0.6, opacity: i < filled ? 1 : 0.3 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300, mass: 0.8 }}
          >
            <View
              style={
                i < filled
                  ? { width: 16, height: 16, borderRadius: 8, backgroundColor: v2.ink }
                  : { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: v2.inkSubtle }
              }
            />
          </EaseView>
        ))}
      </View>
    </EaseView>
  );
}
