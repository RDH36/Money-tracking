import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useV2, type V2Tokens } from '@/constants/designTokensV2';
import { useQuests } from '@/hooks';
import { TIER_1_QUESTS, TIER_2_QUESTS, type QuestDefinition } from '@/lib/gamification/quests';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function QuestsList() {
  const v2 = useV2();
  const { t } = useTranslation();
  const { getQuestWithProgress } = useQuests();

  const tier1WithProgress = TIER_1_QUESTS.map((q) => ({ q, p: getQuestWithProgress(q) }));
  const tier1Total = TIER_1_QUESTS.length;
  const tier1Completed = tier1WithProgress.filter((x) => x.p.isCompleted).length;
  const tier1AllComplete = tier1Completed === tier1Total;
  const activeCount = tier1WithProgress.filter((x) => !x.p.isCompleted).length;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ paddingHorizontal: 6, marginBottom: 4 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.6, textTransform: 'uppercase',
            color: v2.inkSubtle, marginBottom: 4,
          }}
        >
          {t('achievements.questsHookLabel', { count: activeCount })}
        </Text>
        <Text
          style={{
            fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 16,
            color: v2.inkMuted, fontStyle: 'italic',
            letterSpacing: -0.2, lineHeight: 22,
          }}
        >
          {t('achievements.questsHookText')}
        </Text>
      </View>

      {tier1WithProgress.map(({ q, p }) => (
        <QuestCard key={q.id} v2={v2} quest={q} progress={p} />
      ))}

      <View
        style={{
          marginTop: 12,
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: v2.warn + '4D',
        }}
      >
        <LinearGradient
          colors={[v2.warn + '24', v2.warn + '0C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}
        >
          <Ionicons name="sparkles" size={18} color={v2.warn} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700',
                letterSpacing: 0.4, textTransform: 'uppercase',
                color: v2.warn,
              }}
            >
              {t('achievements.epicQuestsTitle')}
            </Text>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted, marginTop: 2 }}>
              {t('achievements.epicQuestsDesc')}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700',
              color: v2.warn, fontVariant: ['tabular-nums'],
            }}
          >
            {t('achievements.epicQuestsCount', { done: tier1Completed, total: tier1Total })}
          </Text>
        </LinearGradient>
      </View>

      {tier1AllComplete
        ? TIER_2_QUESTS.map((q) => (
            <QuestCard key={q.id} v2={v2} quest={q} progress={getQuestWithProgress(q)} />
          ))
        : null}
    </View>
  );
}

interface QuestCardProps {
  v2: V2Tokens;
  quest: QuestDefinition;
  progress: ReturnType<ReturnType<typeof useQuests>['getQuestWithProgress']>;
}

function QuestCard({ v2, quest, progress }: QuestCardProps) {
  const { t } = useTranslation();
  const { currentStep, metricValue, isCompleted, nextStep, stepProgress } = progress;
  const totalSteps = quest.steps.length;
  const dotColor = isCompleted ? v2.good : quest.color;
  const totalXP = quest.steps.reduce((sum, s) => sum + s.xp, 0);
  const iconName: IoniconName = (quest.icon as IoniconName) ?? 'pricetag-outline';

  return (
    <View
      style={{
        backgroundColor: isCompleted ? v2.goodSoft : v2.bgSurface,
        borderWidth: 1,
        borderColor: isCompleted ? v2.good + '40' : v2.hairline,
        borderRadius: 18,
        padding: 14,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 42, height: 42, borderRadius: 12,
          backgroundColor: isCompleted ? v2.good + '30' : quest.color + '24',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={isCompleted ? 'checkmark' : iconName}
          size={18}
          color={isCompleted ? v2.good : quest.color}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 17, color: v2.ink, letterSpacing: -0.3, lineHeight: 20, flexShrink: 1 }}
          >
            {t(quest.titleKey)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: idx < currentStep ? dotColor : v2.hairlineStrong,
                }}
              />
            ))}
          </View>
        </View>
        <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.inkMuted, marginTop: 3, lineHeight: 16 }}>
          {t(quest.descriptionKey)}
        </Text>

        {!isCompleted && nextStep ? (
          <View style={{ marginTop: 10 }}>
            <View style={{ height: 5, borderRadius: 999, backgroundColor: v2.hairline, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min(stepProgress * 100, 100)}%`, backgroundColor: quest.color, borderRadius: 999 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, fontVariant: ['tabular-nums'] }}>
                {t('achievements.questStepLabel', { step: currentStep + 1, progress: metricValue, target: nextStep.target })}
              </Text>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '700', color: quest.color, fontVariant: ['tabular-nums'] }}>
                +{nextStep.xp} XP
              </Text>
            </View>
          </View>
        ) : null}

        {isCompleted ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <View style={{ backgroundColor: v2.good + '24', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 }}>
              <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', color: v2.good }}>
                {t('achievements.questCompleted')}
              </Text>
            </View>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, fontStyle: 'italic' }}>
              {t('achievements.xpCollected', { xp: totalXP })}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
