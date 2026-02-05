import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { useBalanceHidden } from '@/stores/settingsStore';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { SettingSection } from './SettingSection';
import type { AccountWithBalance } from '@/types';

interface AccountsSectionProps {
  accounts: AccountWithBalance[];
  formatMoney: (amount: number) => string;
  onDelete: (account: AccountWithBalance) => void;
}

export function AccountsSection({ accounts, formatMoney, onDelete }: AccountsSectionProps) {
  const { theme } = useTheme();
  const balanceHidden = useBalanceHidden();
  const hiddenAmount = '••••••';
  const effectiveScheme = useEffectiveColorScheme();
  const colors = getDarkModeColors(effectiveScheme === 'dark');

  const getAccountColor = (type: string) => {
    return type === 'bank' ? theme.colors.primary : theme.colors.secondary;
  };

  if (accounts.length === 0) return null;

  return (
    <SettingSection title="Mes comptes">
      {accounts.map((account, index) => {
        const color = getAccountColor(account.type);
        const isLast = index === accounts.length - 1;

        return (
          <HStack
            key={account.id}
            className={`px-4 py-3 justify-between items-center ${!isLast ? 'border-b border-outline-100' : ''}`}
          >
            <HStack space="md" className="items-center flex-1">
              <Box
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                <Ionicons
                  name={account.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={color}
                />
              </Box>
              <VStack>
                <Text className="font-medium text-typography-900">{account.name}</Text>
                <Text className="text-xs text-typography-500">
                  {account.type === 'bank' ? 'Bancaire' : 'Espèce'}
                </Text>
              </VStack>
            </HStack>
            <HStack space="md" className="items-center">
              <Text className="font-semibold" style={{ color }}>
                {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
              </Text>
              {account.is_default === 0 && (
                <Pressable onPress={() => onDelete(account)}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </Pressable>
              )}
            </HStack>
          </HStack>
        );
      })}
    </SettingSection>
  );
}
