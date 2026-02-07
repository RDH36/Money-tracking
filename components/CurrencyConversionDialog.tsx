import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Button, ButtonText } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import type { Currency } from '@/constants/currencies';

interface CurrencyConversionDialogProps {
  isOpen: boolean;
  fromCurrency: Currency;
  toCurrency: Currency;
  isLoading: boolean;
  isFetchingRate: boolean;
  exchangeRate?: number;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function CurrencyConversionDialog({
  isOpen,
  fromCurrency,
  toCurrency,
  isLoading,
  isFetchingRate,
  exchangeRate,
  error,
  onClose,
  onConfirm,
}: CurrencyConversionDialogProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const colors = getDarkModeColors(effectiveScheme === 'dark');
  const canConvert = !isLoading && !isFetchingRate && !!exchangeRate;

  return (
    <AlertDialog isOpen={isOpen} onClose={isLoading ? undefined : onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Heading size="md" className="text-typography-900">
            {t('currency.conversion')}
          </Heading>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <VStack space="md">
            <HStack space="sm" className="items-center">
              <Ionicons name="wifi" size={20} color={theme.colors.primary} />
              <Text className="text-typography-700 flex-1">
                {t('currency.conversionInfo')}
              </Text>
            </HStack>

            <HStack space="md" className="items-center justify-center py-3">
              <VStack className="items-center">
                <Text className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {fromCurrency.symbol}
                </Text>
                <Text className="text-sm text-typography-500">{fromCurrency.code}</Text>
              </VStack>
              <Ionicons name="arrow-forward" size={24} color={colors.textMuted} />
              <VStack className="items-center">
                <Text className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                  {toCurrency.symbol}
                </Text>
                <Text className="text-sm text-typography-500">{toCurrency.code}</Text>
              </VStack>
            </HStack>

            {isFetchingRate ? (
              <HStack space="sm" className="items-center justify-center py-2">
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text className="text-typography-500 text-sm">{t('currency.fetchingRate')}</Text>
              </HStack>
            ) : exchangeRate ? (
              <VStack space="xs" className="bg-background-100 p-3 rounded-lg">
                <Text className="text-typography-700 text-sm text-center font-medium">
                  Taux de change actuel :
                </Text>
                <Text className="text-typography-900 text-center font-bold">
                  1 {fromCurrency.code} = {exchangeRate.toFixed(6)} {toCurrency.code}
                </Text>
                <Text className="text-typography-500 text-xs text-center mt-1">
                  {t('currency.example')} 100,000 {fromCurrency.code} → {(100000 * exchangeRate).toFixed(2)} {toCurrency.code}
                </Text>
              </VStack>
            ) : null}

            <Text className="text-typography-500 text-sm text-center">
              {t('currency.convertInfo', { from: fromCurrency.name, to: toCurrency.name })}
            </Text>

            {error && (
              <HStack space="sm" className="items-center bg-error-50 p-3 rounded-lg">
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text className="text-error-700 flex-1 text-sm">{error}</Text>
              </HStack>
            )}
          </VStack>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={onClose} disabled={isLoading}>
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={onConfirm}
            disabled={!canConvert}
          >
            {isLoading ? (
              <HStack space="sm" className="items-center">
                <ActivityIndicator size="small" color="white" />
                <ButtonText className="text-white">{t('currency.converting')}</ButtonText>
              </HStack>
            ) : (
              <ButtonText className="text-white">{t('currency.convert')}</ButtonText>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
