import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import type { BadgeDefinition } from '@/constants/badges';

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
  earnedDate: string | null;
}

export function BadgeCard({ badge, earned, earnedDate }: BadgeCardProps) {
  const { t } = useTranslation();

  const formattedDate = earnedDate
    ? new Date(earnedDate).toLocaleDateString()
    : null;

  return (
    <VStack
      className="p-3 rounded-xl border items-center"
      style={{
        borderColor: earned ? badge.color + '40' : '#E5E7EB',
        backgroundColor: earned ? badge.color + '08' : '#F9FAFB',
        opacity: earned ? 1 : 0.6,
      }}
      space="xs"
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: earned ? badge.color + '20' : '#E5E7EB' }}
      >
        {earned ? (
          <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={24} color={badge.color} />
        ) : (
          <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
        )}
      </View>
      <Text
        className="text-xs font-semibold text-center"
        style={{ color: earned ? badge.color : '#6B7280' }}
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
