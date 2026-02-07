import { Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { THEMES } from '@/constants/colors';
import { CURRENCIES } from '@/constants/currencies';
import { useTheme } from '@/contexts';
import { SettingSection } from './SettingSection';
import { ColorMode } from '@/stores/settingsStore';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';

interface AppearanceSectionProps {
  themeId: string;
  colorMode: ColorMode;
  currencyCode: string;
  onThemeChange: (id: string) => void;
  onColorModeChange: (mode: ColorMode) => void;
  onCurrencyChange: (code: string) => void;
}

export function AppearanceSection({
  themeId,
  colorMode,
  currencyCode,
  onThemeChange,
  onColorModeChange,
  onCurrencyChange,
}: AppearanceSectionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';

  const COLOR_MODES: { value: ColorMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'light', label: t('settings.light'), icon: 'sunny' },
    { value: 'dark', label: t('settings.dark'), icon: 'moon' },
    { value: 'system', label: t('settings.auto'), icon: 'phone-portrait-outline' },
  ];

  // Dark mode aware colors
  const cardBg = isDark ? '#1C1C1E' : '#FFF';
  const cardBorder = isDark ? '#38383A' : '#E5E5E5';
  const textMuted = isDark ? '#8E8E93' : '#666';
  const chipBg = isDark ? '#2C2C2E' : '#F2F2F7';

  return (
    <SettingSection title={t('settings.appearance')}>
      {/* Mode d'affichage */}
      <Box className="px-4 py-3 border-b border-outline-100">
        <Text className="text-typography-900 mb-3">{t('settings.mode')}</Text>
        <HStack space="sm">
          {COLOR_MODES.map((mode) => {
            const isSelected = colorMode === mode.value;
            return (
              <Pressable key={mode.value} onPress={() => onColorModeChange?.(mode.value)} className="flex-1">
                <VStack
                  className="items-center py-3 rounded-xl border-2"
                  style={{
                    borderColor: isSelected ? theme.colors.primary : cardBorder,
                    backgroundColor: isSelected ? theme.colors.primaryLight : cardBg,
                  }}
                  space="xs"
                >
                  <Ionicons
                    name={mode.icon}
                    size={20}
                    color={isSelected ? theme.colors.primary : textMuted}
                  />
                  <Text
                    className="text-xs font-medium"
                    style={{ color: isSelected ? theme.colors.primary : textMuted }}
                  >
                    {mode.label}
                  </Text>
                </VStack>
              </Pressable>
            );
          })}
        </HStack>
      </Box>

      {/* Thème */}
      <Box className="px-4 py-3 border-b border-outline-100">
        <Text className="text-typography-900 mb-3">{t('settings.color')}</Text>
        <HStack space="sm" className="flex-wrap">
          {THEMES.map((t) => {
            const isSelected = themeId === t.id;
            return (
              <Pressable key={t.id} onPress={() => onThemeChange(t.id)}>
                <VStack
                  className="items-center p-2 rounded-xl border-2"
                  style={{
                    borderColor: isSelected ? t.colors.primary : cardBorder,
                    backgroundColor: isSelected ? t.colors.primaryLight : cardBg,
                    width: 72,
                  }}
                  space="xs"
                >
                  <HStack space="xs">
                    <Box className="w-5 h-5 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                    <Box className="w-5 h-5 rounded-full" style={{ backgroundColor: t.colors.secondary }} />
                  </HStack>
                  <Text
                    className="text-[10px] font-medium"
                    style={{ color: isSelected ? t.colors.primary : textMuted }}
                  >
                    {t.name}
                  </Text>
                  {isSelected && (
                    <Box
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                      style={{ backgroundColor: t.colors.primary }}
                    >
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </Box>
                  )}
                </VStack>
              </Pressable>
            );
          })}
        </HStack>
      </Box>

      {/* Devise */}
      <Box className="px-4 py-3">
        <Text className="text-typography-900 mb-2">{t('settings.currency')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CURRENCIES.map((c) => {
            const isSelected = currencyCode === c.code;
            return (
              <Pressable key={c.code} onPress={() => onCurrencyChange(c.code)}>
                <HStack
                  className="px-3 py-2 rounded-full items-center"
                  style={{
                    backgroundColor: isSelected ? theme.colors.primary : chipBg,
                  }}
                  space="xs"
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: isSelected ? '#FFF' : textMuted }}
                  >
                    {c.symbol}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: isSelected ? '#FFF' : textMuted }}
                  >
                    {c.code}
                  </Text>
                </HStack>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>
    </SettingSection>
  );
}
