import { Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { ReminderFrequency } from '@/lib/notifications';
import { SettingSection } from './SettingSection';
import { SettingRow } from './SettingRow';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { useTranslation } from 'react-i18next';

const REMINDER_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '2h', label: '2h' },
  { value: '4h', label: '4h' },
  { value: 'off', label: 'Off' },
];

interface NotificationsSectionProps {
  reminderFrequency: ReminderFrequency;
  onReminderChange: (value: ReminderFrequency) => void;
}

export function NotificationsSection({ reminderFrequency, onReminderChange }: NotificationsSectionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const chipContainerBg = isDark ? '#2C2C2E' : '#E5E5EA';

  return (
    <SettingSection title={t('settings.notifications')}>
      <Box className="px-4 py-3 border-b border-outline-100">
        <HStack className="justify-between items-center">
          <Text className="text-typography-900">{t('settings.expenseReminders')}</Text>
          <HStack className="rounded-lg p-0.5" style={{ backgroundColor: chipContainerBg }}>
            {REMINDER_OPTIONS.map((opt) => {
              const isSelected = reminderFrequency === opt.value;
              return (
                <Pressable key={opt.value} onPress={() => onReminderChange(opt.value)}>
                  <Box
                    className="px-3 py-1.5 rounded-md"
                    style={{ backgroundColor: isSelected ? theme.colors.primary : 'transparent' }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: isSelected ? '#FFFFFF' : colors.textMuted }}
                    >
                      {opt.label}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        </HStack>
      </Box>
      <SettingRow
        label={t('settings.planReminders')}
        rightText={t('settings.automatic')}
        isLast
      />
    </SettingSection>
  );
}
