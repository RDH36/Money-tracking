import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Pressable, View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useAccounts, useCategories, useGamification } from '@/hooks';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useAnalysisGoal } from '@/hooks/useAnalysisGoal';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { XP_VALUES } from '@/constants/badges';
import type { AnalysisIntent } from '@/lib/analysis/score';
import {
  BubuleIntro, InsightCard, ActionBlock, SinceLastCard,
  IntentChips, GoalCard, DismissedLine, NavCta, KeptSummary,
} from '@/components/analysis';
import type { InsightAction } from '@/lib/analysis/types';

function formatMonthYear(label: string, lang: string): string {
  const [y, m] = label.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang, { month: 'long', year: 'numeric' });
}

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrencyCode();
  const { accounts, createTransfer } = useAccounts();
  const { updateCategory } = useCategories();
  const { awardXP } = useGamification();
  const { goal, goalAmount, setGoal } = useAnalysisGoal();
  const [intent, setIntent] = useState<AnalysisIntent>('overview');
  const {
    loading, state, daysUntilReady, cycleTxCount, cycle, indicators, result,
    sinceLast, sessionDismissed, dismiss, undismiss, markAnalyzed, recordActionApplied,
  } = useAnalysis({ intent, goal, goalAmount });
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Un cycle vide n'est pas une analyse. XP seulement quand une NOUVELLE
    // ligne est écrite (saveAnalysis dédoublonne sur 7 jours).
    if (loading || state === 'insufficientData' || state === 'emptyCycle') return;
    markAnalyzed().then((newId) => {
      if (newId) awardXP(XP_VALUES.ANALYSIS);
    });
  }, [loading, state, markAnalyzed, awardXP]);

  const goAdd = useCallback(() => router.push('/(tabs)/add' as any), [router]);

  const executeAction = useCallback(
    async (action: InsightAction): Promise<boolean> => {
      if (action.type === 'createBudget') {
        const { categoryId, limit } = action.payload as { categoryId: string; limit: number };
        const ok = await updateCategory(categoryId, { budget_limit: limit });
        if (ok) {
          useDataRefreshStore.getState().bumpAll();
          recordActionApplied();
        }
        return ok;
      }
      if (action.type === 'createTransfer') {
        const { amount } = action.payload as { amount: number };
        const usable = [...accounts].sort((a, b) => b.current_balance - a.current_balance);
        if (usable.length < 2 || usable[0].current_balance < amount) return false;
        const res = await createTransfer({ fromAccountId: usable[0].id, toAccountId: usable[1].id, amount });
        if (res.success) {
          useDataRefreshStore.getState().bumpAll();
          recordActionApplied();
        }
        return res.success;
      }
      return false;
    },
    [accounts, createTransfer, updateCategory, recordActionApplied]
  );

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={6}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={18} color={v2.ink} />
      </Pressable>
      <Text style={{ fontFamily: v2.fontDisplay, fontSize: 22, color: v2.ink, letterSpacing: -0.5 }}>{t('analysis.title')}</Text>
    </View>
  );

  // Intro Bubule (jamais bloquante : max 2 s, skippable).
  if (showIntro && !loading && state !== 'insufficientData') {
    return (
      <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
        {header}
        <BubuleIntro onDone={() => setShowIntro(false)} />
      </View>
    );
  }

  const sectionLabel = (key: string) => (
    <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkSubtle, marginTop: 6 }}>
      {t(key)}
    </Text>
  );

  const insightsBlock = result ? (
    <>
      {result.insights.length > 0 ? (
        <>
          {sectionLabel('analysis.weighSection')}
          <View style={{ gap: 10 }}>
            {result.insights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} onDismiss={dismiss} />
            ))}
          </View>
        </>
      ) : null}
      {sessionDismissed.map((id) => (
        <DismissedLine key={id} onUndo={() => undismiss(id)} />
      ))}
      {result.action ? (
        <View style={{ gap: 8, marginTop: 6 }}>
          {sectionLabel('analysis.actionSection')}
          <ActionBlock action={result.action} currency={currency} onExecute={executeAction} />
        </View>
      ) : null}
    </>
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      {header}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 16 }}>
        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator color={v2.brand} />
          </View>
        ) : state === 'insufficientData' ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <Ionicons name="hourglass-outline" size={30} color={v2.inkSubtle} />
            <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 17, color: v2.ink, textAlign: 'center' }}>{t('analysis.insufficientTitle')}</Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkSubtle, textAlign: 'center', maxWidth: 280 }}>
              {t('analysis.insufficient', { count: daysUntilReady })}
            </Text>
          </View>
        ) : state === 'emptyCycle' ? (
          <View style={{ paddingTop: 20, gap: 16, alignItems: 'center' }}>
            <Ionicons name="ellipse-outline" size={28} color={v2.inkSubtle} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.inkMuted, textAlign: 'center', maxWidth: 300 }}>
              {t('analysis.emptyCycleMessage', { count: cycleTxCount })}
            </Text>
            <View style={{ alignSelf: 'stretch' }}>
              <NavCta v2={v2} label={t('analysis.emptyCycleCta')} icon="add-circle-outline" onPress={goAdd} />
            </View>
          </View>
        ) : indicators && result ? (
          <>
            <IntentChips intent={intent} onChange={setIntent} />
            <GoalCard goal={goal} goalAmount={goalAmount} currency={currency} onSelect={setGoal} />
            {cycle && !cycle.isCurrent ? (
              <View style={{ alignSelf: 'flex-start', backgroundColor: v2.bgRaised, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: v2.ink }}>
                  {t('analysis.cycleOf', { month: formatMonthYear(cycle.label, i18n.language) })}
                </Text>
              </View>
            ) : null}
            {sinceLast ? <SinceLastCard sinceLast={sinceLast} indicators={indicators} currency={currency} /> : null}
            {state === 'noIncome' ? (
              <>
                <View style={{ gap: 6, paddingTop: 4 }}>
                  <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, letterSpacing: 0.3 }}>{t('analysis.spentTitle')}</Text>
                  <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 30, letterSpacing: -1, color: v2.ink }}>
                    {formatMoneyFr(indicators.expenses)} {currency}
                  </Text>
                </View>
                <View style={{ backgroundColor: v2.warnSoft, borderWidth: 1, borderColor: `${v2.warn}44`, borderRadius: 14, padding: 14, gap: 10 }}>
                  <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.ink, lineHeight: 18 }}>{t('analysis.noIncomeBanner')}</Text>
                  <NavCta v2={v2} label={t('analysis.noIncomeCta')} icon="trending-up-outline" onPress={goAdd} />
                </View>
                {insightsBlock}
              </>
            ) : (
              <>
                <KeptSummary v2={v2} indicators={indicators} currency={currency} lang={i18n.language} />
                {state === 'calmMonth' && result.insights.length === 0 ? (
                  <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 16, padding: 16 }}>
                    <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, textAlign: 'center' }}>{t('analysis.calmNote')}</Text>
                  </View>
                ) : (
                  insightsBlock
                )}
              </>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
