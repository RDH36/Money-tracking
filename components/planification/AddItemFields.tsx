import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface TypePillProps {
  active: boolean;
  icon: 'arrow-down' | 'arrow-up';
  label: string;
  tone: 'bad' | 'good';
  onPress: () => void;
}

export function TypePill({ active, icon, label, tone, onPress }: TypePillProps) {
  const v2 = useV2();
  const accent = tone === 'bad' ? v2.bad : v2.good;
  const accentSoft = tone === 'bad' ? v2.badSoft : v2.goodSoft;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? accentSoft : v2.bgRaised,
        borderRadius: 12,
        paddingVertical: 12, paddingHorizontal: 12,
        borderWidth: 1, borderColor: active ? accent + '4D' : 'transparent',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <Ionicons name={icon} size={14} color={active ? accent : v2.inkSubtle} />
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700',
          color: active ? accent : v2.inkSubtle, letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

