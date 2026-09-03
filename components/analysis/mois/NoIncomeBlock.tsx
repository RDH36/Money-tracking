import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import { useSQLiteContext } from '@/lib/database';
import { useCycleSettings } from '@/hooks/useCycleSettings';
import { detectPayday, type PaydayDetection } from '@/lib/analysis/payday';
import type { Cycle } from '@/lib/analysis/types';

interface NoIncomeBlockProps {
  cycle: Cycle;
  /** Dépenses du cycle, en centimes. */
  expenses: number;
  range: string;
  currency: string;
  onAddIncome: () => void;
}

/** En dessous, la détection n'est pas assez sûre pour proposer une estimation. */
const MIN_CONFIDENCE = 0.5;

/**
 * État « sans paye » (maquette SansRevenu) : carte sombre d'avancement +
 * dépensé, puis carte blanche qui explique ce qui manque et propose de
 * l'ajouter, ou d'utiliser la paye détectée sur les mois précédents.
 */
export function NoIncomeBlock({ cycle, expenses, range, currency, onAddIncome }: NoIncomeBlockProps) {
  const v2 = useV2();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { settings, expectedIncome, save } = useCycleSettings();
  const [detected, setDetected] = useState<PaydayDetection | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    detectPayday(db)
      .then((d) => alive && setDetected(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [db]);

  // Revenu utilisable comme estimation : réglage existant, sinon détection fiable.
  const usable = expectedIncome && expectedIncome > 0 ? expectedIncome : null;
  const detectedIncome =
    detected && detected.expectedIncome && detected.confidence >= MIN_CONFIDENCE ? detected.expectedIncome : null;
  const estimate = usable ?? detectedIncome;
  const payDay = settings.payDay ?? detected?.payDay ?? null;
  const body = estimate && payDay
    ? `${t('analysis.noIncome.body')} ${t('analysis.noIncome.usual', { amount: formatMoneyFr(estimate), currency, day: payDay })}`
    : t('analysis.noIncome.body');

  const useEstimate = async () => {
    if (!estimate || saving) return;
    setSaving(true);
    try {
      await save({ mode: settings.mode, payDay: settings.payDay, expectedIncome: estimate, source: 'detected' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ borderRadius: 22, overflow: 'hidden' }}>
        <LinearGradient colors={[v2.bgInk, v2.bgInkSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22, gap: 10 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkOnDarkM }}>
            {t('analysis.noIncome.dayOf', { range, elapsed: cycle.elapsedDays, total: cycle.totalDays })}
          </Text>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkOnDarkM }}>{t('analysis.noIncome.spentSoFar')}</Text>
            <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '800', fontSize: 34, lineHeight: 40, letterSpacing: -1.2, color: v2.inkOnDark }}>
              {formatMoneyFr(expenses)} {currency}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 18, padding: 18, gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: v2.brandTint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={22} color={v2.brand} />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 18, lineHeight: 24, color: v2.ink, letterSpacing: -0.3 }}>
            {t('analysis.noIncome.title')}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.inkMuted, lineHeight: 20 }}>{body}</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Pressable onPress={onAddIncome} style={{ height: 50, borderRadius: 14, backgroundColor: v2.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: v2.fontDisplay, fontSize: 15, fontWeight: '700', color: v2.inkOnDark }}>{t('analysis.noIncome.add')}</Text>
          </Pressable>
          {estimate ? (
            <Pressable
              onPress={useEstimate}
              disabled={saving}
              style={{ height: 44, borderRadius: 14, borderWidth: 1, borderColor: v2.hairlineStrong, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
            >
              <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600', color: v2.inkMuted }}>
                {t('analysis.noIncome.useEstimate', { amount: formatMoneyFr(estimate), currency })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
