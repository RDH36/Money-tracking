import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface PinPadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  disabled?: boolean;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export function PinPad({ onDigitPress, onDeletePress, disabled }: PinPadProps) {
  const v2 = useV2();
  return (
    <View style={{ gap: 12, paddingHorizontal: 48 }}>
      {ROWS.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
          {row.map((key) => {
            if (key === '') {
              return <View key="empty" style={{ width: 80, height: 80 }} />;
            }

            const isDel = key === 'del';

            return (
              <Pressable
                key={key}
                onPress={() => {
                  if (disabled) return;
                  if (isDel) onDeletePress();
                  else onDigitPress(key);
                }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDel ? 'transparent' : v2.pinKey,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                {isDel ? (
                  <Ionicons name="backspace-outline" size={24} color={v2.ink} />
                ) : (
                  <Text style={{ color: v2.ink, fontSize: 28, fontWeight: '300' }}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
