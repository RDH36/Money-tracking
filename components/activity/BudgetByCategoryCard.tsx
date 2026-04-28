import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { BudgetRow } from './BudgetRow';

export interface ActivityBudgetItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  spent: number;
  limit: number;
  txCount: number;
  alert?: boolean;
}

interface BudgetByCategoryCardProps {
  monthLabel: string;
  budgets: ActivityBudgetItem[];
  formatMoney: (n: number) => string;
  onCategoryPress?: (id: string) => void;
}

export function BudgetByCategoryCard({
  monthLabel,
  budgets,
  formatMoney,
  onCategoryPress,
}: BudgetByCategoryCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: v2.inkSubtle,
              marginBottom: 4,
            }}
          >
            {t('activity.budgetsHeader', { month: monthLabel })}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontDisplay,
              fontWeight: '700',
              fontSize: 20,
              color: v2.ink,
              letterSpacing: -0.4,
            }}
          >
            {t('activity.budgetsByCategory')}
          </Text>
        </View>
        {budgets.length > 0 ? (
          <View
            style={{
              backgroundColor: v2.bgRaised,
              borderRadius: 999,
              paddingVertical: 4,
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI,
                fontSize: 11,
                fontWeight: '700',
                color: v2.ink,
                fontVariant: ['tabular-nums'],
              }}
            >
              {budgets.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 18,
          padding: 4,
        }}
      >
        {budgets.length === 0 ? (
          <Text
            style={{
              fontFamily: v2.fontUI,
              fontSize: 12,
              color: v2.inkSubtle,
              textAlign: 'center',
              paddingVertical: 16,
            }}
          >
            {t('activity.noBudgetsForMonth')}
          </Text>
        ) : (
          budgets.map((b, i) => (
            <BudgetRow
              key={b.id}
              budget={b}
              isLast={i === budgets.length - 1}
              formatMoney={formatMoney}
              onPress={onCategoryPress ? () => onCategoryPress(b.id) : undefined}
            />
          ))
        )}
      </View>
    </View>
  );
}
