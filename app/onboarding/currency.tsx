import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';
import { useSettings } from '@/hooks';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';

export default function CurrencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { setCurrency } = useSettings();
  const { t } = useTranslation();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    await setCurrency(selectedCurrency);
    setIsLoading(false);
    router.push('/onboarding/balance');
  };

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6">
        <VStack space="md" className="mb-6">
          <Text className="text-typography-500">{t('onboarding.configuration')}</Text>
          <Heading size="xl" className="text-typography-900">
            {t('onboarding.chooseCurrency')}
          </Heading>
          <Text className="text-typography-600">
            {t('onboarding.currencyDescription')}
          </Text>
        </VStack>

        <VStack space="md" className="flex-1">
          {CURRENCIES.map((currency) => {
            const isSelected = selectedCurrency === currency.code;
            return (
              <Pressable
                key={currency.code}
                onPress={() => setSelectedCurrency(currency.code)}
              >
                <HStack
                  className="p-4 rounded-xl border-2"
                  style={{
                    backgroundColor: isSelected ? theme.colors.primaryLight : colors.cardBg,
                    borderColor: isSelected ? theme.colors.primary : colors.cardBorder,
                  }}
                  space="md"
                >
                  <Box
                    className="w-14 h-14 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? theme.colors.primary : colors.chipBg,
                    }}
                  >
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: isSelected ? '#FFFFFF' : colors.textMuted }}
                    >
                      {currency.symbol}
                    </Text>
                  </Box>
                  <VStack className="flex-1 justify-center">
                    <Text className="font-bold text-lg text-typography-900">
                      {currency.code}
                    </Text>
                    <Text className="text-sm text-typography-500">
                      {t(`currencies.${currency.code}`)}
                    </Text>
                  </VStack>
                  <Box
                    className="w-6 h-6 rounded-full border-2 items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                      borderColor: isSelected ? theme.colors.primary : colors.cardBorder,
                    }}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </Box>
                </HStack>
              </Pressable>
            );
          })}
        </VStack>

        <Text className="text-center text-typography-400 text-sm mb-4">
          {t('onboarding.currencyChangeHint')}
        </Text>

        <HStack space="md">
          <Button
            variant="outline"
            size="xl"
            className="flex-1"
            onPress={() => router.back()}
            isDisabled={isLoading}
          >
            <ButtonText>{t('onboarding.back')}</ButtonText>
          </Button>
          <Button
            size="xl"
            className="flex-1"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleNext}
            isDisabled={isLoading}
          >
            <ButtonText className="text-white">
              {isLoading ? t('common.loading') : t('onboarding.next')}
            </ButtonText>
          </Button>
        </HStack>
      </Box>
    </View>
  );
}
