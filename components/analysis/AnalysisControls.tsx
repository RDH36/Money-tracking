import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr, type V2Tokens } from '@/constants/designTokensV2';
import type { AnalysisGoal, AnalysisIntent } from '@/lib/analysis/score';
import type { Indicators } from '@/lib/analysis/types';

const INTENTS: AnalysisIntent[] = ['overview', 'overspend', 'budgets', 'savings'];

/** Chips « Tu regardes pourquoi ? » — chaque raison re-score sans requête. */
export function IntentChips({ intent, onChange }: { intent: AnalysisIntent; onChange: (i: AnalysisIntent) => void }) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {INTENTS.map((it) => {
        const active = it === intent;
        return (
          <Pressable
            key={it}
            onPress={() => onChange(it)}
            style={{
              paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
              backgroundColor: active ? v2.bgInk : v2.bgSurface,
              borderWidth: 1, borderColor: active ? v2.bgInk : v2.hairline,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: active ? v2.inkOnDark : v2.inkMuted }}>
              {t(`analysis.intent.${it}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface GoalCardProps {
  goal: AnalysisGoal | null;
  goalAmount: number | null;
  currency: string;
  onSelect: (goal: AnalysisGoal, amountCentimes?: number) => void;
}

/** Question du but (1ʳᵉ ouverture) puis rappel une ligne, modifiable. */
export function GoalCard({ goal, goalAmount, currency, onSelect }: GoalCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [pendingSave, setPendingSave] = useState(false);

  if (goal && !editing) {
    const label =
      goal === 'saveAmount' && goalAmount
        ? `${t('analysis.goal.saveAmount')} · ${formatMoneyFr(goalAmount)} ${currency}`
        : t(`analysis.goal.${goal}`);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="flag-outline" size={13} color={v2.inkSubtle} />
        <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted }} numberOfLines={1}>
          {t('analysis.goal.current', { label })}
        </Text>
        <Pressable onPress={() => setEditing(true)} hitSlop={6}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.brand, fontWeight: '600' }}>
            {t('analysis.goal.edit')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const choose = (g: AnalysisGoal) => {
    if (g === 'saveAmount') {
      setPendingSave(true);
      return;
    }
    setPendingSave(false);
    setEditing(false);
    onSelect(g);
  };

  const confirmAmount = () => {
    const ar = Number(amountText.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(ar) || ar <= 0) return;
    setPendingSave(false);
    setEditing(false);
    onSelect('saveAmount', ar * 100);
  };

  return (
    <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 16, padding: 14, gap: 10 }}>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}>
        {t('analysis.goal.title')}
      </Text>
      {pendingSave ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="number-pad"
            placeholder={t('analysis.goal.amountPlaceholder')}
            placeholderTextColor={v2.inkSubtle}
            style={{
              borderWidth: 1, borderColor: v2.hairlineStrong, borderRadius: 12,
              paddingVertical: 10, paddingHorizontal: 12,
              fontFamily: v2.fontUI, fontSize: 14, color: v2.ink,
            }}
          />
          <Pressable
            onPress={confirmAmount}
            style={{ backgroundColor: v2.bgInk, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
              {t('analysis.goal.confirm')}
            </Text>
          </Pressable>
        </View>
      ) : (
        (['saveAmount', 'keepBudgets', 'understand'] as AnalysisGoal[]).map((g) => (
          <Pressable
            key={g}
            onPress={() => choose(g)}
            style={{
              borderWidth: 1, borderColor: v2.hairline, borderRadius: 12,
              paddingVertical: 11, paddingHorizontal: 12,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
              {t(`analysis.goal.${g}`)}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

/** Ligne « Constat masqué · Annuler » — le rejet redevient réversible. */
export function DismissedLine({ onUndo }: { onUndo: () => void }) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
      }}
    >
      <Ionicons name="eye-off-outline" size={13} color={v2.inkSubtle} />
      <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle }}>
        {t('analysis.hidden')}
      </Text>
      <Pressable onPress={onUndo} hitSlop={6}>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.brand, fontWeight: '600' }}>
          {t('analysis.undo')}
        </Text>
      </Pressable>
    </View>
  );
}

/** CTA de navigation (openScreen) — pour les états sans revenu / cycle vide. */
export function NavCta({ v2, label, icon, onPress }: { v2: V2Tokens; label: string; icon: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: v2.brand, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}
    >
      <Ionicons name={icon} size={18} color={v2.inkOnDark} />
      <Text style={{ fontFamily: v2.fontUI, fontSize: 15, fontWeight: '700', color: v2.inkOnDark }}>{label}</Text>
    </Pressable>
  );
}

/** Résumé « gardé + meilleur cycle » — seulement quand un revenu existe. */
export function KeptSummary({ v2, indicators, currency, lang }: { v2: V2Tokens; indicators: Indicators; currency: string; lang: string }) {
  const { t } = useTranslation();
  const formatMonth = (label: string) => {
    const [y, m] = label.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(lang, { month: 'long' });
  };
  return (
    <View style={{ gap: 6, paddingTop: 4 }}>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle, letterSpacing: 0.3 }}>
        {t('analysis.keptTitle')}
      </Text>
      <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 30, letterSpacing: -1, color: indicators.keptAmount >= 0 ? v2.good : v2.bad }}>
        {formatMoneyFr(indicators.keptAmount)} {currency}
      </Text>
      {indicators.savingsRate !== null ? (
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted }}>
          {t('analysis.keptDetail', { income: formatMoneyFr(indicators.income), rate: `${Math.round(indicators.savingsRate * 100)} %` })}
        </Text>
      ) : null}
      {indicators.bestCycle ? (
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkSubtle, marginTop: 2 }}>
          {t('analysis.bestComparison', { best: `${Math.round(indicators.bestCycle.savingsRate * 100)} %`, month: formatMonth(indicators.bestCycle.label) })}
        </Text>
      ) : null}
    </View>
  );
}
