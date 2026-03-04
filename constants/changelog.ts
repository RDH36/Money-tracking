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
    version: "1.1.0",
    date: "2026-03-04",
    changes: [
      { type: "added", key: "changelog.gamificationSystem" },
      { type: "added", key: "changelog.streaksAndChallenges" },
      { type: "added", key: "changelog.badgesAndAchievements" },
      { type: "added", key: "changelog.xpAndLevels" },
      { type: "added", key: "changelog.dailyChallenges" },
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
