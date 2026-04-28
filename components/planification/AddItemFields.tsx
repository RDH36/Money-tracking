import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

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

interface CategoryChipProps {
  category: Category;
  active: boolean;
  onPress: () => void;
}

export function CategoryChip({ category, active, onPress }: CategoryChipProps) {
  const v2 = useV2();
  const color = category.color ?? v2.brand;
  const iconName: IoniconName = (category.icon as IoniconName) ?? 'pricetag-outline';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexBasis: '23.5%',
        paddingVertical: 10, paddingHorizontal: 6,
        alignItems: 'center', gap: 4,
        backgroundColor: active ? alpha15(color) : v2.bgRaised,
        borderWidth: active ? 1.5 : 1,
        borderColor: active ? color : 'transparent',
        borderRadius: 12,
      }}
    >
      <View
        style={{
          width: 26, height: 26, borderRadius: 8,
          backgroundColor: alpha15(color),
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={13} color={color} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
          color: active ? color : v2.ink, maxWidth: '100%',
        }}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}
