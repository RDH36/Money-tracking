import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { getCategoryDisplayName } from '@/constants/categories';
import { SectionLabel, SettingsCard } from '@/components/settings/v2';
import type { Category } from '@/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface CategoriesSectionProps {
  categories: Category[];
  customCount: number;
  maxCustom: number;
  onAdd: () => void;
  onEdit?: (category: Category) => void;
}

function alpha15(hex: string | null): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

function formatMonth(locale: string): string {
  const s = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function CategoriesSection({
  categories,
  customCount,
  maxCustom,
  onAdd,
  onEdit,
}: CategoriesSectionProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const baseCats = categories.filter((c) => c.is_default === 1 && c.id !== 'other');
  const customCats = categories.filter((c) => c.is_default === 0);

  return (
    <View>
      <View
        style={{
          padding: 14, borderRadius: 12,
          backgroundColor: v2.bgRaised,
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        }}
      >
        <Ionicons name="information-circle-outline" size={15} color={v2.brand} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, lineHeight: 17 }}>
          {t('categoriesV2.infoBannerMonth', { month: formatMonth(i18n.language) })}
        </Text>
      </View>

      <SectionLabel>{t('categoriesV2.baseSection')}</SectionLabel>
      <SettingsCard>
        {baseCats.map((c, i) => (
          <CategoryRow
            key={c.id}
            v2={v2}
            t={t}
            category={c}
            isLast={i === baseCats.length - 1}
            onPress={onEdit ? () => onEdit(c) : undefined}
          />
        ))}
      </SettingsCard>

      <SectionLabel>
        {t('categoriesV2.customSection', { count: customCount, max: maxCustom })}
      </SectionLabel>
      <SettingsCard>
        {customCats.map((c, i) => (
          <CategoryRow
            key={c.id}
            v2={v2}
            t={t}
            category={c}
            isLast={i === customCats.length - 1 && customCount >= maxCustom}
            onPress={onEdit ? () => onEdit(c) : undefined}
          />
        ))}
        {customCount < maxCustom ? (
          <Pressable
            onPress={onAdd}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingVertical: 14, paddingHorizontal: 14,
            }}
          >
            <View
              style={{
                width: 34, height: 34, borderRadius: 10,
                borderWidth: 1.5, borderStyle: 'dashed', borderColor: v2.brand,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={16} color={v2.brand} />
            </View>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.brand }}>
              {t('categoriesV2.newCategory')}
            </Text>
          </Pressable>
        ) : null}
      </SettingsCard>
    </View>
  );
}

interface CatRowProps {
  v2: ReturnType<typeof useV2>;
  t: (k: string, p?: any) => string;
  category: Category;
  isLast: boolean;
  onPress?: () => void;
}

function CategoryRow({ v2, t, category, isLast, onPress }: CatRowProps) {
  const color = category.color ?? v2.brand;
  const iconName: IoniconName = (category.icon as IoniconName) ?? 'pricetag-outline';
  const name = getCategoryDisplayName(category.id, category.name, t);
  const hasBudget = category.budget_limit && category.budget_limit > 0;
  const budgetText = hasBudget
    ? t('categoriesV2.perMonth', { amount: `${(category.budget_limit! / 100).toLocaleString()} Ar` })
    : t('budget.unlimited');
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13, paddingHorizontal: 14,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: v2.hairline,
      }}
    >
      <View
        style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: alpha15(color),
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={16} color={color} />
      </View>
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.ink }}>
        {name}
      </Text>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 12, fontWeight: '500',
          color: hasBudget ? v2.inkMuted : v2.inkSubtle,
          fontStyle: hasBudget ? 'normal' : 'italic',
          fontVariant: ['tabular-nums'],
        }}
      >
        {budgetText}
      </Text>
      {onPress ? (
        <Ionicons name="chevron-forward" size={13} color={v2.inkSubtle} style={{ marginLeft: 4 }} />
      ) : null}
    </Wrapper>
  );
}
