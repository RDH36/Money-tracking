import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { useGamification, useWeeklyChallenge, useMonthlyChallenge } from '@/hooks';
import { useUnlocksStore } from '@/stores/unlocksStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { UNLOCK_KEYS } from '@/lib/gamification/unlocks';
import { ChallengeCard } from './ChallengeCard';

const dailyKey: Record<string, string> = {
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
const weeklyKey: Record<string, string> = {
  weekly_streak: 'gamification.weeklyStreak',
  weekly_budget_respect: 'gamification.weeklyBudgetRespect',
  weekly_3_categories: 'gamification.weekly3Categories',
  weekly_plan_validate: 'gamification.weeklyPlanValidate',
  weekly_save: 'gamification.weeklySave',
};
const monthlyKey: Record<string, string> = {
  monthly_50_transactions: 'gamification.monthly50Tx',
  monthly_full_budget_clean: 'gamification.monthlyBudgetClean',
  monthly_3_plans: 'gamification.monthly3Plans',
  monthly_15_day_streak: 'gamification.monthly15DayStreak',
  monthly_6_categories: 'gamification.monthly6Categories',
};

interface UpcomingEntry {
  key: string;
  titleKey: string;
  descKey: string;
  current: number;
  target: number;
}

function buildUnlocks(longestStreak: number, badgesCount: number): UpcomingEntry[] {
  return [
    { key: UNLOCK_KEYS.STREAK_FREEZE_PLUS_1, titleKey: 'unlock.freezeTitle', descKey: 'unlock.reqStreak14', current: Math.min(longestStreak, 14), target: 14 },
    { key: UNLOCK_KEYS.THEME_GOLD, titleKey: 'unlock.themeGold', descKey: 'unlock.reqStreak60', current: Math.min(longestStreak, 60), target: 60 },
    { key: UNLOCK_KEYS.THEME_PLATINUM, titleKey: 'unlock.themePlatinum', descKey: 'unlock.reqStreak100', current: Math.min(longestStreak, 100), target: 100 },
    { key: UNLOCK_KEYS.THEME_PRISM, titleKey: 'unlock.themePrism', descKey: 'unlock.reqBadges25', current: Math.min(badgesCount, 25), target: 25 },
  ];
}

interface ChallengesSectionProps {
  onViewAllUnlocks?: () => void;
}

export function ChallengesSection({ onViewAllUnlocks }: ChallengesSectionProps = {}) {
  const v2 = useV2();
  const { t } = useTranslation();
  const gamification = useGamification();
  const weekly = useWeeklyChallenge();
  const monthly = useMonthlyChallenge();
  const unlocks = useUnlocksStore((s) => s.unlocks);
  const longestStreak = useGamificationStore((s) => s.longestStreak);
  const badgesCount = useGamificationStore((s) => s.badges.length);

  const dailyDone = gamification.dailyChallengeCompleted;
  const weeklyDone = weekly.weeklyChallengeCompleted;
  const monthlyDone = monthly.monthlyChallengeCompleted;

  const upcomingEntries = buildUnlocks(longestStreak, badgesCount)
    .filter((e) => !unlocks.has(e.key))
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 3);

  return (
    <View style={{ gap: 10 }}>
      {gamification.dailyChallengeType ? (
        <ChallengeCard
          kind={dailyDone ? t('achievements.kindDailyDone') : t('achievements.kindDaily')}
          label={t(dailyKey[gamification.dailyChallengeType] || '')}
          xp={50}
          color="#EAB308"
          icon="receipt-outline"
          completed={dailyDone}
        />
      ) : null}

      {weekly.weeklyChallengeType ? (
        <ChallengeCard
          kind={weeklyDone ? t('achievements.kindWeeklyDone') : t('achievements.kindWeekly')}
          label={t(weeklyKey[weekly.weeklyChallengeType] || '')}
          xp={weekly.reward}
          color="#8B5CF6"
          icon="calendar-outline"
          completed={weeklyDone}
          progress={weekly.progress}
          target={weekly.target}
        />
      ) : null}

      {monthly.monthlyChallengeType ? (
        <ChallengeCard
          kind={monthlyDone ? t('achievements.kindMonthlyDone') : t('achievements.kindMonthly')}
          label={t(monthlyKey[monthly.monthlyChallengeType] || '')}
          xp={monthly.reward}
          color="#F59E0B"
          icon="ribbon-outline"
          completed={monthlyDone}
          progress={monthly.progress}
          target={monthly.target}
        />
      ) : null}

      {upcomingEntries.length > 0 ? (
        <UpcomingUnlocks v2={v2} t={t} entries={upcomingEntries} onViewAll={onViewAllUnlocks} />
      ) : null}
    </View>
  );
}

interface UpcomingProps {
  v2: ReturnType<typeof useV2>;
  t: (k: string, p?: any) => string;
  entries: UpcomingEntry[];
  onViewAll?: () => void;
}
function UpcomingUnlocks({ v2, t, entries, onViewAll }: UpcomingProps) {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, marginBottom: 10 }}>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 1.6, textTransform: 'uppercase', color: v2.inkSubtle,
          }}
        >
          {t('achievements.upcomingUnlocks')}
        </Text>
        {onViewAll ? (
          <Pressable hitSlop={6} onPress={onViewAll}>
            <Text style={{ fontFamily: v2.fontUI, fontSize: 11, fontWeight: '600', color: v2.brand }}>
              {t('achievements.viewAll')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ backgroundColor: v2.bgSurface, borderWidth: 1, borderColor: v2.hairline, borderRadius: 18, padding: 4 }}>
        {entries.map((e, i) => {
          const remaining = e.target - e.current;
          const close = remaining <= 3;
          const isLast = i === entries.length - 1;
          return (
            <View
              key={e.key}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 12, paddingHorizontal: 12,
                borderBottomWidth: isLast ? 0 : 1, borderBottomColor: v2.hairline,
              }}
            >
              <View
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: close ? v2.brandSoft : 'rgba(15,19,17,0.06)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={close ? 'sparkles' : 'lock-closed-outline'}
                  size={14}
                  color={close ? v2.brand : v2.inkSubtle}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.ink }}>
                  {t(e.titleKey)}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1 }}>
                  {t(e.descKey)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '700', color: close ? v2.brand : v2.inkMuted, fontVariant: ['tabular-nums'] }}>
                  {e.current}/{e.target}
                </Text>
                <Text style={{ fontFamily: v2.fontUI, fontSize: 10, color: v2.inkSubtle, marginTop: 1 }}>
                  {close ? t('achievements.veryClose') : t('achievements.toReach')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
