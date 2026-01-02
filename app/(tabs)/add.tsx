import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Center } from '@/components/ui/center';
import { CategoryPicker } from '@/components/CategoryPicker';
import { useCategories, useTransactions, useBalance } from '@/hooks';
import { useTheme } from '@/contexts';
import type { TransactionType } from '@/types';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { categories } = useCategories();
  const { createTransaction, isLoading } = useTransactions();
  const { refresh: refreshBalance } = useBalance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const number = parseInt(cleaned, 10);
    return number.toLocaleString('fr-FR');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmount(text));
    setSuccess(false);
  };

  const handleSave = async () => {
    const numericAmount = parseInt(amount.replace(/\s/g, ''), 10);

    if (!numericAmount || numericAmount <= 0) return;

    const amountInCents = numericAmount * 100;

    const result = await createTransaction({
      type,
      amount: amountInCents,
      categoryId,
      note: note.trim() || null,
    });

    if (result.success) {
      setAmount('');
      setCategoryId(null);
      setNote('');
      setSuccess(true);
      refreshBalance();

      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const isValid = amount && parseInt(amount.replace(/\s/g, ''), 10) > 0;

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Box className="flex-1 p-6 pb-4">
          <VStack className="flex-1" space="xl">
            <Heading size="xl" className="text-typography-900">
              Nouvelle transaction
            </Heading>

            <HStack space="sm" className="justify-center">
              <Button
                size="lg"
                variant={type === 'expense' ? 'solid' : 'outline'}
                action={type === 'expense' ? 'negative' : 'secondary'}
                onPress={() => setType('expense')}
                className="flex-1"
              >
                <ButtonText>Dépense</ButtonText>
              </Button>
              <Button
                size="lg"
                variant={type === 'income' ? 'solid' : 'outline'}
                action={type === 'income' ? 'positive' : 'secondary'}
                onPress={() => setType('income')}
                className="flex-1"
              >
                <ButtonText>Revenu</ButtonText>
              </Button>
            </HStack>

            <Center className="py-4">
              <Text className="text-typography-500 text-sm mb-2">Montant (MGA)</Text>
              <Input
                size="xl"
                variant="underlined"
                className="w-full max-w-[250px]"
              >
                <InputField
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChange}
                  className="text-4xl text-center font-bold"
                  textAlign="center"
                />
              </Input>
            </Center>

            <VStack space="sm">
              <Text className="text-typography-700 font-medium">Catégorie</Text>
              <CategoryPicker
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
              />
            </VStack>

            <VStack space="sm">
              <Text className="text-typography-700 font-medium">
                Note (optionnel)
              </Text>
              <Input size="lg">
                <InputField
                  placeholder="Ajouter une note..."
                  value={note}
                  onChangeText={setNote}
                />
              </Input>
            </VStack>

            {success && (
              <Center className="bg-success-100 p-3 rounded-xl">
                <Text className="text-success-700 font-medium">
                  ✓ Transaction enregistrée !
                </Text>
              </Center>
            )}
          </VStack>

          <Button
            size="xl"
            className="w-full"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleSave}
            isDisabled={!isValid || isLoading}
          >
            <ButtonText className="text-white font-semibold">
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonText>
          </Button>
        </Box>
      </KeyboardAvoidingView>
    </View>
  );
}
