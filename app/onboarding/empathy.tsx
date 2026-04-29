import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';
import { useOnboardingQuiz } from '@/contexts/OnboardingQuizContext';
import { ProgressDots, EyebrowLabel, BubuleHeadBubble, PrimaryBtn } from '@/components/onboarding/v2';

export default function EmpathyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const v2 = useV2();
  const { frustration, duration, goal } = useOnboardingQuiz();
  const [analyzing, setAnalyzing] = useState(true);

  const pulseScale = useSharedValue(1);
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(20);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      3, true,
    );

    const timer = setTimeout(() => {
      setAnalyzing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fadeIn.value = withTiming(1, { duration: 500 });
      slideUp.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const headlineKey = frustration ? `empathy.headline_${frustration}` : 'empathy.headlineDefault';
  const statKey = frustration ? `empathy.stat_${frustration}` : 'empathy.statDefault';
  const message = duration && goal
    ? t('empathy.personalizedMessage', {
        duration: t(`empathy.duration_${duration}`),
        goal: t(`empathy.goal_${goal}`),
      })
    : t('empathy.message');

  if (analyzing) {
    return (
      <View
        style={{
          flex: 1, backgroundColor: v2.bgBase,
          paddingTop: insets.top, paddingBottom: insets.bottom + 16,
          alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
        }}
      >
        <Animated.View style={[pulseStyle, { alignItems: 'center' }]}>
          <View style={{ position: 'relative', width: 360, height: 360 }}>
            <BubuleHeadBubble top={30}>{t('empathy.searchSpeech')}</BubuleHeadBubble>
            <Image
              source={require('@/assets/images/bubule-search.png')}
              style={{ width: 360, height: 360 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>
        <Text
          style={{
            marginTop: 16, fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 24, color: v2.ink, letterSpacing: -0.5, textAlign: 'center',
          }}
        >
          {t('empathy.analyzing')}
        </Text>
        <Text
          style={{
            marginTop: 8, fontFamily: v2.fontUI, fontSize: 13,
            color: v2.inkMuted, textAlign: 'center',
          }}
        >
          {t('empathy.analyzingSubtitle')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: v2.bgBase }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <ProgressDots step={5} />
      </View>

      <Animated.View style={[contentStyle, { paddingHorizontal: 20, paddingTop: 16 }]}>
        <EyebrowLabel>{t('empathy.resultSpeech')}</EyebrowLabel>
        <Text
          style={{
            marginTop: 4,
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 30, color: v2.ink, letterSpacing: -0.7, lineHeight: 34,
          }}
        >
          {t(headlineKey)}
        </Text>

        <View
          style={{
            marginTop: 32, padding: 22,
            backgroundColor: v2.bgInk, borderRadius: 18,
          }}
        >
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontStyle: 'italic', fontSize: 15, color: v2.brand,
              lineHeight: 22, letterSpacing: -0.2,
            }}
          >
            {t(statKey)}
          </Text>
          <View
            style={{
              marginTop: 16, paddingTop: 14,
              borderTopWidth: 1, borderTopColor: 'rgba(245,245,241,0.12)',
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Ionicons name="information-circle-outline" size={11} color={v2.inkOnDarkM} />
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, color: v2.inkOnDarkM,
                fontStyle: 'italic',
              }}
            >
              Mitsitsy · 2025
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: -16 }}>
          <View style={{ position: 'relative', width: 300, height: 300 }}>
            <BubuleHeadBubble top={20}>{t('empathy.resultSpeech')}</BubuleHeadBubble>
            <Image
              source={require('@/assets/images/bubule-motivation.png')}
              style={{ width: 300, height: 300 }}
              contentFit="contain"
            />
          </View>
        </View>

        <Text
          style={{
            textAlign: 'center', marginTop: 16, marginBottom: 32,
            fontFamily: v2.fontUI, fontSize: 14,
            color: v2.inkMuted, lineHeight: 21, paddingHorizontal: 12,
          }}
        >
          {message}
        </Text>

        <PrimaryBtn
          label={t('empathy.cta')}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/solution');
          }}
        />
      </Animated.View>
    </ScrollView>
  );
}
