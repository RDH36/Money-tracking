import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';
import { useOnboardingQuiz } from '@/contexts/OnboardingQuizContext';
import { ProgressDots, EyebrowLabel, BubuleHeadBubble, PrimaryBtn } from '@/components/onboarding/v2';

interface BenefitDef {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
}

const BENEFITS: Record<string, BenefitDef[]> = {
  dont_know_where: [
    { icon: 'pie-chart-outline', titleKey: 'solution.benefit1_dont_know_where', descKey: 'solution.benefit1Desc_dont_know_where' },
    { icon: 'notifications-outline', titleKey: 'solution.benefit2_dont_know_where', descKey: 'solution.benefit2Desc_dont_know_where' },
    { icon: 'trending-up-outline', titleKey: 'solution.benefit3_dont_know_where', descKey: 'solution.benefit3Desc_dont_know_where' },
  ],
  hard_to_save: [
    { icon: 'wallet-outline', titleKey: 'solution.benefit1_hard_to_save', descKey: 'solution.benefit1Desc_hard_to_save' },
    { icon: 'flag-outline', titleKey: 'solution.benefit2_hard_to_save', descKey: 'solution.benefit2Desc_hard_to_save' },
    { icon: 'analytics-outline', titleKey: 'solution.benefit3_hard_to_save', descKey: 'solution.benefit3Desc_hard_to_save' },
  ],
  stress: [
    { icon: 'shield-checkmark-outline', titleKey: 'solution.benefit1_stress', descKey: 'solution.benefit1Desc_stress' },
    { icon: 'eye-outline', titleKey: 'solution.benefit2_stress', descKey: 'solution.benefit2Desc_stress' },
    { icon: 'heart-outline', titleKey: 'solution.benefit3_stress', descKey: 'solution.benefit3Desc_stress' },
  ],
  plan_better: [
    { icon: 'calendar-outline', titleKey: 'solution.benefit1_plan_better', descKey: 'solution.benefit1Desc_plan_better' },
    { icon: 'list-outline', titleKey: 'solution.benefit2_plan_better', descKey: 'solution.benefit2Desc_plan_better' },
    { icon: 'checkmark-circle-outline', titleKey: 'solution.benefit3_plan_better', descKey: 'solution.benefit3Desc_plan_better' },
  ],
};

interface RowProps {
  index: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  isFirst: boolean;
}

function BenefitRow({ index, icon, title, desc, isFirst }: RowProps) {
  const v2 = useV2();
  const opacity = useSharedValue(0);
  const ty = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 150, withTiming(1, { duration: 500 }));
    ty.value = withDelay(index * 150, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[style, {
        flexDirection: 'row', alignItems: 'flex-start', gap: 16,
        paddingVertical: 20, paddingHorizontal: 6,
        borderTopWidth: isFirst ? 1 : 0,
        borderBottomWidth: 1,
        borderColor: v2.hairline,
      }]}
    >
      <Text
        style={{
          width: 20, paddingTop: 4,
          fontFamily: v2.fontDisplay, fontWeight: '700',
          fontStyle: 'italic', fontSize: 14, color: v2.brand,
          fontVariant: ['tabular-nums'],
        }}
      >
        0{index + 1}
      </Text>
      <View
        style={{
          width: 44, height: 44, borderRadius: 13,
          backgroundColor: v2.brandSoft,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={v2.brand} />
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 17, color: v2.ink, letterSpacing: -0.3, lineHeight: 21,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 6, fontFamily: v2.fontUI, fontSize: 13,
            color: v2.inkMuted, lineHeight: 19,
          }}
        >
          {desc}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function SolutionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const v2 = useV2();
  const { frustration } = useOnboardingQuiz();
  const benefits = BENEFITS[frustration || 'dont_know_where'];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: v2.bgBase }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <ProgressDots step={6} />
        <EyebrowLabel>{t('solution.subtitle')}</EyebrowLabel>
        <Text
          style={{
            marginTop: 4,
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontSize: 30, color: v2.ink, letterSpacing: -0.7, lineHeight: 34,
          }}
        >
          {t('solution.title')}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 16, marginBottom: -8 }}>
        <View style={{ position: 'relative', width: 300, height: 300 }}>
          <BubuleHeadBubble top={20}>{t('solution.subtitle')}</BubuleHeadBubble>
          <Image
            source={require('@/assets/images/bubule-help.png')}
            style={{ width: 300, height: 300 }}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        {benefits.map((b, i) => (
          <BenefitRow
            key={b.titleKey}
            index={i}
            icon={b.icon}
            title={t(b.titleKey)}
            desc={t(b.descKey)}
            isFirst={i === 0}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
        <PrimaryBtn
          label={t('solution.cta')}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/wow');
          }}
        />
      </View>
    </ScrollView>
  );
}
