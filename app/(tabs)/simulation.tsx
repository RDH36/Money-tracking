import { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
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
import { useCategories, useSimulation } from '@/hooks';
import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';

function formatMGA(amountInCents: number): string {
  const amount = amountInCents / 100;
  return amount.toLocaleString('fr-FR') + ' MGA';
}

export default function SimulationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { categories } = useCategories();
  const {
    simulatedExpenses,
    totalSimulated,
    projectedBalance,
    currentBalance,
    addSimulatedExpense,
    removeSimulatedExpense,
    clearAllSimulations,
    hasSimulations,
  } = useSimulation();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const number = parseInt(cleaned, 10);
    return number.toLocaleString('fr-FR');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmount(text));
  };

  const handleAddSimulation = () => {
    const numericAmount = parseInt(amount.replace(/\s/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) return;

    addSimulatedExpense(numericAmount * 100, categoryId, note.trim() || null);
    setAmount('');
    setCategoryId(null);
    setNote('');
  };

  const isValid = amount && parseInt(amount.replace(/\s/g, ''), 10) > 0;
  const isNegative = projectedBalance < 0;

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <VStack className="p-6" space="xl">
            <HStack className="justify-between items-center">
              <Heading size="xl" className="text-typography-900">
                Simulation
              </Heading>
              {hasSimulations && (
                <Pressable onPress={clearAllSimulations}>
                  <Text style={{ color: theme.colors.primary }} className="font-medium">
                    Effacer tout
                  </Text>
                </Pressable>
              )}
            </HStack>

            <Box
              className="p-4 rounded-2xl"
              style={{ backgroundColor: theme.colors.primaryLight }}
            >
              <VStack space="md">
                <HStack className="justify-between">
                  <Text className="text-typography-600">Solde actuel</Text>
                  <Text className="text-typography-900 font-semibold">
                    {formatMGA(currentBalance)}
                  </Text>
                </HStack>
                {hasSimulations && (
                  <HStack className="justify-between">
                    <Text className="text-typography-600">Dépenses simulées</Text>
                    <Text className="text-error-600 font-semibold">
                      - {formatMGA(totalSimulated)}
                    </Text>
                  </HStack>
                )}
                <Box className="h-px bg-outline-200" />
                <HStack className="justify-between items-center">
                  <Text className="text-typography-700 font-medium">Solde projeté</Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: isNegative ? '#DC2626' : theme.colors.primary }}
                  >
                    {formatMGA(projectedBalance)}
                  </Text>
                </HStack>
                {isNegative && (
                  <HStack space="xs" className="items-center">
                    <Ionicons name="warning" size={16} color="#DC2626" />
                    <Text className="text-error-600 text-sm">
                      Attention : solde négatif prévu !
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            <VStack space="md">
              <Text className="text-typography-700 font-semibold text-lg">
                Ajouter une simulation
              </Text>

              <Center>
                <Text className="text-typography-500 text-sm mb-2">Montant (MGA)</Text>
                <Input size="xl" variant="underlined" className="w-full max-w-[200px]">
                  <InputField
                    placeholder="0"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                    className="text-3xl text-center font-bold"
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
                <Text className="text-typography-700 font-medium">Note (optionnel)</Text>
                <Input size="md">
                  <InputField
                    placeholder="Ex: Restaurant avec amis..."
                    value={note}
                    onChangeText={setNote}
                  />
                </Input>
              </VStack>

              <Button
                size="lg"
                className="w-full"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={handleAddSimulation}
                isDisabled={!isValid}
              >
                <ButtonText className="text-white font-semibold">
                  Ajouter à la simulation
                </ButtonText>
              </Button>
            </VStack>

            {hasSimulations && (
              <VStack space="md">
                <Text className="text-typography-700 font-semibold text-lg">
                  Dépenses simulées ({simulatedExpenses.length})
                </Text>
                {simulatedExpenses.map((exp) => (
                  <HStack
                    key={exp.id}
                    className="bg-background-50 p-3 rounded-xl items-center justify-between"
                  >
                    <HStack space="md" className="items-center flex-1">
                      <Box
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: exp.category_color || '#94A3B8' }}
                      >
                        {exp.category_icon && (
                          <Ionicons
                            name={exp.category_icon as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color="white"
                          />
                        )}
                      </Box>
                      <VStack className="flex-1">
                        <Text className="text-typography-900 font-medium">
                          {exp.category_name || 'Sans catégorie'}
                        </Text>
                        {exp.note && (
                          <Text className="text-typography-500 text-xs" numberOfLines={1}>
                            {exp.note}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <HStack space="md" className="items-center">
                      <Text className="text-typography-900 font-semibold">
                        {formatMGA(exp.amount)}
                      </Text>
                      <Pressable onPress={() => removeSimulatedExpense(exp.id)}>
                        <Ionicons name="close-circle" size={24} color="#DC2626" />
                      </Pressable>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            )}

            {!hasSimulations && (
              <Center className="py-8">
                <Ionicons name="calculator-outline" size={48} color="#9CA3AF" />
                <Text className="text-typography-500 text-center mt-4">
                  Ajoutez des dépenses fictives pour voir leur impact sur votre solde
                </Text>
              </Center>
            )}
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
