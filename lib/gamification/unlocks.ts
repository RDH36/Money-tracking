/**
 * Unlock keys define features/bonuses unlocked by gamification.
 * Must stay in sync with RETROACTIVE_BADGE_UNLOCKS in lib/database/migrations.ts
 */

export const UNLOCK_KEYS = {
  // Slot bonuses (added on top of base limits)
  CATEGORY_SLOT_PLUS_1: 'category_slot_plus_1',
  CATEGORY_SLOT_PLUS_2: 'category_slot_plus_2',
  ACCOUNT_SLOT_PLUS_1: 'account_slot_plus_1',
  // Streak freeze bonuses (added on top of default 1)
  STREAK_FREEZE_PLUS_1: 'streak_freeze_plus_1',
  STREAK_FREEZE_PLUS_2: 'streak_freeze_plus_2',
  // Premium themes
  THEME_GOLD: 'theme_gold',
  THEME_PLATINUM: 'theme_platinum',
  THEME_MIDNIGHT: 'theme_midnight',
  THEME_RUBY: 'theme_ruby',
  THEME_EMERALD: 'theme_emerald',
  THEME_ALL_PREMIUM: 'theme_all_premium',
  THEME_PRISM: 'theme_prism',
} as const;

export type UnlockKey = (typeof UNLOCK_KEYS)[keyof typeof UNLOCK_KEYS];

/**
 * Map: badge_id → list of unlock keys granted when the badge is earned.
 * Badges not listed here are purely cosmetic.
 */
export const BADGE_UNLOCKS: Record<string, UnlockKey[]> = {
  streak_14: [UNLOCK_KEYS.STREAK_FREEZE_PLUS_1],
  streak_60: [UNLOCK_KEYS.THEME_GOLD],
  streak_100: [UNLOCK_KEYS.THEME_PLATINUM, UNLOCK_KEYS.STREAK_FREEZE_PLUS_2],
  budget_master: [UNLOCK_KEYS.CATEGORY_SLOT_PLUS_1],
  budget_legend: [UNLOCK_KEYS.CATEGORY_SLOT_PLUS_2],
  planner: [UNLOCK_KEYS.ACCOUNT_SLOT_PLUS_1],
  theme_switcher: [UNLOCK_KEYS.THEME_MIDNIGHT],
  transactions_500: [UNLOCK_KEYS.THEME_RUBY],
  level_10: [UNLOCK_KEYS.THEME_EMERALD],
  level_25: [UNLOCK_KEYS.THEME_ALL_PREMIUM],
};

/**
 * Compute bonus category slots from current unlocks.
 * Base limit (MAX_CUSTOM_CATEGORIES) is defined in schema.ts.
 */
export function getCategorySlotBonus(unlocks: Set<string>): number {
  let bonus = 0;
  if (unlocks.has(UNLOCK_KEYS.CATEGORY_SLOT_PLUS_1)) bonus += 1;
  if (unlocks.has(UNLOCK_KEYS.CATEGORY_SLOT_PLUS_2)) bonus += 1;
  return bonus;
}

export function getAccountSlotBonus(unlocks: Set<string>): number {
  return unlocks.has(UNLOCK_KEYS.ACCOUNT_SLOT_PLUS_1) ? 1 : 0;
}

export function getStreakFreezeBonus(unlocks: Set<string>): number {
  let bonus = 0;
  if (unlocks.has(UNLOCK_KEYS.STREAK_FREEZE_PLUS_1)) bonus += 1;
  if (unlocks.has(UNLOCK_KEYS.STREAK_FREEZE_PLUS_2)) bonus += 1;
  return bonus;
}
