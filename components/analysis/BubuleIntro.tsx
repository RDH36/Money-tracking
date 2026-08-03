import { useEffect } from 'react';
import { Pressable, View, Image, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

/**
 * Intro Bubule : 2 s maximum, skippable au tap, jamais bloquante. Un simple
 * sas d'accueil avant les constats — l'écran s'affiche dès qu'elle se termine.
 */
export function BubuleIntro({ onDone }: { onDone: () => void }) {
  const v2 = useV2();
  const { t } = useTranslation();

  useEffect(() => {
    const id = setTimeout(onDone, 2000);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <Pressable
      onPress={onDone}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 }}
    >
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={{ alignItems: 'center', gap: 14 }}>
        <View
          style={{
            backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairlineStrong,
            borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, maxWidth: 260,
          }}
        >
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontStyle: 'italic', fontWeight: '700',
              color: v2.ink, fontSize: 14, lineHeight: 19, textAlign: 'center',
            }}
          >
            {t('analysis.intro')}
          </Text>
        </View>
        <Image
          source={require('@/assets/images/bubule-search.png')}
          style={{ width: 128, height: 128 }}
          resizeMode="contain"
        />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle }}>
          {t('analysis.skipHint')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
