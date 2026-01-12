import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import type { PlanificationWithTotal } from '@/types';

interface PlanificationCardProps {
  planification: PlanificationWithTotal;
  onPress: () => void;
  onLongPress?: () => void;
  onValidate?: () => void;
  onDelete?: () => void;
}

function formatMGA(amountInCents: number): string {
  const amount = amountInCents / 100;
  return amount.toLocaleString('fr-FR') + ' MGA';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function isExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function PlanificationCard({
  planification,
  onPress,
  onLongPress,
  onValidate,
  onDelete,
}: PlanificationCardProps) {
  const { theme } = useTheme();
  const isPending = planification.status === 'pending';
  const expired = isPending && isExpired(planification.deadline);

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      <Box
        className="bg-background-50 p-4 rounded-xl mb-3"
        style={expired ? { borderWidth: 1, borderColor: '#DC2626' } : undefined}
      >
        <HStack className="justify-between items-start">
          <VStack className="flex-1" space="xs">
            <HStack space="sm" className="items-center flex-wrap">
              <Text className="text-typography-900 font-semibold text-lg">
                {planification.title}
              </Text>
              <Box
                className="px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isPending ? theme.colors.primaryLight : '#E5E7EB',
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: isPending ? theme.colors.primary : '#6B7280' }}
                >
                  {isPending ? 'En attente' : 'Terminé'}
                </Text>
              </Box>
              {expired && (
                <Box className="px-2 py-0.5 rounded-full bg-error-100">
                  <Text className="text-xs font-medium text-error-600">Expiré</Text>
                </Box>
              )}
            </HStack>
            <HStack space="md" className="items-center">
              <Text className="text-typography-500 text-sm">
                {planification.item_count} achat{planification.item_count > 1 ? 's' : ''}
              </Text>
              {planification.deadline && (
                <HStack space="xs" className="items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={expired ? '#DC2626' : '#6B7280'}
                  />
                  <Text className="text-sm" style={{ color: expired ? '#DC2626' : '#6B7280' }}>
                    {formatDate(planification.deadline)}
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>
          <VStack className="items-end" space="xs">
            <Text className="text-typography-900 font-bold text-lg">
              {formatMGA(planification.total)}
            </Text>
            {isPending && (
              <HStack space="sm" className="items-center">
                {onDelete && (
                  <Pressable onPress={onDelete} className="p-1">
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </Pressable>
                )}
                {planification.item_count > 0 && onValidate && (
                  <Pressable
                    onPress={onValidate}
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Text className="text-white text-xs font-medium">Valider</Text>
                  </Pressable>
                )}
              </HStack>
            )}
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
}
