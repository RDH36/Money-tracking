import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

export type FilterKey = 'all' | 'expenses' | 'income' | 'recent';

const FILTERS: { key: FilterKey; tk: string }[] = [
  { key: 'all', tk: 'add.filterAll' },
  { key: 'expenses', tk: 'add.filterExpenses' },
  { key: 'income', tk: 'add.filterIncome' },
  { key: 'recent', tk: 'add.filterRecent' },
];

interface CategorySheetTopBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  count: number;
  filter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  onClose: () => void;
}

export function CategorySheetTopBar({
  search,
  onSearchChange,
  count,
  filter,
  onFilterChange,
  onClose,
}: CategorySheetTopBarProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View>
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: v2.hairlineStrong,
          }}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: v2.inkSubtle,
              marginBottom: 2,
            }}
          >
            {t('add.quickSelect')}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontDisplay,
              fontWeight: '700',
              fontSize: 20,
              color: v2.ink,
              letterSpacing: -0.4,
            }}
          >
            {t('add.category')}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={6}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: v2.bgRaised,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={14} color={v2.ink} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
        <View
          style={{
            backgroundColor: v2.bgRaised,
            borderRadius: 11,
            paddingVertical: 10,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={14} color={v2.inkSubtle} />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder={t('add.searchPlaceholder')}
            placeholderTextColor={v2.inkSubtle}
            style={{
              flex: 1,
              fontFamily: v2.fontUI,
              fontSize: 12,
              color: v2.ink,
              padding: 0,
            }}
          />
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              color: v2.inkSubtle,
              fontVariant: ['tabular-nums'],
            }}
          >
            {count}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 6 }}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => onFilterChange(f.key)}
              style={{
                paddingVertical: 5,
                paddingHorizontal: 11,
                borderRadius: 999,
                backgroundColor: active ? v2.bgInk : 'transparent',
                borderWidth: active ? 0 : 1,
                borderColor: v2.hairlineStrong,
              }}
            >
              <Text
                style={{
                  fontFamily: v2.fontUI,
                  fontSize: 10,
                  fontWeight: '600',
                  color: active ? v2.inkOnDark : v2.inkMuted,
                }}
              >
                {t(f.tk)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
