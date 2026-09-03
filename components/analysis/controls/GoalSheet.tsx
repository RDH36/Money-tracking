import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { AnalysisGoal } from '@/lib/analysis/score';

const GOALS: { id: AnalysisGoal; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'saveAmount', icon: 'wallet-outline' },
  { id: 'keepBudgets', icon: 'shield-checkmark-outline' },
  { id: 'understand', icon: 'search-outline' },
];

interface GoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goal: AnalysisGoal | null;
  goalAmount: number | null;
  currency: string;
  onSelect: (goal: AnalysisGoal, amountCentimes?: number) => void;
}

/**
 * Modal de choix de l'objectif (feuille du bas, évite le clavier) : trois
 * options, et un montant mensuel quand « Mettre de côté » est choisi.
 */
export function GoalSheet({ isOpen, onClose, goal, goalAmount, currency, onSelect }: GoalSheetProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [picked, setPicked] = useState<AnalysisGoal | null>(goal);
  const [amountText, setAmountText] = useState('');

  // Re-synchronise à chaque ouverture sur l'objectif enregistré.
  useEffect(() => {
    if (!isOpen) return;
    setPicked(goal);
    setAmountText(goalAmount ? String(Math.round(goalAmount / 100)) : '');
  }, [isOpen, goal, goalAmount]);

  const ar = Number(amountText);
  const amountOk = Number.isFinite(ar) && ar > 0;
  const canConfirm = picked !== null && (picked !== 'saveAmount' || amountOk);

  const confirm = () => {
    if (!picked || !canConfirm) return;
    onSelect(picked, picked === 'saveAmount' ? ar * 100 : undefined);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      overline={t('analysis.goal.overline')}
      title={t('analysis.goal.title')}
      footer={
        <Pressable
          onPress={confirm}
          disabled={!canConfirm}
          style={{ height: 50, borderRadius: 16, backgroundColor: v2.bgInk, alignItems: 'center', justifyContent: 'center', opacity: canConfirm ? 1 : 0.5 }}
        >
          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 15, fontWeight: '700', color: v2.inkOnDark }}>
            {t('analysis.goal.confirm')}
          </Text>
        </Pressable>
      }
    >
      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 18, color: v2.inkMuted }}>
          {t('analysis.goal.help')}
        </Text>
        {GOALS.map((g) => {
          const active = picked === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => setPicked(g.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                borderWidth: 1, borderColor: active ? v2.brand : v2.hairline, borderRadius: 14,
                backgroundColor: active ? v2.brandTint : v2.bgSurface, paddingVertical: 12, paddingHorizontal: 14,
              }}
            >
              <Ionicons name={g.icon} size={18} color={active ? v2.brand : v2.inkMuted} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 14, fontWeight: '600', color: v2.ink }}>
                {t(`analysis.goal.${g.id}`)}
              </Text>
              {active ? <Ionicons name="checkmark-circle" size={18} color={v2.brand} /> : null}
            </Pressable>
          );
        })}
        {picked === 'saveAmount' ? (
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.inkMuted }}>
              {t('analysis.goal.amountLabel', { currency })}
            </Text>
            <TextInput
              value={amountText}
              onChangeText={(text) => setAmountText(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              autoFocus
              placeholder={t('analysis.goal.amountPlaceholder')}
              placeholderTextColor={v2.inkSubtle}
              style={{
                borderWidth: 1, borderColor: v2.hairlineStrong, borderRadius: 12, minHeight: 44,
                paddingVertical: 10, paddingHorizontal: 12, fontFamily: v2.fontUI, fontSize: 15, color: v2.ink,
              }}
            />
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}
