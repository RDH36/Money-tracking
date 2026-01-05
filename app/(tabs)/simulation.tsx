import { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href, useFocusEffect } from 'expo-router';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { Center } from '@/components/ui/center';
import { usePlanifications, useBalance } from '@/hooks';
import { useTheme } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import type { PlanificationWithTotal } from '@/types';

function formatMGA(amountInCents: number): string {
  const amount = amountInCents / 100;
  return amount.toLocaleString('fr-FR') + ' MGA';
}

export default function PlanificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { balance } = useBalance();
  const {
    planifications,
    createPlanification,
    deletePlanification,
    validatePlanification,
    refresh,
    isLoading,
  } = usePlanifications();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const pendingPlanifications = planifications.filter((p) => p.status === 'pending');
  const completedPlanifications = planifications.filter((p) => p.status === 'completed');
  const totalPending = pendingPlanifications.reduce((sum, p) => sum + p.total, 0);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const result = await createPlanification(newTitle.trim());
    if (result.success && result.id) {
      setNewTitle('');
      setShowNewForm(false);
      router.push(`/planification/${result.id}` as Href);
    }
  };

  const handleDelete = (planif: PlanificationWithTotal) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer "${planif.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deletePlanification(planif.id),
        },
      ]
    );
  };

  const handleValidate = (planif: PlanificationWithTotal) => {
    Alert.alert(
      'Valider la planification',
      `Cela va déduire ${formatMGA(planif.total)} de votre solde actuel. Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: () => validatePlanification(planif.id),
        },
      ]
    );
  };

  const renderPlanificationCard = (planif: PlanificationWithTotal) => {
    const isPending = planif.status === 'pending';

    return (
      <Pressable
        key={planif.id}
        onPress={() => router.push(`/planification/${planif.id}` as Href)}
        onLongPress={() => isPending && handleDelete(planif)}
      >
        <Box className="bg-background-50 p-4 rounded-xl mb-3">
          <HStack className="justify-between items-start">
            <VStack className="flex-1" space="xs">
              <HStack space="sm" className="items-center">
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
              </HStack>
              <Text className="text-typography-500 text-sm">
                {planif.item_count} achat{planif.item_count > 1 ? 's' : ''}
              </Text>
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
                <HStack space="md">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => {
                      setShowNewForm(false);
                      setNewTitle('');
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
    </View>
  );
}
