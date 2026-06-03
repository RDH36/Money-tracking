import { useState, useMemo, useCallback } from 'react';
import { ScrollView, Pressable, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { ExpenseCalendar } from '@/components/ExpenseCalendar';
import { TransactionCard } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks';
import { getDailyTotals } from '@/hooks/useTransactionStats';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useV2 } from '@/constants/designTokensV2';
import { MonthSelector } from '@/components/category-detail';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currencyCode = useCurrencyCode();
  const { transactions, refresh } = useTransactions();
  const posthog = usePostHog();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const dailyTotals = useMemo(() => getDailyTotals(transactions, year, month), [transactions, year, month]);
  const monthExpenses = useMemo(() => Object.values(dailyTotals).reduce((s, dt) => s + dt.expenses, 0), [dailyTotals]);
  const monthIncome = useMemo(() => Object.values(dailyTotals).reduce((s, dt) => s + dt.income, 0), [dailyTotals]);
  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
  }, [transactions, selectedDay, year, month]);

  const navigateMonth = (direction: -1 | 1) => {
    posthog.capture('calendar_navigated', { direction: direction === 1 ? 'next' : 'previous' });
    const d = new Date(year, month + direction, 1);
    const newYear = d.getFullYear();
    const newMonth = d.getMonth();
    setYear(newYear);
    setMonth(newMonth);
    const isCurrent = today.getFullYear() === newYear && today.getMonth() === newMonth;
    setSelectedDay(isCurrent ? today.getDate() : 1);
  };

  const locale = i18n.language === 'mg' ? 'fr-MG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const monthLabel = new Date(year, month).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const todayDateLabel = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

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
          {t('calendar.title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }}
      >
        <View style={{ gap: 14 }}>
          <MonthSelector
            label={monthLabel}
            onPrev={() => navigateMonth(-1)}
            onNext={() => navigateMonth(1)}
          />

          <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center', alignItems: 'baseline' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: v2.inkSubtle }}>
                {t('history.monthExpenses')}
              </Text>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.bad, fontVariant: ['tabular-nums'], marginTop: 2 }}>
                -{formatCurrency(monthExpenses, currencyCode)}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: v2.inkSubtle }}>
                {t('history.monthIncome')}
              </Text>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.good, fontVariant: ['tabular-nums'], marginTop: 2 }}>
                +{formatCurrency(monthIncome, currencyCode)}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: v2.bgSurface,
              borderWidth: 1, borderColor: v2.hairline,
              borderRadius: 14, padding: 12,
            }}
          >
            <ExpenseCalendar
              dailyTotals={dailyTotals}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              year={year}
              month={month}
            />
          </View>

          {selectedDay ? (
            <View style={{ gap: 10 }}>
              <View>
                <Text style={{
                  fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                  letterSpacing: 1.5, textTransform: 'uppercase',
                  color: v2.inkSubtle, marginBottom: 4,
                }}>
                  {todayDateLabel}
                </Text>
                <Text style={{ fontFamily: v2.fontDisplay, fontSize: 22, color: v2.ink, letterSpacing: -0.5 }}>
                  {t('calendar.dailyTotal')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <SoftBox v2={v2} bg={v2.badSoft} tone={v2.bad} label={t('reports.expenses')} value={dailyTotals[selectedDay]?.expenses ?? 0} prefix="-" currencyCode={currencyCode} />
                <SoftBox v2={v2} bg={v2.goodSoft} tone={v2.good} label={t('reports.income')} value={dailyTotals[selectedDay]?.income ?? 0} prefix="+" currencyCode={currencyCode} />
              </View>

              {dayTransactions.length === 0 ? (
                <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>📭</Text>
                  <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle }}>
                    {t('calendar.noExpenses')}
                  </Text>
                </View>
              ) : (
                dayTransactions.map((tx) => (
                  <TransactionCard key={tx.id} transaction={tx} />
                ))
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

interface SoftBoxProps {
  v2: ReturnType<typeof useV2>;
  bg: string;
  tone: string;
  label: string;
  value: number;
  prefix: string;
  currencyCode: string;
}

function SoftBox({ v2, bg, tone, label, value, prefix, currencyCode }: SoftBoxProps) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 9, paddingVertical: 10, paddingHorizontal: 12 }}>
      <Text style={{
        fontFamily: v2.fontUI, fontSize: 9, fontWeight: '700',
        letterSpacing: 1.2, textTransform: 'uppercase',
        color: tone, marginBottom: 2,
      }}>
        {label}
      </Text>
      <Text style={{
        fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700',
        color: tone, fontVariant: ['tabular-nums'],
      }}>
        {prefix}{formatCurrency(value, currencyCode)}
      </Text>
    </View>
  );
}
