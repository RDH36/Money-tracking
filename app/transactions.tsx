import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Text, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePostHog } from 'posthog-react-native';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/premium';
import { useTransactions, useAccounts } from '@/hooks';
import { useV2 } from '@/constants/designTokensV2';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { MonthSelector } from '@/components/category-detail/MonthSelector';
import { formatMonthLabelFr } from '@/components/dashboard/helpers';
import { useCurrency } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrency();
  const { transactions, isFetching, refresh, deleteTransaction } = useTransactions();
  const { refresh: refreshAccounts } = useAccounts();
  const posthog = usePostHog();
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthLabel = formatMonthLabelFr(monthDate, i18n.language);

  const monthTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        const d = new Date(tx.created_at);
        return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
      }),
    [transactions, monthDate]
  );

  // Filtre par jour précis : porte sur transaction_date (la date affichée sur
  // la carte), pour que le jour choisi corresponde à ce que l'utilisateur voit.
  const dayTransactions = useMemo(() => {
    if (!selectedDay) return null;
    return transactions.filter((tx) => {
      const d = new Date(tx.transaction_date);
      return (
        d.getFullYear() === selectedDay.getFullYear() &&
        d.getMonth() === selectedDay.getMonth() &&
        d.getDate() === selectedDay.getDate()
      );
    });
  }, [transactions, selectedDay]);

  const visibleTransactions = selectedDay ? dayTransactions ?? [] : monthTransactions;

  const dayLabel = selectedDay
    ? selectedDay.toLocaleDateString(i18n.language, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const handlePickDate = (_: unknown, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDay(date);
      posthog.capture('history_date_filter_used');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.replace('/history')}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: v2.bgSurface,
            borderWidth: 1,
            borderColor: v2.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color={v2.ink} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontFamily: v2.fontDisplay,
            fontWeight: '700',
            fontSize: 22,
            color: v2.ink,
            letterSpacing: -0.5,
          }}
        >
          {t('dashboard.transactions')}
        </Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          hitSlop={6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: selectedDay ? v2.brandTint : v2.bgSurface,
            borderWidth: 1,
            borderColor: selectedDay ? v2.brand : v2.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={selectedDay ? v2.brand : v2.ink} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refresh}
            tintColor={v2.brand}
          />
        }
      >
        <View style={{ marginBottom: 12 }}>
          {selectedDay ? (
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: v2.brandTint, borderWidth: 1, borderColor: v2.brand,
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <Ionicons name="calendar" size={16} color={v2.brand} />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700',
                    color: v2.brand, textTransform: 'capitalize',
                  }}
                >
                  {dayLabel}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedDay(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={v2.brand} />
              </Pressable>
            </View>
          ) : (
            <MonthSelector
              label={monthLabel}
              onPrev={() => setMonthOffset((p) => p - 1)}
              onNext={() => setMonthOffset((p) => Math.min(p + 1, 0))}
              nextDisabled={monthOffset >= 0}
            />
          )}
        </View>

        {transactions.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <EmptyState
              icon="wallet-outline"
              title={t('history.noTransactions')}
              description={t('history.addFirst')}
              image={require('@/assets/images/bubule-detente.png')}
            />
          </View>
        ) : visibleTransactions.length === 0 ? (
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle,
              textAlign: 'center', paddingVertical: 40, fontStyle: 'italic',
            }}
          >
            {selectedDay
              ? t('history.noTransactionsThisDay')
              : t('categoryDetail.noTransactionsThisMonth')}
          </Text>
        ) : (
          <TransactionsList
            transactions={visibleTransactions}
            currencyCode={currency.code}
            onDelete={(tx) => setDeleteTarget(tx)}
            hideDayHeaders={!!selectedDay}
          />
        )}
      </ScrollView>

      {showPicker ? (
        <DateTimePicker
          value={selectedDay ?? new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handlePickDate}
        />
      ) : null}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            posthog.capture('transaction_deleted', {
              transaction_type: deleteTarget.type,
              source: 'transactions',
            });
            deleteTransaction(deleteTarget.id);
            refreshAccounts();
          }
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}
