import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Heading } from '@/components/ui/heading';
import { getCurrencyByCode } from '@/constants/currencies';
import { useTheme } from '@/contexts';
import { useSettings, useAccounts, useCategories } from '@/hooks';
import { useSQLiteContext } from '@/lib/database';
import { migrateDatabase } from '@/lib/database/migrations';
import { useGamificationStore } from '@/stores/gamificationStore';
import { cancelAllReminders, type ReminderFrequency } from '@/lib/notifications';
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
  FeedbackSection,
  AboutSection,
  DangerZoneSection,
} from '@/components/settings';
import { fetchExchangeRate } from '@/lib/exchangeRate';
import { checkInternetConnection } from '@/lib/network';
import { usePostHog } from 'posthog-react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
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
    tipsEnabled,
    setTipsEnabled,
  } = useSettings();
  const { accounts, formatMoney, refresh: refreshAccounts, deleteAccount, convertAllBalances } = useAccounts();
  const posthog = usePostHog();
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
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
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
    if (result.success) {
      posthog.capture('category_created');
      setShowAddCategory(false);
    }
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
      setConversionError('errors.noInternet');
      return;
    }

    try {
      const rate = await fetchExchangeRate(currencyCode, code);
      setExchangeRate(rate);
    } catch (error) {
      setConversionError('errors.unknown');
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
        setConversionError('errors.conversionFailed');
        return;
      }
      posthog.capture('currency_changed', {
        from_currency: currencyCode,
        to_currency: pendingCurrencyCode,
      });
      await changeCurrencyWithConversion(pendingCurrencyCode, async () => true);
      setPendingCurrencyCode(null);
      setExchangeRate(undefined);
    } catch (error) {
      setConversionError('errors.unknown');
    } finally {
      setIsConverting(false);
    }
  };

  const handleThemeChange = (newThemeId: string) => {
    posthog.capture('theme_changed', { theme_id: newThemeId });
    setTheme(newThemeId);
  };

  const handleReminderChange = (frequency: ReminderFrequency) => {
    posthog.capture('notification_frequency_changed', { frequency });
    setReminderFrequency(frequency);
  };

  const handleResetApp = async () => {
    posthog.capture('app_reset');
    try {
      await db.execAsync(`
        PRAGMA foreign_keys = OFF;
        DROP TABLE IF EXISTS planification_items;
        DROP TABLE IF EXISTS planifications;
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS accounts;
        DROP TABLE IF EXISTS categories;
        DROP TABLE IF EXISTS settings;
        DROP TABLE IF EXISTS sync_meta;
        DROP TABLE IF EXISTS gamification;
        DROP TABLE IF EXISTS badges;
        PRAGMA foreign_keys = ON;
        PRAGMA user_version = 0;
      `);
      await migrateDatabase(db);
      await cancelAllReminders();
      useGamificationStore.getState().initialize({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
        totalXP: 0,
        streakFreezeAvailable: 1,
        streakFreezeUsedDate: '',
        dailyChallengeDate: '',
        dailyChallengeType: '',
        dailyChallengeCompleted: false,
        badges: [],
      });
      setConfirmAction(null);
      setTimeout(() => router.replace('/onboarding'), 300);
    } catch (err) {
      console.error('Error resetting app:', err);
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
          onDelete={(account) => setConfirmAction({
            title: t('account.deleteConfirm', { name: account.name }),
            message: t('account.deleteWarning'),
            confirmText: t('common.delete'),
            onConfirm: () => { posthog.capture('account_deleted', { account_type: account.type }); deleteAccount(account.id); setConfirmAction(null); },
          })}
        />

        <CategoriesSection
          categories={expenseCategories}
          customCount={customCategoriesCount}
          maxCustom={maxCustomCategories}
          onAdd={() => setShowAddCategory(true)}
          onDelete={(category) => setConfirmAction({
            title: t('category.deleteConfirm', { name: category.name }),
            message: t('category.deleteConfirm', { name: category.name }),
            confirmText: t('common.delete'),
            onConfirm: () => { posthog.capture('category_deleted'); deleteCategory(category.id); setConfirmAction(null); },
          })}
        />

        <AppearanceSection
          themeId={themeId}
          colorMode={colorMode}
          currencyCode={currencyCode}
          tipsEnabled={tipsEnabled}
          onThemeChange={handleThemeChange}
          onColorModeChange={(mode: string) => { posthog.capture('color_mode_changed', { mode }); setColorMode(mode as any); }}
          onCurrencyChange={handleCurrencyPress}
          onTipsEnabledChange={(enabled: boolean) => { posthog.capture('tips_toggled', { enabled }); setTipsEnabled(enabled); }}
        />

        <LanguageSection />

        <NotificationsSection
          reminderFrequency={reminderFrequency}
          onReminderChange={handleReminderChange}
        />

        <PrivacySection
          balanceHidden={balanceHidden}
          onToggle={() => { posthog.capture('balance_visibility_toggled', { hidden: !balanceHidden }); toggleBalanceVisibility(); }}
        />

        <FeedbackSection />

        <AboutSection />

        <DangerZoneSection onReset={() => setConfirmAction({
          title: t('settings.resetConfirm'),
          message: t('settings.resetMessage'),
          confirmText: t('settings.reset'),
          onConfirm: handleResetApp,
        })} />
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
        isOpen={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || ''}
        isDestructive
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
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
