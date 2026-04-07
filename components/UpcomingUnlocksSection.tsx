import { View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PremiumCard, FadeIn } from '@/components/premium';
import { useUnlocksStore } from '@/stores/unlocksStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { UNLOCK_KEYS } from '@/lib/gamification/unlocks';

interface UpcomingEntry {
  key: string;
  icon: string;
  color: string;
  titleKey: string;
  requirementKey: string;
  current: number;
  target: number;
}

/**
 * Static map: each unlock's icon/color/title + requirement source.
 * Progress is computed live from gamification state for each entry.
 */
function buildEntries(state: {
  currentStreak: number;
  longestStreak: number;
  badgesCount: number;
}): UpcomingEntry[] {
  const { longestStreak, badgesCount } = state;

  return [
    {
      key: UNLOCK_KEYS.STREAK_FREEZE_PLUS_1,
      icon: 'snow',
      color: '#06B6D4',
      titleKey: 'unlock.freezeTitle',
      requirementKey: 'unlock.reqStreak14',
      current: Math.min(longestStreak, 14),
      target: 14,
    },
    {
      key: UNLOCK_KEYS.THEME_GOLD,
      icon: 'color-palette',
      color: '#D4AF37',
      titleKey: 'unlock.themeGold',
      requirementKey: 'unlock.reqStreak60',
      current: Math.min(longestStreak, 60),
      target: 60,
    },
    {
      key: UNLOCK_KEYS.THEME_PLATINUM,
      icon: 'color-palette',
      color: '#B8B8C1',
      titleKey: 'unlock.themePlatinum',
      requirementKey: 'unlock.reqStreak100',
      current: Math.min(longestStreak, 100),
      target: 100,
    },
    {
      key: UNLOCK_KEYS.THEME_PRISM,
      icon: 'prism',
      color: '#EC4899',
      titleKey: 'unlock.themePrism',
      requirementKey: 'unlock.reqBadges25',
      current: Math.min(badgesCount, 25),
      target: 25,
    },
  ];
}

export function UpcomingUnlocksSection() {
  const { t } = useTranslation();
  const unlocks = useUnlocksStore((s) => s.unlocks);
  const longestStreak = useGamificationStore((s) => s.longestStreak);
  const currentStreak = useGamificationStore((s) => s.currentStreak);
  const badgesCount = useGamificationStore((s) => s.badges.length);

  const entries = buildEntries({ longestStreak, currentStreak, badgesCount })
    .filter((e) => !unlocks.has(e.key))
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 3);

  if (entries.length === 0) return null;

  return (
    <View className="gap-3">
      <FadeIn>
        <RNText className="text-ui-lg font-ui text-content-primary">
          {t('gamification.upcomingUnlocks')}
        </RNText>
      </FadeIn>
      <View className="gap-2">
        {entries.map((entry) => {
          const progress = entry.current / entry.target;
          return (
            <FadeIn key={entry.key}>
              <PremiumCard className="p-3" style={{ backgroundColor: entry.color + '10' }}>
                <View className="gap-2">
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: entry.color + '20',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={entry.icon as any} size={18} color={entry.color} />
                    </View>
                    <View className="flex-1">
                      <RNText className="text-ui-sm font-ui text-content-primary">
                        {t(entry.titleKey)}
                      </RNText>
                      <RNText className="text-body-sm font-body-regular text-content-secondary">
                        {t(entry.requirementKey)}
                      </RNText>
                    </View>
                    <RNText className="text-ui-xs font-ui" style={{ color: entry.color }}>
                      {entry.current}/{entry.target}
                    </RNText>
                  </View>
                  <View className="h-2 bg-bg-raised rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </View>
                </View>
              </PremiumCard>
            </FadeIn>
          );
        })}
      </View>
    </View>
  );
}
