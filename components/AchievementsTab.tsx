import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { BadgeCard } from '@/components/BadgeCard';
import { useGamification } from '@/hooks';
import { useTheme } from '@/contexts';
import { BADGES, calculateLevel, xpProgress, xpForLevel } from '@/constants/badges';

interface BadgeEarnedDate {
  badge_type: string;
  earned_at: string;
}

export function AchievementsTab() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const gamification = useGamification();
  const [badgeDates, setBadgeDates] = useState<Record<string, string>>({});

  const level = calculateLevel(gamification.totalXP);
  const progress = xpProgress(gamification.totalXP);
  const nextLevelXP = xpForLevel(level + 1);
  const earnedCount = gamification.badges.length;

  const challengeKey = gamification.dailyChallengeType
    ? `gamification.challenge${gamification.dailyChallengeType.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (_, c) => c.toUpperCase())}`
    : '';

  // Map challenge types to translation keys
  const challengeKeyMap: Record<string, string> = {
    log_expense: 'gamification.challengeLogExpense',
    log_3_transactions: 'gamification.challengeLog3',
    check_planification: 'gamification.challengeCheckPlan',
    log_income: 'gamification.challengeLogIncome',
    create_planification: 'gamification.challengeCreatePlan',
  };
  const challengeText = challengeKeyMap[gamification.dailyChallengeType] || challengeKey;

  useFocusEffect(
    useCallback(() => {
      gamification.checkBadges();
    }, [])
  );

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <VStack space="lg">
        {/* Stats */}
        <HStack space="sm" className="justify-between">
          <StatCard
            icon="flame"
            iconColor="#EF4444"
            label={t('gamification.streak')}
            value={t('gamification.streakDays', { count: gamification.currentStreak })}
            bg="#FEF2F2"
          />
          <StatCard
            icon="trophy"
            iconColor={theme.colors.primary}
            label={t('gamification.currentLevel')}
            value={String(level)}
            bg={theme.colors.primaryLight}
          />
          <StatCard
            icon="star"
            iconColor="#EAB308"
            label={t('gamification.totalXP')}
            value={String(gamification.totalXP)}
            bg="#FEFCE8"
          />
          <StatCard
            icon="ribbon"
            iconColor="#A855F7"
            label={t('gamification.badges')}
            value={t('gamification.badgesEarned', { count: earnedCount, total: BADGES.length })}
            bg="#FAF5FF"
          />
        </HStack>

        {/* XP Progress */}
        <Box className="p-4 rounded-xl border border-outline-100">
          <HStack className="justify-between items-center mb-2">
            <Text className="text-sm font-semibold text-typography-700">
              {t('gamification.level', { level })}
            </Text>
            <Text className="text-xs text-typography-400">
              {t('gamification.xpOf', { current: gamification.totalXP, next: nextLevelXP })}
            </Text>
          </HStack>
          <View style={{ height: 8, backgroundColor: theme.colors.primary + '20', borderRadius: 4 }}>
            <View
              style={{
                width: `${Math.min(progress * 100, 100)}%`,
                height: '100%',
                backgroundColor: theme.colors.primary,
                borderRadius: 4,
              }}
            />
          </View>
        </Box>

        {/* Daily Challenge */}
        {gamification.dailyChallengeType ? (
          <Box
            className="p-4 rounded-xl border"
            style={{
              borderColor: gamification.dailyChallengeCompleted ? '#22C55E40' : '#EAB30840',
              backgroundColor: gamification.dailyChallengeCompleted ? '#F0FDF408' : '#FEFCE808',
            }}
          >
            <HStack className="items-center justify-between">
              <HStack space="sm" className="items-center flex-1">
                <Ionicons
                  name={gamification.dailyChallengeCompleted ? 'checkmark-circle' : 'star'}
                  size={20}
                  color={gamification.dailyChallengeCompleted ? '#22C55E' : '#EAB308'}
                />
                <VStack className="flex-1">
                  <Text className="text-sm font-semibold text-typography-700">
                    {t('gamification.dailyChallenge')}
                  </Text>
                  <Text className="text-xs text-typography-500">
                    {gamification.dailyChallengeCompleted
                      ? t('gamification.challengeCompleted')
                      : t(challengeText)}
                  </Text>
                </VStack>
              </HStack>
              <Text className="text-xs font-bold" style={{ color: '#7C3AED' }}>
                +50 XP
              </Text>
            </HStack>
          </Box>
        ) : null}

        {/* Streak Info */}
        <HStack space="sm">
          <Box className="flex-1 p-3 rounded-xl" style={{ backgroundColor: '#FEF2F2' }}>
            <HStack space="xs" className="items-center">
              <Ionicons name="flame" size={14} color="#EF4444" />
              <Text className="text-xs text-typography-500">{t('gamification.longestStreak')}</Text>
            </HStack>
            <Text className="text-lg font-bold" style={{ color: '#EF4444' }}>
              {t('gamification.streakDays', { count: gamification.longestStreak })}
            </Text>
          </Box>
          <Box className="flex-1 p-3 rounded-xl" style={{ backgroundColor: '#EFF6FF' }}>
            <HStack space="xs" className="items-center">
              <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
              <Text className="text-xs text-typography-500">{t('gamification.streakFreeze')}</Text>
            </HStack>
            <Text className="text-lg font-bold" style={{ color: '#3B82F6' }}>
              {t('gamification.streakFreezeDesc', { count: gamification.streakFreezeAvailable })}
            </Text>
          </Box>
        </HStack>

        {/* Badges */}
        <VStack space="sm">
          <Text className="text-typography-700 font-semibold">{t('gamification.badges')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BADGES.map((badge) => (
              <View key={badge.id} style={{ width: '48%' }}>
                <BadgeCard
                  badge={badge}
                  earned={gamification.badges.includes(badge.id)}
                  earnedDate={badgeDates[badge.id] || null}
                />
              </View>
            ))}
          </View>
        </VStack>
      </VStack>
    </ScrollView>
  );
}

function StatCard({ icon, iconColor, label, value, bg }: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <VStack className="flex-1 p-2 rounded-lg items-center" style={{ backgroundColor: bg }} space="xs">
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
      <Text className="text-sm font-bold" style={{ color: iconColor }}>{value}</Text>
      <Text className="text-xs text-typography-400 text-center" numberOfLines={1}>{label}</Text>
    </VStack>
  );
}
