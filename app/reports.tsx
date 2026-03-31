import { useState, useMemo } from 'react';
import { ScrollView, Pressable, View, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { usePostHog } from 'posthog-react-native';
import { PeriodSelector } from '@/components/PeriodSelector';
import { useTransactions } from '@/hooks';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactionStats, getBarChartData, filterByPeriod } from '@/hooks/useTransactionStats';
import type { PeriodType } from '@/hooks/useTransactionStats';
import { useTheme } from '@/contexts';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { cn } from '@/lib/utils';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currencyCode = useCurrencyCode();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const posthog = usePostHog();
  const isDark = useEffectiveColorScheme() === 'dark';
  const colors = getDarkModeColors(isDark);

  const [period, setPeriod] = useState<PeriodType>('month');
  const [date, setDate] = useState(new Date());
  const [showAmounts, setShowAmounts] = useState(false);
  const { stats } = useTransactionStats(transactions, period, date);
  const filtered = useMemo(() => filterByPeriod(transactions, period, date), [transactions, period, date]);
  const barData = useMemo(() => getBarChartData(filtered, period, date), [filtered, period, date]);

  const chartBarData = barData.flatMap((b) => [
    { value: b.expenses / 100, label: b.label, frontColor: '#EF4444', spacing: 2 },
    { value: b.income / 100, label: '', frontColor: '#10B981', spacing: 12 },
  ]);

  const pieData = stats.categoryBreakdown.slice(0, 6).map((cat, i) => ({
    value: cat.amount,
    color: cat.color || theme.chartColors[i % theme.chartColors.length],
    text: cat.name,
  }));

  const total = stats.totalExpenses + stats.totalIncome;

  return (
    <ScrollView
      style={{ flex: 1, paddingTop: insets.top }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 16 }}
    >
      <View className="flex-row items-center mb-4 mt-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>
        <RNText className="font-display text-display-md text-content-primary ml-3">{t('reports.title')}</RNText>
      </View>

      <View className="gap-4">
        <PeriodSelector period={period} date={date} onPeriodChange={(p: any) => { posthog.capture('report_period_changed', { period: p }); setPeriod(p); }} onDateChange={setDate} />

        <View className="flex-row gap-3">
          <View className="flex-1 p-4 rounded-xl bg-expense-soft">
            <RNText className="font-ui text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.expenses')}</RNText>
            <RNText className="font-display text-display-lg" style={{ color: '#EF4444' }}>
              {formatCurrency(stats.totalExpenses, currencyCode)}
            </RNText>
          </View>
          <View className="flex-1 p-4 rounded-xl bg-income-soft">
            <RNText className="font-ui text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.income')}</RNText>
            <RNText className="font-display text-display-lg" style={{ color: '#22C55E' }}>
              {formatCurrency(stats.totalIncome, currencyCode)}
            </RNText>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: theme.colors.primaryLight }}>
            <RNText className="font-ui text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.avgPerDay')}</RNText>
            <RNText className="font-ui text-ui-lg" style={{ color: theme.colors.primary }}>
              {formatCurrency(stats.avgPerDay, currencyCode)}
            </RNText>
          </View>
          <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: theme.colors.primaryLight }}>
            <RNText className="font-ui text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.topCategory')}</RNText>
            <RNText className="font-ui text-ui-lg" style={{ color: theme.colors.primary }} numberOfLines={1}>
              {stats.topCategory?.name || '-'}
            </RNText>
          </View>
        </View>

        {total === 0 ? (
          <View className="items-center justify-center py-16">
            <RNText className="text-4xl mb-2">📊</RNText>
            <RNText className="text-content-tertiary">{t('reports.noData')}</RNText>
          </View>
        ) : (
          <>
            {period !== 'day' && chartBarData.length > 0 && (
              <View className="gap-3">
                <RNText className="font-ui text-ui-lg" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('reports.trend')}</RNText>
                <View key={`${period}-${date.getTime()}`} className="p-3 rounded-xl overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
                  <BarChart
                    data={chartBarData}
                    barWidth={period === 'year' ? 8 : 14}
                    spacing={period === 'year' ? 6 : 10}
                    noOfSections={4}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    xAxisLabelTextStyle={{ fontSize: 9, color: colors.textMuted }}
                    yAxisTextStyle={{ fontSize: 9, color: colors.textMuted }}
                    backgroundColor={colors.cardBg}
                    height={150}
                    isAnimated
                  />
                </View>
                <View className="flex-row gap-4 justify-center">
                  <View className="flex-row gap-2 items-center">
                    <View className="w-3 h-3 rounded-full bg-expense" />
                    <RNText className="text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.expenses')}</RNText>
                  </View>
                  <View className="flex-row gap-2 items-center">
                    <View className="w-3 h-3 rounded-full bg-income" />
                    <RNText className="text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.income')}</RNText>
                  </View>
                </View>
              </View>
            )}

            {pieData.length > 0 && (
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <RNText className="font-ui text-ui-lg" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('reports.categoryBreakdown')}</RNText>
                  <View className="flex-row rounded-lg overflow-hidden bg-bg-raised">
                    <Pressable
                      onPress={() => setShowAmounts(false)}
                      className="px-3 py-1"
                      style={!showAmounts ? { backgroundColor: theme.colors.primary } : undefined}
                    >
                      <RNText className="text-ui-sm font-ui" style={{ color: !showAmounts ? '#FFFFFF' : '#6B7280' }}>
                        %
                      </RNText>
                    </Pressable>
                    <Pressable
                      onPress={() => setShowAmounts(true)}
                      className="px-3 py-1"
                      style={showAmounts ? { backgroundColor: theme.colors.primary } : undefined}
                    >
                      <RNText className="text-ui-sm font-ui" style={{ color: showAmounts ? '#FFFFFF' : '#6B7280' }}>
                        {currencyCode}
                      </RNText>
                    </Pressable>
                  </View>
                </View>
                <View className="flex-row items-center justify-center gap-4">
                  <PieChart
                    data={pieData}
                    donut
                    radius={65}
                    innerRadius={40}
                    innerCircleColor={isDark ? '#1A1A20' : '#FFFFFF'}
                    centerLabelComponent={() => (
                      <View className="items-center justify-center">
                        <RNText className="text-ui-sm" style={{ color: colors.textMuted }}>{t('reports.total')}</RNText>
                        <RNText className="font-display text-ui-md" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>
                          {formatCurrency(stats.totalExpenses, currencyCode)}
                        </RNText>
                      </View>
                    )}
                  />
                  <View className="flex-1 gap-2">
                    {stats.categoryBreakdown.slice(0, 5).map((cat, i) => {
                      const budgetInfo = budgets.find((b) => b.category.id === cat.id);
                      const hasBudget = budgetInfo?.budgetLimit;
                      const budgetPct = budgetInfo?.percentage ?? 0;
                      const barColor = budgetInfo?.status === 'red' ? '#EF4444' : budgetInfo?.status === 'orange' ? '#F59E0B' : '#22C55E';

                      return (
                        <View key={cat.id || i} className="gap-1">
                          <View className="flex-row items-center gap-2">
                            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || theme.chartColors[i % theme.chartColors.length] }} />
                            <RNText className="font-body-regular text-body-sm flex-1" style={{ color: isDark ? '#EDEDF0' : '#14141A' }} numberOfLines={1}>{cat.name}</RNText>
                            <RNText className="font-ui text-ui-sm" style={{ color: colors.textMuted }}>
                              {showAmounts
                                ? hasBudget
                                  ? `${formatCurrency(cat.amount, currencyCode)} / ${formatCurrency(budgetInfo.budgetLimit!, currencyCode)}`
                                  : formatCurrency(cat.amount, currencyCode)
                                : `${stats.totalExpenses > 0 ? Math.round((cat.amount / stats.totalExpenses) * 100) : 0}%`
                              }
                            </RNText>
                          </View>
                          {hasBudget && (
                            <View className="flex-row items-center gap-2 ml-5">
                              <View className="flex-1 h-1.5 rounded-full bg-bg-raised overflow-hidden">
                                <View className="h-full rounded-full" style={{ width: `${Math.min(budgetPct, 100)}%`, backgroundColor: barColor }} />
                              </View>
                              <RNText className="text-[10px] font-bold" style={{ color: barColor }}>{budgetPct}%</RNText>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
