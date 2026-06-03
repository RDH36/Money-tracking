import { Pressable, View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useTheme } from '@/contexts';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

export interface PlanificationGroupData {
  planification_id: string;
  planification_title: string;
  transactions: TransactionWithCategory[];
}

interface PlanificationTransactionGroupProps {
  group: PlanificationGroupData;
  onLongPress?: () => void;
}

export function PlanificationTransactionGroup({ group, onLongPress }: PlanificationTransactionGroupProps) {
  const currencyCode = useCurrencyCode();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const expenseCount = group.transactions.filter((tx) => tx.type === 'expense').length;
  const incomeCount = group.transactions.filter((tx) => tx.type === 'income').length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Pressable
      onPress={() => router.push(`/planification/${group.planification_id}`)}
      onLongPress={onLongPress}
    >
      <View className="bg-bg-surface p-4 rounded-xl">
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.colors.primary + '20' }}
          >
            <Ionicons name="layers" size={24} color={theme.colors.primary} />
          </View>

          <View className="flex-1">
            <RNText className="font-semibold text-content-primary" numberOfLines={1}>
              {group.planification_title}
            </RNText>
            <RNText className="text-sm" style={{ color: '#8E8EA0' }}>
              {t('planification.transactionCount', { count: group.transactions.length })}
            </RNText>
            {group.transactions.length > 0 && (
              <RNText className="text-xs" style={{ color: '#6E6E7D' }}>
                {formatTime(group.transactions[0].transaction_date)}
              </RNText>
            )}
          </View>

          <View className="items-end gap-1">
            {expenseCount > 0 && (
              <RNText className="font-bold" style={{ color: '#EF4444' }}>
                -{formatCurrency(group.transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0), currencyCode)}
              </RNText>
            )}
            {incomeCount > 0 && (
              <RNText className="font-bold" style={{ color: '#22C55E' }}>
                +{formatCurrency(group.transactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0), currencyCode)}
              </RNText>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
