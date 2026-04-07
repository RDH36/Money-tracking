export interface BadgeDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_expense',
    nameKey: 'gamification.badgeFirstExpense',
    descriptionKey: 'gamification.badgeFirstExpenseDesc',
    icon: 'receipt-outline',
    color: '#22C55E',
  },
  {
    id: 'streak_3',
    nameKey: 'gamification.badgeStreak3',
    descriptionKey: 'gamification.badgeStreak3Desc',
    icon: 'flame-outline',
    color: '#F97316',
  },
  {
    id: 'streak_7',
    nameKey: 'gamification.badgeStreak7',
    descriptionKey: 'gamification.badgeStreak7Desc',
    icon: 'flame',
    color: '#EF4444',
  },
  {
    id: 'streak_30',
    nameKey: 'gamification.badgeStreak30',
    descriptionKey: 'gamification.badgeStreak30Desc',
    icon: 'bonfire',
    color: '#DC2626',
  },
  {
    id: 'xp_500',
    nameKey: 'gamification.badgeXP500',
    descriptionKey: 'gamification.badgeXP500Desc',
    icon: 'star-outline',
    color: '#EAB308',
  },
  {
    id: 'level_5',
    nameKey: 'gamification.badgeLevel5',
    descriptionKey: 'gamification.badgeLevel5Desc',
    icon: 'star',
    color: '#A855F7',
  },
  {
    id: 'transactions_50',
    nameKey: 'gamification.badgeTransactions50',
    descriptionKey: 'gamification.badgeTransactions50Desc',
    icon: 'layers-outline',
    color: '#3B82F6',
  },
  // --- Regularity ---
  { id: 'streak_14', nameKey: 'gamification.badgeStreak14', descriptionKey: 'gamification.badgeStreak14Desc', icon: 'flame', color: '#F59E0B' },
  { id: 'streak_60', nameKey: 'gamification.badgeStreak60', descriptionKey: 'gamification.badgeStreak60Desc', icon: 'bonfire', color: '#B45309' },
  { id: 'streak_100', nameKey: 'gamification.badgeStreak100', descriptionKey: 'gamification.badgeStreak100Desc', icon: 'flash', color: '#7C2D12' },
  { id: 'early_bird', nameKey: 'gamification.badgeEarlyBird', descriptionKey: 'gamification.badgeEarlyBirdDesc', icon: 'sunny-outline', color: '#FBBF24' },
  { id: 'night_owl', nameKey: 'gamification.badgeNightOwl', descriptionKey: 'gamification.badgeNightOwlDesc', icon: 'moon-outline', color: '#6366F1' },
  { id: 'weekend_warrior', nameKey: 'gamification.badgeWeekendWarrior', descriptionKey: 'gamification.badgeWeekendWarriorDesc', icon: 'calendar-outline', color: '#EC4899' },
  // --- Financial mastery ---
  { id: 'budget_keeper', nameKey: 'gamification.badgeBudgetKeeper', descriptionKey: 'gamification.badgeBudgetKeeperDesc', icon: 'shield-checkmark-outline', color: '#10B981' },
  { id: 'budget_master', nameKey: 'gamification.badgeBudgetMaster', descriptionKey: 'gamification.badgeBudgetMasterDesc', icon: 'shield-checkmark', color: '#059669' },
  { id: 'budget_legend', nameKey: 'gamification.badgeBudgetLegend', descriptionKey: 'gamification.badgeBudgetLegendDesc', icon: 'ribbon', color: '#047857' },
  { id: 'saver', nameKey: 'gamification.badgeSaver', descriptionKey: 'gamification.badgeSaverDesc', icon: 'wallet-outline', color: '#14B8A6' },
  { id: 'planner', nameKey: 'gamification.badgePlanner', descriptionKey: 'gamification.badgePlannerDesc', icon: 'clipboard-outline', color: '#8B5CF6' },
  { id: 'master_planner', nameKey: 'gamification.badgeMasterPlanner', descriptionKey: 'gamification.badgeMasterPlannerDesc', icon: 'clipboard', color: '#6D28D9' },
  // --- Exploration ---
  { id: 'category_explorer', nameKey: 'gamification.badgeCategoryExplorer', descriptionKey: 'gamification.badgeCategoryExplorerDesc', icon: 'compass-outline', color: '#06B6D4' },
  { id: 'theme_switcher', nameKey: 'gamification.badgeThemeSwitcher', descriptionKey: 'gamification.badgeThemeSwitcherDesc', icon: 'color-palette-outline', color: '#D946EF' },
  { id: 'first_custom', nameKey: 'gamification.badgeFirstCustom', descriptionKey: 'gamification.badgeFirstCustomDesc', icon: 'create-outline', color: '#F472B6' },
  // --- Volume ---
  { id: 'transactions_100', nameKey: 'gamification.badgeTransactions100', descriptionKey: 'gamification.badgeTransactions100Desc', icon: 'layers', color: '#2563EB' },
  { id: 'transactions_500', nameKey: 'gamification.badgeTransactions500', descriptionKey: 'gamification.badgeTransactions500Desc', icon: 'albums', color: '#1D4ED8' },
  { id: 'transactions_1000', nameKey: 'gamification.badgeTransactions1000', descriptionKey: 'gamification.badgeTransactions1000Desc', icon: 'library', color: '#1E3A8A' },
  { id: 'xp_1000', nameKey: 'gamification.badgeXP1000', descriptionKey: 'gamification.badgeXP1000Desc', icon: 'star-half', color: '#F59E0B' },
  { id: 'xp_5000', nameKey: 'gamification.badgeXP5000', descriptionKey: 'gamification.badgeXP5000Desc', icon: 'star', color: '#D97706' },
  { id: 'level_10', nameKey: 'gamification.badgeLevel10', descriptionKey: 'gamification.badgeLevel10Desc', icon: 'trophy-outline', color: '#A855F7' },
  { id: 'level_25', nameKey: 'gamification.badgeLevel25', descriptionKey: 'gamification.badgeLevel25Desc', icon: 'trophy', color: '#7E22CE' },
  // --- Endgame ---
  { id: 'quest_master', nameKey: 'gamification.badgeQuestMaster', descriptionKey: 'gamification.badgeQuestMasterDesc', icon: 'diamond', color: '#F59E0B' },
];

