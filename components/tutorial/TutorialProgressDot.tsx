import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import type { ProgressDotProps } from './types';

export function TutorialProgressDot({ index, translateX, onPress, color, screenWidth }: ProgressDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const currentIndex = -translateX.value / screenWidth;
    const distance = Math.abs(currentIndex - index);

    const width = interpolate(distance, [0, 1], [28, 8], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [0, 1], [1, 0.3], Extrapolation.CLAMP);

    return { width, opacity };
  });

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: color }, animatedStyle]} />
    </Pressable>
  );
}
