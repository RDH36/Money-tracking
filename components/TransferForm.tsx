import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import type { AccountWithBalance } from '@/types';

interface TransferFormProps {
  accounts: AccountWithBalance[];
  fromAccountId: string | null;
  toAccountId: string | null;
  onFromChange: (id: string | null) => void;
  onToChange: (id: string | null) => void;
}

export function TransferForm({
  accounts,
  fromAccountId,
  toAccountId,
  onFromChange,
  onToChange,
}: TransferFormProps) {
  const { theme } = useTheme();

  const renderAccountButton = (
    account: AccountWithBalance,
    isSelected: boolean,
    isDisabled: boolean,
    onPress: () => void
  ) => {
    const color = account.type === 'bank' ? theme.colors.primary : '#22c55e';
    return (
      <Button
        key={account.id}
        size="lg"
        variant={isSelected ? 'solid' : 'outline'}
        onPress={onPress}
        isDisabled={isDisabled}
        className="flex-1"
        style={isSelected ? { backgroundColor: color } : {}}
      >
        <HStack space="sm" className="items-center">
          <Ionicons
            name={(account.type === 'bank' ? 'card' : 'cash') as keyof typeof Ionicons.glyphMap}
            size={18}
            color={isSelected ? 'white' : color}
          />
          <ButtonText style={isSelected ? { color: 'white' } : { color }}>
            {account.name}
          </ButtonText>
        </HStack>
      </Button>
    );
  };

  return (
    <>
      <VStack space="sm">
        <Text className="text-typography-700 font-medium">De</Text>
        <HStack space="md">
          {accounts.map((account) =>
            renderAccountButton(
              account,
              fromAccountId === account.id,
              toAccountId === account.id,
              () => onFromChange(account.id)
            )
          )}
        </HStack>
      </VStack>

      <VStack space="sm">
        <Text className="text-typography-700 font-medium">Vers</Text>
        <HStack space="md">
          {accounts.map((account) =>
            renderAccountButton(
              account,
              toAccountId === account.id,
              fromAccountId === account.id,
              () => onToChange(account.id)
            )
          )}
        </HStack>
      </VStack>
    </>
  );
}
