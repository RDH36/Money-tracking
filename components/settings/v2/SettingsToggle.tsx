import { View, Pressable } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface SettingsToggleProps {
  value: boolean;
  onChange?: (next: boolean) => void;
}

export function SettingsToggle({ value, onChange }: SettingsToggleProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      hitSlop={6}
      style={{
        width: 40, height: 24, borderRadius: 12,
        backgroundColor: value ? v2.brand : 'rgba(15,19,17,0.20)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <View
        style={{
          position: 'absolute', top: 2, left: value ? 18 : 2,
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
