import { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Center } from '@/components/ui/center';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { CategoryPicker } from '@/components/CategoryPicker';
import { usePlanificationDetail, useCategories, useBalance, usePlanifications } from '@/hooks';
import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';

function formatMGA(amountInCents: number): string {
  const amount = amountInCents / 100;
  return amount.toLocaleString('fr-FR') + ' MGA';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

type DialogConfig = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive: boolean;
  onConfirm: () => void;
};

export default function PlanificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { balance, refresh: refreshBalance } = useBalance();
  const { categories } = useCategories();
  const { validatePlanification, updateDeadline } = usePlanifications();
  const {
    planification,
    items,
    total,
    addItem,
    removeItem,
    refresh: refreshDetail,
    isLoading,
    isFetching,
  } = usePlanificationDetail(id || null);

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    isDestructive: false,
    onConfirm: () => {},
  });

  const closeDialog = () => setDialog((prev) => ({ ...prev, isOpen: false }));

  const handleDeadlineChange = async (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate && id && planification) {
      await updateDeadline(id, planification.title, selectedDate);
      await refreshDetail();
    }
  };

  const handleRemoveDeadline = async () => {
    if (id && planification) {
      await updateDeadline(id, planification.title, null);
      await refreshDetail();
    }
  };

  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    const number = parseInt(cleaned, 10);
    return number.toLocaleString('fr-FR');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatAmount(text));
  };

  const handleAddItem = async () => {
    const numericAmount = parseInt(amount.replace(/\s/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) return;

    await addItem(numericAmount * 100, categoryId, note.trim() || null);
    setAmount('');
    setCategoryId(null);
    setNote('');
  };

  const handleRemoveItem = (itemId: string) => {
    setDialog({
      isOpen: true,
      title: 'Supprimer',
      message: 'Voulez-vous supprimer cet achat ?',
      confirmText: 'Supprimer',
      isDestructive: true,
      onConfirm: async () => {
        await removeItem(itemId);
        closeDialog();
      },
    });
  };

  const handleValidate = () => {
    if (!id) return;
    setDialog({
      isOpen: true,
      title: 'Valider la planification',
      message: `Cela va déduire ${formatMGA(total)} de votre solde actuel. Continuer ?`,
      confirmText: 'Valider',
      isDestructive: false,
      onConfirm: async () => {
        await validatePlanification(id);
        await refreshBalance();
        closeDialog();
        router.back();
      },
    });
  };

  const isValid = amount && parseInt(amount.replace(/\s/g, ''), 10) > 0;
  const isPending = planification?.status === 'pending';
  const expired = isPending && isExpired(planification?.deadline || null);
  const projectedBalance = balance - total;
  const isNegative = projectedBalance < 0;

  if (!planification && !isFetching) {
    return (
      <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
        <Center className="flex-1">
          <Text className="text-typography-500">Planification introuvable</Text>
          <Button className="mt-4" onPress={() => router.back()}>
            <ButtonText>Retour</ButtonText>
          </Button>
        </Center>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
          <VStack className="p-6" space="xl">
            <HStack className="justify-between items-center">
              <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
              </Pressable>
              <Heading size="lg" className="text-typography-900 flex-1 ml-2" numberOfLines={1}>
                {planification?.title || 'Chargement...'}
              </Heading>
            </HStack>

            {isPending && (
              <Box className="p-3 rounded-xl bg-background-50">
                <HStack className="justify-between items-center">
                  <HStack space="sm" className="items-center flex-1">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={expired ? '#DC2626' : theme.colors.primary}
                    />
                    <VStack>
                      <Text className="text-typography-600 text-sm">Date butoir</Text>
                      {planification?.deadline ? (
                        <Text
                          className="font-semibold"
                          style={{ color: expired ? '#DC2626' : theme.colors.primary }}
                        >
                          {formatDate(planification.deadline)}
                          {expired && ' (Expiré)'}
                        </Text>
                      ) : (
                        <Text className="text-typography-500">Non définie</Text>
                      )}
                    </VStack>
                  </HStack>
                  <HStack space="sm">
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      className="p-2 rounded-lg bg-background-100"
                    >
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </Pressable>
                    {planification?.deadline && (
                      <Pressable
                        onPress={handleRemoveDeadline}
                        className="p-2 rounded-lg bg-background-100"
                      >
                        <Ionicons name="close" size={20} color="#9CA3AF" />
                      </Pressable>
                    )}
                  </HStack>
                </HStack>
                {showDatePicker && (
                  <DateTimePicker
                    value={planification?.deadline ? new Date(planification.deadline) : new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleDeadlineChange}
                  />
                )}
              </Box>
            )}

            {!isPending && (
              <Box className="p-3 rounded-xl bg-background-100">
                <HStack space="sm" className="items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="text-typography-600 flex-1">
                    Cette planification a été validée et les achats ont été déduits du solde.
                  </Text>
                </HStack>
              </Box>
            )}

            <Box
              className="p-4 rounded-2xl"
              style={{ backgroundColor: theme.colors.primaryLight }}
            >
              <VStack space="md">
                <HStack className="justify-between">
                  <Text className="text-typography-600">Solde actuel</Text>
                  <Text className="text-typography-900 font-semibold">
                    {formatMGA(balance)}
                  </Text>
                </HStack>
                {total > 0 && isPending && (
                  <>
                    <HStack className="justify-between">
                      <Text className="text-typography-600">Total planifié</Text>
                      <Text className="text-error-600 font-semibold">
                        - {formatMGA(total)}
                      </Text>
                    </HStack>
                    <Box className="h-px bg-outline-200" />
                    <HStack className="justify-between items-center">
                      <Text className="text-typography-700 font-medium">Solde après</Text>
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
                  </>
                )}
              </VStack>
            </Box>

            {isPending && (
              <VStack space="md">
                <Text className="text-typography-700 font-semibold text-lg">
                  Ajouter un achat
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
                  onPress={handleAddItem}
                  isDisabled={!isValid || isLoading}
                >
                  <ButtonText className="text-white font-semibold">
                    Ajouter
                  </ButtonText>
                </Button>
              </VStack>
            )}

            {items.length > 0 && (
              <VStack space="md">
                <Text className="text-typography-700 font-semibold text-lg">
                  Achats ({items.length})
                </Text>
                {items.map((item) => (
                  <HStack
                    key={item.id}
                    className="bg-background-50 p-3 rounded-xl items-center justify-between"
                  >
                    <HStack space="md" className="items-center flex-1">
                      <Box
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: item.category_color || '#94A3B8' }}
                      >
                        {item.category_icon && (
                          <Ionicons
                            name={item.category_icon as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color="white"
                          />
                        )}
                      </Box>
                      <VStack className="flex-1">
                        <Text className="text-typography-900 font-medium">
                          {item.category_name || 'Sans catégorie'}
                        </Text>
                        {item.note && (
                          <Text className="text-typography-500 text-xs" numberOfLines={1}>
                            {item.note}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <HStack space="md" className="items-center">
                      <Text className="text-typography-900 font-semibold">
                        {formatMGA(item.amount)}
                      </Text>
                      {isPending && (
                        <Pressable onPress={() => handleRemoveItem(item.id)}>
                          <Ionicons name="close-circle" size={24} color="#DC2626" />
                        </Pressable>
                      )}
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            )}

            {items.length === 0 && isPending && (
              <Center className="py-8">
                <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
                <Text className="text-typography-500 text-center mt-4">
                  Ajoutez des achats à votre planification
                </Text>
              </Center>
            )}

          </VStack>
        </ScrollView>

        {isPending && items.length > 0 && (
          <Box
            className="px-6 py-4 border-t border-outline-100 bg-background-0"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <VStack space="sm">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onPress={() => router.back()}
              >
                <HStack space="sm" className="items-center">
                  <Ionicons name="save-outline" size={20} color={theme.colors.primary} />
                  <ButtonText style={{ color: theme.colors.primary }}>
                    Sauvegarder
                  </ButtonText>
                </HStack>
              </Button>
              <Button
                size="lg"
                className="w-full"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={handleValidate}
              >
                <HStack space="sm" className="items-center">
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <ButtonText className="text-white font-semibold">
                    Valider et déduire du solde
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>
          </Box>
        )}
      </KeyboardAvoidingView>

      <AlertDialog isOpen={dialog.isOpen} onClose={closeDialog}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="md" className="text-typography-900">
              {dialog.title}
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <Text className="text-typography-700">{dialog.message}</Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button variant="outline" onPress={closeDialog}>
              <ButtonText>Annuler</ButtonText>
            </Button>
            <Button
              style={{
                backgroundColor: dialog.isDestructive ? '#DC2626' : theme.colors.primary,
              }}
              onPress={dialog.onConfirm}
            >
              <ButtonText className="text-white">{dialog.confirmText}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
