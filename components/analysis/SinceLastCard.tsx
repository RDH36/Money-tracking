import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import type { SinceLast } from '@/hooks/useAnalysis';
import type { Indicators } from '@/lib/analysis/types';

interface SinceLastCardProps {
  sinceLast: SinceLast;
  indicators: Indicators;
  currency: string;
}

/**
 * Bloc « depuis la dernière fois » : compare le cycle courant à la dernière
 * analyse persistée. C'est la boucle comportementale — voir que ce qu'on a
 * fait a marché. Faits chiffrés uniquement, pas de jugement.
 */
export function SinceLastCard({ sinceLast, indicators, currency }: SinceLastCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  const microImproved = sinceLast.prevMicroTotal > 0 && indicators.microTotal < sinceLast.prevMicroTotal;
  const keptDelta = indicators.keptAmount - sinceLast.prevKept;
  // On ne montre le delta « gardé » que si les deux termes sont comparables
  // (revenu présent des deux côtés — sinon le delta mélange des natures).
  const showKept = indicators.savingsRate !== null && sinceLast.prevSavingsRate !== null;

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      style={{
        backgroundColor: v2.brandSoft, borderWidth: 1, borderColor: v2.brandTint,
        borderRadius: 16, padding: 14, gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="time-outline" size={14} color={v2.brand} />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.brand }}>
          {t('analysis.sinceLastTitle', { count: sinceLast.daysSince })}
        </Text>
      </View>

      {microImproved ? (
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.ink, lineHeight: 18 }}>
          {t('analysis.sinceLastMicro', {
            prev: formatMoneyFr(sinceLast.prevMicroTotal),
            now: formatMoneyFr(indicators.microTotal),
            currency,
          })}
        </Text>
      ) : null}

      {showKept && keptDelta !== 0 ? (
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: keptDelta > 0 ? v2.good : v2.inkMuted, lineHeight: 18 }}>
          {keptDelta > 0
            ? t('analysis.sinceLastKeptMore', { amount: formatMoneyFr(keptDelta), currency })
            : t('analysis.sinceLastKeptLess', { amount: formatMoneyFr(Math.abs(keptDelta)), currency })}
        </Text>
      ) : null}

      {!microImproved && (!showKept || keptDelta === 0) ? (
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, lineHeight: 18 }}>
          {t('analysis.sinceLastNoChange')}
        </Text>
      ) : null}
    </Animated.View>
  );
}
