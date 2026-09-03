import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { Verdict } from '@/lib/analysis/verdict';
import { StatusPill } from './StatusPill';
import { formatCycleLabel, formatRate, signed, statusTone, formatWhole } from './tone';

interface VerdictCardProps {
  verdict: Verdict;
  /** Revenu du cycle (saisi ou estimé), en centimes. */
  income: number;
  /** Libellé du cycle (« juillet 2026 », « 29 juin → 28 juil. »). */
  range: string;
  currency: string;
  lang: string;
}

/** Échelle minimale de la barre : un taux de 12 % doit rester lisible. */
const MIN_SCALE = 0.25;

/**
 * La carte verdict : la réponse en un coup d'œil. Fond sombre comme le hero
 * de l'accueil, montant gardé en teinte claire, barre du taux avec repère
 * au record. Valeurs de la maquette Main (rayon 22, padding 22, gap 14).
 */
export function VerdictCard({ verdict, income, range, currency, lang }: VerdictCardProps) {
  const v2 = useV2();
  const router = useRouter();
  const { t } = useTranslation();
  const tone = statusTone(v2, verdict.status);
  const amountColor = verdict.kept < 0 ? statusTone(v2, 'red').onDark : statusTone(v2, 'green').onDark;
  const rate = verdict.rate ?? 0;
  const scale = Math.max(rate, verdict.bestRate ?? 0, MIN_SCALE);
  const fillPct = Math.max(0, Math.min(1, rate / scale)) * 100;
  const bestPct = verdict.bestRate != null ? Math.max(0, Math.min(1, verdict.bestRate / scale)) * 100 : null;
  const subKey = verdict.kept < 0 ? 'analysis.overOn' : verdict.incomeEstimated ? 'analysis.keptOnEstimated' : 'analysis.keptOn';

  return (
    <View style={{ borderRadius: 22, overflow: 'hidden' }}>
      <LinearGradient colors={[v2.bgInk, v2.bgInkSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkOnDarkM }}
          >
            {range}
          </Text>
          <StatusPill status={verdict.status} onDark />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '800', fontSize: 40, lineHeight: 44, letterSpacing: -1.5, color: amountColor }}>
            {signed(formatWhole(verdict.kept), verdict.kept)} {currency}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkOnDarkM, lineHeight: 18 }}>
              {t(subKey, { income: formatWhole(income), currency, rate: formatRate(Math.abs(rate)) })}
            </Text>
            {verdict.incomeEstimated ? (
              <Pressable onPress={() => router.push('/settings/cycle?focus=income' as any)} hitSlop={6}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.inkOnDark, textDecorationLine: 'underline' }}>
                  {t('analysis.incomeEstimatedEdit')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {verdict.rate != null ? (
          <View style={{ gap: 6 }}>
            <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(245,245,241,0.12)' }}>
              <View style={{ height: 6, borderRadius: 999, width: `${fillPct}%`, backgroundColor: tone.onDark }} />
              {bestPct != null ? (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', left: `${bestPct}%`, top: -3, width: 2, height: 12, borderRadius: 1, marginLeft: -1, backgroundColor: v2.inkOnDark, opacity: 0.8 }}
                />
              ) : null}
            </View>
            {verdict.bestRate != null && verdict.bestLabel ? (
              <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkOnDarkM }}>
                {t('analysis.record', { best: formatRate(verdict.bestRate), month: formatCycleLabel(verdict.bestLabel, lang) })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
