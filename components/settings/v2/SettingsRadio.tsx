import { View } from 'react-native';
import { useV2 } from '@/constants/designTokensV2';

interface SettingsRadioProps {
  value: boolean;
}

export function SettingsRadio({ value }: SettingsRadioProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 1.5,
        borderColor: value ? v2.brand : v2.hairlineStrong,
        backgroundColor: value ? v2.brand : 'transparent',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {value ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
      ) : null}
    </View>
  );
}
