import { PieChart } from 'react-native-gifted-charts';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';

interface CategoryData {
  name: string;
  amount: number;
  color?: string;
}

interface ExpenseChartProps {
  data: CategoryData[];
  title?: string;
}

export function ExpenseChart({ data, title = 'Dépenses par catégorie' }: ExpenseChartProps) {
  const { theme } = useTheme();
  const currencyCode = useCurrencyCode();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';

  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const pieData = data.map((item, index) => ({
    value: item.amount,
    color: item.color || theme.chartColors[index % theme.chartColors.length],
    text: `${Math.round((item.amount / total) * 100)}%`,
    label: item.name,
  }));

  return (
    <VStack space="md">
      <Text className="text-typography-700 font-semibold">{title}</Text>

      <HStack className="items-center justify-center" space="lg">
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={45}
          innerCircleColor={isDark ? '#1C1C1E' : '#FFFFFF'}
          centerLabelComponent={() => (
            <VStack className="items-center">
              <Text className="text-typography-500 text-xs">Total</Text>
              <Text className="text-typography-900 font-bold text-sm">
                {formatCurrency(total, currencyCode)}
              </Text>
            </VStack>
          )}
        />

        <VStack space="xs" className="flex-1">
          {pieData.slice(0, 5).map((item, index) => (
            <HStack key={index} className="items-center" space="sm">
              <Box
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <Text className="text-typography-600 text-xs flex-1" numberOfLines={1}>
                {item.label}
              </Text>
              <Text className="text-typography-500 text-xs">
                {item.text}
              </Text>
            </HStack>
          ))}
        </VStack>
      </HStack>
    </VStack>
  );
}
