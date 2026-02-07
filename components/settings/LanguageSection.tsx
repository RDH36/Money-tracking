import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme, useLanguage } from '@/contexts';
import { SettingSection } from './SettingSection';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { LANGUAGES, LanguageCode } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';

export function LanguageSection() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';

  const cardBg = isDark ? '#1C1C1E' : '#FFF';
  const cardBorder = isDark ? '#38383A' : '#E5E5E5';
  const textMuted = isDark ? '#8E8E93' : '#666';

  return (
    <SettingSection title={t('settings.language')}>
      <Box className="px-4 py-3">
        <HStack space="sm">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code as LanguageCode)}
                className="flex-1"
              >
                <VStack
                  className="items-center py-3 rounded-xl border-2"
                  style={{
                    borderColor: isSelected ? theme.colors.primary : cardBorder,
                    backgroundColor: isSelected ? theme.colors.primaryLight : cardBg,
                  }}
                  space="xs"
                >
                  <Text className="text-2xl">{lang.flag}</Text>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: isSelected ? theme.colors.primary : textMuted }}
                  >
                    {lang.name}
                  </Text>
                  {isSelected && (
                    <Box
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
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
    </SettingSection>
  );
}
