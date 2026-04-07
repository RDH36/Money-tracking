import { useMemo, useState } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BadgeCard } from '@/components/BadgeCard';
import { FadeIn } from '@/components/premium';
import { useGamification } from '@/hooks';
import { BADGES } from '@/constants/badges';
import { useTheme } from '@/contexts';

type Filter = 'all' | 'earned' | 'locked';

export function BadgesGrid() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const gamification = useGamification();
  const [filter, setFilter] = useState<Filter>('all');

  const filteredBadges = useMemo(() => {
    const earned = new Set(gamification.badges);
    if (filter === 'earned') return BADGES.filter((b) => earned.has(b.id));
    if (filter === 'locked') return BADGES.filter((b) => !earned.has(b.id));
    return BADGES;
  }, [filter, gamification.badges]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: t('gamification.filterAll'), count: BADGES.length },
    { key: 'earned', label: t('gamification.filterEarned'), count: gamification.badges.length },
    { key: 'locked', label: t('gamification.filterLocked'), count: BADGES.length - gamification.badges.length },
  ];

  return (
    <View className="gap-3">
      <FadeIn>
        <View className="flex-row gap-2">
          {filters.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: isActive ? theme.colors.primary : 'transparent',
                  borderWidth: 1,
                  borderColor: isActive ? theme.colors.primary : '#E5E7EB',
                }}
              >
                <RNText
                  className="text-ui-xs font-ui"
                  style={{ color: isActive ? '#FFFFFF' : '#6B7280' }}
                >
                  {f.label} ({f.count})
                </RNText>
              </Pressable>
            );
          })}
        </View>
      </FadeIn>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {filteredBadges.map((badge) => (
          <View key={badge.id} style={{ width: '48%' }}>
            <BadgeCard
              badge={badge}
              earned={gamification.badges.includes(badge.id)}
              earnedDate={null}
            />
          </View>
        ))}
      </View>
      {filteredBadges.length === 0 && (
        <View className="items-center py-8">
          <RNText className="text-content-tertiary font-body-regular text-body-sm">
            {t('gamification.noBadges')}
          </RNText>
        </View>
      )}
    </View>
  );
}
