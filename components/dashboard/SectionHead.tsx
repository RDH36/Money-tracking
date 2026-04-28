import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { useV2 } from '@/constants/designTokensV2';

interface SectionHeadProps {
  overline: string;
  title: string;
  action?: ReactNode;
  dark?: boolean;
}

export function SectionHead({ overline, title, action, dark = false }: SectionHeadProps) {
  const v2 = useV2();
  const overlineColor = dark ? v2.inkOnDarkM : v2.inkSubtle;
  const titleColor = dark ? v2.inkOnDark : v2.ink;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: overlineColor,
            marginBottom: 4,
          }}
        >
          {overline}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontDisplay,
            fontWeight: '700',
            fontSize: 22,
            lineHeight: 24,
            letterSpacing: -0.5,
            color: titleColor,
          }}
        >
          {title}
        </Text>
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}
