import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { THEMES } from '@/constants/colors';
import { useTheme } from '@/contexts';
import { useSettings, useAccounts, useCategories } from '@/hooks';
import { ReminderFrequency } from '@/lib/notifications';
import { AccountList } from '@/components/AccountList';
import { AddCategoryModal } from '@/components/AddCategoryModal';

const REMINDER_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: '1h', label: 'Chaque heure' },
  { value: '2h', label: 'Toutes les 2h' },
  { value: '4h', label: 'Toutes les 4h' },
  { value: 'off', label: 'Désactivé' },
];

const PLANIF_REMINDERS = [
  { icon: 'calendar-outline' as const, text: '1 jour avant la date butoir' },
  { icon: 'alarm-outline' as const, text: "Le jour de l'échéance" },
  { icon: 'alert-circle-outline' as const, text: 'Chaque jour si expiré' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, themeId, setTheme } = useTheme();
  const { balanceHidden, toggleBalanceVisibility, reminderFrequency, setReminderFrequency } =
    useSettings();
  const { accounts, formatMoney, refresh: refreshAccounts } = useAccounts();
  const {
    expenseCategories,
    refresh: refreshCategories,
    createCategory,
    canCreateCategory,
    customCategoriesCount,
    maxCustomCategories,
  } = useCategories();
  const [showAddCategory, setShowAddCategory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshCategories();
    }, [refreshAccounts, refreshCategories])
  );

  const handleCreateCategory = async (params: { name: string; icon: string; color: string }) => {
    const result = await createCategory(params);
    if (result.success) {
      setShowAddCategory(false);
    }
    return result;
  };

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <VStack className="p-6" space="xl">
          <Heading size="xl" className="text-typography-900">Paramètres</Heading>

          <AccountList accounts={accounts} formatMoney={formatMoney} />

          <VStack space="md">
            <HStack className="justify-between items-center">
              <Text className="text-typography-700 font-semibold text-lg">Catégories</Text>
              <Text className="text-typography-500 text-sm">
                {customCategoriesCount}/{maxCustomCategories} personnalisées
              </Text>
            </HStack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {expenseCategories.map((category) => (
                <Box
                  key={category.id}
                  className="p-3 rounded-xl items-center"
                  style={{
                    backgroundColor: `${category.color}20`,
                    minWidth: 80,
                  }}
                >
                  <Box
                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: category.color || '#666' }}
                  >
                    <Ionicons
                      name={(category.icon || 'cube') as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color="#FFF"
                    />
                  </Box>
                  <Text className="text-xs font-medium text-center" style={{ color: category.color || '#666' }} numberOfLines={1}>
                    {category.name}
                  </Text>
                  {category.is_default === 0 && (
                    <Box
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Text className="text-white text-[10px]">Custom</Text>
                    </Box>
                  )}
                </Box>
              ))}
              <Pressable onPress={() => setShowAddCategory(true)}>
                <Box
                  className="p-3 rounded-xl border-2 border-dashed border-outline-300 items-center justify-center"
                  style={{ minWidth: 80, minHeight: 90 }}
                >
                  <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
                  <Text className="text-xs mt-1" style={{ color: theme.colors.primary }}>Ajouter</Text>
                </Box>
              </Pressable>
            </ScrollView>
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700 font-semibold text-lg">Thème de couleur</Text>
            <HStack space="md" className="flex-wrap">
              {THEMES.map((t) => {
                const isSelected = themeId === t.id;
                return (
                  <Pressable key={t.id} onPress={() => setTheme(t.id)}>
                    <VStack
                      className="items-center p-3 rounded-xl border-2"
                      style={{
                        borderColor: isSelected ? t.colors.primary : '#E5E5E5',
                        backgroundColor: isSelected ? t.colors.primaryLight : '#FFFFFF',
                        width: 90,
                      }}
                      space="sm"
                    >
                      <HStack space="xs">
                        <Box className="w-6 h-6 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                        <Box className="w-6 h-6 rounded-full" style={{ backgroundColor: t.colors.secondary }} />
                      </HStack>
                      <Text className="text-xs font-medium" style={{ color: isSelected ? t.colors.primary : '#666' }}>
                        {t.name}
                      </Text>
                      {isSelected && (
                        <Box
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                          style={{ backgroundColor: t.colors.primary }}
                        >
                          <Ionicons name="checkmark" size={12} color="white" />
                        </Box>
                      )}
                    </VStack>
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700 font-semibold text-lg">Rappels de dépenses</Text>
            <Text className="text-typography-500 text-sm">
              Recevez des notifications pour ne pas oublier vos dépenses
            </Text>
            <HStack space="sm" className="flex-wrap">
              {REMINDER_OPTIONS.map((option) => {
                const isSelected = reminderFrequency === option.value;
                return (
                  <Pressable key={option.value} onPress={() => setReminderFrequency(option.value)}>
                    <Box
                      className="px-4 py-2 rounded-full border-2"
                      style={{
                        borderColor: isSelected ? theme.colors.primary : '#E5E5E5',
                        backgroundColor: isSelected ? theme.colors.primaryLight : '#FFFFFF',
                      }}
                    >
                      <Text className="text-sm font-medium" style={{ color: isSelected ? theme.colors.primary : '#666' }}>
                        {option.label}
                      </Text>
                    </Box>
                  </Pressable>
                );
              })}
            </HStack>
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700 font-semibold text-lg">Rappels de planification</Text>
            <Text className="text-typography-500 text-sm">Notifications automatiques pour les dates butoir</Text>
            <Box className="bg-background-50 p-4 rounded-xl">
              <VStack space="md">
                {PLANIF_REMINDERS.map((reminder, index) => (
                  <HStack key={index} space="md" className="items-center">
                    <Box
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: theme.colors.primaryLight }}
                    >
                      <Ionicons name={reminder.icon} size={16} color={theme.colors.primary} />
                    </Box>
                    <Text className="text-typography-700 flex-1">{reminder.text}</Text>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  </HStack>
                ))}
              </VStack>
            </Box>
            <Text className="text-typography-400 text-xs">
              Ces rappels sont envoyés automatiquement quand une planification a une date butoir définie.
            </Text>
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700 font-semibold text-lg">Confidentialité</Text>
            <Pressable onPress={toggleBalanceVisibility}>
              <HStack className="bg-background-0 p-4 rounded-xl border border-outline-100 justify-between items-center">
                <HStack space="md" className="items-center">
                  <Box
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: theme.colors.primaryLight }}
                  >
                    <Ionicons name={balanceHidden ? 'eye-off' : 'eye'} size={20} color={theme.colors.primary} />
                  </Box>
                  <VStack>
                    <Text className="text-typography-900 font-medium">Masquer le solde</Text>
                    <Text className="text-typography-500 text-xs">{balanceHidden ? 'Solde masqué' : 'Solde visible'}</Text>
                  </VStack>
                </HStack>
                <Box
                  className="w-12 h-7 rounded-full p-1"
                  style={{ backgroundColor: balanceHidden ? theme.colors.primary : '#E5E5E5' }}
                >
                  <Box className="w-5 h-5 rounded-full bg-white" style={{ marginLeft: balanceHidden ? 'auto' : 0 }} />
                </Box>
              </HStack>
            </Pressable>
          </VStack>

          <VStack space="md">
            <Text className="text-typography-700 font-semibold text-lg">À propos</Text>
            <Box className="bg-background-0 p-4 rounded-xl border border-outline-100">
              <VStack space="sm">
                <HStack className="justify-between">
                  <Text className="text-typography-500">Version</Text>
                  <Text className="text-typography-900">1.0.2</Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="text-typography-500">Développeur</Text>
                  <Link href="https://github.com/RDH36" className="text-typography-900">
                    Raymond Dzery Hago
                  </Link>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </VStack>
      </ScrollView>

      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onCreateCategory={handleCreateCategory}
        canCreateCategory={canCreateCategory}
        customCategoriesCount={customCategoriesCount}
        maxCustomCategories={maxCustomCategories}
      />
    </View>
  );
}
