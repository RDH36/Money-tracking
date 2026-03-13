import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { usePostHog } from 'posthog-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const [ready, setReady] = useState(false);
  const posthog = usePostHog();

  // Wave hand animation
  const waveRotate = useSharedValue(0);
  // Stagger text lines
  const line1Opacity = useSharedValue(0);
  const line1Y = useSharedValue(20);
  const line2Opacity = useSharedValue(0);
  const line2Y = useSharedValue(20);
  const line3Opacity = useSharedValue(0);
  const line3Y = useSharedValue(20);
  // CTA button
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);

  useEffect(() => {
    // Wave hand 👋
    waveRotate.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 150 }),
          withTiming(-15, { duration: 150 }),
          withTiming(15, { duration: 150 }),
          withTiming(0, { duration: 200 })
        ),
        2,
        false
      )
    );

    // Stagger text entrance
    const anim = (delay: number) => ({
      opacity: withDelay(delay, withTiming(1, { duration: 500 })),
      y: withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })),
    });

    const l1 = anim(400);
    line1Opacity.value = l1.opacity;
    line1Y.value = l1.y;

    const l2 = anim(700);
    line2Opacity.value = l2.opacity;
    line2Y.value = l2.y;

    const l3 = anim(1000);
    line3Opacity.value = l3.opacity;
    line3Y.value = l3.y;

    // CTA appears last
    ctaOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    ctaY.value = withDelay(1400, withSpring(0, { damping: 12, stiffness: 100 }));

    const timer = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${waveRotate.value}deg` }],
  }));

  const line1Style = useAnimatedStyle(() => ({
    opacity: line1Opacity.value,
    transform: [{ translateY: line1Y.value }],
  }));
  const line2Style = useAnimatedStyle(() => ({
    opacity: line2Opacity.value,
    transform: [{ translateY: line2Y.value }],
  }));
  const line3Style = useAnimatedStyle(() => ({
    opacity: line3Opacity.value,
    transform: [{ translateY: line3Y.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6 justify-center">
        <VStack className="items-center" space="lg">
          {/* Wave emoji */}
          <Animated.View style={waveStyle}>
            <Text style={styles.wave}>👋</Text>
          </Animated.View>

          {/* Staggered text */}
          <VStack className="items-center" space="sm">
            <Animated.View style={line1Style}>
              <Text
                style={[styles.greeting, { color: theme.colors.primary }]}
              >
                {t('welcome.greeting')}
              </Text>
            </Animated.View>

            <Animated.View style={line2Style}>
              <Text style={styles.title} className="text-typography-900 text-center">
                {t('welcome.title')}
              </Text>
            </Animated.View>

            <Animated.View style={line3Style}>
              <Text className="text-typography-500 text-center text-base mt-2">
                {t('welcome.subtitle')}
              </Text>
            </Animated.View>
          </VStack>
        </VStack>
      </Box>

      {/* CTA */}
      <Animated.View style={[{ paddingHorizontal: 24 }, ctaStyle]}>
        <Button
          size="xl"
          className="w-full"
          style={{ backgroundColor: theme.colors.primary }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            posthog.capture('onboarding_started');
            router.push('/onboarding/quiz-1');
          }}
          isDisabled={!ready}
        >
          <ButtonText className="text-white">{t('welcome.cta')}</ButtonText>
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    fontSize: 64,
    lineHeight: 80,
    textAlign: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
});
