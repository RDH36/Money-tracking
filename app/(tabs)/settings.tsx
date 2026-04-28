import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useAccounts, useCategories } from '@/hooks';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useSQLiteContext } from '@/lib/database';
import { migrateDatabase } from '@/lib/database/migrations';
import { cancelAllReminders } from '@/lib/notifications';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AboutSection, DangerZoneSection } from '@/components/settings';
import { useV2 } from '@/constants/designTokensV2';
import {
  SectionLabel,
  SettingsCard,
  SettingsRow,
  SettingsHeader,
} from '@/components/settings/v2';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const v2 = useV2();
  const router = useRouter();
  const db = useSQLiteContext();
  const posthog = usePostHog();
  const { accounts } = useAccounts();
  const { customCategoriesCount } = useCategories();

  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; confirmText: string; onConfirm: () => void;
  } | null>(null);

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
        currentStreak: 0, longestStreak: 0, lastActivityDate: '', totalXP: 0,
        streakFreezeAvailable: 1, streakFreezeUsedDate: '',
        dailyChallengeDate: '', dailyChallengeType: '', dailyChallengeCompleted: false,
        weeklyChallengeStart: '', weeklyChallengeType: '', weeklyChallengeCompleted: false,
        monthlyChallengeMonth: '', monthlyChallengeType: '', monthlyChallengeCompleted: false,
        badges: [],
      });
      setConfirmAction(null);
      setTimeout(() => router.replace('/onboarding'), 300);
    } catch (err) { console.error(err); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 }}>
        <SettingsHeader title={t('settingsV2.headerTitle')} showBack={false} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        <SectionLabel>{t('settingsV2.preferencesSection')}</SectionLabel>
        <SettingsCard>
          <SettingsRow
            icon="business-outline"
            iconColor="#3B82F6"
            label={t('settings.accounts')}
            value={String(accounts.length)}
            onPress={() => router.push('/settings/accounts' as any)}
          />
          <SettingsRow
            icon="grid-outline"
            iconColor="#8B5CF6"
            label={t('settings.categoriesBudgets')}
            value={t('settingsV2.categoriesActiveCount', { count: customCategoriesCount })}
            onPress={() => router.push('/settings/categories' as any)}
          />
          <SettingsRow
            icon="color-palette-outline"
            iconColor="#EC4899"
            label={t('settings.appearance')}
            onPress={() => router.push('/settings/appearance' as any)}
          />
          <SettingsRow
            icon="globe-outline"
            iconColor="#10B981"
            label={t('settings.language')}
            onPress={() => router.push('/settings/language' as any)}
          />
          <SettingsRow
            icon="notifications-outline"
            iconColor="#F59E0B"
            label={t('settings.notifications')}
            onPress={() => router.push('/settings/notifications' as any)}
          />
          <SettingsRow
            icon="lock-closed-outline"
            iconColor="#6366F1"
            label={t('settings.privacy')}
            onPress={() => router.push('/settings/privacy' as any)}
          />
          <SettingsRow
            icon="chatbubble-outline"
            iconColor="#14B8A6"
            label={t('settings.feedback')}
            onPress={() => router.push('/settings/feedback' as any)}
            isLast
          />
        </SettingsCard>

        <AboutSection />

        <DangerZoneSection
          onReset={() => setConfirmAction({
            title: t('settings.resetConfirm'),
            message: t('settings.resetMessage'),
            confirmText: t('settings.reset'),
            onConfirm: handleResetApp,
          })}
        />

        <Text
          style={{
            marginTop: 18, textAlign: 'center',
            fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 14, fontStyle: 'italic',
            color: v2.inkSubtle,
          }}
        >
          {t('settingsV2.tagline')}
        </Text>
      </ScrollView>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || ''}
        isDestructive
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </View>
  );
}
