import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, Pressable, View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useAccounts, useCategories, useGamification } from '@/hooks';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useAnalysisGoal } from '@/hooks/useAnalysisGoal';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { XP_VALUES } from '@/constants/badges';
import { intentForGoal } from '@/lib/analysis/score';
import { BubuleIntro, SinceLastCard, GoalRow, DismissedLine, EmptyState } from '@/components/analysis';
import { VerdictCard, WeighRow, WeighCard, SectionLabel, ActionCard, NoIncomeBlock } from '@/components/analysis/mois';
import { formatCycleRange } from '@/lib/analysis/cycle';
import { getVerdict } from '@/lib/analysis/verdict';
import type { InsightAction } from '@/lib/analysis/types';

/**
 * « Ton mois » : verdict d'abord (carte sombre), puis ce qui a pesé, puis la
 * seule action, puis les réglages secondaires (angle, objectif) en bas.
 */
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
  const intent = intentForGoal(goal);
  const {
    loading, state, daysUntilReady, cycleTxCount, cycle, indicators, result,
    sinceLast, sessionDismissed, dismiss, undismiss, markAnalyzed, recordActionApplied,
  } = useAnalysis({ intent, goal, goalAmount });
  const [showIntro, setShowIntro] = useState(true);

  const range = cycle ? formatCycleRange(cycle, i18n.language) : '';
  const verdict = useMemo(() => (indicators ? getVerdict(indicators) : null), [indicators]);

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

  // « Pas pour moi » = rejet (réversible) du constat qui porte l'action.
  const declineAction = useCallback(() => {
    const carrier = result?.insights.find((i) => i.action === result.action);
    if (carrier) dismiss(carrier.id);
  }, [result, dismiss]);

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={6}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={18} color={v2.ink} />
      </Pressable>
      <Text style={{ flex: 1, fontFamily: v2.fontDisplay, fontSize: 22, color: v2.ink, letterSpacing: -0.5 }}>{t('analysis.title')}</Text>
      <Pressable
        onPress={() => router.push('/intro-mois?replay=1' as any)}
        hitSlop={6}
        accessibilityLabel={t('intro.mois.about')}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="help-outline" size={18} color={v2.ink} />
      </Pressable>
    </View>
  );

  // Bubule cherche : c'est l'état de chargement (phrases qui changent), puis
  // 2 s minimum ; skippable dès que le calcul est fini.
  const onIntroDone = useCallback(() => setShowIntro(false), []);
  if (showIntro && (loading || state !== 'insufficientData')) {
    return (
      <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
        {header}
        <BubuleIntro onDone={onIntroDone} loading={loading} />
      </View>
    );
  }

  const weighBlock =
    result && (result.insights.length > 0 || sessionDismissed.length > 0) ? (
      <View>
        <SectionLabel text={t(state === 'noIncome' ? 'analysis.noIncome.meanwhile' : 'analysis.weighSection')} />
        <View style={{ gap: 10 }}>
          {result.insights.length > 0 ? (
            <WeighCard>
              {result.insights.map((insight, index) => (
                <WeighRow
                  key={insight.id}
                  insight={insight}
                  currency={currency}
                  index={index}
                  last={index === result.insights.length - 1}
                  onDismiss={dismiss}
                />
              ))}
            </WeighCard>
          ) : null}
          {sessionDismissed.map((id) => (
            <DismissedLine key={id} onUndo={() => undismiss(id)} />
          ))}
        </View>
      </View>
    ) : null;

  const actionBlock = result?.action ? (
    <View>
      <SectionLabel text={t('analysis.actionSection')} />
      <ActionCard action={result.action} currency={currency} onExecute={executeAction} onDecline={declineAction} />
    </View>
  ) : null;

  const calmBlock = (
    <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 18, padding: 16 }}>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, textAlign: 'center' }}>{t('analysis.calmNote')}</Text>
    </View>
  );

  // Sous le verdict : l'objectif durable, qui oriente constats et action.
  const focus = <GoalRow goal={goal} goalAmount={goalAmount} currency={currency} onSelect={setGoal} />;

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      {header}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 18 }}>
        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator color={v2.brand} />
          </View>
        ) : state === 'insufficientData' ? (
          <EmptyState
            icon="hourglass-outline"
            title={t('analysis.insufficientTitle')}
            message={t('analysis.insufficient', { count: daysUntilReady })}
          />
        ) : state === 'emptyCycle' ? (
          <EmptyState
            icon="ellipse-outline"
            message={t('analysis.emptyCycleMessage', { count: cycleTxCount })}
            cta={{ label: t('analysis.emptyCycleCta'), icon: 'add-circle-outline', onPress: goAdd }}
          />
        ) : indicators && result && cycle && verdict ? (
          <>
            {state === 'noIncome' ? (
              <NoIncomeBlock cycle={cycle} expenses={indicators.expenses} range={range} currency={currency} onAddIncome={goAdd} />
            ) : (
              <VerdictCard verdict={verdict} income={indicators.income} range={range} currency={currency} lang={i18n.language} />
            )}
            {focus}
            {sinceLast ? <SinceLastCard sinceLast={sinceLast} indicators={indicators} currency={currency} /> : null}
            {state === 'calmMonth' && result.insights.length === 0 ? calmBlock : weighBlock}
            {actionBlock}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
