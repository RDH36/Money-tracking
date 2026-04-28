import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import { useGamification } from '@/hooks';
import { BADGES, type BadgeDefinition } from '@/constants/badges';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type Filter = 'all' | 'earned' | 'locked';

const SECRET_BADGES_HINT = 3;

export function BadgesGrid() {
  const v2 = useV2();
  const { t } = useTranslation();
  const gamification = useGamification();
  const [filter, setFilter] = useState<Filter>('all');

  const earnedSet = useMemo(() => new Set(gamification.badges), [gamification.badges]);
  const filteredBadges = useMemo(() => {
    if (filter === 'earned') return BADGES.filter((b) => earnedSet.has(b.id));
    if (filter === 'locked') return BADGES.filter((b) => !earnedSet.has(b.id));
    return BADGES;
  }, [filter, earnedSet]);

  const filters: { key: Filter; tk: string; count: number }[] = [
    { key: 'all', tk: 'achievements.filterAll', count: BADGES.length },
    { key: 'earned', tk: 'achievements.filterEarned', count: gamification.badges.length },
    { key: 'locked', tk: 'achievements.filterLocked', count: BADGES.length - gamification.badges.length },
  ];

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: active ? v2.bgInk : 'transparent',
                borderWidth: 1,
                borderColor: active ? v2.bgInk : v2.hairlineStrong,
              }}
            >
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700',
                  letterSpacing: 0.2, color: active ? v2.inkOnDark : v2.ink,
                }}
              >
                {t(f.tk)}
              </Text>
              <Text
                style={{
                  fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600',
                  color: active ? v2.inkOnDarkM : v2.inkSubtle,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {f.count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: 6, marginBottom: 10 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.6, textTransform: 'uppercase', color: v2.brand,
          }}
        >
          {t('achievements.collectionLabel', { count: gamification.badges.length })}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 18,
            color: v2.ink, letterSpacing: -0.3, marginTop: 3,
          }}
        >
          {t('achievements.collectionTitle')}
        </Text>
      </View>

      {filteredBadges.length === 0 ? (
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle,
            fontStyle: 'italic', textAlign: 'center', paddingVertical: 30,
          }}
        >
          {t('achievements.noResultsForFilter')}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {filteredBadges.map((badge) => (
            <View key={badge.id} style={{ flexBasis: '48%' }}>
              <BadgeCard v2={v2} badge={badge} earned={earnedSet.has(badge.id)} />
            </View>
          ))}
        </View>
      )}

      <View
        style={{
          marginTop: 14, paddingVertical: 12, paddingHorizontal: 14,
          borderRadius: 12, backgroundColor: v2.bgRaised,
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}
      >
        <View
          style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: 'rgba(15,19,17,0.06)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 18, color: v2.inkSubtle, letterSpacing: -0.5 }}>?</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: v2.ink }}>
            {t('achievements.secretBadges', { count: SECRET_BADGES_HINT })}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}>
            {t('achievements.secretBadgesHint')}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface BadgeCardProps { v2: V2Tokens; badge: BadgeDefinition; earned: boolean; }
function BadgeCard({ v2, badge, earned }: BadgeCardProps) {
  const { t } = useTranslation();
  const iconName: IoniconName = (badge.icon as IoniconName) ?? 'pricetag-outline';
  const color = badge.color || v2.brand;
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 14,
        backgroundColor: earned ? v2.bgSurface : 'transparent',
        borderWidth: earned ? 1 : 1,
        borderStyle: earned ? 'solid' : 'dashed',
        borderColor: earned ? color + '40' : v2.hairlineStrong,
        opacity: earned ? 1 : 0.7,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {earned ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', right: -20, top: -20,
            width: 70, height: 70, borderRadius: 35,
            backgroundColor: color + '18',
          }}
        />
      ) : null}
      <View
        style={{
          width: 44, height: 44, borderRadius: 14,
          backgroundColor: earned ? color + '24' : 'rgba(15,19,17,0.06)',
          alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        }}
      >
        <Ionicons
          name={earned ? iconName : 'lock-closed'}
          size={20}
          color={earned ? color : v2.inkSubtle}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700',
          lineHeight: 16, color: earned ? v2.ink : v2.inkMuted,
        }}
      >
        {t(badge.nameKey)}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          fontFamily: v2.fontUI, fontSize: 11,
          color: v2.inkSubtle, marginTop: 3, lineHeight: 14,
        }}
      >
        {t(badge.descriptionKey)}
      </Text>
      {earned ? (
        <View
          style={{
            marginTop: 8, alignSelf: 'flex-start',
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999,
            backgroundColor: color + '20',
          }}
        >
          <Ionicons name="checkmark" size={9} color={color} />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', color }}>
            ✓
          </Text>
        </View>
      ) : null}
    </View>
  );
}
