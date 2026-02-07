import { useRouter } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { useTheme } from '@/contexts';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6">
        <VStack className="flex-1 justify-center" space="xl">
          <Center>
            <Text className="text-6xl mb-4">💰</Text>
            <Heading size="2xl" className="text-center text-typography-900">
              {t('onboarding.appName')}
            </Heading>
            <Text className="text-center text-typography-600 mt-2">
              {t('onboarding.tagline')}
            </Text>
          </Center>

          <VStack space="md" className="mt-8">
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ {t('onboarding.feature1')}
              </Text>
            </Box>
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ {t('onboarding.feature2')}
              </Text>
            </Box>
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ {t('onboarding.feature3')}
              </Text>
            </Box>
            <Box className="bg-background-50 p-4 rounded-xl">
              <Text className="text-typography-700">
                ✓ {t('onboarding.feature4')}
              </Text>
            </Box>
          </VStack>
        </VStack>

        <VStack space="md">
          <Button
            size="xl"
            className="w-full"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={() => router.push('/tutorial')}
          >
            <ButtonText className="text-white">{t('onboarding.start')}</ButtonText>
          </Button>

          <Text className="text-typography-400 text-xs text-center">
            {t('onboarding.termsPrefix')}{' '}
            <Pressable onPress={() => openLink('https://www.mitsitsy.app/terms')}>
              <Text className="text-typography-500 text-xs underline">{t('onboarding.termsLink')}</Text>
            </Pressable>
            {' '}{t('onboarding.and')}{' '}
            <Pressable onPress={() => openLink('https://www.mitsitsy.app/privacy')}>
              <Text className="text-typography-500 text-xs underline">{t('onboarding.privacyLink')}</Text>
            </Pressable>
          </Text>
        </VStack>
      </Box>
    </View>
  );
}
