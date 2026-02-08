import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

const DEFAULT_CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const currencyCode = useCurrencyCode();
  const { t, i18n } = useTranslation();
  const isExpense = transaction.type === 'expense';
  const isTransfer = !!transaction.transfer_id;
  const formattedAmount = formatCurrency(transaction.amount, currencyCode);
  const sign = isExpense ? '-' : '+';
  const iconColor = transaction.category_color || '#95A5A6';

  const getCategoryName = () => {
    if (!transaction.category_id) return t('common.noCategory');
    // Handle system income category
    if (transaction.category_id === 'system-income') {
      return t('add.income');
    }
    if (DEFAULT_CATEGORY_IDS.includes(transaction.category_id)) {
      return t(`categories.${transaction.category_id}`);
    }
    return transaction.category_name || t('common.noCategory');
  };

  const getAccountDisplayName = (name: string | null, type: string | null) => {
    if (!name) return t('add.account');
    // Translate default account names
    if ((name === 'Banque' || name === 'Bank') && type === 'bank') {
      return t('account.defaultBank');
    }
    if ((name === 'Espèce' || name === 'Cash') && type === 'cash') {
      return t('account.defaultCash');
    }
    return name;
  };

  const getTransferLabel = () => {
    if (!isTransfer) return null;
    const from = getAccountDisplayName(transaction.account_name, transaction.account_type);
    const to = transaction.linked_account_name || t('add.account');
    return `${from} → ${to}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleTimeString(locale, {
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
            {getCategoryName()}
          </Text>
          {isTransfer && getTransferLabel() && (
            <Text className="text-primary-600 text-sm font-medium">
              {getTransferLabel()}
            </Text>
          )}
          {!isTransfer && !isExpense && transaction.account_name && (
            <Text className="text-success-600 text-sm font-medium">
              → {getAccountDisplayName(transaction.account_name, transaction.account_type)}
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
