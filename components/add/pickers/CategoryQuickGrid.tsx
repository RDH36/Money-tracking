import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface CategoryQuickGridProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMorePress: () => void;
  totalCount: number;
}

const CELL_BASIS = '23.5%';

function alpha(hex: string | null, suffix: string): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + suffix;
  return 'rgba(15,19,17,0.06)';
}

export function CategoryQuickGrid({
  categories,
  selectedId,
  onSelect,
  onMorePress,
  totalCount,
}: CategoryQuickGridProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: 18 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontFamily: v2.fontUI,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: v2.inkSubtle,
          }}
        >
          {t('add.categorySelected')}
        </Text>
        <Pressable
          onPress={onMorePress}
          hitSlop={6}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 11,
              fontWeight: '600',
              color: v2.brand,
            }}
          >
            {t('add.viewAllCount', { count: totalCount })}
          </Text>
          <Ionicons name="chevron-forward" size={11} color={v2.brand} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {categories.map((cat) => {
          const active = cat.id === selectedId;
          const color = cat.color ?? v2.brand;
          const iconName: IoniconName = (cat.icon as IoniconName) ?? 'pricetag-outline';
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              style={{
                flexBasis: CELL_BASIS,
                paddingVertical: 10,
                paddingHorizontal: 6,
                alignItems: 'center',
                gap: 5,
                backgroundColor: active ? alpha(color, '10') : v2.bgSurface,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? color : v2.hairline,
                borderRadius: 14,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: alpha(color, '18'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={iconName} size={14} color={color} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: v2.fontUI,
                  fontSize: 10,
                  fontWeight: '600',
                  color: active ? color : v2.ink,
                  textAlign: 'center',
                  maxWidth: '100%',
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onMorePress}
          style={{
            flexBasis: CELL_BASIS,
            paddingVertical: 10,
            paddingHorizontal: 6,
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: v2.hairlineStrong,
            borderStyle: 'dashed',
            borderRadius: 14,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: v2.bgRaised,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={14} color={v2.brand} />
          </View>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              fontWeight: '600',
              color: v2.brand,
              textAlign: 'center',
            }}
          >
            {t('add.more')}
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          marginTop: 8,
          fontFamily: v2.fontUI,
          fontSize: 11,
          color: v2.inkSubtle,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        {t('add.tapToSelect')}
      </Text>
    </View>
  );
}
