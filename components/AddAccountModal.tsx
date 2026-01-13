import { useState } from 'react';
import { Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts';
import type { AccountType } from '@/types';

const ACCOUNT_ICONS = [
  { icon: 'card', label: 'Carte' },
  { icon: 'cash', label: 'Espèce' },
  { icon: 'wallet', label: 'Portefeuille' },
  { icon: 'business', label: 'Entreprise' },
  { icon: 'phone-portrait', label: 'Mobile' },
  { icon: 'globe', label: 'En ligne' },
];

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (params: {
    name: string;
    type: AccountType;
    initialBalance: number;
    icon: string;
  }) => Promise<{ success: boolean; limitReached: boolean } | void>;
  canCreateAccount: boolean;
  customAccountsCount: number;
  maxCustomAccounts: number;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onCreateAccount,
  canCreateAccount,
  customAccountsCount,
  maxCustomAccounts,
}: AddAccountModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [icon, setIcon] = useState('wallet');
  const [balance, setBalance] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const formatNumber = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    return parseInt(cleaned, 10).toLocaleString('fr-FR');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    const numericBalance = parseInt(balance.replace(/\s/g, '') || '0', 10);
    await onCreateAccount({
      name: name.trim(),
      type,
      initialBalance: numericBalance * 100,
      icon,
    });
    resetForm();
    setIsCreating(false);
  };

  const resetForm = () => {
    setName('');
    setType('bank');
    setIcon('wallet');
    setBalance('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Show limit reached view
  if (!canCreateAccount) {
    return (
      <AlertDialog isOpen={isOpen} onClose={handleClose}>
        <AlertDialogBackdrop />
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <HStack space="sm" className="items-center">
              <Box
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#FEE2E2' }}
              >
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
              </Box>
              <Heading size="md" className="text-typography-900">Limite atteinte</Heading>
            </HStack>
          </AlertDialogHeader>
          <AlertDialogBody className="mt-3 mb-4">
            <Text className="text-typography-600">
              Vous avez atteint la limite de {maxCustomAccounts} comptes personnalisés.
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              style={{ backgroundColor: theme.colors.primary }}
              onPress={handleClose}
            >
              <ButtonText className="text-white">Compris</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <HStack className="items-center justify-between w-full">
            <Heading size="md" className="text-typography-900">Nouveau compte</Heading>
            <Text className="text-typography-500 text-sm">
              {customAccountsCount}/{maxCustomAccounts}
            </Text>
          </HStack>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={20}
            style={{ maxHeight: 400 }}
          >
          <VStack space="lg">
            <VStack space="sm">
              <Text className="text-typography-700 font-medium">Nom du compte</Text>
              <Input size="md">
                <InputField
                  placeholder="Ex: Épargne, MVola..."
                  value={name}
                  onChangeText={setName}
                />
              </Input>
            </VStack>

            <VStack space="sm">
              <Text className="text-typography-700 font-medium">Type</Text>
              <HStack space="md">
                <Pressable onPress={() => setType('bank')} className="flex-1">
                  <Box
                    className="p-3 rounded-xl border-2 items-center"
                    style={{
                      borderColor: type === 'bank' ? theme.colors.primary : '#E5E5E5',
                      backgroundColor: type === 'bank' ? theme.colors.primaryLight : '#FFF',
                    }}
                  >
                    <Ionicons
                      name="card"
                      size={24}
                      color={type === 'bank' ? theme.colors.primary : '#666'}
                    />
                    <Text
                      className="text-xs mt-1"
                      style={{ color: type === 'bank' ? theme.colors.primary : '#666' }}
                    >
                      Bancaire
                    </Text>
                  </Box>
                </Pressable>
                <Pressable onPress={() => setType('cash')} className="flex-1">
                  <Box
                    className="p-3 rounded-xl border-2 items-center"
                    style={{
                      borderColor: type === 'cash' ? '#22c55e' : '#E5E5E5',
                      backgroundColor: type === 'cash' ? '#22c55e20' : '#FFF',
                    }}
                  >
                    <Ionicons
                      name="cash"
                      size={24}
                      color={type === 'cash' ? '#22c55e' : '#666'}
                    />
                    <Text
                      className="text-xs mt-1"
                      style={{ color: type === 'cash' ? '#22c55e' : '#666' }}
                    >
                      Espèce
                    </Text>
                  </Box>
                </Pressable>
              </HStack>
            </VStack>

            <VStack space="sm">
              <Text className="text-typography-700 font-medium">Icône</Text>
              <HStack space="sm" className="flex-wrap">
                {ACCOUNT_ICONS.map((item) => (
                  <Pressable key={item.icon} onPress={() => setIcon(item.icon)}>
                    <Box
                      className="w-12 h-12 rounded-xl border-2 items-center justify-center"
                      style={{
                        borderColor: icon === item.icon ? theme.colors.primary : '#E5E5E5',
                        backgroundColor: icon === item.icon ? theme.colors.primaryLight : '#FFF',
                      }}
                    >
                      <Ionicons
                        name={item.icon as keyof typeof Ionicons.glyphMap}
                        size={24}
                        color={icon === item.icon ? theme.colors.primary : '#666'}
                      />
                    </Box>
                  </Pressable>
                ))}
              </HStack>
            </VStack>

            <VStack space="sm">
              <Text className="text-typography-700 font-medium">Solde initial (MGA)</Text>
              <Input size="md">
                <InputField
                  placeholder="0"
                  keyboardType="numeric"
                  value={balance}
                  onChangeText={(text) => setBalance(formatNumber(text))}
                />
              </Input>
            </VStack>
          </VStack>
          </KeyboardAwareScrollView>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={handleClose} isDisabled={isCreating}>
            <ButtonText>Annuler</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleCreate}
            isDisabled={!name.trim() || isCreating}
          >
            <ButtonText className="text-white">
              {isCreating ? 'Création...' : 'Créer'}
            </ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
