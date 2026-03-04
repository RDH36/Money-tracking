import { useEffect, useRef } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { xpProgress, xpForLevel, calculateLevel } from '@/constants/badges';

interface GamificationBarProps {
  currentStreak: number;
  totalXP: number;
  dailyChallengeCompleted: boolean;
  isLoading?: boolean;
  onPress: () => void;
}

function SkeletonBar({ theme }: { theme: { colors: { primaryLight: string; primary: string } } }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const barColor = theme.colors.primary + '25';

  return (
    <View
      className="mt-2 p-3 rounded-xl"
      style={{ backgroundColor: theme.colors.primaryLight }}
    >
      <Animated.View style={{ opacity, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Streak placeholder */}
        <View style={{ width: 50, height: 12, backgroundColor: barColor, borderRadius: 6 }} />
        {/* Level placeholder */}
        <View style={{ width: 36, height: 12, backgroundColor: barColor, borderRadius: 6 }} />
        {/* XP bar placeholder */}
        <View style={{ flex: 1, height: 6, backgroundColor: barColor, borderRadius: 3 }} />
        {/* XP text placeholder */}
        <View style={{ width: 48, height: 12, backgroundColor: barColor, borderRadius: 6 }} />
        {/* Challenge icon placeholder */}
        <View style={{ width: 16, height: 16, backgroundColor: barColor, borderRadius: 8 }} />
      </Animated.View>
    </View>
  );
}

export function GamificationBar({ currentStreak, totalXP, dailyChallengeCompleted, isLoading, onPress }: GamificationBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (isLoading) return <SkeletonBar theme={theme} />;

  const level = calculateLevel(totalXP);
  const progress = xpProgress(totalXP);
  const nextLevelXP = xpForLevel(level + 1);

  return (
    <Pressable onPress={onPress}>
      <HStack
        className="mt-2 p-3 rounded-xl items-center"
        style={{ backgroundColor: theme.colors.primaryLight }}
        space="md"
      >
        {/* Streak */}
        <HStack space="xs" className="items-center">
          <Ionicons
            name={currentStreak > 0 ? 'flame' : 'flame-outline'}
            size={16}
            color={currentStreak > 0 ? '#EF4444' : '#9CA3AF'}
          />
          <Text className="text-xs font-bold" style={{ color: currentStreak > 0 ? '#EF4444' : '#9CA3AF' }}>
            {t('gamification.streakDays', { count: currentStreak })}
          </Text>
        </HStack>

        {/* Level */}
        <Text className="text-xs font-bold" style={{ color: theme.colors.primary }}>
          {t('gamification.level', { level })}
        </Text>

        {/* XP Progress Bar */}
        <View style={{ flex: 1, height: 6, backgroundColor: theme.colors.primary + '30', borderRadius: 3 }}>
          <View
            style={{
              width: `${Math.min(progress * 100, 100)}%`,
              height: '100%',
              backgroundColor: theme.colors.primary,
              borderRadius: 3,
            }}
          />
        </View>
        <Text className="text-xs" style={{ color: theme.colors.primary }}>
          {t('gamification.xpOf', { current: totalXP, next: nextLevelXP })}
        </Text>

        {/* Daily Challenge */}
        <Ionicons
          name={dailyChallengeCompleted ? 'checkmark-circle' : 'star-outline'}
          size={16}
          color={dailyChallengeCompleted ? '#22C55E' : '#EAB308'}
        />
      </HStack>
    </Pressable>
  );
}
