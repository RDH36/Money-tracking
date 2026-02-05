import { Box } from '@/components/ui/box';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { SettingSection } from './SettingSection';
import { SettingRow } from './SettingRow';

interface PrivacySectionProps {
  balanceHidden: boolean;
  onToggle: () => void;
}

export function PrivacySection({ balanceHidden, onToggle }: PrivacySectionProps) {
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';

  const trackOff = isDark ? '#39393D' : '#E5E5EA';
  const thumbColor = isDark ? '#FFFFFF' : '#FFFFFF';

  return (
    <SettingSection title="Confidentialité">
      <SettingRow
        label="Masquer le solde"
        onPress={onToggle}
        isLast
        rightElement={
          <Box
            className="w-12 h-7 rounded-full p-0.5 justify-center"
            style={{ backgroundColor: balanceHidden ? theme.colors.primary : trackOff }}
          >
            <Box
              className="w-6 h-6 rounded-full shadow"
              style={{ alignSelf: balanceHidden ? 'flex-end' : 'flex-start', backgroundColor: thumbColor }}
            />
          </Box>
        }
      />
    </SettingSection>
  );
}
