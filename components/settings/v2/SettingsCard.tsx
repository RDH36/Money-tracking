import { View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';

interface SettingsCardProps {
  children: ReactNode;
  style?: ViewStyle;
  danger?: boolean;
}

export function SettingsCard({ children, style, danger = false }: SettingsCardProps) {
  const v2 = useV2();
  return (
    <View
      style={[
        {
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: danger ? v2.bad + '40' : v2.hairline,
          borderRadius: 14,
          overflow: 'hidden',
        },
        style as any,
      ]}
    >
      {children}
    </View>
  );
}
