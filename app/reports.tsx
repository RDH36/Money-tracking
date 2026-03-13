import { useState, useMemo } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { usePostHog } from 'posthog-react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { PeriodSelector } from '@/components/PeriodSelector';
import { useTransactions } from '@/hooks';
import { useTransactionStats, getBarChartData, filterByPeriod } from '@/hooks/useTransactionStats';
import type { PeriodType } from '@/hooks/useTransactionStats';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors, SEMANTIC_COLORS } from '@/constants/darkMode';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = useEffectiveColorScheme() === 'dark';
  const colors = getDarkModeColors(isDark);
  const currencyCode = useCurrencyCode();
  const { transactions } = useTransactions();
  const posthog = usePostHog();

  const [period, setPeriod] = useState<PeriodType>('month');
  const [date, setDate] = useState(new Date());
  const { stats } = useTransactionStats(transactions, period, date);
  const filtered = useMemo(() => filterByPeriod(transactions, period, date), [transactions, period, date]);
  const barData = useMemo(() => getBarChartData(filtered, period, date), [filtered, period, date]);

  const chartBarData = barData.flatMap((b) => [
    { value: b.expenses / 100, label: b.label, frontColor: SEMANTIC_COLORS.expense, spacing: 2 },
    { value: b.income / 100, label: '', frontColor: SEMANTIC_COLORS.income, spacing: 12 },
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
      <HStack className="items-center mb-4 mt-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text className="text-xl font-bold text-typography-900 ml-3">{t('reports.title')}</Text>
      </HStack>

      <VStack space="md">
        <PeriodSelector period={period} date={date} onPeriodChange={(p: any) => { posthog.capture('report_period_changed', { period: p }); setPeriod(p); }} onDateChange={setDate} />

        {/* Summary Cards */}
        <HStack space="sm">
          <Box className="flex-1 p-4 rounded-xl" style={{ backgroundColor: isDark ? SEMANTIC_COLORS.expenseLightDark : SEMANTIC_COLORS.expenseLight }}>
            <Text className="text-sm text-typography-500">{t('reports.expenses')}</Text>
            <Text className="text-lg font-bold" style={{ color: SEMANTIC_COLORS.expense }}>
              {formatCurrency(stats.totalExpenses, currencyCode)}
            </Text>
          </Box>
          <Box className="flex-1 p-4 rounded-xl" style={{ backgroundColor: isDark ? SEMANTIC_COLORS.incomeLightDark : SEMANTIC_COLORS.incomeLight }}>
            <Text className="text-sm text-typography-500">{t('reports.income')}</Text>
            <Text className="text-lg font-bold" style={{ color: SEMANTIC_COLORS.income }}>
              {formatCurrency(stats.totalIncome, currencyCode)}
            </Text>
          </Box>
        </HStack>

        {/* Stats Row */}
        <HStack space="sm">
          <Box className="flex-1 p-4 rounded-xl" style={{ backgroundColor: theme.colors.primaryLight }}>
            <Text className="text-sm text-typography-500">{t('reports.avgPerDay')}</Text>
            <Text className="text-base font-bold" style={{ color: theme.colors.primary }}>
              {formatCurrency(stats.avgPerDay, currencyCode)}
            </Text>
          </Box>
          <Box className="flex-1 p-4 rounded-xl" style={{ backgroundColor: theme.colors.primaryLight }}>
            <Text className="text-sm text-typography-500">{t('reports.topCategory')}</Text>
            <Text className="text-base font-bold" style={{ color: theme.colors.primary }} numberOfLines={1}>
              {stats.topCategory?.name || '-'}
            </Text>
          </Box>
        </HStack>

        {total === 0 ? (
          <Center className="py-16">
            <Text className="text-4xl mb-2">📊</Text>
            <Text className="text-typography-400">{t('reports.noData')}</Text>
          </Center>
        ) : (
          <>
            {/* Bar Chart - Trend */}
            {period !== 'day' && chartBarData.length > 0 && (
              <VStack space="sm">
                <Text className="text-typography-700 font-semibold">{t('reports.trend')}</Text>
                <Box key={`${period}-${date.getTime()}`} className="p-3 rounded-xl overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
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
                </Box>
                <HStack space="md" className="justify-center">
                  <HStack space="xs" className="items-center">
                    <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: SEMANTIC_COLORS.expense }} />
                    <Text className="text-xs text-typography-500">{t('reports.expenses')}</Text>
                  </HStack>
                  <HStack space="xs" className="items-center">
                    <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: SEMANTIC_COLORS.income }} />
                    <Text className="text-xs text-typography-500">{t('reports.income')}</Text>
                  </HStack>
                </HStack>
              </VStack>
            )}

            {/* Pie Chart - Categories */}
            {pieData.length > 0 && (
              <VStack space="sm">
                <Text className="text-typography-700 font-semibold">{t('reports.categoryBreakdown')}</Text>
                <HStack className="items-center justify-center" space="lg">
                  <PieChart
                    data={pieData}
                    donut
                    radius={65}
                    innerRadius={40}
                    innerCircleColor={colors.cardBg}
                    centerLabelComponent={() => (
                      <VStack className="items-center">
                        <Text className="text-typography-500 text-xs">{t('reports.total')}</Text>
                        <Text className="text-typography-900 font-bold text-sm">
                          {formatCurrency(stats.totalExpenses, currencyCode)}
                        </Text>
                      </VStack>
                    )}
                  />
                  <VStack space="xs" className="flex-1">
                    {stats.categoryBreakdown.slice(0, 5).map((cat, i) => (
                      <HStack key={cat.id || i} className="items-center" space="sm">
                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <Text className="text-sm text-typography-600 flex-1" numberOfLines={1}>{cat.name}</Text>
                        <Text className="text-sm text-typography-500">
                          {stats.totalExpenses > 0 ? Math.round((cat.amount / stats.totalExpenses) * 100) : 0}%
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </HStack>
              </VStack>
            )}
          </>
        )}
      </VStack>
    </ScrollView>
  );
}
