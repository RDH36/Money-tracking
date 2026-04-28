import { View, Text } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface ActivityScreenHeaderProps {
  monthLabel: string;
  title: string;
}

export function ActivityScreenHeader({ monthLabel, title }: ActivityScreenHeaderProps) {
  const v2 = useV2();
  return (
    <View>
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 4,
        }}
      >
        {monthLabel}
      </Text>
      <Text
        style={{
          fontFamily: v2.fontDisplay,
          fontWeight: '700',
          fontSize: 28,
          color: v2.ink,
          letterSpacing: -0.8,
          lineHeight: 30,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
