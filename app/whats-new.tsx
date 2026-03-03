import { useEffect } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { CHANGELOG, CURRENT_VERSION } from '@/constants/changelog';
import { useWhatsNew } from '@/hooks';

const TYPE_CONFIG = {
  added: { icon: 'add-circle' as const, color: '#22C55E' },
  fixed: { icon: 'build' as const, color: '#F59E0B' },
  improved: { icon: 'trending-up' as const, color: '#3B82F6' },
};

export default function WhatsNewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = useEffectiveColorScheme() === 'dark';
  const colors = getDarkModeColors(isDark);
  const { markSeen } = useWhatsNew();

  useEffect(() => {
    markSeen();
  }, [markSeen]);

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <HStack className="px-4 py-3 items-center" space="md">
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.textMuted} />
        </Pressable>
        <Heading size="xl" className="text-typography-900">
          {t('settings.whatsNew')}
        </Heading>
      </HStack>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <VStack space="xl">
          {CHANGELOG.map((entry) => (
            <VStack key={entry.version} space="sm">
              <HStack className="items-center" space="sm">
                <Box
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: entry.version === CURRENT_VERSION ? theme.colors.primary : colors.textMuted + '30' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: entry.version === CURRENT_VERSION ? '#FFFFFF' : colors.textMuted }}
                  >
                    v{entry.version}
                  </Text>
                </Box>
                <Text className="text-typography-500 text-xs">{entry.date}</Text>
                {entry.version === CURRENT_VERSION && (
                  <Box className="px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary + '20' }}>
                    <Text className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                      {t('changelog.current')}
                    </Text>
                  </Box>
                )}
              </HStack>

              <Box className="rounded-xl border border-outline-100 p-4" style={{ backgroundColor: colors.cardBg }}>
                <VStack space="sm">
                  {entry.changes.map((change, idx) => {
                    const config = TYPE_CONFIG[change.type];
                    return (
                      <HStack key={idx} space="sm" className="items-start">
                        <Ionicons name={config.icon} size={18} color={config.color} style={{ marginTop: 2 }} />
                        <Text className="text-typography-800 flex-1 text-sm">{t(change.key)}</Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            </VStack>
          ))}
        </VStack>
      </ScrollView>
    </View>
  );
}
