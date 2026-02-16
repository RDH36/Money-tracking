import { useState, useEffect } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts';
import { useBalanceHidden } from '@/stores/settingsStore';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import type { ReceiptData, AccountWithBalance } from '@/types';

interface ReceiptValidationModalProps {
  isOpen: boolean;
  receiptData: ReceiptData | null;
  imageUri: string | null;
  accounts: AccountWithBalance[];
  formatMoney: (amount: number) => string;
  onValidate: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function ReceiptValidationModal({
  isOpen,
  receiptData,
  imageUri,
  accounts,
  formatMoney,
  onValidate,
  onClose,
}: ReceiptValidationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const balanceHidden = useBalanceHidden();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAccountId(null);
      setIsLoading(false);
      setError(null);
      setShowRawText(false);
    }
  }, [isOpen]);

  if (!receiptData) return null;

  const hasItems = receiptData.items.length > 0;
  const totalCents = receiptData.items.reduce((sum, item) => {
    const val = parseFloat(item.amount.replace(/\s/g, '').replace(',', '.'));
    return sum + Math.round(val * 100);
  }, 0);

  const getAccountColor = (type: string) => (type === 'bank' ? theme.colors.primary : theme.colors.secondary);
  const getAccountName = (account: AccountWithBalance) => {
    if (account.is_default === 1) {
      return account.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash');
    }
    return account.name;
  };

  const handleValidate = async () => {
    if (!selectedAccountId || !hasItems) return;
    setIsLoading(true);
    setError(null);
    const result = await onValidate(selectedAccountId);
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

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <HStack space="sm" className="items-center">
            <Box
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.colors.primary + '20' }}
            >
              <Ionicons name="document-text" size={22} color={theme.colors.primary} />
            </Box>
            <VStack>
              <Heading size="md" className="text-typography-900">
                {t('receipt.extractedData')}
              </Heading>
              {hasItems && (
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {t('receipt.itemsFound', { count: receiptData.items.length })}
                </Text>
              )}
            </VStack>
          </HStack>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-2 mb-3">
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            <VStack space="md">
              {imageUri && (
                <Box className="rounded-xl overflow-hidden" style={{ height: 80 }}>
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </Box>
              )}

              {!hasItems && (
                <Box className="p-3 rounded-xl" style={{ backgroundColor: isDark ? '#450A0A' : '#FEF2F2' }}>
                  <HStack space="sm" className="items-center">
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text className="flex-1 text-sm" style={{ color: '#EF4444' }}>
                      {t('receipt.noDataFound')}
                    </Text>
                  </HStack>
                </Box>
              )}

              {hasItems && (
                <VStack space="xs">
                  {receiptData.items.map((item, index) => (
                    <HStack
                      key={index}
                      className="py-2 px-3 rounded-lg items-center justify-between"
                      style={{ backgroundColor: isDark ? colors.cardBg : '#F8FAFC' }}
                    >
                      <HStack space="sm" className="items-center flex-1 mr-2">
                        <Box
                          className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#EF444420' }}
                        >
                          <Ionicons name="cart-outline" size={14} color="#EF4444" />
                        </Box>
                        <Text className="text-typography-900 flex-1 text-sm" numberOfLines={1}>
                          {item.description}
                        </Text>
                      </HStack>
                      <Text className="font-semibold text-sm" style={{ color: '#EF4444' }}>
                        {item.amount}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}

              {receiptData.total && hasItems && (
                <Box className="p-3 rounded-xl" style={{ backgroundColor: theme.colors.primaryLight }}>
                  <HStack className="justify-between items-center">
                    <HStack space="sm" className="items-center">
                      <Ionicons name="calculator-outline" size={18} color={theme.colors.primary} />
                      <Text className="font-medium" style={{ color: theme.colors.primary }}>
                        {t('receipt.total')}
                      </Text>
                    </HStack>
                    <Text className="text-lg font-bold" style={{ color: theme.colors.primary }}>
                      {receiptData.total}
                    </Text>
                  </HStack>
                </Box>
              )}

              {hasItems && (
                <VStack space="sm">
                  <Text className="text-typography-700 font-semibold">
                    {t('receipt.selectAccount')}
                  </Text>
                  {accounts.map((account) => {
                    const isSelected = selectedAccountId === account.id;
                    const color = getAccountColor(account.type);
                    const hasEnough = account.current_balance >= totalCents;
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
                              <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
                              <VStack>
                                <Text className="font-medium text-typography-900">{getAccountName(account)}</Text>
                                <Text className="text-xs text-typography-500">
                                  {balanceHidden ? '••••••' : formatMoney(account.current_balance)}
                                </Text>
                              </VStack>
                            </HStack>
                            {isSelected && <Ionicons name="checkmark-circle" size={24} color={color} />}
                            {!hasEnough && (
                              <Text className="text-xs text-error-500">{t('errors.insufficientBalance')}</Text>
                            )}
                          </HStack>
                        </Box>
                      </Pressable>
                    );
                  })}
                </VStack>
              )}

              {error && (
                <Box className="p-3 rounded-xl" style={{ backgroundColor: isDark ? '#450A0A' : '#FEF2F2' }}>
                  <Text className="text-sm text-center" style={{ color: '#EF4444' }}>{t(error)}</Text>
                </Box>
              )}

              {receiptData.rawText.length > 0 && (
                <VStack space="sm">
                  <Pressable onPress={() => setShowRawText(!showRawText)}>
                    <HStack space="sm" className="items-center">
                      <Ionicons
                        name={showRawText ? 'chevron-down' : 'chevron-forward'}
                        size={16}
                        color={colors.textMuted}
                      />
                      <Text className="text-sm" style={{ color: colors.textMuted }}>
                        {t('receipt.rawText')}
                      </Text>
                    </HStack>
                  </Pressable>
                  {showRawText && (
                    <Box
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder }}
                    >
                      <Text className="text-xs" style={{ color: colors.textMuted }}>
                        {receiptData.rawText.substring(0, 500)}
                      </Text>
                    </Box>
                  )}
                </VStack>
              )}
            </VStack>
          </ScrollView>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={handleClose}>
            <ButtonText>{t('receipt.cancel')}</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleValidate}
            isDisabled={!selectedAccountId || !hasItems || isLoading}
          >
            <ButtonText className="text-white">
              {isLoading ? t('receipt.validating') : t('receipt.validate')}
            </ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
