import { View, Pressable } from 'react-native';
import { Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts';
import { useAccounts } from '@/hooks';
import { getCategoryDisplayName } from '@/constants/categories';
import type { BudgetData } from '@/hooks/useBudgets';

const STATUS_COLORS = { green: '#22C55E', orange: '#F59E0B', red: '#EF4444' };

interface BudgetSummarySectionProps {
  budgets: BudgetData[];
}

export function BudgetSummarySection({ budgets }: BudgetSummarySectionProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { formatMoney } = useAccounts();

  if (budgets.length === 0) return null;

  const monthLabel = new Date().toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  return (
    <View className="px-4 gap-2">
      <RNText className="font-display text-display-sm text-content-primary capitalize">
        {t('budget.monthBudgetsWithMonth', { month: monthLabel })}
      </RNText>

      {budgets.map((b) => {
        const color = b.category.color || '#95A5A6';
        const barColor = b.status ? STATUS_COLORS[b.status] : color;
        const barWidth = b.percentage ? Math.min(b.percentage, 100) : 0;
        const name = getCategoryDisplayName(b.category.id, b.category.name, t);

        return (
          <Pressable key={b.category.id} onPress={() => router.push(`/category/${b.category.id}` as any)}>
            <View className="flex-row items-center py-2">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${color}20` }}>
                <Ionicons name={(b.category.icon || 'cube') as keyof typeof Ionicons.glyphMap} size={16} color={color} />
              </View>
              <RNText className="font-body-bold text-body-sm text-content-primary w-24" numberOfLines={1}>{name}</RNText>
              <View className="flex-1 mx-3">
                {b.budgetLimit ? (
                  <View className="h-2 rounded-full bg-bg-raised overflow-hidden">
                    <View className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
                  </View>
                ) : (
                  <RNText className="text-content-tertiary text-xs">{formatMoney(b.spent)}</RNText>
                )}
              </View>
              {b.percentage !== null && (
                <RNText className="font-body-bold text-body-sm w-10 text-right" style={{ color: barColor }}>{b.percentage}%</RNText>
              )}
              {b.status && (
                <View className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: barColor }} />
              )}
              <Ionicons name="chevron-forward" size={14} color="#C7C7CC" className="ml-1" />
            </View>
          </Pressable>
        );
      })}

      <Pressable onPress={() => router.push('/(tabs)/history' as any)}>
        <RNText className="text-right font-ui text-ui-sm py-1" style={{ color: theme.colors.primary }}>
          {t('budget.viewAll')} →
        </RNText>
      </Pressable>
    </View>
  );
}
