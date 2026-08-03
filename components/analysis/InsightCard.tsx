import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { Insight } from '@/lib/analysis/types';

interface InsightCardProps {
  insight: Insight;
  /** Rang, pour la révélation en cascade. */
  index: number;
  onDismiss: (id: string) => void;
}

/**
 * Un constat : rang, message chiffré (i18n + params) et son `evidence` — le
 * calcul affiché tel quel pour être vérifiable. Bouton discret de rejet.
 */
export function InsightCard({ insight, index, onDismiss }: InsightCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const tone =
    insight.severity === 'urgent' ? v2.bad : insight.severity === 'watch' ? v2.warn : v2.inkMuted;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).duration(320)}
      style={{
        backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 16, padding: 14, gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 22, height: 22, borderRadius: 11, marginTop: 1,
            backgroundColor: `${tone}22`, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '800', color: tone }}>
            {index + 1}
          </Text>
        </View>
        <Text
          style={{
            flex: 1, fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600',
            color: v2.ink, lineHeight: 19,
          }}
        >
          {t(insight.titleKey, insight.params)}
        </Text>
      </View>

      <Text
        style={{
          marginLeft: 32, fontFamily: v2.fontUI, fontSize: 12,
          color: v2.inkSubtle, fontVariant: ['tabular-nums'], letterSpacing: 0.2,
        }}
      >
        {insight.evidence}
      </Text>

      <Pressable onPress={() => onDismiss(insight.id)} hitSlop={6} style={{ marginLeft: 32, marginTop: 2 }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, textDecorationLine: 'underline' }}>
          {t('analysis.dismiss')}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
