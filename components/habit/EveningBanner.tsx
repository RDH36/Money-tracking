import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { EyebrowLabel } from '@/components/onboarding/v2';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrentStreak } from '@/stores/gamificationStore';
import { computeTodayStats } from '@/lib/habit/todayStats';

interface EveningBannerProps {
  formatMoney: (n: number) => string;
}

/** Ouvert depuis le rappel du soir : chiffre du jour, série, titre. */
export function EveningBanner({ formatMoney }: EveningBannerProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const { transactions } = useTransactions();
  const streak = useCurrentStreak();
  const today = useMemo(() => computeTodayStats(transactions, new Date()), [transactions]);
  const nothing = today.count === 0;

  return (
    <View>
      <View
        style={{
          backgroundColor: v2.bgInk, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkOnDarkM }}>
            {t('habit.evening.today')}
          </Text>
          <Text style={{ marginTop: 2, fontFamily: v2.fontUI, fontSize: 16, fontWeight: '700', color: v2.inkOnDark }}>
            {nothing
              ? t('habit.evening.nothing')
              : t('habit.evening.summary', { count: today.expenseCount, amount: formatMoney(today.expense) })}
          </Text>
        </View>
        {streak > 0 ? (
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: v2.brand }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.inkOnDark }}>
              {t('habit.evening.streak', { count: streak })}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ marginTop: 16 }}>
        <EyebrowLabel>{t('habit.evening.eyebrow')}</EyebrowLabel>
        <Text
          style={{
            marginTop: 4, fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 26, color: v2.ink, letterSpacing: -0.5, lineHeight: 30,
          }}
        >
          {t(nothing ? 'habit.first.titleStart' : 'habit.evening.titleStart')}{' '}
          <Text style={{ fontStyle: 'italic', color: v2.brand }}>
            {t(nothing ? 'habit.first.titleAccent' : 'habit.evening.titleAccent')}
          </Text>
        </Text>
      </View>
    </View>
  );
}
