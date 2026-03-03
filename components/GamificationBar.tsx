import { View, Pressable } from 'react-native';
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
  onPress: () => void;
}

export function GamificationBar({ currentStreak, totalXP, dailyChallengeCompleted, onPress }: GamificationBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
