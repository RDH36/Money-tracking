import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useV2 } from '@/constants/designTokensV2';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface DayTransactionGroupProps {
  dayLabel: string;
  transactions: TransactionWithCategory[];
  formatMoney: (n: number) => string;
  onTransactionDelete?: (tx: TransactionWithCategory) => void;
  currencyCode?: string;
}

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

function formatHM(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export function DayTransactionGroup({
  dayLabel,
  transactions,
  formatMoney,
  onTransactionDelete,
  currencyCode = 'Ar',
}: DayTransactionGroupProps) {
  const v2 = useV2();

  return (
    <View style={{ marginTop: 18 }}>
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {dayLabel}
      </Text>
      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 18,
          padding: 4,
        }}
      >
        {transactions.map((tx, i) => {
          const isLast = i === transactions.length - 1;
          const isExpense = tx.type === 'expense';
          const isIncome = tx.type === 'income';
          const tone = isExpense ? v2.bad : isIncome ? v2.good : v2.inkMuted;
          const sign = isIncome ? '+' : isExpense ? '−' : '';
          const color = tx.category_color ?? v2.inkMuted;
          const iconName: IoniconName = (tx.category_icon as IoniconName) ?? 'pricetag-outline';
          const time = formatHM(tx.created_at);
          const meta = [tx.note, time].filter(Boolean).join(' · ');

          return (
            <View
              key={tx.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: v2.hairline,
              }}
            >
              <View
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  backgroundColor: alpha15(color),
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name={iconName} size={15} color={color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}
                >
                  {tx.category_name ?? ''}
                </Text>
                {meta ? (
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}
                  >
                    {meta}
                  </Text>
                ) : null}
              </View>
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                  color: tone, fontVariant: ['tabular-nums'],
                }}
              >
                {sign}{formatMoney(tx.amount)} {currencyCode}
              </Text>
              {onTransactionDelete ? (
                <Pressable
                  onPress={() => onTransactionDelete(tx)}
                  hitSlop={6}
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: v2.badSoft,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={v2.bad} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
