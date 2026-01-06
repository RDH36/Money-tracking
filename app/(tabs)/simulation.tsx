import { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
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
import { usePlanifications, useBalance } from '@/hooks';
import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import type { PlanificationWithTotal } from '@/types';

function formatMGA(amountInCents: number): string {
  const amount = amountInCents / 100;
  return amount.toLocaleString('fr-FR') + ' MGA';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

export default function PlanificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { balance, refresh: refreshBalance } = useBalance();
  const {
    planifications,
    createPlanification,
    deletePlanification,
    validatePlanification,
    checkExpiredPlanifications,
    refresh,
    isLoading,
  } = usePlanifications();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshBalance();
      checkExpiredPlanifications();
    }, [refresh, refreshBalance, checkExpiredPlanifications])
  );

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
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

  const pendingPlanifications = planifications.filter((p) => p.status === 'pending');
  const completedPlanifications = planifications.filter((p) => p.status === 'completed');
  const totalPending = pendingPlanifications.reduce((sum, p) => sum + p.total, 0);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const result = await createPlanification(newTitle.trim(), deadline);
    if (result.success && result.id) {
      setNewTitle('');
      setDeadline(null);
      setShowNewForm(false);
      router.push(`/planification/${result.id}` as Href);
    }
  };

  const handleDateChange = (_: unknown, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const handleDelete = (planif: PlanificationWithTotal) => {
    setDialog({
      isOpen: true,
      title: 'Supprimer',
      message: `Voulez-vous supprimer "${planif.title}" ?`,
      confirmText: 'Supprimer',
      isDestructive: true,
      onConfirm: async () => {
        await deletePlanification(planif.id);
        closeDialog();
      },
    });
  };

  const handleValidate = (planif: PlanificationWithTotal) => {
    setDialog({
      isOpen: true,
      title: 'Valider la planification',
      message: `Cela va déduire ${formatMGA(planif.total)} de votre solde actuel. Continuer ?`,
      confirmText: 'Valider',
      isDestructive: false,
      onConfirm: async () => {
        await validatePlanification(planif.id);
        await refreshBalance();
        closeDialog();
      },
    });
  };

  const renderPlanificationCard = (planif: PlanificationWithTotal) => {
    const isPending = planif.status === 'pending';
    const expired = isPending && isExpired(planif.deadline);

    return (
      <Pressable
        key={planif.id}
        onPress={() => router.push(`/planification/${planif.id}` as Href)}
        onLongPress={() => isPending && handleDelete(planif)}
      >
        <Box
          className="bg-background-50 p-4 rounded-xl mb-3"
          style={expired ? { borderWidth: 1, borderColor: '#DC2626' } : undefined}
        >
          <HStack className="justify-between items-start">
            <VStack className="flex-1" space="xs">
              <HStack space="sm" className="items-center flex-wrap">
                <Text className="text-typography-900 font-semibold text-lg">
                  {planif.title}
                </Text>
                <Box
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isPending
                      ? theme.colors.primaryLight
                      : '#E5E7EB',
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color: isPending ? theme.colors.primary : '#6B7280',
                    }}
                  >
                    {isPending ? 'En attente' : 'Terminé'}
                  </Text>
                </Box>
                {expired && (
                  <Box className="px-2 py-0.5 rounded-full bg-error-100">
                    <Text className="text-xs font-medium text-error-600">Expiré</Text>
                  </Box>
                )}
              </HStack>
              <HStack space="md" className="items-center">
                <Text className="text-typography-500 text-sm">
                  {planif.item_count} achat{planif.item_count > 1 ? 's' : ''}
                </Text>
                {planif.deadline && (
                  <HStack space="xs" className="items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={expired ? '#DC2626' : '#6B7280'}
                    />
                    <Text
                      className="text-sm"
                      style={{ color: expired ? '#DC2626' : '#6B7280' }}
                    >
                      {formatDate(planif.deadline)}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </VStack>
            <VStack className="items-end" space="xs">
              <Text className="text-typography-900 font-bold text-lg">
                {formatMGA(planif.total)}
              </Text>
              {isPending && planif.item_count > 0 && (
                <Pressable
                  onPress={() => handleValidate(planif)}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Text className="text-white text-xs font-medium">Valider</Text>
                </Pressable>
              )}
            </VStack>
          </HStack>
        </Box>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <VStack className="p-6" space="xl">
          <HStack className="justify-between items-center">
            <Heading size="xl" className="text-typography-900">
              Planification
            </Heading>
            {!showNewForm && (
              <Pressable onPress={() => setShowNewForm(true)}>
                <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
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
                  {formatMGA(balance)}
                </Text>
              </HStack>
              {totalPending > 0 && (
                <>
                  <HStack className="justify-between">
                    <Text className="text-typography-600">Total planifié</Text>
                    <Text className="text-error-600 font-semibold">
                      - {formatMGA(totalPending)}
                    </Text>
                  </HStack>
                  <Box className="h-px bg-outline-200" />
                  <HStack className="justify-between items-center">
                    <Text className="text-typography-700 font-medium">Solde après</Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{
                        color:
                          balance - totalPending < 0 ? '#DC2626' : theme.colors.primary,
                      }}
                    >
                      {formatMGA(balance - totalPending)}
                    </Text>
                  </HStack>
                </>
              )}
            </VStack>
          </Box>

          {showNewForm && (
            <Box className="bg-background-50 p-4 rounded-xl">
              <VStack space="md">
                <Text className="text-typography-700 font-semibold">
                  Nouvelle planification
                </Text>
                <Input size="md">
                  <InputField
                    placeholder="Ex: Courses du weekend"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    autoFocus
                  />
                </Input>
                <VStack space="sm">
                  <Text className="text-typography-600 text-sm">Date butoir (optionnel)</Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className="p-3 rounded-lg bg-background-100"
                  >
                    <HStack space="sm" className="items-center">
                      <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                      <Text className="text-typography-700">
                        {deadline ? formatDate(deadline.toISOString()) : 'Choisir une date'}
                      </Text>
                      {deadline && (
                        <Pressable
                          onPress={() => setDeadline(null)}
                          className="ml-auto"
                        >
                          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </Pressable>
                      )}
                    </HStack>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={deadline || new Date()}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={handleDateChange}
                    />
                  )}
                </VStack>
                <HStack space="md">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => {
                      setShowNewForm(false);
                      setNewTitle('');
                      setDeadline(null);
                    }}
                  >
                    <ButtonText>Annuler</ButtonText>
                  </Button>
                  <Button
                    className="flex-1"
                    style={{ backgroundColor: theme.colors.primary }}
                    onPress={handleCreate}
                    isDisabled={!newTitle.trim() || isLoading}
                  >
                    <ButtonText className="text-white">Créer</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {pendingPlanifications.length > 0 && (
            <VStack space="md">
              <Text className="text-typography-700 font-semibold text-lg">
                En attente ({pendingPlanifications.length})
              </Text>
              {pendingPlanifications.map(renderPlanificationCard)}
            </VStack>
          )}

          {completedPlanifications.length > 0 && (
            <VStack space="md">
              <Text className="text-typography-500 font-semibold text-lg">
                Terminées ({completedPlanifications.length})
              </Text>
              {completedPlanifications.map(renderPlanificationCard)}
            </VStack>
          )}

          {planifications.length === 0 && !showNewForm && (
            <Center className="py-12">
              <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
              <Text className="text-typography-500 text-center mt-4">
                Créez une planification pour préparer vos achats à l&apos;avance
              </Text>
              <Button
                className="mt-4"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={() => setShowNewForm(true)}
              >
                <ButtonText className="text-white">Créer une planification</ButtonText>
              </Button>
            </Center>
          )}
        </VStack>
      </ScrollView>

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
