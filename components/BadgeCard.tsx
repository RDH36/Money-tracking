import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import type { BadgeDefinition } from '@/constants/badges';

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
  earnedDate: string | null;
}

export function BadgeCard({ badge, earned, earnedDate }: BadgeCardProps) {
  const { t } = useTranslation();
  const isDark = useEffectiveColorScheme() === 'dark';
  const colors = getDarkModeColors(isDark);

  const formattedDate = earnedDate
    ? new Date(earnedDate).toLocaleDateString()
    : null;

  return (
    <VStack
      className="p-3 rounded-xl border items-center"
      style={{
        borderColor: earned ? badge.color + '40' : colors.cardBorder,
        backgroundColor: earned ? badge.color + '08' : (isDark ? colors.chipBg : '#F3F4F6'),
        opacity: earned ? 1 : 0.8,
      }}
      space="xs"
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: earned ? badge.color + '20' : (isDark ? colors.cardBorder : '#E5E7EB40') }}
      >
        {earned ? (
          <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={24} color={badge.color} />
        ) : (
          <Ionicons name="lock-closed" size={20} color={isDark ? '#8E8E93' : '#9CA3AF'} />
        )}
      </View>
      <Text
        className="text-xs font-semibold text-center"
        style={{ color: earned ? badge.color : (isDark ? '#8E8E93' : '#6B7280') }}
        numberOfLines={1}
      >
        {t(badge.nameKey)}
      </Text>
      <Text className="text-xs text-center text-typography-400" numberOfLines={2}>
        {earned && formattedDate
          ? t('gamification.earnedOn', { date: formattedDate })
          : t(badge.descriptionKey)}
      </Text>
    </VStack>
  );
}
