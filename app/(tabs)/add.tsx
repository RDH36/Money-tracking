import { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, parseAmount, getNumericValue } from '@/lib/amountInput';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors, SEMANTIC_COLORS } from '@/constants/darkMode';
import type { TransactionType } from '@/types';

type ScreenMode = 'transaction' | 'transfer';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currency = useCurrency();
  const { expenseCategories, incomeCategory, refresh: refreshCategories } = useCategories();
  const { createTransaction, isLoading } = useTransactions();
  const { accounts, refresh: refreshAccounts, createTransfer, formatMoney } = useAccounts();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const [mode, setMode] = useState<ScreenMode>('transaction');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshCategories();
    }, [refreshAccounts, refreshCategories])
  );

  const getNumericAmount = () => getNumericValue(amount);

  const resetForm = () => {
    setAmount('');
    setCategoryId(null);
    setAccountId(null);
    setFromAccountId(null);
    setToAccountId(null);
    setNote('');
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleSave = async () => {
    const numericAmount = getNumericAmount();
    if (numericAmount <= 0) return;
    const amountValue = parseAmount(amount);
    setError(null);

    if (mode === 'transaction') {
      if (!accountId) return;
      // For income, use the system income category; for expense, use selected category
      const finalCategoryId = type === 'income' ? SYSTEM_CATEGORY_INCOME_ID : categoryId;
      const result = await createTransaction({
        type,
        amount: amountValue,
        categoryId: finalCategoryId,
        accountId,
        note: note.trim() || null,
      });
      if (result.success) {
        resetForm();
        refreshAccounts();
      } else if (result.error) {
        setError(result.error);
      }
    } else {
      if (!fromAccountId || !toAccountId) return;
      const result = await createTransfer({
        fromAccountId,
        toAccountId,
        amount: amountValue,
        note: note.trim() || undefined,
      });
      if (result.success) {
        resetForm();
        refreshAccounts();
      } else if (result.error) {
        setError(result.error);
      }
    }
  };

  const isValidTransaction = getNumericAmount() > 0 && accountId;
  const isValidTransfer = getNumericAmount() > 0 && fromAccountId && toAccountId && fromAccountId !== toAccountId;
  const isValid = mode === 'transaction' ? isValidTransaction : isValidTransfer;

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        bottomOffset={20}
      >
          <Box className="flex-1 p-6 pb-4">
            <VStack className="flex-1" space="xl">
              <Heading size="xl" className="text-typography-900">
                {mode === 'transaction' ? t('add.newTransaction') : t('add.transfer')}
              </Heading>

              <Box className="bg-background-100 p-1 rounded-xl">
                <HStack>
                  <Pressable onPress={() => { setMode('transaction'); setError(null); }} className="flex-1">
                    <Box
                      className="py-3 rounded-lg items-center"
                      style={mode === 'transaction' ? { backgroundColor: theme.colors.primary } : {}}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="receipt-outline"
                          size={18}
                          color={mode === 'transaction' ? colors.cardBg : colors.textMuted}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: mode === 'transaction' ? colors.cardBg : colors.textMuted }}
                        >
                          {t('add.transaction')}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => { setMode('transfer'); setError(null); }} className="flex-1">
                    <Box
                      className="py-3 rounded-lg items-center"
                      style={mode === 'transfer' ? { backgroundColor: theme.colors.secondary } : {}}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="swap-horizontal-outline"
                          size={18}
                          color={mode === 'transfer' ? colors.cardBg : colors.textMuted}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: mode === 'transfer' ? colors.cardBg : colors.textMuted }}
                        >
                          {t('add.transfer')}
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
                        borderColor: type === 'expense' ? '#EF4444' : colors.cardBorder,
                        backgroundColor: type === 'expense' ? (isDark ? '#450A0A' : '#FEF2F2') : colors.cardBg,
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="arrow-down-circle"
                          size={20}
                          color={type === 'expense' ? '#EF4444' : colors.textMuted}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: type === 'expense' ? '#EF4444' : colors.textMuted }}
                        >
                          {t('add.expense')}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => setType('income')} className="flex-1">
                    <Box
                      className="py-3 px-4 rounded-xl border-2 items-center"
                      style={{
                        borderColor: type === 'income' ? '#22C55E' : colors.cardBorder,
                        backgroundColor: type === 'income' ? (isDark ? '#052E16' : '#F0FDF4') : colors.cardBg,
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="arrow-up-circle"
                          size={20}
                          color={type === 'income' ? '#22C55E' : colors.textMuted}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: type === 'income' ? '#22C55E' : colors.textMuted }}
                        >
                          {t('add.income')}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                </HStack>
              )}

              <Center className="py-4">
                <Text className="text-typography-500 text-sm mb-2">{t('add.amount')} ({currency.code})</Text>
                <Input size="xl" variant="underlined" className="w-full max-w-[250px]">
                  <InputField
                    placeholder="0"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={(text) => { setAmount(formatAmountInput(text)); setSuccess(false); setError(null); }}
                    className="text-4xl text-center font-bold"
                    textAlign="center"
                  />
                </Input>
              </Center>

              {mode === 'transaction' ? (
                <>
                  <VStack space="sm">
                    <Text className="text-typography-700 font-medium">{t('add.account')}</Text>
                    <AccountPicker accounts={accounts} selectedId={accountId} onSelect={setAccountId} formatMoney={formatMoney} />
                  </VStack>
                  {type === 'expense' ? (
                    <VStack space="sm">
                      <Text className="text-typography-700 font-medium">{t('add.category')}</Text>
                      <CategoryPicker categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} />
                    </VStack>
                  ) : (
                    <VStack space="sm">
                      <Text className="text-typography-700 font-medium">{t('add.category')}</Text>
                      <Box className="p-3 rounded-xl border-2" style={{ borderColor: '#22C55E', backgroundColor: isDark ? '#052E16' : '#F0FDF4' }}>
                        <HStack space="md" className="items-center">
                          <Box className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: incomeCategory?.color || '#22C55E' }}>
                            <Ionicons name={(incomeCategory?.icon as keyof typeof Ionicons.glyphMap) || 'trending-up'} size={20} color="white" />
                          </Box>
                          <Text className="font-medium text-typography-900">{t('add.income')}</Text>
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
                <Text className="text-typography-700 font-medium">{t('add.noteOptional')}</Text>
                <Input size="lg">
                  <InputField placeholder={t('add.notePlaceholder')} value={note} onChangeText={setNote} maxLength={20} />
                </Input>
                <Text className="text-typography-400 text-xs text-right">{t('common.characters', { current: note.length, max: 20 })}</Text>
              </VStack>

              {success && (
                <Center className="bg-success-100 p-3 rounded-xl">
                  <Text className="text-success-700 font-medium">
                    {mode === 'transaction' ? t('add.transactionSaved') : t('add.transferSaved')}
                  </Text>
                </Center>
              )}

              {error && (
                <Center className="bg-error-100 p-3 rounded-xl">
                  <Text className="text-error-700 font-medium">
                    {error}
                  </Text>
                </Center>
              )}
            </VStack>

            <Button
              size="xl"
              className="w-full mt-4"
              style={{ backgroundColor: mode === 'transfer' ? theme.colors.secondary : theme.colors.primary }}
              onPress={handleSave}
              isDisabled={!isValid || isLoading}
            >
              <ButtonText className="text-white font-semibold">
                {isLoading ? t('add.saving') : t('common.save')}
              </ButtonText>
            </Button>
          </Box>
      </KeyboardAwareScrollView>
    </View>
  );
}
