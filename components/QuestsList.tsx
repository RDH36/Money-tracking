import { View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PremiumCard, FadeIn } from '@/components/premium';
import { useQuests } from '@/hooks';
import {
  TIER_1_QUESTS,
  TIER_2_QUESTS,
  type QuestDefinition,
} from '@/lib/gamification/quests';

export function QuestsList() {
  const { t } = useTranslation();
  const { getQuestWithProgress } = useQuests();

  const tier1AllComplete = TIER_1_QUESTS.every(
    (q) => getQuestWithProgress(q).isCompleted
  );

  return (
    <View className="gap-3">
      <FadeIn>
        <RNText className="text-ui-lg font-ui text-content-primary">
          {t('gamification.quests')}
        </RNText>
      </FadeIn>
      <View className="gap-2">
        {TIER_1_QUESTS.map((quest) => (
          <QuestCard key={quest.id} quest={quest} progressFn={getQuestWithProgress} />
        ))}
      </View>
      {tier1AllComplete && (
        <>
          <FadeIn>
            <View className="flex-row items-center gap-2 mt-2">
              <Ionicons name="diamond" size={16} color="#F59E0B" />
              <RNText className="text-ui-md font-ui" style={{ color: '#F59E0B' }}>
                {t('gamification.questsEpic')}
              </RNText>
            </View>
          </FadeIn>
          <View className="gap-2">
            {TIER_2_QUESTS.map((quest) => (
              <QuestCard key={quest.id} quest={quest} progressFn={getQuestWithProgress} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function QuestCard({
  quest,
  progressFn,
}: {
  quest: QuestDefinition;
  progressFn: ReturnType<typeof useQuests>['getQuestWithProgress'];
}) {
  const { t } = useTranslation();
  const { currentStep, metricValue, isCompleted, nextStep, stepProgress } =
    progressFn(quest);
  const totalSteps = quest.steps.length;

  return (
    <FadeIn>
      <PremiumCard
        className="p-3"
        style={{
          backgroundColor: isCompleted ? '#22C55E12' : quest.color + '12',
        }}
      >
        <View className="gap-2">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: isCompleted ? '#22C55E20' : quest.color + '20',
              }}
            >
              <Ionicons
                name={(isCompleted ? 'checkmark-circle' : quest.icon) as any}
                size={22}
                color={isCompleted ? '#22C55E' : quest.color}
              />
            </View>
            <View className="flex-1">
              <RNText className="text-ui-sm font-ui text-content-primary">
                {t(quest.titleKey)}
              </RNText>
              <RNText className="text-body-sm font-body-regular text-content-secondary">
                {t(quest.descriptionKey)}
              </RNText>
            </View>
            <RNText
              className="text-ui-xs font-ui"
              style={{ color: isCompleted ? '#22C55E' : quest.color }}
            >
              {currentStep}/{totalSteps}
            </RNText>
          </View>

          {!isCompleted && nextStep && (
            <View className="gap-1">
              <View className="flex-row justify-between">
                <RNText className="text-ui-xs font-ui text-content-secondary">
                  {metricValue}/{nextStep.target}
                </RNText>
                <RNText className="text-ui-xs font-ui" style={{ color: quest.color }}>
                  +{nextStep.xp} XP
                </RNText>
              </View>
              <View className="h-2 bg-bg-raised rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${stepProgress * 100}%`,
                    backgroundColor: quest.color,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </PremiumCard>
    </FadeIn>
  );
}
