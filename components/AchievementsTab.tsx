import { useCallback, useState } from 'react';
import { ScrollView, View, Pressable, Text as RNText } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AchievementsHero } from '@/components/achievements/AchievementsHero';
import { ChallengesSection } from '@/components/achievements/ChallengesSection';
import { BadgesGrid } from '@/components/achievements/BadgesGrid';
import { QuestsList } from '@/components/QuestsList';
import { useGamification, useQuests } from '@/hooks';
import { useTheme } from '@/contexts';

type TabKey = 'challenges' | 'quests' | 'badges';

export function AchievementsTab() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const gamification = useGamification();
  const quests = useQuests();
  const [activeTab, setActiveTab] = useState<TabKey>('challenges');

  useFocusEffect(useCallback(() => {
    gamification.checkBadges();
    quests.refreshQuests();
  }, []));

  const tabs: { key: TabKey; labelKey: string; icon: string }[] = [
    { key: 'challenges', labelKey: 'gamification.tabChallenges', icon: 'flash' },
    { key: 'quests', labelKey: 'gamification.tabQuests', icon: 'compass' },
    { key: 'badges', labelKey: 'gamification.tabBadges', icon: 'ribbon' },
  ];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View className="gap-4">
        <AchievementsHero />

        {/* Segmented control */}
        <View className="flex-row bg-bg-raised rounded-xl p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: isActive ? theme.colors.primary : 'transparent',
                }}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={isActive ? '#FFFFFF' : '#9CA3AF'}
                  />
                  <RNText
                    className="text-ui-xs font-ui"
                    style={{ color: isActive ? '#FFFFFF' : '#9CA3AF' }}
                  >
                    {t(tab.labelKey)}
                  </RNText>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Active section */}
        {activeTab === 'challenges' && <ChallengesSection />}
        {activeTab === 'quests' && <QuestsList />}
        {activeTab === 'badges' && <BadgesGrid />}
      </View>
    </ScrollView>
  );
}
