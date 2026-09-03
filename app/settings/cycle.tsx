import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useSQLiteContext } from '@/lib/database';
import { useCurrencyCode, type ExpectedIncomeSource } from '@/stores/settingsStore';
import { useCycleSettings } from '@/hooks/useCycleSettings';
import { detectPayday, type PaydayDetection } from '@/lib/analysis/payday';
import type { CycleMode } from '@/lib/analysis/types';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import { SectionLabel } from '@/components/settings/v2';
import { CycleModeList, PayDayGrid, ExpectedIncomeField, DetectedSuggestionCard } from '@/components/cycle';

/** Centimes → texte du champ (entier en devise). */
const toIncomeText = (cents: number | null) => (cents ? String(Math.round(cents / 100)) : '');

/**
 * Paramètres → Mon cycle : mode, jour de paye, revenu habituel. Une
 * suggestion tirée de l'historique s'affiche quand elle diffère du réglage.
 */
export default function CycleSettingsPage() {
  const { t } = useTranslation();
  const v2 = useV2();
  const router = useRouter();
  // `focus=income` : arrivée depuis « Modifier » sur la paye estimée du verdict.
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const focusIncome = focus === 'income';
  const db = useSQLiteContext();
  const currency = useCurrencyCode();
  const { settings, expectedIncome, save } = useCycleSettings();

  const [mode, setMode] = useState<CycleMode>(settings.mode);
  const [payDay, setPayDay] = useState<number | null>(settings.payDay);
  const [incomeText, setIncomeText] = useState('');
  const [incomeSource, setIncomeSource] = useState<ExpectedIncomeSource>('manual');
  const [detected, setDetected] = useState<PaydayDetection | null>(null);
  const [suggestionUsed, setSuggestionUsed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-synchronise le formulaire quand les réglages arrivent (hydratation).
  useEffect(() => {
    setMode(settings.mode);
    setPayDay(settings.payDay);
    setIncomeText(toIncomeText(expectedIncome));
  }, [settings.mode, settings.payDay, expectedIncome]);

  useEffect(() => {
    let cancelled = false;
    detectPayday(db)
      .then((d) => { if (!cancelled) setDetected(d); })
      .catch(() => { /* détection silencieuse : pas de suggestion */ });
    return () => { cancelled = true; };
  }, [db]);

  // Suggestion visible seulement si l'historique propose un jour différent du réglage enregistré.
  const suggestion =
    !suggestionUsed && detected?.mode === 'payday' && detected.payDay !== null
    && (settings.mode !== 'payday' || settings.payDay !== detected.payDay)
      ? detected
      : null;

  const useSuggestion = () => {
    if (!suggestion || suggestion.payDay === null) return;
    setMode('payday');
    setPayDay(suggestion.payDay);
    if (suggestion.expectedIncome) {
      setIncomeText(toIncomeText(suggestion.expectedIncome));
      setIncomeSource('detected');
    }
    setSuggestionUsed(true);
  };

  const handleIncomeChange = (text: string) => {
    setIncomeText(text);
    setIncomeSource('manual');
  };

  const canSave = !saving && (mode !== 'payday' || payDay !== null);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const ar = Number(incomeText);
    const income = Number.isFinite(ar) && ar > 0 ? ar * 100 : null;
    try {
      await save({
        mode,
        payDay: mode === 'payday' ? payDay : null,
        expectedIncome: income,
        source: income === null ? undefined : incomeSource,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPageWrapper title={t('settings.cycle.title')}>
      <Text
        style={{
          fontFamily: v2.fontUIRegular, fontSize: 15, lineHeight: 22, color: v2.inkMuted,
          paddingHorizontal: 6, paddingTop: 4, paddingBottom: 6,
        }}
      >
        {t('settings.cycle.help')}
      </Text>

      {suggestion && suggestion.payDay !== null ? (
        <View style={{ marginTop: 10 }}>
          <DetectedSuggestionCard
            day={suggestion.payDay}
            amount={suggestion.expectedIncome}
            currency={currency}
            onUse={useSuggestion}
          />
        </View>
      ) : null}

      <SectionLabel>{t('settings.cycle.modeSection')}</SectionLabel>
      <CycleModeList mode={mode} onChange={setMode} />

      {mode === 'payday' ? (
        <>
          <SectionLabel>{t('settings.cycle.daySection')}</SectionLabel>
          <PayDayGrid value={payDay} onChange={setPayDay} />
        </>
      ) : null}

      <SectionLabel>{t('settings.cycle.incomeSection')}</SectionLabel>
      {focusIncome ? (
        <View style={{ backgroundColor: v2.brandTint, borderRadius: 14, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 19, color: v2.ink }}>
            {t('settings.cycle.incomeFocusHint')}
          </Text>
        </View>
      ) : null}
      <ExpectedIncomeField value={incomeText} onChange={handleIncomeChange} currency={currency} autoFocus={focusIncome} />

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        accessibilityRole="button"
        style={{
          marginTop: 24, height: 52, backgroundColor: v2.bgInk, borderRadius: 16,
          alignItems: 'center', justifyContent: 'center', opacity: canSave ? 1 : 0.5,
        }}
      >
        <Text style={{ fontFamily: v2.fontDisplay, fontSize: 15, fontWeight: '700', color: v2.inkOnDark }}>
          {t('settings.cycle.save')}
        </Text>
      </Pressable>
    </SettingsPageWrapper>
  );
}
