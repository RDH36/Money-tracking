import { useEffect, useState } from 'react';
import { View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PremiumCard, FadeIn } from '@/components/premium';
import { useTheme } from '@/contexts';
import { useGamification } from '@/hooks';
import { BADGES, calculateLevel, xpProgress, xpForLevel } from '@/constants/badges';

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}h ${mm}m`;
  return `${mm}m ${ss}s`;
}

export function AchievementsHero() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const gamification = useGamification();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeUntilMidnight()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const level = calculateLevel(gamification.totalXP);
  const progress = xpProgress(gamification.totalXP);
  const nextLevelXP = xpForLevel(level + 1);
  const earnedCount = gamification.badges.length;

  return (
    <View className="gap-3">
      <FadeIn>
        <PremiumCard className="p-4">
          <View className="gap-3">
            {/* Level + XP */}
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: theme.colors.primary + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="trophy" size={22} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <RNText className="text-ui-md font-ui text-content-primary">
                  {t('gamification.level', { level })}
                </RNText>
                <RNText className="text-ui-xs font-ui text-content-secondary">
                  {t('gamification.xpOf', { current: gamification.totalXP, next: nextLevelXP })}
                </RNText>
              </View>
            </View>
            <View className="h-2.5 bg-bg-raised rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </View>
            {/* Compact stat chips */}
            <View className="flex-row gap-2 pt-1">
              <StatChip icon="flame" color="#EF4444"
                value={`${gamification.currentStreak}j`} />
              <StatChip icon="shield-checkmark" color="#3B82F6"
                value={String(gamification.streakFreezeAvailable)} />
              <StatChip icon="star" color="#EAB308"
                value={String(gamification.totalXP)} />
              <StatChip icon="ribbon" color="#8B5CF6"
                value={`${earnedCount}/${BADGES.length}`} />
            </View>
            {gamification.currentStreak > 0 && (
              <View className="flex-row items-center gap-1 pt-0.5">
                <Ionicons name="time-outline" size={10} color="#9CA3AF" />
                <RNText className="text-content-tertiary font-body-regular" style={{ fontSize: 10 }}>
                  {t('gamification.nextStreak', { time: countdown })}
                </RNText>
              </View>
            )}
          </View>
        </PremiumCard>
      </FadeIn>
    </View>
  );
}

function StatChip({ icon, color, value }: { icon: string; color: string; value: string }) {
  return (
    <View
      className="flex-1 flex-row items-center justify-center gap-1 rounded-lg py-1.5"
      style={{ backgroundColor: color + '12' }}
    >
      <Ionicons name={icon as any} size={12} color={color} />
      <RNText className="text-ui-xs font-ui" style={{ color }}>{value}</RNText>
    </View>
  );
}
