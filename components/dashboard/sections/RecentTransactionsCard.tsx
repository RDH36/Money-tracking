import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import { groupByPlanification } from '@/lib/groupTransactions';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import { BackdatedLine } from '@/components/transactions/BackdatedLine';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface RecentTransactionsCardProps {
  transactions: TransactionWithCategory[];
  onSeeAllPress?: () => void;
  onTransactionLongPress?: (tx: TransactionWithCategory) => void;
  currencyCode?: string;
}

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

function formatHM(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
}

export function RecentTransactionsCard({
  transactions,
  onSeeAllPress,
  onTransactionLongPress,
  currencyCode = 'Ar',
}: RecentTransactionsCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const router = useRouter();
  const items = groupByPlanification(transactions);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: v2.inkSubtle,
              marginBottom: 4,
            }}
          >
            {t('dashboard.recent')}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontDisplay,
              fontWeight: '700',
              fontSize: 22,
              lineHeight: 24,
              color: v2.ink,
              letterSpacing: -0.5,
            }}
          >
            {t('dashboard.transactions')}
          </Text>
        </View>
        {onSeeAllPress ? (
          <Pressable onPress={onSeeAllPress} hitSlop={6}>
            <Text
              style={{
                fontFamily: v2.fontUI,
                fontSize: 11,
                fontWeight: '600',
                color: v2.brand,
              }}
            >
              {t('dashboard.viewAllArrow')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 18,
          padding: 4,
        }}
      >
        {items.length === 0 ? (
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 12,
              color: v2.inkSubtle,
              textAlign: 'center',
              paddingVertical: 16,
            }}
          >
            {t('dashboard.noRecentTransactions')}
          </Text>
        ) : (
          items.map((item, i) => {
            const isLast = i === items.length - 1;
            const rowStyle = {
              flexDirection: 'row' as const,
              alignItems: 'center' as const,
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: v2.hairline,
            };

            if (item.kind === 'group') {
              const totalExpense = item.transactions
                .filter((tx) => tx.type === 'expense')
                .reduce((s, tx) => s + tx.amount, 0);
              const totalIncome = item.transactions
                .filter((tx) => tx.type === 'income')
                .reduce((s, tx) => s + tx.amount, 0);
              return (
                <Pressable
                  key={`g-${item.planificationId}`}
                  onPress={() => router.push(`/planification/${item.planificationId}` as any)}
                  style={rowStyle}
                >
                  <View
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: v2.brandSoft,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="layers-outline" size={16} color={v2.brand} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1,
                      }}
                    >
                      {t('planification.transactionCount', { count: item.transactions.length })} · {formatHM(item.latestCreatedAt)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {totalExpense > 0 ? (
                      <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.bad, fontVariant: ['tabular-nums'] }}>
                        −{formatMoneyFr(totalExpense)} {currencyCode}
                      </Text>
                    ) : null}
                    {totalIncome > 0 ? (
                      <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: v2.good, fontVariant: ['tabular-nums'] }}>
                        +{formatMoneyFr(totalIncome)} {currencyCode}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            }

            const tx = item.transaction;
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const tone = isExpense ? v2.bad : isIncome ? v2.good : v2.inkMuted;
            const sign = isIncome ? '+' : isExpense ? '−' : '';
            const cat = tx.category_name ?? t('common.noCategory');
            const catColor = tx.category_color ?? v2.inkMuted;
            const iconName: IoniconName = (tx.category_icon as IoniconName) ?? 'pricetag-outline';
            const time = formatHM(tx.transaction_date);
            const meta = [tx.note, tx.account_name, time].filter(Boolean).join(' · ');

            return (
              <Pressable
                key={tx.id}
                onLongPress={onTransactionLongPress ? () => onTransactionLongPress(tx) : undefined}
                delayLongPress={300}
                style={rowStyle}
              >
                <View
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: alpha15(catColor),
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name={iconName} size={16} color={catColor} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}
                  >
                    {cat}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}
                  >
                    {meta}
                  </Text>
                  <BackdatedLine tx={tx} />
                </View>
                <Text
                  style={{
                    fontFamily: v2.fontUI, fontSize: 15, fontWeight: '700',
                    color: tone, fontVariant: ['tabular-nums'],
                  }}
                >
                  {sign}{formatMoneyFr(tx.amount)} {currencyCode}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}
