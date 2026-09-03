import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2, formatMoneyFr } from '@/constants/designTokensV2';
import type { AnalysisGoal } from '@/lib/analysis/score';
import { GoalSheet } from './GoalSheet';

interface GoalRowProps {
  goal: AnalysisGoal | null;
  goalAmount: number | null;
  currency: string;
  onSelect: (goal: AnalysisGoal, amountCentimes?: number) => void;
}

/**
 * Carte horizontale sous le verdict : l'objectif en cours, qui oriente les
 * constats et l'action. Toucher la carte ouvre la liste de sélection.
 */
export function GoalRow({ goal, goalAmount, currency, onSelect }: GoalRowProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const label = goal
    ? goal === 'saveAmount' && goalAmount
      ? t('analysis.goal.saveShort', { amount: formatMoneyFr(goalAmount), currency })
      : t(`analysis.goal.${goal}`)
    : t('analysis.goal.none');

  return (
    <>
      <Pressable
        onPress={() => setSheetOpen(true)}
        accessibilityRole="button"
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline,
          borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
        }}
      >
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: v2.brandTint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="flag-outline" size={16} color={v2.brand} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: v2.inkMuted }}>
            {t('analysis.goal.overline')}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600', color: v2.ink }} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.brand }}>
          {t(goal ? 'analysis.goal.edit' : 'analysis.goal.choose')}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={v2.inkSubtle} />
      </Pressable>

      <GoalSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        goal={goal}
        goalAmount={goalAmount}
        currency={currency}
        onSelect={onSelect}
      />
    </>
  );
}
