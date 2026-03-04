import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useTheme } from '@/contexts';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import type { DailyTotal } from '@/hooks/useTransactionStats';

interface ExpenseCalendarProps {
  dailyTotals: Record<number, DailyTotal>;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  year: number;
  month: number;
}

export function ExpenseCalendar({ dailyTotals, selectedDay, onSelectDay, year, month }: ExpenseCalendarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  const getIntensity = (expenses: number): string => {
    if (expenses === 0 || maxExpense === 0) return 'transparent';
    const ratio = expenses / maxExpense;
    if (ratio < 0.25) return theme.colors.primary + '20';
    if (ratio < 0.5) return theme.colors.primary + '40';
    if (ratio < 0.75) return theme.colors.primary + '80';
    return theme.colors.primary + 'CC';
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View>
      <HStack className="mb-1">
        {dayLabels.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text className="text-xs text-typography-400 font-medium">{label}</Text>
          </View>
        ))}
      </HStack>

      {rows.map((row, rowIdx) => (
        <HStack key={rowIdx} className="mb-1">
          {row.map((day, colIdx) => {
            if (day === null) {
              return <View key={colIdx} style={{ flex: 1, height: 52 }} />;
            }

            const dt = dailyTotals[day];
            const isToday = isCurrentMonth && today.getDate() === day;
            const isSelected = selectedDay === day;
            const bg = getIntensity(dt?.expenses || 0);

            return (
              <Pressable
                key={colIdx}
                onPress={() => onSelectDay(day)}
                style={{
                  flex: 1,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: isSelected ? theme.colors.primary : bg,
                  borderWidth: isToday ? 2 : 0,
                  borderColor: theme.colors.primary,
                  margin: 1,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: isSelected ? '#FFF' : isToday ? theme.colors.primary : undefined }}
                >
                  {day}
                </Text>
                {dt && dt.expenses > 0 && (
                  <Text
                    className="text-[8px]"
                    style={{ color: isSelected ? '#FFF' : '#EF4444' }}
                    numberOfLines={1}
                  >
                    {formatCurrency(dt.expenses, currencyCode)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </HStack>
      ))}
    </View>
  );
}
