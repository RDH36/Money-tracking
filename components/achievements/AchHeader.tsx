import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
export type AchTabKey = 'challenges' | 'quests' | 'badges';

interface AchHeaderProps {
  activeTab: AchTabKey;
  onTabChange: (t: AchTabKey) => void;
}

function getISOWeek(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

const TABS: { key: AchTabKey; tk: string; icon: IoniconName }[] = [
  { key: 'challenges', tk: 'achievements.tabChallenges', icon: 'flame' },
  { key: 'quests', tk: 'achievements.tabQuests', icon: 'ribbon' },
  { key: 'badges', tk: 'achievements.tabBadges', icon: 'trophy' },
];

export function AchHeader({ activeTab, onTabChange }: AchHeaderProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const now = new Date();
  const month = capitalize(now.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }));
  const week = getISOWeek(now);

  return (
    <View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: v2.inkSubtle, marginBottom: 4,
        }}
      >
        {t('achievements.titleWeekLabel', { month, week })}
      </Text>
      <Text
        style={{
          fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 36, color: v2.ink,
          letterSpacing: -1, lineHeight: 38,
        }}
      >
        {t('achievements.titleSucces')}
      </Text>

      <View
        style={{
          marginTop: 14,
          backgroundColor: v2.bgRaised,
          borderRadius: 12,
          padding: 4,
          flexDirection: 'row',
          gap: 2,
        }}
      >
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 8,
                borderRadius: 9,
                backgroundColor: active ? v2.bgSurface : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                shadowColor: '#000',
                shadowOpacity: active ? 0.08 : 0,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: active ? 1 : 0,
              }}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={active ? v2.brand : v2.inkSubtle}
              />
              <Text
                style={{
                  fontFamily: v2.fontUI,
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                  color: active ? v2.ink : v2.inkSubtle,
                }}
              >
                {t(tab.tk)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
