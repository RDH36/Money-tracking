import { useState } from 'react';
import { Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { useReceiptScanner } from '@/hooks/useReceiptScanner';
import { useTransactions, useAccounts } from '@/hooks';
import { ReceiptValidationModal } from '@/components/ReceiptValidationModal';

interface ReceiptScanButtonProps {
  onComplete: () => void;
}

export function ReceiptScanButton({ onComplete }: ReceiptScanButtonProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);
  const { isProcessing, receiptData, imageUri, error, pickImage, reset } = useReceiptScanner();
  const { accounts, formatMoney } = useAccounts();
  const { createTransaction } = useTransactions();
  const [showValidation, setShowValidation] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSource = async (source: 'camera' | 'gallery') => {
    setShowOptions(false);
    const success = await pickImage(source);
    if (success) {
      setShowValidation(true);
    }
  };

  const handleValidate = async (accountId: string): Promise<{ success: boolean; error?: string }> => {
    if (!receiptData || receiptData.items.length === 0) {
      return { success: false, error: 'receipt.noDataFound' };
    }

    for (const item of receiptData.items) {
      const val = parseFloat(item.amount.replace(/\s/g, '').replace(',', '.'));
      const amountCents = Math.round(val * 100);
      const result = await createTransaction({
        type: 'expense',
        amount: amountCents,
        categoryId: null,
        accountId,
        note: item.description.substring(0, 20),
      });
      if (!result.success) {
        return { success: false, error: result.error || 'errors.saveFailed' };
      }
    }

    onComplete();
    return { success: true };
  };

  const handleClose = () => {
    setShowValidation(false);
    reset();
  };

  if (isProcessing) {
    return (
      <Box className="p-3 rounded-xl items-center" style={{ backgroundColor: theme.colors.primary + '10' }}>
        <HStack space="sm" className="items-center">
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
            {t('receipt.processing')}
          </Text>
        </HStack>
      </Box>
    );
  }

  return (
    <>
      {!showOptions ? (
        <Pressable onPress={() => setShowOptions(true)}>
          <Box
            className="p-3 rounded-xl border items-center"
            style={{ borderColor: theme.colors.primary + '40', backgroundColor: theme.colors.primary + '08' }}
          >
            <HStack space="sm" className="items-center">
              <Ionicons name="camera-outline" size={20} color={theme.colors.primary} />
              <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                {t('receipt.scanReceipt')}
              </Text>
            </HStack>
          </Box>
        </Pressable>
      ) : (
        <VStack space="sm">
          <HStack space="sm">
            <Pressable onPress={() => handleSource('camera')} className="flex-1">
              <Box
                className="p-3 rounded-xl border items-center"
                style={{ borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' }}
              >
                <VStack space="xs" className="items-center">
                  <Ionicons name="camera" size={22} color={theme.colors.primary} />
                  <Text className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                    {t('receipt.takePhoto')}
                  </Text>
                </VStack>
              </Box>
            </Pressable>
            <Pressable onPress={() => handleSource('gallery')} className="flex-1">
              <Box
                className="p-3 rounded-xl border items-center"
                style={{ borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondary + '10' }}
              >
                <VStack space="xs" className="items-center">
                  <Ionicons name="image" size={22} color={theme.colors.secondary} />
                  <Text className="text-xs font-medium" style={{ color: theme.colors.secondary }}>
                    {t('receipt.importImage')}
                  </Text>
                </VStack>
              </Box>
            </Pressable>
          </HStack>
          <Pressable onPress={() => setShowOptions(false)}>
            <Text className="text-xs text-center" style={{ color: colors.textMuted }}>
              {t('receipt.cancel')}
            </Text>
          </Pressable>
        </VStack>
      )}

      {error && (
        <Box className="p-2 rounded-lg mt-1" style={{ backgroundColor: isDark ? '#450A0A' : '#FEF2F2' }}>
          <Text className="text-xs text-center" style={{ color: '#EF4444' }}>
            {t(error)}
          </Text>
        </Box>
      )}

      <ReceiptValidationModal
        isOpen={showValidation && receiptData !== null}
        receiptData={receiptData}
        imageUri={imageUri}
        accounts={accounts}
        formatMoney={formatMoney}
        onValidate={handleValidate}
        onClose={handleClose}
      />
    </>
  );
}
