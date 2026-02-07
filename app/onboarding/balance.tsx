import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { useTheme } from '@/contexts';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, parseAmount, getNumericValue } from '@/lib/amountInput';

export default function BalanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currency = useCurrency();
  const { t } = useTranslation();
  const [bankBalance, setBankBalance] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    const numericBank = getNumericValue(bankBalance);
    const numericCash = getNumericValue(cashBalance);

    if (numericBank < 0 || numericCash < 0) {
      setError(t('onboarding.negativeError'));
      return;
    }

    if (numericBank === 0 && numericCash === 0) {
      setError(t('onboarding.balanceRequired'));
      return;
    }

    setError('');
    router.push({
      pathname: '/onboarding/categories' as const,
      params: {
        bankBalance: bankBalance || '0',
        cashBalance: cashBalance || '0',
      },
    });
  };

  const handleBankChange = (text: string) => {
    setBankBalance(formatAmountInput(text));
    if (error) setError('');
  };

  const handleCashChange = (text: string) => {
    setCashBalance(formatAmountInput(text));
    if (error) setError('');
  };

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top }}
    >
      <KeyboardAwareScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        bottomOffset={20}
      >
        <Box className="flex-1 p-6">
          <VStack className="flex-1" space="xl">
              <VStack space="sm">
                <Text className="text-typography-500">{t('onboarding.step')} 2/3</Text>
                <Heading size="xl" className="text-typography-900">
                  {t('onboarding.configureAccounts')}
                </Heading>
                <Text className="text-typography-600">
                  {t('onboarding.enterBalances')}
                </Text>
              </VStack>

              <VStack space="lg" className="mt-4">
                <Box
                  className="p-4 rounded-xl border-2"
                  style={{ borderColor: theme.colors.primary + '40' }}
                >
                  <HStack space="md" className="items-center mb-3">
                    <Box
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary + '20' }}
                    >
                      <Ionicons name="card" size={24} color={theme.colors.primary} />
                    </Box>
                    <VStack>
                      <Text className="font-semibold text-typography-900">{t('account.bank')}</Text>
                      <Text className="text-xs text-typography-500">{t('onboarding.bankAccount')}</Text>
                    </VStack>
                  </HStack>

                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText>{t('onboarding.balanceInBank')} ({currency.code})</FormControlLabelText>
                    </FormControlLabel>
                    <Input size="xl" className="mt-2">
                      <InputField
                        placeholder="0"
                        keyboardType="decimal-pad"
                        value={bankBalance}
                        onChangeText={handleBankChange}
                        className="text-xl"
                      />
                    </Input>
                  </FormControl>
                </Box>

                <Box
                  className="p-4 rounded-xl border-2"
                  style={{ borderColor: theme.colors.secondary + '40' }}
                >
                  <HStack space="md" className="items-center mb-3">
                    <Box
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: theme.colors.secondaryLight }}
                    >
                      <Ionicons name="cash" size={24} color={theme.colors.secondary} />
                    </Box>
                    <VStack>
                      <Text className="font-semibold text-typography-900">{t('account.cash')}</Text>
                      <Text className="text-xs text-typography-500">{t('onboarding.cashAccount')}</Text>
                    </VStack>
                  </HStack>

                  <FormControl>
                    <FormControlLabel>
                      <FormControlLabelText>{t('onboarding.balanceInCash')} ({currency.code})</FormControlLabelText>
                    </FormControlLabel>
                    <Input size="xl" className="mt-2">
                      <InputField
                        placeholder="0"
                        keyboardType="decimal-pad"
                        value={cashBalance}
                        onChangeText={handleCashChange}
                        className="text-xl"
                      />
                    </Input>
                  </FormControl>
                </Box>
              </VStack>

              {error && (
                <FormControl isInvalid>
                  <FormControlError>
                    <FormControlErrorText>{error}</FormControlErrorText>
                  </FormControlError>
                </FormControl>
              )}

            <Text className="text-center text-typography-400 text-sm">
              {t('onboarding.balanceChangeHint')}
            </Text>

            <HStack space="md" className="mt-4">
              <Button
                variant="outline"
                size="xl"
                className="flex-1"
                onPress={() => router.back()}
              >
                <ButtonText>{t('onboarding.back')}</ButtonText>
              </Button>
              <Button
                size="xl"
                className="flex-1"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={handleNext}
              >
                <ButtonText className="text-white">{t('onboarding.next')}</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </Box>
      </KeyboardAwareScrollView>
    </View>
  );
}
