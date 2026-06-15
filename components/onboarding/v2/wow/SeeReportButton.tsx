import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface SeeReportButtonProps {
  label: string;
  onPress: () => void;
}

export function SeeReportButton({ label, onPress }: SeeReportButtonProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 14, borderRadius: 14,
        backgroundColor: v2.brand,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
          color: v2.inkOnDark,
        }}
      >
        {label}
      </Text>
      <Ionicons name="arrow-forward" size={16} color={v2.inkOnDark} />
    </Pressable>
  );
}
