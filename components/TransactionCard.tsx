import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PressableCard } from '@/components/premium/PremiumCard';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useTheme } from '@/contexts';
import { getCategoryDisplayName } from '@/constants/categories';
import { formatTransactionDateTime } from '@/lib/formatTransactionDate';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import { BackdatedLine } from '@/components/transactions/BackdatedLine';

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TransactionCard({ transaction, onPress, onDelete }: TransactionCardProps) {
  const currencyCode = useCurrencyCode();
  const { theme } = useTheme();
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
    return (
      getCategoryDisplayName(transaction.category_id, transaction.category_name, t) ||
      t('common.noCategory')
    );
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

  return (
    <View>
      <PressableCard
        onPress={onPress || (() => {})}
        className="p-4"
      >
        <View className="flex-row gap-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: iconColor + '14' }}
          >
            <Ionicons
              name={(transaction.category_icon || 'cube') as keyof typeof Ionicons.glyphMap}
              size={24}
              color={iconColor}
            />
          </View>

          <View className="flex-1">
            <Text className="font-ui text-ui-md text-content-primary">
              {getCategoryName()}
            </Text>
            {isTransfer && getTransferLabel() && (
              <Text className="text-ui-sm font-ui" style={{ color: theme.colors.primary }}>
                {getTransferLabel()}
              </Text>
            )}
            {!isTransfer && !isExpense && transaction.account_name && (
              <Text className="text-ui-sm font-ui" style={{ color: theme.colors.primary }}>
                → {getAccountDisplayName(transaction.account_name, transaction.account_type)}
              </Text>
            )}
            {transaction.note && !isTransfer && (
              <Text
                className="font-body-regular text-body-sm" style={{ color: '#8E8EA0' }}
                numberOfLines={1}
              >
                {transaction.note}
              </Text>
            )}
            <Text className="text-ui-xs font-body-regular" style={{ color: '#8E8EA0' }}>
              {formatTransactionDateTime(transaction.transaction_date, i18n.language)}
            </Text>
            <BackdatedLine tx={transaction} />
          </View>

          <View className="items-end justify-center">
            <Text
              className="font-ui text-ui-lg font-bold"
              style={{ color: isTransfer ? theme.colors.primary : isExpense ? '#EF4444' : '#22C55E' }}
            >
              {isTransfer ? '' : sign}{formattedAmount}
            </Text>
          </View>
        </View>
      </PressableCard>
      {onDelete && (
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <Ionicons name="close" size={12} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}
