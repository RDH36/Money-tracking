import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { useTheme } from '@/contexts';

export default function BalanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    const numericBalance = parseFloat(balance.replace(/\s/g, ''));

    if (!balance || isNaN(numericBalance)) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (numericBalance < 0) {
      setError('Le montant ne peut pas être négatif');
      return;
    }

    setError('');
    router.push({
      pathname: '/onboarding/categories' as const,
      params: { balance: Math.round(numericBalance * 100).toString() },
    });
  };

  const formatNumber = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const number = parseInt(cleaned, 10);
    return number.toLocaleString('fr-FR');
  };

  const handleChangeText = (text: string) => {
    setBalance(formatNumber(text));
    if (error) setError('');
  };

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Box className="flex-1 p-6">
          <VStack className="flex-1" space="xl">
            <VStack space="sm">
              <Text className="text-typography-500">Étape 1/2</Text>
              <Heading size="xl" className="text-typography-900">
                Quel est votre solde actuel ?
              </Heading>
              <Text className="text-typography-600">
                Entrez le montant que vous avez actuellement
              </Text>
            </VStack>

            <FormControl isInvalid={!!error} className="mt-4">
              <FormControlLabel>
                <FormControlLabelText>Solde initial (MGA)</FormControlLabelText>
              </FormControlLabel>

              <Input size="xl" className="mt-2">
                <InputField
                  placeholder="0"
                  keyboardType="numeric"
                  value={balance}
                  onChangeText={handleChangeText}
                  className="text-2xl"
                />
              </Input>

              {error ? (
                <FormControlError>
                  <FormControlErrorText>{error}</FormControlErrorText>
                </FormControlError>
              ) : (
                <FormControlHelper>
                  <FormControlHelperText>
                    Exemple: 500 000 MGA
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            </FormControl>
          </VStack>

          <HStack space="md">
            <Button
              variant="outline"
              size="xl"
              className="flex-1"
              onPress={() => router.back()}
            >
              <ButtonText>Retour</ButtonText>
            </Button>
            <Button
              size="xl"
              className="flex-1"
              style={{ backgroundColor: theme.colors.primary }}
              onPress={handleNext}
            >
              <ButtonText className="text-white">Suivant</ButtonText>
            </Button>
          </HStack>
        </Box>
      </KeyboardAvoidingView>
    </View>
  );
}
