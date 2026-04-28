import { useCallback, useState } from 'react';
import { View, ScrollView, Pressable, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { usePostHog } from 'posthog-react-native';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/premium';
import { useTransactions, useAccounts } from '@/hooks';
import { useV2 } from '@/constants/designTokensV2';
import { RecentTransactionsCard } from '@/components/dashboard';
import { useCurrency } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const v2 = useV2();
  const currency = useCurrency();
  const { transactions, isFetching, refresh, deleteTransaction } = useTransactions();
  const { refresh: refreshAccounts } = useAccounts();
  const posthog = usePostHog();
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

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
          onPress={() => router.back()}
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
            fontFamily: v2.fontDisplay,
            fontWeight: '700',
            fontSize: 22,
            color: v2.ink,
            letterSpacing: -0.5,
          }}
        >
          {t('dashboard.transactions')}
        </Text>
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
        {transactions.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <EmptyState
              icon="wallet-outline"
              title={t('history.noTransactions')}
              description={t('history.addFirst')}
              image={require('@/assets/images/bubule-detente.png')}
            />
          </View>
        ) : (
          <RecentTransactionsCard
            transactions={transactions}
            onTransactionLongPress={(tx) => setDeleteTarget(tx)}
            currencyCode={currency.code}
          />
        )}
      </ScrollView>

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
