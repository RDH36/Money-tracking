import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import type { InsightAction } from '@/lib/analysis/types';

interface ActionBlockProps {
  action: InsightAction;
  /** Exécute l'action (retourne le succès). La navigation est interdite. */
  onExecute: (action: InsightAction) => Promise<boolean>;
}

/**
 * Le bloc « à faire maintenant » : seul élément accentué de l'écran. L'action
 * s'exécute en un tap, sans quitter l'écran ; le feedback reste inline.
 */
export function ActionBlock({ action, onExecute }: ActionBlockProps) {
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
    <Animated.View entering={FadeInDown.delay(320).duration(320)}>
      <Pressable
        onPress={run}
        disabled={done || state === 'busy'}
        style={{
          backgroundColor: done ? v2.goodSoft : v2.brand,
          borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {state === 'busy' ? (
          <ActivityIndicator color={v2.inkOnDark} size="small" />
        ) : (
          <Ionicons
            name={done ? 'checkmark-circle' : 'flash'}
            size={18}
            color={done ? v2.good : v2.inkOnDark}
          />
        )}
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 15, fontWeight: '700',
            color: done ? v2.good : v2.inkOnDark, letterSpacing: 0.2,
          }}
        >
          {done ? t('analysis.actionDone') : t(action.labelKey)}
        </Text>
      </Pressable>
      {state === 'error' ? (
        <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>
          {t('analysis.actionError')}
        </Text>
      ) : null}
    </Animated.View>
  );
}
