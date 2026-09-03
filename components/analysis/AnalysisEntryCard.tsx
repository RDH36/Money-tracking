import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useAnalysisEntry } from '@/hooks/useAnalysisEntry';
import { StatusPill, formatRate, signed, formatWhole } from '@/components/analysis/mois';

/**
 * Carte d'entrée pleine largeur sous le hero (maquette Accueil). Elle DIT le
 * verdict (statut, montant gardé, taux) et invite à voir pourquoi. Style
 * volontairement DOUX (surface neutre, bordure hairline) : une porte d'entrée
 * permanente, pas une alerte. Sans verdict calculable, rendu générique.
 */
export function AnalysisEntryCard({ onPress }: { onPress: () => void }) {
  const v2 = useV2();
  const { t } = useTranslation();
  const currency = useCurrencyCode();
  const { verdict } = useAnalysisEntry();

  const card = {
    backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 18, padding: 16,
  } as const;

  if (!verdict || verdict.status === 'unknown') {
    return (
      <Pressable onPress={onPress} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: v2.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles-outline" size={18} color={v2.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 15, color: v2.ink, letterSpacing: -0.2 }}>
            {t('analysis.entryTitle')}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, marginTop: 2 }}>{t('analysis.entrySubtitle')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={v2.inkSubtle} />
      </Pressable>
    );
  }

  const over = verdict.kept < 0;
  const amountColor = over ? v2.bad : v2.good;
  const rateText = over
    ? t('analysis.entry.over')
    : t(verdict.incomeEstimated ? 'analysis.entry.keptEstimated' : 'analysis.entry.kept', { rate: formatRate(verdict.rate ?? 0) });

  return (
    <Pressable onPress={onPress} style={{ ...card, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: v2.inkMuted }}
        >
          {t('analysis.entry.overline', { range: verdict.range })}
        </Text>
        <StatusPill status={verdict.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '800', fontSize: 34, lineHeight: 38, letterSpacing: -1.2, color: amountColor }}>
          {signed(formatWhole(verdict.kept), verdict.kept)} {currency}
        </Text>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted }}>{rateText}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: v2.hairline }}>
        <Text style={{ fontFamily: v2.fontDisplay, fontSize: 14, fontWeight: '700', color: v2.brand }}>{t('analysis.entry.seeWhy')}</Text>
        <Ionicons name="chevron-forward" size={18} color={v2.brand} />
      </View>
    </Pressable>
  );
}
