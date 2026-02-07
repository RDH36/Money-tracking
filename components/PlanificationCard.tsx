import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import type { PlanificationWithTotal } from '@/types';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';

interface PlanificationCardProps {
  planification: PlanificationWithTotal;
  onPress: () => void;
  onLongPress?: () => void;
  onValidate?: () => void;
  onDelete?: () => void;
  formatMoney: (amount: number) => string;
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
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
  formatMoney,
}: PlanificationCardProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const colors = getDarkModeColors(effectiveScheme === 'dark');
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
                  backgroundColor: isPending ? theme.colors.primaryLight : theme.colors.secondaryLight,
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: isPending ? theme.colors.primary : theme.colors.secondary }}
                >
                  {isPending ? t('planification.pending') : t('planification.completed')}
                </Text>
              </Box>
              {expired && (
                <Box className="px-2 py-0.5 rounded-full bg-error-100">
                  <Text className="text-xs font-medium text-error-600">{t('planification.expired')}</Text>
                </Box>
              )}
            </HStack>
            <HStack space="md" className="items-center">
              <Text className="text-typography-500 text-sm">
                {t('planification.itemCount', { count: planification.item_count })}
              </Text>
              {planification.deadline && (
                <HStack space="xs" className="items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={expired ? '#DC2626' : colors.textMuted}
                  />
                  <Text className="text-sm" style={{ color: expired ? '#DC2626' : colors.textMuted }}>
                    {formatDate(planification.deadline, i18n.language)}
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>
          <VStack className="items-end" space="xs">
            {(planification.total_expenses > 0 || planification.total_income > 0) ? (
              <VStack className="items-end">
                {planification.total_expenses > 0 && (
                  <Text className="text-error-600 font-semibold text-sm">
                    - {formatMoney(planification.total_expenses)}
                  </Text>
                )}
                {planification.total_income > 0 && (
                  <Text className="text-success-600 font-semibold text-sm">
                    + {formatMoney(planification.total_income)}
                  </Text>
                )}
              </VStack>
            ) : (
              <Text className="text-typography-500 font-medium">0</Text>
            )}
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
                    <Text className="text-white text-xs font-medium">{t('planification.validate')}</Text>
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
