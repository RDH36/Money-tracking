import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const currencyCode = useCurrencyCode();
  const isExpense = transaction.type === 'expense';
  const isTransfer = !!transaction.transfer_id;
  const formattedAmount = formatCurrency(transaction.amount, currencyCode);
  const sign = isExpense ? '-' : '+';
  const iconColor = transaction.category_color || '#95A5A6';

  const getTransferLabel = () => {
    if (!isTransfer) return null;
    const from = transaction.account_name || 'Compte';
    const to = transaction.linked_account_name || 'Compte';
    return `${from} → ${to}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Pressable onPress={onPress}>
      <HStack
        className="bg-background-0 p-4 rounded-xl border border-outline-100"
        space="md"
      >
        <Box
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: iconColor + '20',
          }}
        >
          <Ionicons
            name={(transaction.category_icon || 'cube') as keyof typeof Ionicons.glyphMap}
            size={24}
            color={iconColor}
          />
        </Box>

        <VStack className="flex-1" space="xs">
          <Text className="font-semibold text-typography-900">
            {transaction.category_name || 'Sans catégorie'}
          </Text>
          {isTransfer && getTransferLabel() && (
            <Text className="text-primary-600 text-sm font-medium">
              {getTransferLabel()}
            </Text>
          )}
          {!isTransfer && !isExpense && transaction.account_name && (
            <Text className="text-success-600 text-sm font-medium">
              → {transaction.account_name}
            </Text>
          )}
          {transaction.note && !isTransfer && (
            <Text className="text-typography-500 text-sm" numberOfLines={1}>
              {transaction.note}
            </Text>
          )}
          <Text className="text-typography-400 text-xs">
            {formatTime(transaction.created_at)}
          </Text>
        </VStack>

        <Text
          className={`font-bold text-lg ${
            isTransfer ? 'text-primary-600' : isExpense ? 'text-error-600' : 'text-success-600'
          }`}
        >
          {isTransfer ? '' : sign}{formattedAmount}
        </Text>
      </HStack>
    </Pressable>
  );
}
