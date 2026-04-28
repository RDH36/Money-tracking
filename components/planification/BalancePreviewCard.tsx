import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface BalancePreviewCardProps {
  balance: number;
  totalPendingExpenses: number;
  totalPendingIncome: number;
  formatMoney: (n: number) => string;
}

export function BalancePreviewCard({
  balance,
  totalPendingExpenses,
  totalPendingIncome,
  formatMoney,
}: BalancePreviewCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const hasPending = totalPendingExpenses > 0 || totalPendingIncome > 0;
  const projected = balance - (totalPendingExpenses - totalPendingIncome);

  return (
    <View
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1,
        borderColor: v2.hairline,
        borderRadius: 18,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted }}>
          {t('planification.currentBalance')}
        </Text>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 16, fontWeight: '700', color: v2.ink, fontVariant: ['tabular-nums'] }}>
          {formatMoney(balance)}
        </Text>
      </View>

      {hasPending ? (
        <>
          {totalPendingExpenses > 0 ? (
            <Row v2={v2} label={t('planification.plannedExpenses')} value={`- ${formatMoney(totalPendingExpenses)}`} tone={v2.bad} />
          ) : null}
          {totalPendingIncome > 0 ? (
            <Row v2={v2} label={t('planification.plannedIncome')} value={`+ ${formatMoney(totalPendingIncome)}`} tone={v2.good} />
          ) : null}
          <View style={{ height: 1, backgroundColor: v2.hairline, marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.ink, fontWeight: '600' }}>
              {t('planification.balanceAfter')}
            </Text>
            <Text
              style={{
                fontFamily: v2.fontDisplay,
                fontWeight: '700',
                fontSize: 22,
                letterSpacing: -0.5,
                color: projected < 0 ? v2.bad : v2.brand,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatMoney(projected)}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

interface RowProps {
  v2: ReturnType<typeof useV2>;
  label: string;
  value: string;
  tone: string;
}

function Row({ v2, label, value, tone }: RowProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted }}>{label}</Text>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700', color: tone, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}
