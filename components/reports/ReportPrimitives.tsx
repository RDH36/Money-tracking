import { View, Text, Pressable } from 'react-native';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';

interface StatCardProps {
  label: string;
  value: string;
  tone: string;
  bg: string;
  numeric?: boolean;
}

export function StatCard({ label, value, tone, bg, numeric = true }: StatCardProps) {
  const v2 = useV2();
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 14,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: v2.hairline,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: v2.fontDisplay,
          fontWeight: '700',
          fontSize: 18,
          color: tone,
          letterSpacing: -0.4,
          fontVariant: numeric ? ['tabular-nums'] : undefined,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

interface LegendDotProps { color: string; label: string; }
export function LegendDot({ color, label }: LegendDotProps) {
  const v2 = useV2();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>{label}</Text>
    </View>
  );
}

interface ToggleBtnProps { active: boolean; onPress: () => void; label: string; }
export function ToggleBtn({ active, onPress, label }: ToggleBtnProps) {
  const v2 = useV2();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: active ? v2.bgInk : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 11,
          fontWeight: '600',
          color: active ? v2.inkOnDark : v2.inkSubtle,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export type { V2Tokens };
