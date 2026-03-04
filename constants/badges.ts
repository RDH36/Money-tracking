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
];

export const DAILY_CHALLENGE_TYPES = [
  'log_expense',
  'log_3_transactions',
  'check_planification',
  'log_income',
  'create_planification',
] as const;

export type DailyChallengeType = (typeof DAILY_CHALLENGE_TYPES)[number];

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
