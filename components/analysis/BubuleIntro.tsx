import { useEffect, useState } from 'react';
import { Pressable, View, Image, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

/** Phrases de Bubule pendant le calcul, dans l'ordre. */
const STEPS = ['analysis.intro', 'analysis.introCompare', 'analysis.introWeigh'];
const STEP_MS = 1400;
const MIN_MS = 2000;

/**
 * Bubule « cherche » : c'est aussi l'état de chargement. La bulle change de
 * phrase toutes les 1,4 s ; l'écran arrive dès que le calcul est fini (au
 * moins 2 s d'affichage). Tant que ça charge, on ne peut pas passer.
 */
export function BubuleIntro({ onDone, loading = false }: { onDone: () => void; loading?: boolean }) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (minElapsed && !loading) onDone();
  }, [minElapsed, loading, onDone]);

  return (
    <Pressable
      onPress={loading ? undefined : onDone}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 }}
    >
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={{ alignItems: 'center', gap: 14 }}>
        <View
          style={{
            backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairlineStrong,
            borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, maxWidth: 260,
          }}
        >
          <Animated.Text
            key={step}
            entering={FadeIn.duration(250)}
            style={{
              fontFamily: v2.fontDisplay, fontStyle: 'italic', fontWeight: '700',
              color: v2.ink, fontSize: 14, lineHeight: 19, textAlign: 'center',
            }}
          >
            {t(STEPS[step])}
          </Animated.Text>
        </View>
        <Image
          source={require('@/assets/images/bubule-search.png')}
          style={{ width: 128, height: 128 }}
          resizeMode="contain"
        />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle }}>
          {loading ? t('analysis.loadingHint') : t('analysis.skipHint')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
