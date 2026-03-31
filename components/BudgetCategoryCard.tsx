import { View } from 'react-native';
import { Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PressableCard } from '@/components/premium';
import { useAccounts } from '@/hooks';
import { useTheme } from '@/contexts';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { BudgetData } from '@/hooks/useBudgets';

const DEFAULT_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

const STATUS_COLORS = { green: '#22C55E', orange: '#F59E0B', red: '#EF4444' };

interface BudgetCategoryCardProps {
  budget: BudgetData;
  onPress: () => void;
}

export function BudgetCategoryCard({ budget, onPress }: BudgetCategoryCardProps) {
  const { t } = useTranslation();
  const { formatMoney } = useAccounts();
  const { theme } = useTheme();
  const { category, spent, budgetLimit, percentage, status, timeUntilReset } = budget;
  const color = category.color || '#95A5A6';
  const barColor = status ? STATUS_COLORS[status] : theme.colors.primary;
  const barWidth = percentage ? Math.min(percentage, 100) : 0;

  const displayName = DEFAULT_IDS.includes(category.id)
    ? t(`categories.${category.id}`) : category.name;

  return (
    <PressableCard onPress={onPress} className="mx-4 mb-3 rounded-2xl bg-bg-surface">
      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${color}15` }}
          >
            <Ionicons name={(category.icon || 'cube') as keyof typeof Ionicons.glyphMap} size={22} color={color} />
          </View>
          <View className="flex-1">
            <RNText className="font-display text-display-sm text-content-primary">{displayName}</RNText>
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="time-outline" size={12} color="#8E8EA0" />
              <RNText className="text-content-tertiary text-[11px] ml-1">
                {t('budget.resetIn')} {timeUntilReset}
              </RNText>
            </View>
          </View>
          {percentage !== null && (
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${barColor}15` }}
            >
              <RNText className="font-display text-display-sm" style={{ color: barColor }}>
                {percentage}%
              </RNText>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" style={{ marginLeft: 4 }} />
        </View>

        {/* Budget info */}
        {budgetLimit ? (
          <>
            <View className="flex-row justify-between items-baseline mb-2">
              <RNText className="font-body-bold text-body-md text-content-primary">
                {formatMoney(spent)}
              </RNText>
              <RNText className="font-body-regular text-body-sm text-content-tertiary">
                / {formatMoney(budgetLimit)}
              </RNText>
            </View>
            <View className="h-2 rounded-full bg-bg-raised overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${barWidth}%`, backgroundColor: barColor }}
              />
            </View>
          </>
        ) : (
          <View className="flex-row items-baseline">
            <RNText className="font-body-bold text-body-md text-content-primary">
              {formatMoney(spent)}
            </RNText>
            <RNText className="font-body-regular text-body-sm text-content-tertiary ml-2">
              · {t('budget.unlimited')}
            </RNText>
          </View>
        )}
      </View>
    </PressableCard>
  );
}
