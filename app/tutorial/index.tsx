import { useRouter } from 'expo-router';
import { View, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import { useTutorialStatus, useOnboardingStatus } from '@/hooks';
import { TutorialSlide, TutorialProgressDot } from '@/components/tutorial';
import type { TutorialSlideData } from '@/components/tutorial';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export default function AnimatedTutorial() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { complete } = useTutorialStatus();
  const { isCompleted: onboardingCompleted } = useOnboardingStatus();
  const { t } = useTranslation();

  const SLIDES: TutorialSlideData[] = useMemo(() => [
    {
      icon: 'wallet',
      iconBg: '#E0F2FE',
      iconColor: '#0EA5E9',
      title: t('tutorial.slide1Title'),
      subtitle: t('tutorial.slide1Subtitle'),
      features: [
        { icon: 'flash', color: '#22C55E', text: t('tutorial.slide1Feature1') },
        { icon: 'cloud-offline', color: '#8B5CF6', text: t('tutorial.slide1Feature2') },
        { icon: 'eye', color: '#F59E0B', text: t('tutorial.slide1Feature3') },
      ],
    },
    {
      icon: 'add-circle',
      iconBg: '#DCFCE7',
      iconColor: '#22C55E',
      title: t('tutorial.slide2Title'),
      subtitle: t('tutorial.slide2Subtitle'),
      features: [
        { icon: 'remove-circle', color: '#EF4444', text: t('tutorial.slide2Feature1') },
        { icon: 'add-circle', color: '#22C55E', text: t('tutorial.slide2Feature2') },
        { icon: 'swap-horizontal', color: '#0EA5E9', text: t('tutorial.slide2Feature3') },
      ],
    },
    {
      icon: 'stats-chart',
      iconBg: '#F3E8FF',
      iconColor: '#8B5CF6',
      title: t('tutorial.slide3Title'),
      subtitle: t('tutorial.slide3Subtitle'),
      features: [
        { icon: 'wallet', color: '#0EA5E9', text: t('tutorial.slide3Feature1') },
        { icon: 'pie-chart', color: '#8B5CF6', text: t('tutorial.slide3Feature2') },
        { icon: 'time', color: '#F59E0B', text: t('tutorial.slide3Feature3') },
      ],
    },
    {
      icon: 'calendar',
      iconBg: '#FEF3C7',
      iconColor: '#F59E0B',
      title: t('tutorial.slide4Title'),
      subtitle: t('tutorial.slide4Subtitle'),
      features: [
        { icon: 'create', color: '#0EA5E9', text: t('tutorial.slide4Feature1') },
        { icon: 'calculator', color: '#8B5CF6', text: t('tutorial.slide4Feature2') },
        { icon: 'checkmark-circle', color: '#22C55E', text: t('tutorial.slide4Feature3') },
      ],
      isLast: true,
    },
  ], [t]);

  const translateX = useSharedValue(0);
  const indexValue = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSkip = async () => {
    await complete();
    router.replace(onboardingCompleted ? '/(tabs)' : '/onboarding/currency');
  };

  const handleFinish = async () => {
    await complete();
    router.replace(onboardingCompleted ? '/(tabs)' : '/onboarding/currency');
  };

  const goToIndex = (newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, SLIDES.length - 1));
    indexValue.value = clampedIndex;
    setCurrentIndex(clampedIndex);
    translateX.value = withSpring(-clampedIndex * SCREEN_WIDTH, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  };

  const handleNext = () => {
    goToIndex(currentIndex + 1);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const currentOffset = -indexValue.value * SCREEN_WIDTH;
      let newTranslateX = currentOffset + e.translationX;

      if (newTranslateX > 0) {
        newTranslateX = e.translationX * 0.3;
      } else if (newTranslateX < -(SLIDES.length - 1) * SCREEN_WIDTH) {
        const overscroll = newTranslateX + (SLIDES.length - 1) * SCREEN_WIDTH;
        newTranslateX = -(SLIDES.length - 1) * SCREEN_WIDTH + overscroll * 0.3;
      }

      translateX.value = newTranslateX;
    })
    .onEnd((e) => {
      const currentOffset = -indexValue.value * SCREEN_WIDTH;
      const swipedDistance = translateX.value - currentOffset;

      let newIndex = indexValue.value;

      if (e.velocityX < -VELOCITY_THRESHOLD || swipedDistance < -SWIPE_THRESHOLD) {
        newIndex = Math.min(indexValue.value + 1, SLIDES.length - 1);
      } else if (e.velocityX > VELOCITY_THRESHOLD || swipedDistance > SWIPE_THRESHOLD) {
        newIndex = Math.max(indexValue.value - 1, 0);
      }

      indexValue.value = newIndex;
      runOnJS(setCurrentIndex)(newIndex);
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 90,
        mass: 1,
      });
    });

  const carouselStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const currentSlide = SLIDES[currentIndex];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        className="flex-1 bg-background-0"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <HStack className="justify-between items-center px-6 py-2">
          <Text className="text-typography-500 font-medium">
            {currentIndex + 1}/{SLIDES.length}
          </Text>
          {!currentSlide?.isLast && (
            <Pressable onPress={handleSkip}>
              <Text className="text-typography-500">{t('tutorial.skipButton')}</Text>
            </Pressable>
          )}
        </HStack>

        <View style={{ flex: 1, overflow: 'hidden' }}>
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.carousel, { width: SCREEN_WIDTH * SLIDES.length }, carouselStyle]}
            >
              {SLIDES.map((slide, index) => (
                <TutorialSlide
                  key={index}
                  slide={slide}
                  index={index}
                  translateX={translateX}
                  screenWidth={SCREEN_WIDTH}
                />
              ))}
            </Animated.View>
          </GestureDetector>
        </View>

        <Box className="px-6">
          <HStack className="justify-center mb-6" space="sm">
            {SLIDES.map((_, index) => (
              <TutorialProgressDot
                key={index}
                index={index}
                translateX={translateX}
                onPress={() => goToIndex(index)}
                color={theme.colors.primary}
                screenWidth={SCREEN_WIDTH}
              />
            ))}
          </HStack>

          <Button
            size="xl"
            className="w-full"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={currentSlide?.isLast ? handleFinish : handleNext}
          >
            <ButtonText className="text-white">
              {currentSlide?.isLast ? t('tutorial.startButton') : t('tutorial.nextButton')}
            </ButtonText>
          </Button>
        </Box>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    flex: 1,
    flexDirection: 'row',
  },
});
