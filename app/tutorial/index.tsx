import { useRouter } from 'expo-router';
import { View, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState, useCallback } from 'react';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useTheme } from '@/contexts';
import { useTutorialStatus, useOnboardingStatus } from '@/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

const SLIDES = [
  {
    icon: 'wallet',
    iconBg: '#E0F2FE',
    iconColor: '#0EA5E9',
    title: 'Prenez le contrôle',
    subtitle: 'Gérez vos finances en 10 secondes, même sans internet.',
    features: [
      { icon: 'flash', color: '#22C55E', text: 'Enregistrez en moins de 10 secondes' },
      { icon: 'cloud-offline', color: '#8B5CF6', text: 'Fonctionne 100% hors ligne' },
      { icon: 'eye', color: '#F59E0B', text: 'Voyez où va votre argent' },
    ],
  },
  {
    icon: 'add-circle',
    iconBg: '#DCFCE7',
    iconColor: '#22C55E',
    title: 'Où est passé cet argent ?',
    subtitle: "Plus jamais cette question. Chaque dépense est trackée.",
    features: [
      { icon: 'remove-circle', color: '#EF4444', text: 'Dépense : catégorie + montant' },
      { icon: 'add-circle', color: '#22C55E', text: 'Revenu : salaire, bonus...' },
      { icon: 'swap-horizontal', color: '#0EA5E9', text: 'Transfert entre comptes' },
    ],
  },
  {
    icon: 'stats-chart',
    iconBg: '#F3E8FF',
    iconColor: '#8B5CF6',
    title: 'Simple et clair',
    subtitle: "Pas de tableaux compliqués. Juste l'essentiel.",
    features: [
      { icon: 'wallet', color: '#0EA5E9', text: 'Votre solde réel, toujours à jour' },
      { icon: 'pie-chart', color: '#8B5CF6', text: 'Graphiques par catégorie' },
      { icon: 'time', color: '#F59E0B', text: 'Historique complet' },
    ],
  },
  {
    icon: 'calendar',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    title: 'Anticipez',
    subtitle: 'Planifiez vos dépenses et évitez les surprises.',
    features: [
      { icon: 'create', color: '#0EA5E9', text: 'Loyer, factures, courses...' },
      { icon: 'calculator', color: '#8B5CF6', text: 'Simulez votre solde futur' },
      { icon: 'checkmark-circle', color: '#22C55E', text: 'Validez quand payé' },
    ],
    isLast: true,
  },
];

export default function AnimatedTutorial() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { complete } = useTutorialStatus();
  const { isCompleted: onboardingCompleted } = useOnboardingStatus();

  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const handleSkip = async () => {
    await complete();
    router.replace(onboardingCompleted ? '/(tabs)' : '/onboarding/currency');
  };

  const handleFinish = async () => {
    await complete();
    router.replace(onboardingCompleted ? '/(tabs)' : '/onboarding/currency');
  };

  const updateIndex = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const clampedTranslation = e.translationX;
      // Add resistance at edges
      if (currentIndex === 0 && clampedTranslation > 0) {
        translateX.value = clampedTranslation * 0.3;
      } else if (currentIndex === SLIDES.length - 1 && clampedTranslation < 0) {
        translateX.value = clampedTranslation * 0.3;
      } else {
        translateX.value = clampedTranslation;
      }
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD && currentIndex < SLIDES.length - 1) {
        runOnJS(updateIndex)(currentIndex + 1);
      } else if (e.translationX > SWIPE_THRESHOLD && currentIndex > 0) {
        runOnJS(updateIndex)(currentIndex - 1);
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const currentSlide = SLIDES[currentIndex];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        className="flex-1 bg-background-0"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        {/* Header */}
        <HStack className="justify-between items-center px-6 py-2">
          <Text className="text-typography-500 font-medium">
            {currentIndex + 1}/{SLIDES.length}
          </Text>
          {!currentSlide.isLast && (
            <Pressable onPress={handleSkip}>
              <Text className="text-typography-500">Passer</Text>
            </Pressable>
          )}
        </HStack>

        {/* Gesture Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ flex: 1 }, contentStyle]}>
            <View className="flex-1 px-6 justify-center">
              <VStack space="xl" className="items-center">
                {/* Icon */}
                <Animated.View style={iconStyle}>
                  <Box
                    className="w-28 h-28 rounded-full items-center justify-center"
                    style={{ backgroundColor: currentSlide.iconBg }}
                  >
                    <Ionicons
                      name={currentSlide.icon as keyof typeof Ionicons.glyphMap}
                      size={64}
                      color={currentSlide.iconColor}
                    />
                  </Box>
                </Animated.View>

                {/* Title & Subtitle */}
                <VStack space="sm" className="items-center">
                  <Heading size="2xl" className="text-center text-typography-900">
                    {currentSlide.title}
                  </Heading>
                  <Text className="text-center text-typography-600 px-2">
                    {currentSlide.subtitle}
                  </Text>
                </VStack>

                {/* Features */}
                <VStack space="md" className="w-full bg-background-50 p-5 rounded-2xl mt-2">
                  {currentSlide.features.map((feature, fIndex) => (
                    <FeatureRow
                      key={`${currentIndex}-${fIndex}`}
                      icon={feature.icon}
                      color={feature.color}
                      text={feature.text}
                      delay={fIndex * 150}
                    />
                  ))}
                </VStack>

                {/* Celebration */}
                {currentSlide.isLast && (
                  <Box className="bg-background-50 p-4 rounded-2xl w-full items-center">
                    <Text className="text-4xl mb-2">🎉</Text>
                    <Text className="text-typography-700 text-center font-medium">
                      Votre tranquillité financière commence maintenant.
                    </Text>
                  </Box>
                )}
              </VStack>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Bottom */}
        <Box className="px-6">
          <HStack className="justify-center mb-6" space="sm">
            {SLIDES.map((_, index) => (
              <ProgressDot
                key={index}
                isActive={index === currentIndex}
                onPress={() => setCurrentIndex(index)}
                color={theme.colors.primary}
              />
            ))}
          </HStack>

          <Button
            size="xl"
            className="w-full"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={currentSlide.isLast ? handleFinish : () => setCurrentIndex(currentIndex + 1)}
          >
            <ButtonText className="text-white">
              {currentSlide.isLast ? 'Commencer' : 'Suivant'}
            </ButtonText>
          </Button>
        </Box>
      </View>
    </GestureHandlerRootView>
  );
}

function FeatureRow({ icon, color, text, delay }: { icon: string; color: string; text: string; delay: number }) {
  const opacity = useSharedValue(0);
  const rowX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = 0;
    rowX.value = -20;
    opacity.value = withDelay(delay, withSpring(1));
    rowX.value = withDelay(delay, withSpring(0));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: rowX.value }],
  }));

  return (
    <Animated.View style={style}>
      <HStack space="md" className="items-center">
        <Box
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={color} />
        </Box>
        <Text className="text-typography-700 flex-1 text-base">{text}</Text>
      </HStack>
    </Animated.View>
  );
}

function ProgressDot({ isActive, onPress, color }: { isActive: boolean; onPress: () => void; color: string }) {
  const width = useSharedValue(8);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    width.value = withSpring(isActive ? 28 : 8, { damping: 15 });
    opacity.value = withTiming(isActive ? 1 : 0.3, { duration: 200 });
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: color }, style]} />
    </Pressable>
  );
}
