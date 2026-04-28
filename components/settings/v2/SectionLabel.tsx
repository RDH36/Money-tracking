import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';

interface SectionLabelProps {
  children: string;
  action?: ReactNode;
}

export function SectionLabel({ children, action }: SectionLabelProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingBottom: 8,
        marginTop: 14,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
          letterSpacing: 1.6, textTransform: 'uppercase',
          color: v2.inkSubtle,
        }}
      >
        {children}
      </Text>
      {action ? <View>{action}</View> : null}
    </View>
  );
}
