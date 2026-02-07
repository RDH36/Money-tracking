import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import type { SlideItemProps } from './types';

export function TutorialSlide({ slide, index, translateX, screenWidth }: SlideItemProps) {
  const { t } = useTranslation();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const scale = interpolate(
      -translateX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      -translateX.value,
      inputRange,
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={{ width: screenWidth, flex: 1, justifyContent: 'center' }}>
      <Animated.View style={[{ flex: 1, justifyContent: 'center' }, animatedStyle]}>
        <VStack space="xl" className="items-center px-6">
          <Box
            className="w-28 h-28 rounded-full items-center justify-center"
            style={{ backgroundColor: slide.iconBg }}
          >
            <Ionicons
              name={slide.icon as keyof typeof Ionicons.glyphMap}
              size={64}
              color={slide.iconColor}
            />
          </Box>

          <VStack space="sm" className="items-center">
            <Heading size="2xl" className="text-center text-typography-900">
              {slide.title}
            </Heading>
            <Text className="text-center text-typography-600 px-2">
              {slide.subtitle}
            </Text>
          </VStack>

          <VStack space="md" className="w-full bg-background-50 p-5 rounded-2xl mt-2">
            {slide.features.map((feature, fIndex) => (
              <HStack key={fIndex} space="md" className="items-center">
                <Box
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={22} color={feature.color} />
                </Box>
                <Text className="text-typography-700 flex-1 text-base">{feature.text}</Text>
              </HStack>
            ))}
          </VStack>

          {slide.isLast && (
            <Box className="bg-background-50 p-4 rounded-2xl w-full items-center">
              <Text className="text-4xl mb-2">🎉</Text>
              <Text className="text-typography-700 text-center font-medium">
                {t('tutorial.finalMessage')}
              </Text>
            </Box>
          )}
        </VStack>
      </Animated.View>
    </View>
  );
}
