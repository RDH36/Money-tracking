import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface NetSummaryCardProps {
  periodLabel: string;
  totalIncome: number;
  totalExpenses: number;
  avgPerDay: number;
  topCategoryName: string | null;
  formatMoney: (n: number) => string;
}

export function NetSummaryCard({
  periodLabel,
  totalIncome,
  totalExpenses,
  avgPerDay,
  topCategoryName,
  formatMoney,
}: NetSummaryCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const net = totalIncome - totalExpenses;
  const sign = net >= 0 ? '+' : '−';

  return (
    <View style={{ borderRadius: 18, overflow: 'hidden' }}>
      <LinearGradient
        colors={[v2.bgInk, v2.bgInkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: v2.inkOnDarkM, marginBottom: 8,
          }}
        >
          {t('reports.netLabel', { period: periodLabel })}
        </Text>

        <Text
          style={{
            fontFamily: v2.fontDisplay, fontSize: 36,
            color: v2.inkOnDark, letterSpacing: -1, lineHeight: 38,
            fontVariant: ['tabular-nums'],
          }}
        >
          {sign}{formatMoney(Math.abs(net))}
        </Text>

        <View style={{ marginTop: 16, flexDirection: 'row', gap: 18 }}>
          <Col v2={v2} label={t('reports.income')} value={`+${formatMoney(totalIncome)}`} positive />
          <View style={{ width: 1, backgroundColor: 'rgba(245,245,241,0.1)' }} />
          <Col v2={v2} label={t('reports.expenses')} value={`-${formatMoney(totalExpenses)}`} positive={false} />
        </View>

        <View
          style={{
            marginTop: 14, paddingTop: 14,
            borderTopWidth: 1, borderTopColor: 'rgba(245,245,241,0.08)',
            flexDirection: 'row', gap: 18,
          }}
        >
          <SubCol v2={v2} label={t('reports.avgPerDay')} value={formatMoney(avgPerDay)} />
          <View style={{ width: 1, backgroundColor: 'rgba(245,245,241,0.08)' }} />
          <SubCol v2={v2} label={t('reports.topCategory')} value={topCategoryName ?? '—'} />
        </View>
      </LinearGradient>
    </View>
  );
}

interface ColProps { v2: ReturnType<typeof useV2>; label: string; value: string; positive: boolean; }
function Col({ v2, label, value, positive }: ColProps) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
          letterSpacing: 0.5, textTransform: 'uppercase',
          color: v2.inkOnDarkM,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 4, fontFamily: v2.fontUI, fontSize: 13,
          fontWeight: '700', fontVariant: ['tabular-nums'],
          color: positive ? '#7DD3A6' : '#E8A99B',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

interface SubColProps { v2: ReturnType<typeof useV2>; label: string; value: string; }
function SubCol({ v2, label, value }: SubColProps) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 9, fontWeight: '700',
          letterSpacing: 1.2, textTransform: 'uppercase',
          color: v2.inkOnDarkM,
        }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 4, fontFamily: v2.fontUI, fontSize: 12,
          fontWeight: '600', color: v2.inkOnDark,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
