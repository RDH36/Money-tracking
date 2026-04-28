import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface CategoryDetailHeaderProps {
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  onBack: () => void;
  onEdit: () => void;
}

function alpha15(hex: string | null): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

export function CategoryDetailHeader({
  categoryName,
  categoryIcon,
  categoryColor,
  onBack,
  onEdit,
}: CategoryDetailHeaderProps) {
  const v2 = useV2();
  const color = categoryColor ?? v2.brand;
  const iconName: IoniconName = (categoryIcon as IoniconName) ?? 'pricetag-outline';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Pressable
        onPress={onBack}
        hitSlop={6}
        style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: v2.bgSurface,
          borderWidth: 1, borderColor: v2.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={18} color={v2.ink} />
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginHorizontal: 12, justifyContent: 'center' }}>
        <View
          style={{
            width: 30, height: 30, borderRadius: 9,
            backgroundColor: alpha15(categoryColor),
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={16} color={color} />
        </View>
        <Text
          numberOfLines={1}
          style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 22, color: v2.ink, letterSpacing: -0.5, flexShrink: 1 }}
        >
          {categoryName}
        </Text>
      </View>

      <Pressable
        onPress={onEdit}
        hitSlop={6}
        style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: v2.bgSurface,
          borderWidth: 1, borderColor: v2.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="create-outline" size={18} color={v2.ink} />
      </Pressable>
    </View>
  );
}
