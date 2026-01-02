import { useMemo, useCallback } from 'react';
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
import { useBalance, useTransactions, useSettings, useExpensesByCategory } from '@/hooks';
import { TransactionCard } from '@/components/TransactionCard';
import { ExpenseChart } from '@/components/ExpenseChart';
import { useTheme } from '@/contexts';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { formatted, formattedIncome, formattedExpense, refresh: refreshBalance, isLoading: balanceLoading } = useBalance();
  const { transactions, refresh: refreshTransactions, isFetching } = useTransactions();
  const { balanceHidden, toggleBalanceVisibility } = useSettings();
  const { expenses, refresh: refreshExpenses } = useExpensesByCategory();

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshBalance();
      refreshTransactions();
      refreshExpenses();
    }, [refreshBalance, refreshTransactions, refreshExpenses])
  );

  const handleRefresh = async () => {
    await Promise.all([refreshBalance(), refreshTransactions(), refreshExpenses()]);
  };

  const hiddenAmount = '••••••';

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || balanceLoading}
            onRefresh={handleRefresh}
          />
        }
      >
        <VStack className="p-6" space="lg">
          <Heading size="xl" className="text-typography-900">
            Dashboard
          </Heading>

          <Box className="p-6 rounded-2xl" style={{ backgroundColor: theme.colors.primary }}>
            <HStack className="justify-between items-start">
              <VStack>
                <Text className="text-white text-sm mb-1">Solde actuel</Text>
                <Heading size="2xl" className="text-white">
                  {balanceHidden ? hiddenAmount : formatted}
                </Heading>
              </VStack>
              <Pressable onPress={toggleBalanceVisibility} className="p-2">
                <Ionicons
                  name={balanceHidden ? 'eye-off' : 'eye'}
                  size={24}
                  color="white"
                />
              </Pressable>
            </HStack>
          </Box>

          <HStack space="md">
            <Box className="flex-1 bg-success-50 p-4 rounded-xl border border-success-200">
              <Text className="text-success-700 text-xs mb-1">Revenus</Text>
              <Text className="text-success-800 font-bold text-lg">
                +{formattedIncome}
              </Text>
            </Box>
            <Box className="flex-1 bg-error-50 p-4 rounded-xl border border-error-200">
              <Text className="text-error-700 text-xs mb-1">Dépenses</Text>
              <Text className="text-error-800 font-bold text-lg">
                -{formattedExpense}
              </Text>
            </Box>
          </HStack>

          {expenses.length > 0 && (
            <Box className="bg-background-0 p-4 rounded-xl border border-outline-100">
              <ExpenseChart data={expenses} />
            </Box>
          )}

          <VStack space="md">
            <Text className="text-typography-700 font-semibold">
              Transactions récentes
            </Text>

            {recentTransactions.length === 0 ? (
              <Center className="py-8 bg-background-0 rounded-xl border border-outline-100">
                <Text className="text-4xl mb-2">📭</Text>
                <Text className="text-typography-500 text-center text-sm">
                  Aucune transaction
                </Text>
              </Center>
            ) : (
              <VStack space="sm">
                {recentTransactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
                {transactions.length > 5 && (
                  <Pressable
                    onPress={() => router.push('/history')}
                    className="py-3 px-4 rounded-xl"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <HStack className="justify-center items-center" space="sm">
                      <Text className="text-white font-semibold">
                        Voir plus
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </HStack>
                  </Pressable>
                )}
              </VStack>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </View>
  );
}
