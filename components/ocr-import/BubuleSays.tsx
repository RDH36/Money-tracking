import { View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SpeechBubbleV2 } from '@/components/onboarding/v2';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { useV2 } from '@/constants/designTokensV2';

/**
 * Cadrage du personnage dans les images Bubule (661×377, beaucoup de marge
 * transparente) : zone gardée, en unités de l'image à l'échelle 1.
 */
const POSES = {
  // Montre au poignet : « reviens au prochain cycle ».
  time: { source: require('@/assets/images/bubule-time.png'), width: 200, height: 300, left: -228, top: -30 },
  // Bras levé sous les confettis : « c'est fait ».
  enjoy: { source: require('@/assets/images/bubule-enjoy.png'), width: 400, height: 300, left: -128, top: -30 },
} as const;

// Queue de la bulle (fixe pour la bulle courte de « enjoy ») et rendu en sombre :
// trait seul → teinté ; image en couleurs (confettis) → variante au trait clair.
const LOOKS = {
  time: { tail: 'center', darkSource: null },
  enjoy: { tail: 'right', darkSource: require('@/assets/images/bubule-enjoy-dark.png') },
} as const;

interface BubuleSaysProps {
  text: string;
  pose: keyof typeof POSES;
}

/** Bubule recadré avec sa bulle au-dessus (états plein écran de l'import). */
export function BubuleSays({ text, pose }: BubuleSaysProps) {
  // Plus petit sur les écrans bas (grande police).
  const { height } = useWindowDimensions();
  const s = height < 700 ? 0.45 : 0.53;
  const p = POSES[pose];
  const look = LOOKS[pose];
  // Bubule est tracé en noir sur fond transparent : en sombre, le trait prend la
  // couleur du texte (teinte, ou variante d'image qui garde les confettis). Jamais de fond.
  const v2 = useV2();
  const isDark = useEffectiveColorScheme() === 'dark';
  return (
    <>
      <SpeechBubbleV2 tail={look.tail} style={{ alignSelf: 'center' }}>{text}</SpeechBubbleV2>
      <View style={{ width: p.width * s, height: p.height * s, overflow: 'hidden', alignSelf: 'center', marginTop: 10, marginBottom: 12 }}>
        <Image
          source={isDark && look.darkSource ? look.darkSource : p.source}
          contentFit="contain"
          tintColor={isDark && !look.darkSource ? v2.ink : undefined}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', left: p.left * s, top: p.top * s, width: 661 * s, height: 377 * s }}
        />
      </View>
    </>
  );
}
