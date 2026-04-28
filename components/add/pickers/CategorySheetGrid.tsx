import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const COLS = 4;
const GAP = 8;
const SHEET_PADDING = 20;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_WIDTH = Math.floor(
  (SCREEN_WIDTH - SHEET_PADDING * 2 - GAP * (COLS - 1)) / COLS
);

interface CategorySheetGridProps {
  categories: Category[];
  draftId: string | null;
  onSelect: (id: string) => void;
  onCreatePress?: () => void;
}

function alpha(hex: string | null, suffix: string): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + suffix;
  return 'rgba(15,19,17,0.06)';
}

export function CategorySheetGrid({
  categories,
  draftId,
  onSelect,
  onCreatePress,
}: CategorySheetGridProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: SHEET_PADDING, paddingVertical: 8 }}
      style={{ flexGrow: 0 }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {categories.map((cat) => {
          const active = cat.id === draftId;
          const color = cat.color ?? v2.brand;
          const iconName: IoniconName =
            (cat.icon as IoniconName) ?? 'pricetag-outline';
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
              style={{
                width: CELL_WIDTH,
                paddingVertical: 12,
                paddingHorizontal: 6,
                alignItems: 'center',
                gap: 6,
                backgroundColor: active ? alpha(color, '10') : v2.bgRaised,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? color : 'transparent',
                borderRadius: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  backgroundColor: alpha(color, '20'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={iconName} size={15} color={color} />
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

        {onCreatePress ? (
          <Pressable
            onPress={onCreatePress}
            style={{
              width: CELL_WIDTH,
              paddingVertical: 12,
              paddingHorizontal: 6,
              alignItems: 'center',
              gap: 6,
              borderWidth: 1.5,
              borderColor: v2.hairlineStrong,
              borderStyle: 'dashed',
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor: v2.bgRaised,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={15} color={v2.brand} />
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
              {t('add.create')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
