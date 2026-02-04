import { Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { useTheme } from '@/contexts';
import { useBalanceHidden } from '@/stores/settingsStore';
import type { AccountWithBalance } from '@/types';

interface AccountPickerProps {
  accounts: AccountWithBalance[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  formatMoney: (amount: number) => string;
}

export function AccountPicker({
  accounts,
  selectedId,
  onSelect,
  formatMoney,
}: AccountPickerProps) {
  const { theme } = useTheme();
  const balanceHidden = useBalanceHidden();
  const hiddenAmount = '••••••';

  const getAccountColor = (type: string) => {
    return type === 'bank' ? theme.colors.primary : theme.colors.secondary;
  };

  const getAccountIcon = (type: string) => {
    return type === 'bank' ? 'card' : 'cash';
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <HStack space="md">
        {accounts.map((account) => {
          const isSelected = selectedId === account.id;
          const color = getAccountColor(account.type);

          return (
            <Pressable
              key={account.id}
              onPress={() => onSelect(isSelected ? null : account.id)}
              style={{ minWidth: 140 }}
            >
              <Box
                className="p-4 rounded-xl border-2"
                style={{
                  backgroundColor: isSelected ? color + '15' : '#F5F5F5',
                  borderColor: isSelected ? color : 'transparent',
                }}
              >
                <VStack space="sm">
                  <HStack space="sm" className="items-center">
                    <Ionicons
                      name={getAccountIcon(account.type) as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={isSelected ? color : '#666'}
                    />
                    <Text
                      className="font-semibold"
                      style={{ color: isSelected ? color : '#666' }}
                    >
                      {account.name}
                    </Text>
                  </HStack>
                  <Text
                    className="text-xs"
                    style={{ color: isSelected ? color : '#999' }}
                  >
                    {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                  </Text>
                </VStack>
              </Box>
            </Pressable>
          );
        })}
      </HStack>
    </ScrollView>
  );
}
