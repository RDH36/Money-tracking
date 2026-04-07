import { APP_VERSION } from "./app";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: "added" | "fixed" | "improved";
    key: string;
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-03-31",
    changes: [
      { type: "added", key: "changelog.budgetLimits" },
      { type: "added", key: "changelog.budgetCards" },
      { type: "added", key: "changelog.categoryDetailPage" },
      { type: "added", key: "changelog.budgetWarnings" },
      { type: "added", key: "changelog.dashboardBudgets" },
      { type: "improved", key: "changelog.settingsRedesign" },
      { type: "improved", key: "changelog.reportsWithBudget" },
      { type: "added", key: "changelog.rateAppButton" },
      // Gamification v2 — endgame overhaul
      { type: "added", key: "changelog.newBadges22" },
      { type: "added", key: "changelog.questMasterBadge" },
      { type: "added", key: "changelog.longTermQuests" },
      { type: "added", key: "changelog.epicQuests" },
      { type: "added", key: "changelog.newDailyChallenges" },
      { type: "added", key: "changelog.weeklyChallenges" },
      { type: "added", key: "changelog.monthlyChallenges" },
      { type: "added", key: "changelog.featureUnlocks" },
      { type: "added", key: "changelog.premiumThemes" },
      { type: "added", key: "changelog.featureUnlockedModal" },
      { type: "added", key: "changelog.upcomingUnlocksSection" },
      { type: "added", key: "changelog.questProgressNotif" },
      { type: "improved", key: "changelog.tabBarRefonte" },
      { type: "improved", key: "changelog.achievementsRefonte" },
      { type: "improved", key: "changelog.settingsInHeader" },
    ],
  },
  {
    version: "1.1.1",
    date: "2026-03-20",
    changes: [
      { type: "improved", key: "changelog.premiumUIRedesign" },
      { type: "added", key: "changelog.bubuleMascot" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-04",
    changes: [
      { type: "added", key: "changelog.gamificationSystem" },
      { type: "added", key: "changelog.streaksAndChallenges" },
      { type: "added", key: "changelog.badgesAndAchievements" },
      { type: "added", key: "changelog.xpAndLevels" },
      { type: "added", key: "changelog.dailyChallenges" },
      { type: "added", key: "changelog.gamificationNotifications" },
      { type: "added", key: "changelog.reportsScreen" },
      { type: "added", key: "changelog.calendarScreen" },
      { type: "added", key: "changelog.activityFilters" },
      { type: "improved", key: "changelog.reducedRedundancy" },
      { type: "fixed", key: "changelog.transferFilter" },
      { type: "fixed", key: "changelog.transferNotCountedAsExpense" },
    ],
  },
  {
    version: "1.0.6",
    date: "2025-02-26",
    changes: [
      { type: "added", key: "changelog.factoryReset" },
      { type: "added", key: "changelog.deleteTransactions" },
      { type: "added", key: "changelog.whatsNewPage" },
      { type: "added", key: "changelog.planificationGrouping" },
      { type: "added", key: "changelog.autoDeleteEmptyPlanification" },
      { type: "improved", key: "changelog.performanceOptimizations" },
      { type: "fixed", key: "changelog.instantDeleteUpdate" },
      { type: "fixed", key: "changelog.balanceRefreshAfterDelete" },
      { type: "fixed", key: "changelog.deleteCustomCategory" },
      { type: "fixed", key: "changelog.deleteModalNames" },
    ],
  },
  {
    version: "1.0.5",
    date: "2025-02-20",
    changes: [
      { type: "added", key: "changelog.darkMode" },
      { type: "added", key: "changelog.feedbackModal" },
      { type: "added", key: "changelog.multiLanguage" },
    ],
  },
  {
    version: "1.0.4",
    date: "2025-02-15",
    changes: [
      { type: "added", key: "changelog.currencyConversion" },
      { type: "added", key: "changelog.multipleAccounts" },
      { type: "added", key: "changelog.transferBetweenAccounts" },
      { type: "added", key: "changelog.planificationSystem" },
    ],
  },
];

export const CURRENT_VERSION = APP_VERSION;
