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
import { formatTransactionDateTime } from '@/lib/formatTransactionDate';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import { BackdatedLine } from './BackdatedLine';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function alpha15(hex: string | null | undefined): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + '15';
  return 'rgba(15,19,17,0.06)';
}

function dayKey(iso: string): string {
  try { return new Date(iso).toDateString(); } catch { return iso; }
}

function dayLabel(iso: string, lang: string, t: (k: string) => string): string {
  const d = new Date(iso);
  const key = d.toDateString();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === today.toDateString()) return t('history.today');
  if (key === yesterday.toDateString()) return t('history.yesterday');
  try {
    return d.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

interface RowProps {
  tx: TransactionWithCategory;
  currencyCode: string;
  onDelete?: () => void;
  isLast: boolean;
}
function TransactionRow({ tx, currencyCode, onDelete, isLast }: RowProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const isIncome = tx.type === 'income';
  const isExpense = tx.type === 'expense';
  const tone = isExpense ? v2.bad : isIncome ? v2.good : v2.inkMuted;
  const sign = isIncome ? '+' : isExpense ? '−' : '';
  const cat = tx.category_name ?? t('common.noCategory');
  const catColor = tx.category_color ?? v2.inkMuted;
  const iconName: IoniconName = (tx.category_icon as IoniconName) ?? 'pricetag-outline';
  // Date + heure de la transaction en tête du meta pour rester visible même
  // si la note est longue (la ligne tronque par la fin).
  const dateTime = formatTransactionDateTime(tx.transaction_date, i18n.language);
  const meta = [dateTime, tx.account_name, tx.note].filter(Boolean).join(' · ');

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
  const { t, i18n } = useTranslation();
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
          {t('planification.transactionCount', { count: group.transactions.length })} · {formatTransactionDateTime(group.latestCreatedAt, i18n.language)}
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
  /** Masque les en-têtes de jour (utile quand un jour précis est déjà filtré). */
  hideDayHeaders?: boolean;
}
export function TransactionsList({ transactions, currencyCode, onDelete, hideDayHeaders }: TransactionsListProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const items = groupByPlanification(transactions);

  let lastDay: string | null = null;

  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => {
        const dateIso = item.kind === 'group' ? item.latestCreatedAt : item.transaction.created_at;
        const key = dayKey(dateIso);
        const showHeader = !hideDayHeaders && key !== lastDay;
        lastDay = key;

        const header = showHeader ? (
          <Text
            key={`h-${key}`}
            style={{
              fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
              color: v2.inkSubtle, letterSpacing: 0.6, textTransform: 'uppercase',
              marginTop: 8, marginBottom: 2, paddingHorizontal: 4,
            }}
          >
            {dayLabel(dateIso, i18n.language, t)}
          </Text>
        ) : null;

        if (item.kind === 'group') {
          return (
            <View key={`g-${item.planificationId}`} style={{ gap: 8 }}>
              {header}
              <GroupCard group={item} currencyCode={currencyCode} />
            </View>
          );
        }
        return (
          <View key={item.transaction.id} style={{ gap: 8 }}>
            {header}
            <View
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
          </View>
        );
      })}
    </View>
  );
}
