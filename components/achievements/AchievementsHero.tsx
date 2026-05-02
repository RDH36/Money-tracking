import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useGamification } from '@/hooks';
import { BADGES, calculateLevel, xpProgress, xpToNextLevel } from '@/constants/badges';

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}h ${mm}m`;
  return `${mm}m ${ss}s`;
}

export function AchievementsHero() {
  const v2 = useV2();
  const { t } = useTranslation();
  const gamification = useGamification();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const level = calculateLevel(gamification.totalXP);
  const progress = xpProgress(gamification.totalXP);
  const remaining = xpToNextLevel(gamification.totalXP);
  const earnedCount = gamification.badges.length;

  return (
    <View style={{ borderRadius: 18, overflow: 'hidden' }}>
      <LinearGradient
        colors={[v2.bgInk, v2.bgInkSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18 }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', right: -40, top: -40,
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: 'rgba(14,140,130,0.18)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', left: -30, bottom: -30,
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: 'rgba(245,245,241,0.04)',
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ borderRadius: 16, overflow: 'hidden', shadowColor: v2.brand, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
            <LinearGradient
              colors={[v2.brand, v2.brandDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 26, color: v2.inkOnDark, letterSpacing: -0.5 }}>
                {level}
              </Text>
            </LinearGradient>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
                letterSpacing: 1.5, textTransform: 'uppercase',
                color: v2.inkOnDarkM, marginBottom: 2,
              }}
            >
              {t('achievements.heroLevelOverline')}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 22, color: v2.inkOnDark, letterSpacing: -0.4 }}
            >
              {t('gamification.level', { level })}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 14, height: 6, borderRadius: 999, backgroundColor: 'rgba(245,245,241,0.12)', overflow: 'hidden' }}>
          <LinearGradient
            colors={[v2.brand, '#2EBDA8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: '100%', width: `${Math.min(progress * 100, 100)}%`, borderRadius: 999 }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', color: v2.inkOnDarkM, fontVariant: ['tabular-nums'] }}>
            {gamification.totalXP} XP
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkOnDarkM }}>
            {t('achievements.heroNextLevelGap', { xp: remaining, level: level + 1 })}
          </Text>
        </View>

        <View style={{ marginTop: 14, flexDirection: 'row', gap: 6 }}>
          <Chip v2={v2} icon="flame" tone="#EF4444" value={t('achievements.streakDaysShort', { count: gamification.currentStreak })} label={t('achievements.statStreakLabel')} />
          <Chip v2={v2} icon="snow" tone="#06B6D4" value={String(gamification.streakFreezeAvailable)} label={t('achievements.statFreezesLabel')} />
          <Chip v2={v2} icon="checkmark-circle" tone={v2.brand} value={`${earnedCount}/${BADGES.length}`} label={t('achievements.statBadgesLabel')} />
        </View>

        {gamification.currentStreak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Ionicons name="time-outline" size={11} color={v2.inkOnDarkM} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 10, color: v2.inkOnDarkM, fontWeight: '500' }}>
              {t('achievements.nextDailyIn', { time: countdown })}
            </Text>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

interface ChipProps { v2: ReturnType<typeof useV2>; icon: any; tone: string; value: string; label: string; }
function Chip({ v2, icon, tone, value, label }: ChipProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(245,245,241,0.08)',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 6,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon} size={12} color={tone} />
        <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: v2.inkOnDark, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </View>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 9, color: v2.inkOnDarkM, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}
