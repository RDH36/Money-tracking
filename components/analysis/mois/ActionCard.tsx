import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { InsightAction } from '@/lib/analysis/types';
import { alpha } from './tone';

interface ActionCardProps {
  action: InsightAction;
  currency: string;
  /** Exécute l'action (retourne le succès). La navigation est interdite. */
  onExecute: (action: InsightAction) => Promise<boolean>;
  /** « Pas pour moi » : rejette le constat porteur de l'action. */
  onDecline: () => void;
}

/**
 * « Et maintenant ? » (maquette Main) : la seule action de l'écran. Titre =
 * ce qu'elle va faire, ligne bénéfice, bouton plein 50 px, lien de refus.
 * Le retour reste inline.
 */
export function ActionCard({ action, currency, onExecute, onDecline }: ActionCardProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const run = async () => {
    if (state === 'busy' || state === 'done') return;
    setState('busy');
    const ok = await onExecute(action);
    setState(ok ? 'done' : 'error');
  };

  const done = state === 'done';

  return (
    <Animated.View
      entering={FadeInDown.delay(320).duration(320)}
      style={{
        backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: alpha(v2.brand, 0.35),
        borderRadius: 18, padding: 16, gap: 12,
      }}
    >
      <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 16, color: v2.ink, letterSpacing: -0.2, lineHeight: 21 }}>
        {t(action.labelKey, { ...action.labelParams, currency })}
      </Text>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 13, color: v2.inkMuted, lineHeight: 18 }}>
        {t(`analysis.actionBenefit.${action.type}`)}
      </Text>

      <View style={{ gap: 8 }}>
        <Pressable
          onPress={run}
          disabled={done || state === 'busy'}
          style={{
            height: 50, borderRadius: 14, backgroundColor: done ? v2.goodSoft : v2.brand,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {state === 'busy' ? (
            <ActivityIndicator color={v2.inkOnDark} size="small" />
          ) : (
            <Ionicons name={done ? 'checkmark-circle' : 'checkmark'} size={16} color={done ? v2.good : v2.inkOnDark} />
          )}
          <Text style={{ fontFamily: v2.fontDisplay, fontSize: 15, fontWeight: '700', color: done ? v2.good : v2.inkOnDark }}>
            {done ? t('analysis.actionDone') : t(`analysis.actionButton.${action.type}`)}
          </Text>
        </Pressable>

        {state === 'error' ? (
          <Text style={{ textAlign: 'center', fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>{t('analysis.actionError')}</Text>
        ) : null}

        {!done ? (
          <Pressable onPress={onDecline} hitSlop={6} style={{ alignSelf: 'center' }}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '500', color: v2.inkMuted }}>{t('analysis.notForMe')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
