import { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Center } from '@/components/ui/center';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PlanificationCard } from '@/components/PlanificationCard';
import { ValidatePlanificationDialog } from '@/components/ValidatePlanificationDialog';
import { usePlanifications, useBalance, useAccounts } from '@/hooks';
import { useTheme } from '@/contexts';
import type { PlanificationWithTotal } from '@/types';

function formatMGA(amountInCents: number): string {
  const amount = amountInCents / 100;
  return amount.toLocaleString('fr-FR') + ' MGA';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function PlanificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { balance, refresh: refreshBalance } = useBalance();
  const { accounts, refresh: refreshAccounts, formatMoney } = useAccounts();
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
      refreshAccounts();
      checkExpiredPlanifications();
    }, [refresh, refreshBalance, refreshAccounts, checkExpiredPlanifications])
  );

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlanificationWithTotal | null>(null);
  const [validateTarget, setValidateTarget] = useState<PlanificationWithTotal | null>(null);

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
    if (selectedDate) setDeadline(selectedDate);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deletePlanification(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleValidateConfirm = async (planificationId: string, accountId: string) => {
    await validatePlanification(planificationId, accountId);
    await refreshBalance();
    await refreshAccounts();
  };

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <VStack className="p-6" space="xl">
          <HStack className="justify-between items-center">
            <Heading size="xl" className="text-typography-900">Planification</Heading>
            {!showNewForm && (
              <Pressable onPress={() => setShowNewForm(true)}>
                <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
              </Pressable>
            )}
          </HStack>

          <Box className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.primaryLight }}>
            <VStack space="md">
              <HStack className="justify-between">
                <Text className="text-typography-600">Solde actuel</Text>
                <Text className="text-typography-900 font-semibold">{formatMGA(balance)}</Text>
              </HStack>
              {totalPending > 0 && (
                <>
                  <HStack className="justify-between">
                    <Text className="text-typography-600">Total planifié</Text>
                    <Text className="text-error-600 font-semibold">- {formatMGA(totalPending)}</Text>
                  </HStack>
                  <Box className="h-px bg-outline-200" />
                  <HStack className="justify-between items-center">
                    <Text className="text-typography-700 font-medium">Solde après</Text>
                    <Text
                      className="text-2xl font-bold"
                      style={{ color: balance - totalPending < 0 ? '#DC2626' : theme.colors.primary }}
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
                <Text className="text-typography-700 font-semibold">Nouvelle planification</Text>
                <Input size="md">
                  <InputField placeholder="Ex: Courses du weekend" value={newTitle} onChangeText={setNewTitle} autoFocus />
                </Input>
                <VStack space="sm">
                  <Text className="text-typography-600 text-sm">Date butoir (optionnel)</Text>
                  <Pressable onPress={() => setShowDatePicker(true)} className="p-3 rounded-lg bg-background-100">
                    <HStack space="sm" className="items-center">
                      <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                      <Text className="text-typography-700">
                        {deadline ? formatDate(deadline.toISOString()) : 'Choisir une date'}
                      </Text>
                      {deadline && (
                        <Pressable onPress={() => setDeadline(null)} className="ml-auto">
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
                  <Button variant="outline" className="flex-1" onPress={() => { setShowNewForm(false); setNewTitle(''); setDeadline(null); }}>
                    <ButtonText>Annuler</ButtonText>
                  </Button>
                  <Button className="flex-1" style={{ backgroundColor: theme.colors.primary }} onPress={handleCreate} isDisabled={!newTitle.trim() || isLoading}>
                    <ButtonText className="text-white">Créer</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {pendingPlanifications.length > 0 && (
            <VStack space="md">
              <Text className="text-typography-700 font-semibold text-lg">En attente ({pendingPlanifications.length})</Text>
              {pendingPlanifications.map((p) => (
                <PlanificationCard
                  key={p.id}
                  planification={p}
                  onPress={() => router.push(`/planification/${p.id}` as Href)}
                  onLongPress={() => setDeleteTarget(p)}
                  onValidate={() => setValidateTarget(p)}
                />
              ))}
            </VStack>
          )}

          {completedPlanifications.length > 0 && (
            <VStack space="md">
              <Text className="text-typography-500 font-semibold text-lg">Terminées ({completedPlanifications.length})</Text>
              {completedPlanifications.map((p) => (
                <PlanificationCard key={p.id} planification={p} onPress={() => router.push(`/planification/${p.id}` as Href)} />
              ))}
            </VStack>
          )}

          {planifications.length === 0 && !showNewForm && (
            <Center className="py-12">
              <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
              <Text className="text-typography-500 text-center mt-4">
                Créez une planification pour préparer vos achats à l&apos;avance
              </Text>
              <Button className="mt-4" style={{ backgroundColor: theme.colors.primary }} onPress={() => setShowNewForm(true)}>
                <ButtonText className="text-white">Créer une planification</ButtonText>
              </Button>
            </Center>
          )}
        </VStack>
      </ScrollView>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer"
        message={`Voulez-vous supprimer "${deleteTarget?.title}" ?`}
        confirmText="Supprimer"
        isDestructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ValidatePlanificationDialog
        isOpen={!!validateTarget}
        planification={validateTarget}
        accounts={accounts}
        onClose={() => setValidateTarget(null)}
        onValidate={handleValidateConfirm}
        formatMoney={formatMoney}
      />
    </View>
  );
}
