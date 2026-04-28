import { View, Text } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface AddTransactionHeaderProps {
  title: string;
}

export function AddTransactionHeader({ title }: AddTransactionHeaderProps) {
  const v2 = useV2();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: v2.fontDisplay,
          fontWeight: '700',
          fontSize: 22,
          color: v2.ink,
          letterSpacing: -0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
