import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useGamification, useQuests } from '@/hooks';
import { useV2 } from '@/constants/designTokensV2';
import {
  AchievementsHero,
  AchHeader,
  ChallengesSection,
  BadgesGrid,
  type AchTabKey,
} from '@/components/achievements';
import { QuestsList } from '@/components/QuestsList';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const gamification = useGamification();
  const quests = useQuests();
  const [activeTab, setActiveTab] = useState<AchTabKey>('challenges');

  useFocusEffect(useCallback(() => {
    gamification.checkBadges();
    quests.refreshQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14 }}>
          <AchHeader activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <AchievementsHero />
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {activeTab === 'challenges' ? (
            <ChallengesSection onViewAllUnlocks={() => setActiveTab('badges')} />
          ) : null}
          {activeTab === 'quests' ? <QuestsList /> : null}
          {activeTab === 'badges' ? <BadgesGrid /> : null}
        </View>
      </ScrollView>
    </View>
  );
}
