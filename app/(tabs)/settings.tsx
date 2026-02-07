import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Heading } from '@/components/ui/heading';
import { getCurrencyByCode } from '@/constants/currencies';
import { useTheme } from '@/contexts';
import { useSettings, useAccounts, useCategories } from '@/hooks';
import { AddCategoryModal } from '@/components/AddCategoryModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CurrencyConversionDialog } from '@/components/CurrencyConversionDialog';
import {
  AccountsSection,
  CategoriesSection,
  AppearanceSection,
  LanguageSection,
  NotificationsSection,
  PrivacySection,
  AboutSection,
} from '@/components/settings';
import { fetchExchangeRate } from '@/lib/exchangeRate';
import { checkInternetConnection } from '@/lib/network';
import type { Category, AccountWithBalance } from '@/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { themeId, setTheme } = useTheme();
  const {
    balanceHidden,
    toggleBalanceVisibility,
    colorMode,
    setColorMode,
    reminderFrequency,
    setReminderFrequency,
    currencyCode,
    changeCurrencyWithConversion,
  } = useSettings();
  const { accounts, formatMoney, refresh: refreshAccounts, deleteAccount, convertAllBalances } = useAccounts();
  const {
    expenseCategories,
    refresh: refreshCategories,
    createCategory,
    deleteCategory,
    canCreateCategory,
    customCategoriesCount,
    maxCustomCategories,
  } = useCategories();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<AccountWithBalance | null>(null);
  const [pendingCurrencyCode, setPendingCurrencyCode] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | undefined>();
  const [conversionError, setConversionError] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshCategories();
    }, [refreshAccounts, refreshCategories])
  );

  const handleCreateCategory = async (params: { name: string; icon: string; color: string }) => {
    const result = await createCategory(params);
    if (result.success) setShowAddCategory(false);
    return result;
  };

  const handleCurrencyPress = async (code: string) => {
    if (code === currencyCode) return;
    setConversionError(undefined);
    setExchangeRate(undefined);
    setPendingCurrencyCode(code);
    setIsFetchingRate(true);

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      setIsFetchingRate(false);
      setConversionError('Pas de connexion internet');
      return;
    }

    try {
      const rate = await fetchExchangeRate(currencyCode, code);
      setExchangeRate(rate);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleCurrencyConversion = async () => {
    if (!pendingCurrencyCode || !exchangeRate) return;
    setIsConverting(true);
    try {
      const success = await convertAllBalances(exchangeRate);
      if (!success) {
        setConversionError('Erreur lors de la conversion');
        return;
      }
      await changeCurrencyWithConversion(pendingCurrencyCode, async () => true);
      setPendingCurrencyCode(null);
      setExchangeRate(undefined);
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <View className="flex-1 bg-background-50" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <Heading size="2xl" className="text-typography-900 px-4 py-6">
          {t('settings.title')}
        </Heading>

        <AccountsSection
          accounts={accounts}
          formatMoney={formatMoney}
          onDelete={setDeleteAccountTarget}
        />

        <CategoriesSection
          categories={expenseCategories}
          customCount={customCategoriesCount}
          maxCustom={maxCustomCategories}
          onAdd={() => setShowAddCategory(true)}
          onDelete={setDeleteCategoryTarget}
        />

        <AppearanceSection
          themeId={themeId}
          colorMode={colorMode}
          currencyCode={currencyCode}
          onThemeChange={setTheme}
          onColorModeChange={setColorMode}
          onCurrencyChange={handleCurrencyPress}
        />

        <LanguageSection />

        <NotificationsSection
          reminderFrequency={reminderFrequency}
          onReminderChange={setReminderFrequency}
        />

        <PrivacySection
          balanceHidden={balanceHidden}
          onToggle={toggleBalanceVisibility}
        />

        <AboutSection />
      </ScrollView>

      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onCreateCategory={handleCreateCategory}
        canCreateCategory={canCreateCategory}
        customCategoriesCount={customCategoriesCount}
        maxCustomCategories={maxCustomCategories}
      />

      <ConfirmDialog
        isOpen={!!deleteCategoryTarget}
        title={t('category.deleteConfirm')}
        message={t('common.deleteItem', { name: deleteCategoryTarget?.name })}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={async () => {
          if (deleteCategoryTarget) await deleteCategory(deleteCategoryTarget.id);
          setDeleteCategoryTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteAccountTarget}
        title={t('account.deleteConfirm')}
        message={t('common.deleteItem', { name: deleteAccountTarget?.name })}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteAccountTarget(null)}
        onConfirm={async () => {
          if (deleteAccountTarget) await deleteAccount(deleteAccountTarget.id);
          setDeleteAccountTarget(null);
        }}
      />

      <CurrencyConversionDialog
        isOpen={!!pendingCurrencyCode}
        fromCurrency={getCurrencyByCode(currencyCode)}
        toCurrency={getCurrencyByCode(pendingCurrencyCode || currencyCode)}
        isLoading={isConverting}
        isFetchingRate={isFetchingRate}
        exchangeRate={exchangeRate}
        error={conversionError}
        onClose={() => {
          if (!isConverting && !isFetchingRate) {
            setPendingCurrencyCode(null);
            setExchangeRate(undefined);
            setConversionError(undefined);
          }
        }}
        onConfirm={handleCurrencyConversion}
      />
    </View>
  );
}
