import { View, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PremiumCard, FadeIn } from '@/components/premium';
import { UpcomingUnlocksSection } from '@/components/UpcomingUnlocksSection';
import { useGamification, useWeeklyChallenge, useMonthlyChallenge } from '@/hooks';

const challengeKeyMap: Record<string, string> = {
  log_expense: 'gamification.challengeLogExpense',
  log_3_transactions: 'gamification.challengeLog3',
  check_planification: 'gamification.challengeCheckPlan',
  log_income: 'gamification.challengeLogIncome',
  create_planification: 'gamification.challengeCreatePlan',
  log_before_noon: 'gamification.challengeBeforeNoon',
  categorize_all: 'gamification.challengeCategorizeAll',
  review_budget: 'gamification.challengeReviewBudget',
  stay_under_budget: 'gamification.challengeStayUnderBudget',
  save_today: 'gamification.challengeSaveToday',
};

const weeklyKeyMap: Record<string, string> = {
  weekly_streak: 'gamification.weeklyStreak',
  weekly_budget_respect: 'gamification.weeklyBudgetRespect',
  weekly_3_categories: 'gamification.weekly3Categories',
  weekly_plan_validate: 'gamification.weeklyPlanValidate',
  weekly_save: 'gamification.weeklySave',
};

const monthlyKeyMap: Record<string, string> = {
  monthly_50_transactions: 'gamification.monthly50Tx',
  monthly_full_budget_clean: 'gamification.monthlyBudgetClean',
  monthly_3_plans: 'gamification.monthly3Plans',
  monthly_15_day_streak: 'gamification.monthly15DayStreak',
  monthly_6_categories: 'gamification.monthly6Categories',
};

export function ChallengesSection() {
  const { t } = useTranslation();
  const gamification = useGamification();
  const weekly = useWeeklyChallenge();
  const monthly = useMonthlyChallenge();
  const challengeText = challengeKeyMap[gamification.dailyChallengeType] || '';

  return (
    <View className="gap-3">
      {/* Daily */}
      {gamification.dailyChallengeType ? (
        <FadeIn>
          <PremiumCard
            className="p-4"
            style={{
              backgroundColor: gamification.dailyChallengeCompleted
                ? '#22C55E12' : '#EAB30812',
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <IconCircle
                  bg={gamification.dailyChallengeCompleted ? '#22C55E20' : '#EAB30820'}
                  icon={gamification.dailyChallengeCompleted ? 'checkmark-circle' : 'star'}
                  color={gamification.dailyChallengeCompleted ? '#22C55E' : '#EAB308'}
                />
                <View className="flex-1">
                  <RNText className="text-ui-sm font-ui text-content-primary">
                    {t('gamification.dailyChallenge')}
                  </RNText>
                  <RNText className="text-body-sm font-body-regular text-content-secondary">
                    {gamification.dailyChallengeCompleted
                      ? t('gamification.challengeCompleted')
                      : t(challengeText)}
                  </RNText>
                </View>
              </View>
              <RNText className="text-ui-sm font-ui" style={{ color: '#EAB308' }}>
                +50 XP
              </RNText>
            </View>
          </PremiumCard>
        </FadeIn>
      ) : null}

      {/* Weekly */}
      {weekly.weeklyChallengeType ? (
        <FadeIn>
          <PremiumCard
            className="p-4"
            style={{
              backgroundColor: weekly.weeklyChallengeCompleted ? '#22C55E12' : '#8B5CF612',
            }}
          >
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <IconCircle
                    bg={weekly.weeklyChallengeCompleted ? '#22C55E20' : '#8B5CF620'}
                    icon={weekly.weeklyChallengeCompleted ? 'checkmark-circle' : 'calendar'}
                    color={weekly.weeklyChallengeCompleted ? '#22C55E' : '#8B5CF6'}
                  />
                  <View className="flex-1">
                    <RNText className="text-ui-sm font-ui text-content-primary">
                      {t('gamification.weeklyChallenge')}
                    </RNText>
                    <RNText className="text-body-sm font-body-regular text-content-secondary">
                      {weekly.weeklyChallengeCompleted
                        ? t('gamification.weeklyCompleted')
                        : t(weeklyKeyMap[weekly.weeklyChallengeType] || '')}
                    </RNText>
                  </View>
                </View>
                <RNText className="text-ui-sm font-ui" style={{ color: '#8B5CF6' }}>
                  +{weekly.reward} XP
                </RNText>
              </View>
              {!weekly.weeklyChallengeCompleted && weekly.target > 1 && (
                <View className="gap-1">
                  <View className="flex-row justify-between">
                    <RNText className="text-ui-xs font-ui text-content-secondary">
                      {t('gamification.progress')}
                    </RNText>
                    <RNText className="text-ui-xs font-ui text-content-secondary">
                      {weekly.progress}/{weekly.target}
                    </RNText>
                  </View>
                  <View className="h-2 bg-bg-raised rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((weekly.progress / weekly.target) * 100, 100)}%`,
                        backgroundColor: '#8B5CF6',
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </PremiumCard>
        </FadeIn>
      ) : null}

      {/* Monthly */}
      {monthly.monthlyChallengeType ? (
        <FadeIn>
          <PremiumCard
            className="p-4"
            style={{
              backgroundColor: monthly.monthlyChallengeCompleted ? '#22C55E12' : '#F59E0B12',
            }}
          >
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <IconCircle
                    bg={monthly.monthlyChallengeCompleted ? '#22C55E20' : '#F59E0B20'}
                    icon={monthly.monthlyChallengeCompleted ? 'checkmark-circle' : 'diamond'}
                    color={monthly.monthlyChallengeCompleted ? '#22C55E' : '#F59E0B'}
                  />
                  <View className="flex-1">
                    <RNText className="text-ui-sm font-ui text-content-primary">
                      {t('gamification.monthlyChallenge')}
                    </RNText>
                    <RNText className="text-body-sm font-body-regular text-content-secondary">
                      {monthly.monthlyChallengeCompleted
                        ? t('gamification.monthlyCompleted')
                        : t(monthlyKeyMap[monthly.monthlyChallengeType] || '')}
                    </RNText>
                  </View>
                </View>
                <RNText className="text-ui-sm font-ui" style={{ color: '#F59E0B' }}>
                  +{monthly.reward} XP
                </RNText>
              </View>
              {!monthly.monthlyChallengeCompleted && monthly.target > 1 && (
                <View className="gap-1">
                  <View className="flex-row justify-between">
                    <RNText className="text-ui-xs font-ui text-content-secondary">
                      {t('gamification.progress')}
                    </RNText>
                    <RNText className="text-ui-xs font-ui text-content-secondary">
                      {monthly.progress}/{monthly.target}
                    </RNText>
                  </View>
                  <View className="h-2 bg-bg-raised rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((monthly.progress / monthly.target) * 100, 100)}%`,
                        backgroundColor: '#F59E0B',
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </PremiumCard>
        </FadeIn>
      ) : null}

      {/* Upcoming unlocks */}
      <UpcomingUnlocksSection />
    </View>
  );
}

function IconCircle({ bg, icon, color }: { bg: string; icon: string; color: string }) {
  return (
    <View
      className="w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: bg }}
    >
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
  );
}
