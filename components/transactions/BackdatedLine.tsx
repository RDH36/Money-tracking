import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { Transaction } from '@/types';

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

interface BackdatedLineProps {
  tx: Pick<Transaction, 'type' | 'transaction_date' | 'created_at'>;
  /** Override the text color (defaults to the brand accent). */
  color?: string;
}

/**
 * Renders an explicit "occurred on X · recorded on Y" hint, but ONLY when the
 * transaction was back-dated (its economic day differs from the day it was
 * logged). Returns null for same-day transactions (the common case).
 */
export function BackdatedLine({ tx, color }: BackdatedLineProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();

  if (sameDay(tx.transaction_date, tx.created_at)) return null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  const occurred =
    tx.type === 'income'
      ? t('transaction.receivedOn', { date: fmt(tx.transaction_date) })
      : t('transaction.spentOn', { date: fmt(tx.transaction_date) });
  const recorded = t('transaction.recordedOn', { date: fmt(tx.created_at) });
  const tint = color ?? v2.brand;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <Ionicons name="time-outline" size={10} color={tint} />
      <Text
        numberOfLines={1}
        style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 10, color: tint }}
      >
        {occurred} · {recorded}
      </Text>
    </View>
  );
}
