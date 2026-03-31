import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useSettings } from '@/hooks';
import { NotificationsSection } from '@/components/settings';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import type { ReminderFrequency } from '@/lib/notifications';

export default function NotificationsSettingsPage() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { reminderFrequency, setReminderFrequency } = useSettings();

  return (
    <SettingsPageWrapper title={t('settings.notifications')}>
      <NotificationsSection
        reminderFrequency={reminderFrequency}
        onReminderChange={(freq: ReminderFrequency) => {
          posthog.capture('notification_frequency_changed', { frequency: freq });
          setReminderFrequency(freq);
        }}
      />
    </SettingsPageWrapper>
  );
}
