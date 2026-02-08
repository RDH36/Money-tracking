import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { SettingSection } from './SettingSection';
import { SettingRow } from './SettingRow';

interface PrivacySectionProps {
  balanceHidden: boolean;
  onToggle: () => void;
}

export function PrivacySection({ balanceHidden, onToggle }: PrivacySectionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  return (
    <SettingSection title={t('settings.privacy')}>
      <SettingRow
        label={t('settings.hideBalance')}
        onPress={onToggle}
        isLast
        rightElement={
          <Box
            className="w-12 h-7 rounded-full p-0.5 justify-center"
            style={{ backgroundColor: balanceHidden ? theme.colors.primary : colors.switchOff }}
          >
            <Box
              className="w-6 h-6 rounded-full shadow"
              style={{ alignSelf: balanceHidden ? 'flex-end' : 'flex-start', backgroundColor: colors.switchThumb }}
            />
          </Box>
        }
      />
    </SettingSection>
  );
}
