import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import { useBalanceHidden } from '@/stores/settingsStore';
import type { AccountWithBalance, PlanificationWithTotal } from '@/types';

interface ValidatePlanificationDialogProps {
  isOpen: boolean;
  planification: PlanificationWithTotal | null;
  accounts: AccountWithBalance[];
  onClose: () => void;
  onValidate: (planificationId: string, accountId: string) => Promise<void>;
  formatMoney: (amount: number) => string;
}

export function ValidatePlanificationDialog({
  isOpen,
  planification,
  accounts,
  onClose,
  onValidate,
  formatMoney,
}: ValidatePlanificationDialogProps) {
  const { theme } = useTheme();
  const balanceHidden = useBalanceHidden();
  const hiddenAmount = '••••••';
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = async () => {
    if (!planification || !selectedAccountId) return;
    setIsLoading(true);
    await onValidate(planification.id, selectedAccountId);
    setIsLoading(false);
    setSelectedAccountId(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedAccountId(null);
    onClose();
  };

  const getAccountColor = (type: string) => (type === 'bank' ? theme.colors.primary : theme.colors.secondary);

  if (!planification) return null;

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <Heading size="md" className="text-typography-900">Valider la planification</Heading>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <VStack space="md">
            <Text className="text-typography-700">
              Déduire {formatMoney(planification.total)} de quel compte ?
            </Text>
            <VStack space="sm">
              {accounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                const color = getAccountColor(account.type);
                const hasEnough = account.current_balance >= planification.total;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setSelectedAccountId(account.id)}
                    disabled={!hasEnough}
                    style={{ opacity: hasEnough ? 1 : 0.5 }}
                  >
                    <Box
                      className="p-3 rounded-xl border-2"
                      style={{
                        borderColor: isSelected ? color : '#E5E5E5',
                        backgroundColor: isSelected ? color + '15' : '#FFFFFF',
                      }}
                    >
                      <HStack className="justify-between items-center">
                        <HStack space="sm" className="items-center">
                          <Ionicons
                            name={account.icon as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color={color}
                          />
                          <VStack>
                            <Text className="font-medium text-typography-900">{account.name}</Text>
                            <Text className="text-xs text-typography-500">
                              {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                            </Text>
                          </VStack>
                        </HStack>
                        {isSelected && <Ionicons name="checkmark-circle" size={24} color={color} />}
                        {!hasEnough && (
                          <Text className="text-xs text-error-500">Solde insuffisant</Text>
                        )}
                      </HStack>
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>
          </VStack>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={handleClose}>
            <ButtonText>Annuler</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleValidate}
            isDisabled={!selectedAccountId || isLoading}
          >
            <ButtonText className="text-white">{isLoading ? 'Validation...' : 'Valider'}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
