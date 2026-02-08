import { useState, useEffect } from 'react';
import { Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';

interface FeatureTooltipProps {
  id: string;
  message: string;
  visible: boolean;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

export function FeatureTooltip({
  message,
  visible,
  onDismiss,
  position = 'bottom',
}: FeatureTooltipProps) {
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [position === 'bottom' ? -10 : 10, 0],
        }) }],
        position: 'absolute',
        left: 16,
        right: 16,
        [position]: -60,
        zIndex: 1000,
      }}
    >
      <Pressable onPress={onDismiss}>
        <Box
          className="p-3 rounded-xl shadow-lg"
          style={{
            backgroundColor: theme.colors.primary,
          }}
        >
          <HStack space="sm" className="items-center">
            <Ionicons name="bulb" size={18} color="#FFF" />
            <Text className="flex-1 text-white text-sm">{message}</Text>
            <Ionicons name="close" size={16} color="#FFF" style={{ opacity: 0.7 }} />
          </HStack>
        </Box>
        {/* Arrow */}
        <Box
          style={{
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 8,
            borderRightWidth: 8,
            borderTopWidth: position === 'bottom' ? 0 : 8,
            borderBottomWidth: position === 'bottom' ? 8 : 0,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: position === 'bottom' ? 'transparent' : theme.colors.primary,
            borderBottomColor: position === 'bottom' ? theme.colors.primary : 'transparent',
            alignSelf: 'center',
            marginTop: position === 'bottom' ? -1 : 0,
            marginBottom: position === 'top' ? -1 : 0,
          }}
        />
      </Pressable>
    </Animated.View>
  );
}
