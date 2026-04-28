import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface TodayCardProps {
  dateLabel: string;
  transactionCount: number;
  netAmount: number;
  spent: number;
  received: number;
  formatMoney: (n: number) => string;
}

export function TodayCard({
  dateLabel,
  transactionCount,
  netAmount,
  spent,
  received,
  formatMoney,
}: TodayCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const positive = netAmount >= 0;
  const chipBg = positive ? v2.brand : v2.bad;
  const chipText = positive
    ? t('activity.netPositive', { amount: formatMoney(netAmount) })
    : t('activity.netNegative', { amount: formatMoney(netAmount) });

  return (
    <View
      style={{
        backgroundColor: v2.brandTint,
        borderWidth: 1,
        borderColor: v2.brand + '4D',
        borderRadius: 18,
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: v2.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="time" size={16} color={v2.inkOnDark} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: v2.fontUI,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: v2.brandDeep,
              }}
            >
              {t('activity.todayDate', { date: dateLabel })}
            </Text>
            <Text
              style={{
                fontFamily: v2.fontUI,
                fontSize: 11,
                color: v2.inkMuted,
                marginTop: 1,
              }}
            >
              {t('activity.txCount', { count: transactionCount })}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: chipBg,
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 999,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: v2.fontUI,
              fontSize: 11,
              fontWeight: '700',
              color: v2.inkOnDark,
              fontVariant: ['tabular-nums'],
            }}
          >
            {chipText}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <StatBox v2={v2} label={t('activity.spent')} value={`-${formatMoney(spent)}`} tone={v2.bad} />
        <StatBox v2={v2} label={t('activity.received')} value={formatMoney(received)} tone={v2.good} />
      </View>
    </View>
  );
}

interface StatBoxProps {
  v2: ReturnType<typeof useV2>;
  label: string;
  value: string;
  tone: string;
}

function StatBox({ v2, label, value, tone }: StatBoxProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: v2.bgSurface,
        padding: 10,
        borderRadius: 10,
      }}
    >
      <Text
        style={{
          fontFamily: v2.fontUI,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: v2.inkSubtle,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          marginTop: 2,
          fontFamily: v2.fontUI,
          fontSize: 14,
          fontWeight: '700',
          color: tone,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}
