import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';

interface MonthSelectorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  prevDisabled?: boolean;
}

export function MonthSelector({
  label,
  onPrev,
  onNext,
  nextDisabled = false,
  prevDisabled = false,
}: MonthSelectorProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: v2.bgSurface,
        borderWidth: 1,
        borderColor: v2.hairline,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
      }}
    >
      <Pressable
        onPress={onPrev}
        disabled={prevDisabled}
        hitSlop={8}
        style={{ opacity: prevDisabled ? 0.3 : 1 }}
      >
        <Ionicons name="chevron-back" size={16} color={v2.inkMuted} />
      </Pressable>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: v2.fontDisplay,
          fontWeight: '700',
          fontSize: 18,
          color: v2.ink,
          letterSpacing: -0.4,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={onNext}
        disabled={nextDisabled}
        hitSlop={8}
        style={{ opacity: nextDisabled ? 0.3 : 1 }}
      >
        <Ionicons name="chevron-forward" size={16} color={v2.inkSubtle} />
      </Pressable>
    </View>
  );
}
