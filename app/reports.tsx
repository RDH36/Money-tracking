import { useState, useMemo, useEffect } from 'react';
import { ScrollView, Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BarChart } from 'react-native-gifted-charts';
import { usePostHog } from 'posthog-react-native';
import { PeriodSelector } from '@/components/PeriodSelector';
import { useTransactions, useGamification, useAccounts } from '@/hooks';
import { useBudgetForPeriod } from '@/hooks/useBudgets';
import {
  useTransactionStats,
  getBarChartData,
  filterByPeriod,
  formatPeriodLabel,
} from '@/hooks/useTransactionStats';
import type { PeriodType } from '@/hooks/useTransactionStats';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useV2 } from '@/constants/designTokensV2';
import { LegendDot } from '@/components/reports/ReportPrimitives';
import { NetSummaryCard } from '@/components/reports/NetSummaryCard';
import { CategoryBreakdownV2 } from '@/components/reports/CategoryBreakdownV2';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currencyCode = useCurrencyCode();
  const { transactions } = useTransactions();
  const { formatMoney } = useAccounts();
  const posthog = usePostHog();
  const gamification = useGamification();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [date, setDate] = useState(new Date());
  const [showAmounts, setShowAmounts] = useState(false);

  useEffect(() => {
    gamification.checkDailyChallenge('review_budget');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getBudgetForCategory } = useBudgetForPeriod(period, date);
  const { stats } = useTransactionStats(transactions, period, date);
  const filtered = useMemo(() => filterByPeriod(transactions, period, date), [transactions, period, date]);
  const barData = useMemo(() => getBarChartData(filtered, period, date), [filtered, period, date]);
  const chartBarData = useMemo(
    () => barData.flatMap((b) => [
      { value: b.expenses / 100, label: b.label, frontColor: v2.bad, spacing: 2 },
      { value: b.income / 100, label: '', frontColor: v2.good, spacing: 12 },
    ]),
    [barData, v2.bad, v2.good]
  );

  const total = stats.totalExpenses + stats.totalIncome;
  const periodLabel = formatPeriodLabel(date, period, i18n.language);
  const breakdown = stats.categoryBreakdown.slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={6}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color={v2.ink} />
        </Pressable>
        <Text style={{ fontFamily: v2.fontDisplay, fontSize: 22, color: v2.ink, letterSpacing: -0.5 }}>
          {t('reports.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
        <View style={{ gap: 14 }}>
          <PeriodSelector
            period={period}
            date={date}
            onPeriodChange={(p: PeriodType) => { posthog.capture('report_period_changed', { period: p }); setPeriod(p); }}
            onDateChange={setDate}
          />

          <NetSummaryCard
            periodLabel={periodLabel}
            totalIncome={stats.totalIncome}
            totalExpenses={stats.totalExpenses}
            avgPerDay={stats.avgPerDay}
            topCategoryName={stats.topCategory?.name ?? null}
            formatMoney={formatMoney}
          />

          {total === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
              <Text style={{ fontFamily: v2.fontUI, color: v2.inkSubtle }}>{t('reports.noData')}</Text>
            </View>
          ) : (
            <>
              {period !== 'day' && chartBarData.length > 0 ? (
                <View style={{ gap: 10 }}>
                  <Text
                    style={{
                      fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                      letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkSubtle,
                    }}
                  >
                    {t('reports.trend')}
                  </Text>
                  <View
                    key={`${period}-${date.getTime()}`}
                    style={{
                      backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
                      borderRadius: 14, padding: 12,
                    }}
                  >
                    <BarChart
                      data={chartBarData}
                      barWidth={period === 'year' ? 8 : 14}
                      spacing={period === 'year' ? 6 : 10}
                      noOfSections={4}
                      yAxisThickness={0}
                      xAxisThickness={0}
                      hideRules
                      xAxisLabelTextStyle={{ fontSize: 9, color: v2.inkSubtle }}
                      yAxisTextStyle={{ fontSize: 9, color: v2.inkSubtle }}
                      backgroundColor={v2.bgSurface}
                      height={150}
                      isAnimated
                    />
                    <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: v2.hairline }}>
                      <LegendDot color={v2.good} label={t('reports.income')} />
                      <LegendDot color={v2.bad} label={t('reports.expenses')} />
                    </View>
                  </View>
                </View>
              ) : null}

              <CategoryBreakdownV2
                categories={breakdown}
                totalExpenses={stats.totalExpenses}
                showAmounts={showAmounts}
                onToggleAmounts={setShowAmounts}
                formatMoney={formatMoney}
                getBudgetForCategory={(id, spent) => getBudgetForCategory(id, spent)}
                currencyCode={currencyCode}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
