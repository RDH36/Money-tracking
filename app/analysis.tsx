import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Pressable, View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import { useCurrencyCode } from '@/stores/settingsStore';
import { useAccounts, useCategories } from '@/hooks';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { BubuleIntro, InsightCard, ActionBlock } from '@/components/analysis';
import type { InsightAction } from '@/lib/analysis/types';

function formatMonth(label: string, lang: string): string {
  const [y, m] = label.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang, { month: 'long' });
}

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrencyCode();
  const { accounts, createTransfer } = useAccounts();
  const { updateCategory } = useCategories();
  const { loading, status, daysUntilReady, indicators, result, dismiss, markAnalyzed } = useAnalysis();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (status === 'ready') markAnalyzed();
  }, [status, markAnalyzed]);

  const executeAction = useCallback(
    async (action: InsightAction): Promise<boolean> => {
      if (action.type === 'createBudget') {
        const { categoryId, limit } = action.payload as { categoryId: string; limit: number };
        const ok = await updateCategory(categoryId, { budget_limit: limit });
        if (ok) useDataRefreshStore.getState().bumpAll();
        return ok;
      }
      if (action.type === 'createTransfer') {
        const { amount } = action.payload as { amount: number };
        const usable = [...accounts].sort((a, b) => b.current_balance - a.current_balance);
        if (usable.length < 2 || usable[0].current_balance < amount) return false;
        const res = await createTransfer({ fromAccountId: usable[0].id, toAccountId: usable[1].id, amount });
        if (res.success) useDataRefreshStore.getState().bumpAll();
        return res.success;
      }
      return false;
    },
    [accounts, createTransfer, updateCategory]
  );

  const header = (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={6}
        style={{
          width: 36, height: 36, borderRadius: 18, backgroundColor: v2.bgSurface,
          borderWidth: 1, borderColor: v2.hairline, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={18} color={v2.ink} />
      </Pressable>
      <Text style={{ fontFamily: v2.fontDisplay, fontSize: 22, color: v2.ink, letterSpacing: -0.5 }}>
        {t('analysis.title')}
      </Text>
    </View>
  );

  // Intro Bubule (jamais bloquante : max 2 s, skippable au tap).
  if (showIntro && !loading && status === 'ready') {
    return (
      <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
        {header}
        <BubuleIntro onDone={() => setShowIntro(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      {header}
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 16 }}>
        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator color={v2.brand} />
          </View>
        ) : status === 'insufficient' ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <Ionicons name="hourglass-outline" size={30} color={v2.inkSubtle} />
            <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 17, color: v2.ink, textAlign: 'center' }}>
              {t('analysis.insufficientTitle')}
            </Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkSubtle, textAlign: 'center', maxWidth: 280 }}>
              {t('analysis.insufficient', { count: daysUntilReady })}
            </Text>
          </View>
        ) : indicators && result ? (
          <>
            {/* Résumé : ce qui a été gardé + comparaison au meilleur cycle. */}
            <View style={{ gap: 6, paddingTop: 4 }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, letterSpacing: 0.3 }}>
                {t('analysis.keptTitle')}
              </Text>
              <Text
                style={{
                  fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 30, letterSpacing: -1,
                  color: indicators.keptAmount >= 0 ? v2.good : v2.bad,
                }}
              >
                {formatMoneyFr(indicators.keptAmount)} {currency}
              </Text>
              {indicators.savingsRate !== null ? (
                <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted }}>
                  {t('analysis.keptDetail', {
                    income: formatMoneyFr(indicators.income),
                    rate: `${Math.round(indicators.savingsRate * 100)} %`,
                  })}
                </Text>
              ) : null}
              {indicators.bestCycle ? (
                <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkSubtle, marginTop: 2 }}>
                  {t('analysis.bestComparison', {
                    best: `${Math.round(indicators.bestCycle.savingsRate * 100)} %`,
                    month: formatMonth(indicators.bestCycle.label, i18n.language),
                  })}
                </Text>
              ) : null}
            </View>

            {result.calmMonth ? (
              <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, textAlign: 'center' }}>
                  {t('analysis.calmNote')}
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
                    textTransform: 'uppercase', color: v2.inkSubtle, marginTop: 6,
                  }}
                >
                  {t('analysis.weighSection')}
                </Text>
                <View style={{ gap: 10 }}>
                  {result.insights.map((insight, index) => (
                    <InsightCard key={insight.id} insight={insight} index={index} onDismiss={dismiss} />
                  ))}
                </View>

                {result.action ? (
                  <View style={{ gap: 8, marginTop: 6 }}>
                    <Text
                      style={{
                        fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
                        textTransform: 'uppercase', color: v2.inkSubtle,
                      }}
                    >
                      {t('analysis.actionSection')}
                    </Text>
                    <ActionBlock action={result.action} onExecute={executeAction} />
                  </View>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
