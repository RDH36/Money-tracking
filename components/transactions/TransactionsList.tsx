import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ComponentProps } from 'react';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import {
  groupByPlanification,
  type PlanificationGroup,
} from '@/lib/groupTransactions';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import { BackdatedLine } from './BackdatedLine';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}
function formatHM(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
}

interface RowProps {
  tx: TransactionWithCategory;
  currencyCode: string;
  onDelete?: () => void;
  isLast: boolean;
}
function TransactionRow({ tx, currencyCode, onDelete, isLast }: RowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const isIncome = tx.type === 'income';
  const isExpense = tx.type === 'expense';
  const tone = isExpense ? v2.bad : isIncome ? v2.good : v2.inkMuted;
  const sign = isIncome ? '+' : isExpense ? '−' : '';
  const cat = tx.category_name ?? t('common.noCategory');
  const catColor = tx.category_color ?? v2.inkMuted;
  const iconName: IoniconName = (tx.category_icon as IoniconName) ?? 'pricetag-outline';
  const time = formatHM(tx.transaction_date);
  const meta = [tx.note, tx.account_name, time].filter(Boolean).join(' · ');

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 12,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: v2.hairline,
      }}
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
        <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
          {cat}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}>
          {meta}
        </Text>
        <BackdatedLine tx={tx} />
      </View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
          color: tone, fontVariant: ['tabular-nums'],
        }}
      >
        {sign}{formatMoneyFr(tx.amount)} {currencyCode}
      </Text>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
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
}

interface GroupCardProps {
  group: PlanificationGroup;
  currencyCode: string;
}
function GroupCard({ group, currencyCode }: GroupCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const router = useRouter();
  const totalExpense = group.transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const totalIncome = group.transactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);

  return (
    <Pressable
      onPress={() => router.push(`/planification/${group.planificationId}` as any)}
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 14, padding: 14,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}
    >
      <View
        style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: v2.brandSoft,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="layers-outline" size={18} color={v2.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 14, color: v2.ink, letterSpacing: -0.2 }}>
          {group.title}
        </Text>
        <Text style={{ marginTop: 2, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle }}>
          {t('planification.transactionCount', { count: group.transactions.length })} · {formatHM(group.latestCreatedAt)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        {totalExpense > 0 ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.bad, fontVariant: ['tabular-nums'] }}>
            −{formatMoneyFr(totalExpense)} {currencyCode}
          </Text>
        ) : null}
        {totalIncome > 0 ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.good, fontVariant: ['tabular-nums'] }}>
            +{formatMoneyFr(totalIncome)} {currencyCode}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

interface TransactionsListProps {
  transactions: TransactionWithCategory[];
  currencyCode: string;
  onDelete?: (tx: TransactionWithCategory) => void;
}
export function TransactionsList({ transactions, currencyCode, onDelete }: TransactionsListProps) {
  const v2 = useV2();
  const items = groupByPlanification(transactions);

  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => {
        if (item.kind === 'group') {
          return <GroupCard key={`g-${item.planificationId}`} group={item} currencyCode={currencyCode} />;
        }
        return (
          <View
            key={item.transaction.id}
            style={{
              backgroundColor: v2.bgSurface,
              borderWidth: 1, borderColor: v2.hairline,
              borderRadius: 14, padding: 4,
            }}
          >
            <TransactionRow
              tx={item.transaction}
              currencyCode={currencyCode}
              onDelete={onDelete ? () => onDelete(item.transaction) : undefined}
              isLast
            />
          </View>
        );
      })}
    </View>
  );
}
