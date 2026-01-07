import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Center } from '@/components/ui/center';
import { CategoryPicker } from '@/components/CategoryPicker';
import { AccountPicker } from '@/components/AccountPicker';
import { TransferForm } from '@/components/TransferForm';
import { useCategories, useTransactions, useAccounts, SYSTEM_CATEGORY_INCOME_ID } from '@/hooks';
import { useTheme } from '@/contexts';
import type { TransactionType } from '@/types';

type ScreenMode = 'transaction' | 'transfer';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { expenseCategories, incomeCategory } = useCategories();
  const { createTransaction, isLoading } = useTransactions();
  const { accounts, refresh: refreshAccounts, createTransfer, formatMoney } = useAccounts();

  const [mode, setMode] = useState<ScreenMode>('transaction');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    return parseInt(cleaned, 10).toLocaleString('fr-FR');
  };

  const getNumericAmount = () => parseInt(amount.replace(/\s/g, ''), 10) || 0;

  const resetForm = () => {
    setAmount('');
    setCategoryId(null);
    setAccountId(null);
    setFromAccountId(null);
    setToAccountId(null);
    setNote('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleSave = async () => {
    const numericAmount = getNumericAmount();
    if (numericAmount <= 0) return;
    const amountInCents = numericAmount * 100;

    if (mode === 'transaction') {
      if (!accountId) return;
      // For income, use the system income category; for expense, use selected category
      const finalCategoryId = type === 'income' ? SYSTEM_CATEGORY_INCOME_ID : categoryId;
      const result = await createTransaction({
        type,
        amount: amountInCents,
        categoryId: finalCategoryId,
        accountId,
        note: note.trim() || null,
      });
      if (result.success) {
        resetForm();
        refreshAccounts();
      }
    } else {
      if (!fromAccountId || !toAccountId) return;
      const result = await createTransfer({
        fromAccountId,
        toAccountId,
        amount: amountInCents,
        note: note.trim() || undefined,
      });
      if (result.success) {
        resetForm();
        refreshAccounts();
      }
    }
  };

  const isValidTransaction = getNumericAmount() > 0 && accountId;
  const isValidTransfer = getNumericAmount() > 0 && fromAccountId && toAccountId && fromAccountId !== toAccountId;
  const isValid = mode === 'transaction' ? isValidTransaction : isValidTransfer;

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <Box className="flex-1 p-6 pb-4">
            <VStack className="flex-1" space="xl">
              <Heading size="xl" className="text-typography-900">
                {mode === 'transaction' ? 'Nouvelle transaction' : 'Transfert'}
              </Heading>

              <Box className="bg-background-100 p-1 rounded-xl">
                <HStack>
                  <Pressable onPress={() => setMode('transaction')} className="flex-1">
                    <Box
                      className="py-3 rounded-lg items-center"
                      style={mode === 'transaction' ? { backgroundColor: theme.colors.primary } : {}}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="receipt-outline"
                          size={18}
                          color={mode === 'transaction' ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: mode === 'transaction' ? '#FFFFFF' : '#6B7280' }}
                        >
                          Transaction
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => setMode('transfer')} className="flex-1">
                    <Box
                      className="py-3 rounded-lg items-center"
                      style={mode === 'transfer' ? { backgroundColor: theme.colors.primary } : {}}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="swap-horizontal-outline"
                          size={18}
                          color={mode === 'transfer' ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: mode === 'transfer' ? '#FFFFFF' : '#6B7280' }}
                        >
                          Transfert
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                </HStack>
              </Box>

              {mode === 'transaction' && (
                <HStack space="sm" className="justify-center">
                  <Pressable onPress={() => setType('expense')} className="flex-1">
                    <Box
                      className="py-3 px-4 rounded-xl border-2 items-center"
                      style={{
                        borderColor: type === 'expense' ? '#EF4444' : '#E5E5E5',
                        backgroundColor: type === 'expense' ? '#FEF2F2' : '#FFFFFF',
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="arrow-down-circle"
                          size={20}
                          color={type === 'expense' ? '#EF4444' : '#9CA3AF'}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: type === 'expense' ? '#EF4444' : '#6B7280' }}
                        >
                          Dépense
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => setType('income')} className="flex-1">
                    <Box
                      className="py-3 px-4 rounded-xl border-2 items-center"
                      style={{
                        borderColor: type === 'income' ? '#22C55E' : '#E5E5E5',
                        backgroundColor: type === 'income' ? '#F0FDF4' : '#FFFFFF',
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="arrow-up-circle"
                          size={20}
                          color={type === 'income' ? '#22C55E' : '#9CA3AF'}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: type === 'income' ? '#22C55E' : '#6B7280' }}
                        >
                          Revenu
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                </HStack>
              )}

              <Center className="py-4">
                <Text className="text-typography-500 text-sm mb-2">Montant (MGA)</Text>
                <Input size="xl" variant="underlined" className="w-full max-w-[250px]">
                  <InputField
                    placeholder="0"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={(text) => { setAmount(formatAmount(text)); setSuccess(false); }}
                    className="text-4xl text-center font-bold"
                    textAlign="center"
                  />
                </Input>
              </Center>

              {mode === 'transaction' ? (
                <>
                  <VStack space="sm">
                    <Text className="text-typography-700 font-medium">Compte</Text>
                    <AccountPicker accounts={accounts} selectedId={accountId} onSelect={setAccountId} formatMoney={formatMoney} />
                  </VStack>
                  {type === 'expense' ? (
                    <VStack space="sm">
                      <Text className="text-typography-700 font-medium">Catégorie</Text>
                      <CategoryPicker categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} />
                    </VStack>
                  ) : (
                    <VStack space="sm">
                      <Text className="text-typography-700 font-medium">Catégorie</Text>
                      <Box className="p-3 rounded-xl border-2" style={{ borderColor: '#22C55E', backgroundColor: '#F0FDF4' }}>
                        <HStack space="md" className="items-center">
                          <Box className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: incomeCategory?.color || '#22C55E' }}>
                            <Ionicons name={(incomeCategory?.icon as keyof typeof Ionicons.glyphMap) || 'trending-up'} size={20} color="white" />
                          </Box>
                          <Text className="font-medium text-typography-900">{incomeCategory?.name || 'Revenu'}</Text>
                        </HStack>
                      </Box>
                    </VStack>
                  )}
                </>
              ) : (
                <TransferForm
                  accounts={accounts}
                  fromAccountId={fromAccountId}
                  toAccountId={toAccountId}
                  onFromChange={setFromAccountId}
                  onToChange={setToAccountId}
                />
              )}

              <VStack space="sm">
                <Text className="text-typography-700 font-medium">Note (optionnel)</Text>
                <Input size="lg">
                  <InputField placeholder="Ajouter une note..." value={note} onChangeText={setNote} />
                </Input>
              </VStack>

              {success && (
                <Center className="bg-success-100 p-3 rounded-xl">
                  <Text className="text-success-700 font-medium">
                    {mode === 'transaction' ? '✓ Transaction enregistrée !' : '✓ Transfert effectué !'}
                  </Text>
                </Center>
              )}
            </VStack>

            <Button
              size="xl"
              className="w-full mt-4"
              style={{ backgroundColor: theme.colors.primary }}
              onPress={handleSave}
              isDisabled={!isValid || isLoading}
            >
              <ButtonText className="text-white font-semibold">
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </ButtonText>
            </Button>
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
