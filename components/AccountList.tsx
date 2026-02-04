import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { useBalanceHidden } from '@/stores/settingsStore';
import type { AccountWithBalance } from '@/types';

interface AccountListProps {
  accounts: AccountWithBalance[];
  formatMoney: (amount: number) => string;
  onDelete?: (account: AccountWithBalance) => void;
}

export function AccountList({ accounts, formatMoney, onDelete }: AccountListProps) {
  const { theme } = useTheme();
  const balanceHidden = useBalanceHidden();
  const hiddenAmount = '••••••';

  const getAccountColor = (type: string) => {
    return type === 'bank' ? theme.colors.primary : '#22c55e';
  };

  return (
    <VStack space="md">
      <Text className="text-typography-700 font-semibold text-lg">Mes comptes</Text>
      <VStack space="sm">
        {accounts.map((account) => (
          <Box
            key={account.id}
            className="p-4 rounded-xl border"
            style={{
              borderColor: getAccountColor(account.type) + '40',
              backgroundColor: getAccountColor(account.type) + '10',
            }}
          >
            <HStack className="justify-between items-center">
              <HStack space="md" className="items-center">
                <Box
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: getAccountColor(account.type) + '30' }}
                >
                  <Ionicons
                    name={account.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={getAccountColor(account.type)}
                  />
                </Box>
                <VStack>
                  <Text className="font-semibold text-typography-900">{account.name}</Text>
                  <Text className="text-xs text-typography-500">
                    {account.type === 'bank' ? 'Bancaire' : 'Espèce'}
                  </Text>
                </VStack>
              </HStack>
              <HStack space="md" className="items-center">
                <Text className="font-bold" style={{ color: getAccountColor(account.type) }}>
                  {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                </Text>
                {account.is_default === 0 && onDelete && (
                  <Pressable onPress={() => onDelete(account)}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </Pressable>
                )}
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}