export const DAILY_CHALLENGE_TYPES = [
  'log_expense',
  'log_3_transactions',
  'check_planification',
  'log_income',
  'create_planification',
  'log_before_noon',
  'categorize_all',
  'review_budget',
  'stay_under_budget',
  'save_today',
] as const;

export type DailyChallengeType = (typeof DAILY_CHALLENGE_TYPES)[number];

export const WEEKLY_CHALLENGE_TYPES = [
  'weekly_streak',
  'weekly_budget_respect',
  'weekly_3_categories',
  'weekly_plan_validate',
  'weekly_save',
] as const;

export type WeeklyChallengeType = (typeof WEEKLY_CHALLENGE_TYPES)[number];

/** Reward XP per weekly challenge type */
export const WEEKLY_CHALLENGE_REWARDS: Record<WeeklyChallengeType, number> = {
  weekly_streak: 200,
  weekly_budget_respect: 250,
  weekly_3_categories: 150,
  weekly_plan_validate: 200,
  weekly_save: 300,
};

/** Target count per weekly challenge type (for progress display) */
export const WEEKLY_CHALLENGE_TARGETS: Record<WeeklyChallengeType, number> = {
  weekly_streak: 5,
  weekly_budget_respect: 1,
  weekly_3_categories: 3,
  weekly_plan_validate: 1,
  weekly_save: 2,
};

export const MONTHLY_CHALLENGE_TYPES = [
  'monthly_50_transactions',
  'monthly_full_budget_clean',
  'monthly_3_plans',
  'monthly_15_day_streak',
  'monthly_6_categories',
] as const;

export type MonthlyChallengeType = (typeof MONTHLY_CHALLENGE_TYPES)[number];

export const MONTHLY_CHALLENGE_REWARDS: Record<MonthlyChallengeType, number> = {
  monthly_50_transactions: 600,
  monthly_full_budget_clean: 800,
  monthly_3_plans: 500,
  monthly_15_day_streak: 700,
  monthly_6_categories: 500,
};

export const MONTHLY_CHALLENGE_TARGETS: Record<MonthlyChallengeType, number> = {
  monthly_50_transactions: 50,
  monthly_full_budget_clean: 1,
  monthly_3_plans: 3,
  monthly_15_day_streak: 15,
  monthly_6_categories: 6,
};

export const XP_VALUES = {
  OPEN_APP: 4,
  EXPENSE: 5,
  INCOME: 15,
  TRANSFER: 8,
  DAILY_CHALLENGE: 50,
  STREAK_7: 100,
  STREAK_30: 300,
} as const;

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function xpToNextLevel(currentXP: number): number {
  const level = calculateLevel(currentXP);
  return xpForLevel(level + 1) - currentXP;
}

export function xpProgress(currentXP: number): number {
  const level = calculateLevel(currentXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range === 0) return 0;
  return (currentXP - currentLevelXP) / range;
}
