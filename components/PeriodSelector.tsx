import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { useTheme } from '@/contexts';
import type { PeriodType } from '@/hooks/useTransactionStats';
import { navigateDate, formatPeriodLabel } from '@/hooks/useTransactionStats';

interface PeriodSelectorProps {
  period: PeriodType;
  date: Date;
  onPeriodChange: (period: PeriodType) => void;
  onDateChange: (date: Date) => void;
}

const PERIODS: PeriodType[] = ['day', 'week', 'month', 'year'];

export function PeriodSelector({ period, date, onPeriodChange, onDateChange }: PeriodSelectorProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  const locale = i18n.language === 'mg' ? 'fr-MG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const label = formatPeriodLabel(date, period, locale);

  return (
    <>
      <HStack className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.colors.primaryLight }}>
        {PERIODS.map((p) => (
          <Pressable key={p} onPress={() => onPeriodChange(p)} className="flex-1">
            <Box
              className="py-2 items-center"
              style={period === p ? { backgroundColor: theme.colors.primary } : undefined}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: period === p ? '#FFFFFF' : theme.colors.primary }}
              >
                {t(`periods.${p}`)}
              </Text>
            </Box>
          </Pressable>
        ))}
      </HStack>

      <HStack className="items-center justify-between px-2">
        <Pressable onPress={() => onDateChange(navigateDate(date, period, -1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
        </Pressable>
        <Text className="text-sm font-semibold text-typography-700 capitalize">{label}</Text>
        <Pressable onPress={() => onDateChange(navigateDate(date, period, 1))} hitSlop={12}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </Pressable>
      </HStack>
    </>
  );
}
