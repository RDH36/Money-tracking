import { useState, useCallback } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
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
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ValidatePlanificationDialog } from '@/components/ValidatePlanificationDialog';
import { usePlanificationDetail, useCategories, useBalance, usePlanifications, useAccounts, SYSTEM_CATEGORY_INCOME_ID } from '@/hooks';
import { useTheme } from '@/contexts';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, parseAmount, getNumericValue } from '@/lib/amountInput';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { TransactionType } from '@/types';

const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

function formatDate(dateStr: string, language: string = 'fr'): string {
  const date = new Date(dateStr);
  const localeMap: { [key: string]: string } = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE' };
  const locale = localeMap[language] || 'fr-FR';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export default function PlanificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const currency = useCurrency();
  const { balance, refresh: refreshBalance } = useBalance();
  const { accounts, refresh: refreshAccounts, formatMoney } = useAccounts();
  const { expenseCategories, incomeCategory, refresh: refreshCategories } = useCategories();
  const { validatePlanification, updateDeadline } = usePlanifications();
  const { planification, items, total, addItem, removeItem, refresh: refreshDetail, isLoading, isFetching } = usePlanificationDetail(id || null);

  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const getCategoryName = (categoryId: string | null, categoryName: string | null) => {
    if (!categoryId) return t('common.noCategory');
    if (DEFAULT_CATEGORY_IDS.includes(categoryId)) {
      return t(`categories.${categoryId}`);
    }
    return categoryName || t('common.noCategory');
  };

  useFocusEffect(
    useCallback(() => {
      refreshCategories();
    }, [refreshCategories])
  );

  const [amount, setAmount] = useState('');
  const [itemType, setItemType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showValidateDialog, setShowValidateDialog] = useState(false);

  const handleDeadlineChange = async (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && id && planification) {
      await updateDeadline(id, planification.title, selectedDate);
      await refreshDetail();
    }
  };

  const handleRemoveDeadline = async () => {
    if (id && planification) {
      await updateDeadline(id, planification.title, null);
      await refreshDetail();
    }
  };

  const handleAddItem = async () => {
    const numericAmount = getNumericValue(amount);
    if (!numericAmount || numericAmount <= 0) return;
    const finalCategoryId = itemType === 'income' ? SYSTEM_CATEGORY_INCOME_ID : categoryId;
    await addItem(parseAmount(amount), itemType, finalCategoryId, note.trim() || null);
    setAmount('');
    setItemType('expense');
    setCategoryId(null);
    setNote('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteItemId) {
      await removeItem(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const handleValidateConfirm = async (planificationId: string, accountId: string) => {
    const result = await validatePlanification(planificationId, accountId);
    if (result.success) {
      await refreshBalance();
      await refreshAccounts();
      router.back();
    }
    return result;
  };

  const isValid = amount && getNumericValue(amount) > 0;
  const isPending = planification?.status === 'pending';
  const expired = isPending && isExpired(planification?.deadline || null);

  // Calculate expenses and income separately
  const totalExpenses = items.reduce((sum, item) => item.type !== 'income' ? sum + item.amount : sum, 0);
  const totalIncome = items.reduce((sum, item) => item.type === 'income' ? sum + item.amount : sum, 0);
  const netImpact = totalExpenses - totalIncome; // positive = net expense, negative = net income

  const projectedBalance = balance - netImpact;
  const isNegative = projectedBalance < 0;

  if (!planification && !isFetching) {
    return (
      <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
        <Center className="flex-1">
          <Text className="text-typography-500">{t('planification.notFound')}</Text>
          <Button className="mt-4" onPress={() => router.back()}><ButtonText>{t('onboarding.back')}</ButtonText></Button>
        </Center>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        bottomOffset={20}
      >
        <VStack className="p-6" space="xl">
            <HStack className="justify-between items-center">
              <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
              </Pressable>
              <Heading size="lg" className="text-typography-900 flex-1 ml-2" numberOfLines={1}>
                {planification?.title || t('common.loading')}
              </Heading>
            </HStack>

            {isPending && (
              <Box className="p-3 rounded-xl bg-background-50">
                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center flex-1">
                    <Ionicons name="calendar-outline" size={20} color={expired ? '#DC2626' : theme.colors.primary} />
                    <VStack>
                      <Text className="text-typography-600 text-sm">{t('planification.deadline')}</Text>
                      {planification?.deadline ? (
                        <Text className="font-semibold" style={{ color: expired ? '#DC2626' : theme.colors.primary }}>
                          {formatDate(planification.deadline, i18n.language)}{expired && ` (${t('planification.expired')})`}
                        </Text>
                      ) : (
                        <Text className="text-typography-500">{t('planification.notDefined')}</Text>
                      )}
                    </VStack>
                  </HStack>
                  <HStack space="sm">
                    <Pressable onPress={() => setShowDatePicker(true)} className="p-2 rounded-lg bg-background-100">
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </Pressable>
                    {planification?.deadline && (
                      <Pressable onPress={handleRemoveDeadline} className="p-2 rounded-lg bg-background-100">
                        <Ionicons name="close" size={20} color={colors.textMuted} />
                      </Pressable>
                    )}
                  </HStack>
                </HStack>
                {showDatePicker && (
                  <DateTimePicker value={planification?.deadline ? new Date(planification.deadline) : new Date()} mode="date" display="default" minimumDate={new Date()} onChange={handleDeadlineChange} />
                )}
              </Box>
            )}

            {!isPending && (
              <Box className="p-3 rounded-xl bg-background-100">
                <HStack space="sm" className="items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-typography-600 flex-1">{t('planification.validatedMessage')}</Text>
                </HStack>
              </Box>
            )}

            <Box className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.primaryLight }}>
              <VStack space="md">
                <HStack className="justify-between">
                  <Text className="text-typography-600">{t('planification.currentBalance')}</Text>
                  <Text className="text-typography-900 font-semibold">{formatMoney(balance)}</Text>
                </HStack>
                {(totalExpenses > 0 || totalIncome > 0) && isPending && (
                  <>
                    {totalExpenses > 0 && (
                      <HStack className="justify-between">
                        <Text className="text-typography-600">{t('planification.plannedExpenses')}</Text>
                        <Text className="text-error-600 font-semibold">- {formatMoney(totalExpenses)}</Text>
                      </HStack>
                    )}
                    {totalIncome > 0 && (
                      <HStack className="justify-between">
                        <Text className="text-typography-600">{t('planification.plannedIncome')}</Text>
                        <Text className="text-success-600 font-semibold">+ {formatMoney(totalIncome)}</Text>
                      </HStack>
                    )}
                    <Box className="h-px bg-outline-200" />
                    <HStack className="justify-between items-center">
                      <Text className="text-typography-700 font-medium">{t('planification.balanceAfter')}</Text>
                      <Text className="text-2xl font-bold" style={{ color: isNegative ? '#DC2626' : theme.colors.primary }}>{formatMoney(projectedBalance)}</Text>
                    </HStack>
                    {isNegative && (
                      <HStack space="xs" className="items-center">
                        <Ionicons name="warning" size={16} color="#DC2626" />
                        <Text className="text-error-600 text-sm">{t('planification.negativeWarning')}</Text>
                      </HStack>
                    )}
                  </>
                )}
              </VStack>
            </Box>

            {isPending && (
              <VStack space="md">
                <Text className="text-typography-700 font-semibold text-lg">{t('planification.addElement')}</Text>
                <HStack space="sm" className="justify-center">
                  <Pressable onPress={() => setItemType('expense')} className="flex-1">
                    <Box
                      className="py-3 px-4 rounded-xl border-2 items-center"
                      style={{
                        borderColor: itemType === 'expense' ? '#EF4444' : colors.cardBorder,
                        backgroundColor: itemType === 'expense' ? (isDark ? '#450A0A' : '#FEF2F2') : colors.cardBg,
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="arrow-down-circle"
                          size={20}
                          color={itemType === 'expense' ? '#EF4444' : colors.textMuted}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: itemType === 'expense' ? '#EF4444' : colors.textMuted }}
                        >
                          {t('add.expense')}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => setItemType('income')} className="flex-1">
                    <Box
                      className="py-3 px-4 rounded-xl border-2 items-center"
                      style={{
                        borderColor: itemType === 'income' ? '#22C55E' : colors.cardBorder,
                        backgroundColor: itemType === 'income' ? (isDark ? '#052E16' : '#F0FDF4') : colors.cardBg,
                      }}
                    >
                      <HStack space="sm" className="items-center">
                        <Ionicons
                          name="arrow-up-circle"
                          size={20}
                          color={itemType === 'income' ? '#22C55E' : colors.textMuted}
                        />
                        <Text
                          className="font-semibold"
                          style={{ color: itemType === 'income' ? '#22C55E' : colors.textMuted }}
                        >
                          {t('add.income')}
                        </Text>
                      </HStack>
                    </Box>
                  </Pressable>
                </HStack>
                <Center>
                  <Text className="text-typography-500 text-sm mb-2">{t('planification.amount')} ({currency.code})</Text>
                  <Input size="xl" variant="underlined" className="w-full max-w-[200px]">
                    <InputField placeholder="0" keyboardType="decimal-pad" value={amount} onChangeText={(t) => setAmount(formatAmountInput(t))} className="text-3xl text-center font-bold" textAlign="center" />
                  </Input>
                </Center>
                {itemType === 'expense' ? (
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
                <VStack space="sm">
                  <Text className="text-typography-700 font-medium">{t('add.noteOptional')}</Text>
                  <Input size="md"><InputField placeholder="Ex: Restaurant..." value={note} onChangeText={setNote} maxLength={20} /></Input>
                  <Text className="text-typography-400 text-xs text-right">{t('common.characters', { current: note.length, max: 20 })}</Text>
                </VStack>
                <Button size="lg" className="w-full" style={{ backgroundColor: itemType === 'income' ? '#22C55E' : theme.colors.primary }} onPress={handleAddItem} isDisabled={!isValid || isLoading}>
                  <ButtonText className="text-white font-semibold">{t('planification.add')}</ButtonText>
                </Button>
              </VStack>
            )}

            {items.length > 0 && (
              <VStack space="md">
                <Text className="text-typography-700 font-semibold text-lg">{t('planification.elements', { count: items.length })}</Text>
                {items.map((item) => {
                  const isIncome = item.type === 'income';
                  return (
                    <HStack key={item.id} className="bg-background-50 p-3 rounded-xl items-center justify-between">
                      <HStack space="md" className="items-center flex-1">
                        <Box className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: item.category_color || '#94A3B8' }}>
                          {item.category_icon && <Ionicons name={item.category_icon as keyof typeof Ionicons.glyphMap} size={20} color="white" />}
                        </Box>
                        <VStack className="flex-1">
                          <Text className="text-typography-900 font-medium">{getCategoryName(item.category_id, item.category_name)}</Text>
                          {item.note && <Text className="text-typography-500 text-xs" numberOfLines={1}>{item.note}</Text>}
                        </VStack>
                      </HStack>
                      <HStack space="md" className="items-center">
                        <Text className="font-semibold" style={{ color: isIncome ? '#22C55E' : '#EF4444' }}>
                          {isIncome ? '+' : '-'}{formatMoney(item.amount)}
                        </Text>
                        {isPending && <Pressable onPress={() => setDeleteItemId(item.id)}><Ionicons name="close-circle" size={24} color="#DC2626" /></Pressable>}
                      </HStack>
                    </HStack>
                  );
                })}
              </VStack>
            )}

            {items.length === 0 && isPending && (
              <Center className="py-8">
                <Ionicons name="list-outline" size={48} color={colors.textMuted} />
                <Text className="text-typography-500 text-center mt-4">{t('planification.addElementsHint')}</Text>
              </Center>
            )}

            {isPending && items.length > 0 && (
              <VStack space="sm" className="mt-4">
                <Button size="lg" variant="outline" className="w-full" onPress={() => router.back()}>
                  <HStack space="sm" className="items-center">
                    <Ionicons name="save-outline" size={20} color={theme.colors.primary} />
                    <ButtonText style={{ color: theme.colors.primary }}>{t('planification.save')}</ButtonText>
                  </HStack>
                </Button>
                <Button size="lg" className="w-full" style={{ backgroundColor: theme.colors.primary }} onPress={() => setShowValidateDialog(true)}>
                  <HStack space="sm" className="items-center">
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <ButtonText className="text-white font-semibold">{t('planification.validateAndDeduct')}</ButtonText>
                  </HStack>
                </Button>
              </VStack>
            )}
        </VStack>
      </KeyboardAwareScrollView>

      <ConfirmDialog isOpen={!!deleteItemId} title={t('common.delete')} message={t('planification.deleteItemConfirm')} confirmText={t('common.delete')} isDestructive onClose={() => setDeleteItemId(null)} onConfirm={handleDeleteConfirm} />

      <ValidatePlanificationDialog
        isOpen={showValidateDialog}
        planification={planification ? { ...planification, total, item_count: items.length } : null}
        accounts={accounts}
        onClose={() => setShowValidateDialog(false)}
        onValidate={handleValidateConfirm}
        formatMoney={formatMoney}
      />
    </View>
  );
}
