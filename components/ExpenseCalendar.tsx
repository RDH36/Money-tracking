import { Pressable, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useV2 } from '@/constants/designTokensV2';
import type { DailyTotal } from '@/hooks/useTransactionStats';

interface ExpenseCalendarProps {
  dailyTotals: Record<number, DailyTotal>;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  year: number;
  month: number;
}

export function ExpenseCalendar({
  dailyTotals,
  selectedDay,
  onSelectDay,
  year,
  month,
}: ExpenseCalendarProps) {
  const { t } = useTranslation();
  const v2 = useV2();
  const currencyCode = useCurrencyCode();

  const dayLabels = [
    t('calendar.mon'), t('calendar.tue'), t('calendar.wed'),
    t('calendar.thu'), t('calendar.fri'), t('calendar.sat'), t('calendar.sun'),
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const maxExpense = Object.values(dailyTotals).reduce((max, dt) => Math.max(max, dt.expenses), 0);

  const intensityFor = (expenses: number): { bg: string; border: string } => {
    if (expenses === 0 || maxExpense === 0) return { bg: 'transparent', border: 'transparent' };
    const ratio = expenses / maxExpense;
    const color = ratio >= 0.66 ? v2.bad : ratio >= 0.33 ? v2.warn : v2.good;
    return { bg: color + '20', border: color + '40' };
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {dayLabels.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: v2.inkSubtle }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {row.map((day, colIdx) => {
            if (day === null) {
              return <View key={colIdx} style={{ flex: 1, height: 58, margin: 1 }} />;
            }

            const dt = dailyTotals[day];
            const isToday = isCurrentMonth && today.getDate() === day;
            const isSelected = selectedDay === day;
            const intensity = intensityFor(dt?.expenses || 0);

            const bg = isSelected ? v2.bgInk : intensity.bg;
            const borderColor = isToday ? v2.brand : intensity.border;
            const borderWidth = isToday ? 2 : intensity.bg !== 'transparent' ? 1 : 0;
            const dayColor = isSelected ? v2.inkOnDark : v2.ink;

            return (
              <Pressable
                key={colIdx}
                onPress={() => onSelectDay(day)}
                style={{
                  flex: 1,
                  height: 58,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: bg,
                  borderWidth,
                  borderColor,
                  margin: 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: v2.fontUI,
                    fontSize: 12,
                    fontWeight: isToday || isSelected ? '700' : '600',
                    color: dayColor,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {day}
                </Text>
                {dt && dt.expenses > 0 ? (
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 8, color: isSelected ? v2.inkOnDarkM : v2.bad, fontVariant: ['tabular-nums'] }}
                  >
                    -{formatCurrency(dt.expenses, currencyCode)}
                  </Text>
                ) : null}
                {dt && dt.income > 0 ? (
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 8, color: isSelected ? v2.inkOnDarkM : v2.good, fontVariant: ['tabular-nums'] }}
                  >
                    +{formatCurrency(dt.income, currencyCode)}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
