import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import { useSQLiteContext } from '@/lib/database';
import { migrateDatabase } from '@/lib/database/migrations';
import { useGamificationStore } from '@/stores/gamificationStore';
import { cancelAllReminders } from '@/lib/notifications';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SettingSection, SettingRow, AboutSection, DangerZoneSection } from '@/components/settings';
import { usePostHog } from 'posthog-react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();
  const posthog = usePostHog();

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
        dailyChallengeDate: '', dailyChallengeType: '', dailyChallengeCompleted: false, badges: [],
      });
      setConfirmAction(null);
      setTimeout(() => router.replace('/onboarding'), 300);
    } catch (err) {
      console.error('Error resetting app:', err);
    }
  };

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="font-display text-display-lg text-content-primary px-4 py-6">
          {t('settings.title')}
        </Text>

        <SettingSection>
          <SettingRow label={t('settings.accounts')} leftIcon="person-outline" leftIconColor="#3B82F6" onPress={() => router.push('/settings/accounts' as any)} />
          <SettingRow label={t('settings.categoriesBudgets')} leftIcon="grid-outline" leftIconColor="#8B5CF6" onPress={() => router.push('/settings/categories' as any)} />
          <SettingRow label={t('settings.appearance')} leftIcon="color-palette-outline" leftIconColor="#EC4899" onPress={() => router.push('/settings/appearance' as any)} />
          <SettingRow label={t('settings.language')} leftIcon="globe-outline" leftIconColor="#10B981" onPress={() => router.push('/settings/language' as any)} />
          <SettingRow label={t('settings.notifications')} leftIcon="notifications-outline" leftIconColor="#F59E0B" onPress={() => router.push('/settings/notifications' as any)} />
          <SettingRow label={t('settings.privacy')} leftIcon="lock-closed-outline" leftIconColor="#6366F1" onPress={() => router.push('/settings/privacy' as any)} />
          <SettingRow label={t('settings.feedback')} leftIcon="chatbubble-outline" leftIconColor="#14B8A6" onPress={() => router.push('/settings/feedback' as any)} isLast />
        </SettingSection>

        <AboutSection />

        <DangerZoneSection onReset={() => setConfirmAction({
          title: t('settings.resetConfirm'),
          message: t('settings.resetMessage'),
          confirmText: t('settings.reset'),
          onConfirm: handleResetApp,
        })} />
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
