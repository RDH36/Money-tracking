import { View, Text as RNText } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getCategoryDisplayName } from '@/constants/categories';

interface CategoryData {
  id?: string | null;
  name: string;
  amount: number;
  color?: string;
}

interface ExpenseChartProps {
  data: CategoryData[];
  title?: string;
}

export function ExpenseChart({ data, title }: ExpenseChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currencyCode = useCurrencyCode();
  const isDark = useEffectiveColorScheme() === 'dark';

  const getCategoryName = (item: CategoryData) => {
    if (!item.id) return t('common.noCategory');
    return getCategoryDisplayName(item.id, item.name, t) || item.name;
  };

  const displayTitle = title || t('dashboard.expensesByCategory');

  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const pieData = data.map((item, index) => ({
    value: item.amount,
    color: item.color || theme.chartColors[index % theme.chartColors.length],
    text: `${Math.round((item.amount / total) * 100)}%`,
    label: getCategoryName(item),
  }));

  return (
    <View className="gap-4">
      <RNText className="font-ui text-ui-lg text-content-primary">{displayTitle}</RNText>

      <View className="flex-row items-center justify-center gap-4">
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={45}
          innerCircleColor={isDark ? '#1A1A20' : '#FFFFFF'}
          centerLabelComponent={() => (
            <View className="items-center justify-center">
              <RNText className="text-content-tertiary text-ui-sm">Total</RNText>
              <RNText className="font-display text-ui-md text-content-primary">
                {formatCurrency(total, currencyCode)}
              </RNText>
            </View>
          )}
        />

        <View className="flex-1 gap-2">
          {pieData.slice(0, 5).map((item, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <RNText className="font-body-regular text-body-sm text-content-primary flex-1" numberOfLines={1}>
                {item.label}
              </RNText>
              <RNText className="font-ui text-ui-sm text-content-tertiary">
                {item.text}
              </RNText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
