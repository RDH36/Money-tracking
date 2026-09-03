import { useState, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { Insight } from '@/lib/analysis/types';
import { insightIcon, severityTone } from './tone';

interface WeighRowProps {
  insight: Insight;
  currency: string;
  /** Rang, pour la révélation en cascade. */
  index: number;
  /** Dernière ligne : pas de séparateur. */
  last: boolean;
  onDismiss: (id: string) => void;
}

/**
 * Un constat en ligne (maquette Main) : carré d'icône 36 teinté par sévérité,
 * titre-phrase 14/19, ligne factuelle 12/17, puis « Voir le calcul » qui
 * déplie l'evidence brute et le lien discret de masquage.
 */
export function WeighRow({ insight, currency, index, last, onDismiss }: WeighRowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const tone = severityTone(v2, insight.severity);
  const params = { ...insight.params, currency };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 90).duration(320)}
      style={{
        flexDirection: 'row', gap: 12, alignItems: 'flex-start',
        paddingVertical: 14, paddingHorizontal: 12,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: v2.hairline,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={insightIcon(insight.id, insight.severity)} size={18} color={tone.fg} />
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600', color: v2.ink, lineHeight: 19 }}>
          {t(insight.titleKey, params)}
        </Text>
        {insight.bodyKey ? (
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, lineHeight: 17 }}>
            {t(insight.bodyKey, params)}
          </Text>
        ) : null}

        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '500', color: v2.brand }}>
            {t(open ? 'analysis.hideCalc' : 'analysis.seeCalc')}
          </Text>
        </Pressable>

        {open ? (
          <View style={{ gap: 8, marginTop: 2 }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, fontVariant: ['tabular-nums'], letterSpacing: 0.2, lineHeight: 16 }}>
              {insight.evidence}
            </Text>
            <Pressable onPress={() => onDismiss(insight.id)} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, textDecorationLine: 'underline' }}>
                {t('analysis.hideInsight')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Carte blanche qui reçoit les lignes de constats (rayon 18, padding 4). */
export function WeighCard({ children }: { children: ReactNode }) {
  const v2 = useV2();
  return (
    <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 18, padding: 4 }}>
      {children}
    </View>
  );
}

/** Label de section en petites capitales : 10 px, espacement 1.5, encre atténuée. */
export function SectionLabel({ text }: { text: string }) {
  const v2 = useV2();
  return (
    <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkMuted, marginBottom: 10 }}>
      {text}
    </Text>
  );
}
