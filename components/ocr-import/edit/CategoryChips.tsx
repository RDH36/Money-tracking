import { Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { getCategoryDisplayName } from '@/constants/categories';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface CategoryChipsProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Choix de catégorie en une ligne défilante (toucher à nouveau = aucune). */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {categories.map((cat) => {
        const active = cat.id === selectedId;
        const color = cat.color ?? v2.brand;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(active ? null : cat.id)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
              backgroundColor: active ? v2.brandTint : v2.bgSurface,
              borderWidth: active ? 1.5 : 1, borderColor: active ? color : v2.hairline,
            }}
          >
            <Ionicons name={(cat.icon as IoniconName) ?? 'pricetag-outline'} size={14} color={color} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: active ? v2.ink : v2.inkMuted }}>
              {getCategoryDisplayName(cat.id, cat.name, t)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
