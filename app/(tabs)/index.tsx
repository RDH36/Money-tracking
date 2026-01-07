import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { useAccounts, useTransactions, useSettings, useExpensesByCategory } from '@/hooks';
import { TransactionCard } from '@/components/TransactionCard';
import { ExpenseChart } from '@/components/ExpenseChart';
import { AddAccountModal } from '@/components/AddAccountModal';
import { useTheme } from '@/contexts';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { accounts, formattedTotal, refresh: refreshAccounts, isLoading: accountsLoading, formatMoney, createAccount } = useAccounts();
  const { transactions, refresh: refreshTransactions, isFetching } = useTransactions();
  const { balanceHidden, toggleBalanceVisibility } = useSettings();
  const { expenses, refresh: refreshExpenses } = useExpensesByCategory();
  const [showAddAccount, setShowAddAccount] = useState(false);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshTransactions();
      refreshExpenses();
    }, [refreshAccounts, refreshTransactions, refreshExpenses])
  );

  const handleRefresh = async () => {
    await Promise.all([refreshAccounts(), refreshTransactions(), refreshExpenses()]);
  };

  const handleCreateAccount = async (params: Parameters<typeof createAccount>[0]) => {
    await createAccount(params);
    setShowAddAccount(false);
  };

  const hiddenAmount = '••••••';
  const getAccountColor = (type: string) => (type === 'bank' ? theme.colors.primary : '#22c55e');

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isFetching || accountsLoading} onRefresh={handleRefresh} />}
      >
        <VStack className="p-6" space="lg">
          <Heading size="xl" className="text-typography-900">Dashboard</Heading>

          <Box className="p-6 rounded-2xl" style={{ backgroundColor: theme.colors.primary }}>
            <HStack className="justify-between items-start">
              <VStack>
                <Text className="text-white text-sm mb-1">Solde total</Text>
                <Heading size="2xl" className="text-white">{balanceHidden ? hiddenAmount : formattedTotal}</Heading>
              </VStack>
              <Pressable onPress={toggleBalanceVisibility} className="p-2">
                <Ionicons name={balanceHidden ? 'eye-off' : 'eye'} size={24} color="white" />
              </Pressable>
            </HStack>
          </Box>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {accounts.map((account) => (
              <Box
                key={account.id}
                className="p-4 rounded-xl border"
                style={{
                  borderColor: getAccountColor(account.type) + '40',
                  backgroundColor: getAccountColor(account.type) + '10',
                  minWidth: 150,
                }}
              >
                <HStack space="sm" className="items-center mb-2">
                  <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={18} color={getAccountColor(account.type)} />
                  <Text className="text-xs font-medium" style={{ color: getAccountColor(account.type) }} numberOfLines={1}>
                    {account.name}
                  </Text>
                </HStack>
                <Text className="font-bold text-base" style={{ color: getAccountColor(account.type) }}>
                  {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                </Text>
              </Box>
            ))}
            <Pressable onPress={() => setShowAddAccount(true)}>
              <Box className="p-4 rounded-xl border-2 border-dashed border-outline-300 items-center justify-center" style={{ minWidth: 100, minHeight: 80 }}>
                <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
                <Text className="text-xs mt-1" style={{ color: theme.colors.primary }}>Ajouter</Text>
              </Box>
            </Pressable>
          </ScrollView>

          {expenses.length > 0 && (
            <Box className="bg-background-0 p-4 rounded-xl border border-outline-100">
              <ExpenseChart data={expenses} />
            </Box>
          )}

          <VStack space="md">
            <Text className="text-typography-700 font-semibold">Transactions récentes</Text>
            {recentTransactions.length === 0 ? (
              <Center className="py-8 bg-background-0 rounded-xl border border-outline-100">
                <Text className="text-4xl mb-2">📭</Text>
                <Text className="text-typography-500 text-center text-sm">Aucune transaction</Text>
              </Center>
            ) : (
              <VStack space="sm">
                {recentTransactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
                {transactions.length > 5 && (
                  <Pressable onPress={() => router.push('/history')} className="py-3 px-4 rounded-xl" style={{ backgroundColor: theme.colors.primary }}>
                    <HStack className="justify-center items-center" space="sm">
                      <Text className="text-white font-semibold">Voir plus</Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </HStack>
                  </Pressable>
                )}
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>

      <AddAccountModal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} onCreateAccount={handleCreateAccount} />
    </View>
  );
}
