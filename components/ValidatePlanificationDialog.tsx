import { useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import type { AccountWithBalance, PlanificationWithTotal } from '@/types';

interface ValidatePlanificationDialogProps {
  isOpen: boolean;
  planification: PlanificationWithTotal | null;
  accounts: AccountWithBalance[];
  onClose: () => void;
  onValidate: (planificationId: string, accountId: string) => Promise<{ success: boolean; error?: string }>;
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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const balanceHidden = useBalanceHidden();
  const hiddenAmount = '••••••';
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!planification || !selectedAccountId) return;
    setIsLoading(true);
    setError(null);
    const result = await onValidate(planification.id, selectedAccountId);
    setIsLoading(false);
    if (result.success) {
      setSelectedAccountId(null);
      onClose();
    } else if (result.error) {
      setError(result.error);
    }
  };

  const handleClose = () => {
    setSelectedAccountId(null);
    setError(null);
    onClose();
  };

  const getAccountColor = (type: string) => (type === 'bank' ? theme.colors.primary : theme.colors.secondary);

  const getAccountName = (account: AccountWithBalance) => {
    if (account.is_default === 1) {
      return account.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash');
    }
    return account.name;
  };

  if (!planification) return null;

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <Heading size="md" className="text-typography-900">{t('planification.validate')}</Heading>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <VStack space="md">
            <Text className="text-typography-700">
              {t('planification.deductFromAccount', { amount: formatMoney(planification.total) })}
            </Text>
            <VStack space="sm">
              {accounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                const color = getAccountColor(account.type);
                const hasEnough = account.current_balance >= planification.total;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => { setSelectedAccountId(account.id); setError(null); }}
                    disabled={!hasEnough}
                    style={{ opacity: hasEnough ? 1 : 0.5 }}
                  >
                    <Box
                      className="p-3 rounded-xl border-2"
                      style={{
                        borderColor: isSelected ? color : colors.cardBorder,
                        backgroundColor: isSelected ? color + '15' : colors.cardBg,
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
                            <Text className="font-medium text-typography-900">{getAccountName(account)}</Text>
                            <Text className="text-xs text-typography-500">
                              {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                            </Text>
                          </VStack>
                        </HStack>
                        {isSelected && <Ionicons name="checkmark-circle" size={24} color={color} />}
                        {!hasEnough && (
                          <Text className="text-xs text-error-500">{t('planification.insufficientBalance')}</Text>
                        )}
                      </HStack>
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>
            {error && (
              <Box className="p-3 rounded-xl bg-error-100">
                <Text className="text-error-700 text-center">{t(error)}</Text>
              </Box>
            )}
          </VStack>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={handleClose}>
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleValidate}
            isDisabled={!selectedAccountId || isLoading}
          >
            <ButtonText className="text-white">{isLoading ? t('planification.validating') : t('planification.validate')}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
