import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import { Progress } from '@/components/dashboard';

interface CategoryHeroCardProps {
  categoryColor: string | null;
  monthLabel: string;
  spent: number;
  limit: number | null;
  percentage: number | null;
  status: 'green' | 'orange' | 'red' | null;
  resetTime: string;
  formatMoney: (n: number) => string;
  currencyCode?: string;
}

function tintAlpha(hex: string | null, suffix: string): string {
  if (hex && hex.startsWith('#') && hex.length === 7) return hex + suffix;
  return 'rgba(15,19,17,0.04)';
}

export function CategoryHeroCard({
  categoryColor,
  monthLabel,
  spent,
  limit,
  percentage,
  status,
  resetTime,
  formatMoney,
  currencyCode = 'Ar',
}: CategoryHeroCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const hasLimit = !!limit && limit > 0;
  const pct = percentage ?? 0;
  const tone = !hasLimit ? v2.inkSubtle : status === 'red' ? v2.bad : status === 'orange' ? v2.warn : v2.good;
  const overshoot = hasLimit && spent > limit ? spent - limit : 0;

  return (
    <View
      style={{
        backgroundColor: v2.bgSurface,
        borderWidth: 1,
        borderColor: v2.hairline,
        borderRadius: 18,
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -50, top: -50,
          width: 160, height: 160,
          borderRadius: 80,
          backgroundColor: tintAlpha(categoryColor, '14'),
        }}
      />

      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: v2.inkSubtle, marginBottom: 8,
        }}
      >
        {t('categoryDetail.monthSpentLabel', { month: monthLabel })}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontSize: 38,
            letterSpacing: -1, color: v2.ink,
            fontVariant: ['tabular-nums'], lineHeight: 40,
          }}
        >
          {formatMoney(spent)}
        </Text>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.inkSubtle, fontWeight: '500' }}>
          {currencyCode}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, fontVariant: ['tabular-nums'] }}>
          {hasLimit ? `/ ${formatMoney(limit!)}` : t('activity.unlimited')}
        </Text>
      </View>

      {hasLimit ? (
        <Progress value={Math.min(pct, 100)} height={8} color={tone} thresholds={[50, 80]} />
      ) : (
        <View style={{ height: 8, backgroundColor: v2.bgRaised, borderRadius: 999 }} />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
        <Ionicons name="time-outline" size={12} color={v2.inkSubtle} />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, fontWeight: '500' }}>
          {t('categoryDetail.resetInLabel', { time: resetTime })}
        </Text>
        <View style={{ flex: 1 }} />
        {hasLimit && pct >= 80 ? (
          <View
            style={{
              backgroundColor: pct > 100 ? v2.badSoft : v2.warnSoft,
              paddingVertical: 4, paddingHorizontal: 10,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                color: pct > 100 ? v2.bad : v2.warn,
                fontVariant: ['tabular-nums'],
              }}
            >
              {pct > 100
                ? t('categoryDetail.overshootChip', { amount: `${formatMoney(overshoot)} ${currencyCode}`, pct: Math.round(pct) })
                : t('categoryDetail.alertChip', { pct: Math.round(pct) })}
            </Text>
          </View>
        ) : null}
      </View>

      {hasLimit ? <ThresholdLegend v2={v2} pct={pct} /> : null}
    </View>
  );
}

interface LegendProps { v2: V2Tokens; pct: number; }

function ThresholdLegend({ v2, pct }: LegendProps) {
  const { t } = useTranslation();
  const reached50 = pct >= 50;
  const reached80 = pct >= 80;
  const exceeded = pct > 100;

  return (
    <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: v2.hairline, flexDirection: 'row' }}>
      <LegendCol
        v2={v2}
        title={t('categoryDetail.threshold1Label')}
        active={reached50}
        activeColor={v2.good}
        statusKey={reached50 ? 'categoryDetail.statusReached' : 'categoryDetail.statusNotYet'}
      />
      <LegendCol
        v2={v2}
        title={t('categoryDetail.threshold2Label')}
        active={reached80}
        activeColor={v2.warn}
        leftBorder
        statusKey={reached80 ? 'categoryDetail.statusAlertReady' : 'categoryDetail.statusNotYet'}
      />
      <LegendCol
        v2={v2}
        title={t('categoryDetail.thresholdLimitLabel')}
        active={exceeded}
        activeColor={v2.bad}
        leftBorder
        statusKey={exceeded ? 'categoryDetail.statusExceeded' : 'categoryDetail.statusNotYet'}
      />
    </View>
  );
}

interface ColProps {
  v2: V2Tokens;
  title: string;
  active: boolean;
  activeColor: string;
  statusKey: string;
  leftBorder?: boolean;
}

function LegendCol({ v2, title, active, activeColor, statusKey, leftBorder }: ColProps) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, paddingLeft: leftBorder ? 14 : 0, borderLeftWidth: leftBorder ? 1 : 0, borderLeftColor: v2.hairline }}>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 9, fontWeight: '700',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: v2.inkSubtle, marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: active ? activeColor : v2.hairlineStrong,
          }}
        />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: active ? activeColor : v2.inkSubtle }}>
          {t(statusKey)}
        </Text>
      </View>
    </View>
  );
}
