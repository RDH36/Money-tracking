import { create } from 'zustand';
import { calculateLevel, xpToNextLevel, xpProgress } from '@/constants/badges';

interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalXP: number;
  streakFreezeAvailable: number;
  streakFreezeUsedDate: string;
  dailyChallengeDate: string;
  dailyChallengeType: string;
  dailyChallengeCompleted: boolean;
  badges: string[];
  isInitialized: boolean;
  pendingLevelUp: number | null;

  setCurrentStreak: (streak: number) => void;
  setLongestStreak: (streak: number) => void;
  setLastActivityDate: (date: string) => void;
  setTotalXP: (xp: number) => void;
  setStreakFreezeAvailable: (count: number) => void;
  setStreakFreezeUsedDate: (date: string) => void;
  setDailyChallenge: (date: string, type: string, completed: boolean) => void;
  setDailyChallengeCompleted: (completed: boolean) => void;
  setBadges: (badges: string[]) => void;
  addBadge: (badgeId: string) => void;
  setPendingLevelUp: (level: number | null) => void;
  initialize: (data: GamificationData) => void;
}

export interface GamificationData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  totalXP: number;
  streakFreezeAvailable: number;
  streakFreezeUsedDate: string;
  dailyChallengeDate: string;
  dailyChallengeType: string;
  dailyChallengeCompleted: boolean;
  badges: string[];
}

export const useGamificationStore = create<GamificationState>((set) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: '',
  totalXP: 0,
  streakFreezeAvailable: 1,
  streakFreezeUsedDate: '',
  dailyChallengeDate: '',
  dailyChallengeType: '',
  dailyChallengeCompleted: false,
  badges: [],
  isInitialized: false,
  pendingLevelUp: null,

  setCurrentStreak: (streak) => set({ currentStreak: streak }),
  setLongestStreak: (streak) => set({ longestStreak: streak }),
  setLastActivityDate: (date) => set({ lastActivityDate: date }),
  setTotalXP: (xp) => set({ totalXP: xp }),
  setStreakFreezeAvailable: (count) => set({ streakFreezeAvailable: count }),
  setStreakFreezeUsedDate: (date) => set({ streakFreezeUsedDate: date }),
  setDailyChallenge: (date, type, completed) =>
    set({ dailyChallengeDate: date, dailyChallengeType: type, dailyChallengeCompleted: completed }),
  setDailyChallengeCompleted: (completed) => set({ dailyChallengeCompleted: completed }),
  setBadges: (badges) => set({ badges }),
  addBadge: (badgeId) => set((state) => ({ badges: [...state.badges, badgeId] })),
  setPendingLevelUp: (level) => set({ pendingLevelUp: level }),
  initialize: (data) => set({ ...data, isInitialized: true }),
}));

export const useCurrentStreak = () => useGamificationStore((s) => s.currentStreak);
export const useLongestStreak = () => useGamificationStore((s) => s.longestStreak);
export const useTotalXP = () => useGamificationStore((s) => s.totalXP);
export const useCurrentLevel = () => useGamificationStore((s) => calculateLevel(s.totalXP));
export const useXPToNextLevel = () => useGamificationStore((s) => xpToNextLevel(s.totalXP));
export const useXPProgress = () => useGamificationStore((s) => xpProgress(s.totalXP));
export const useEarnedBadges = () => useGamificationStore((s) => s.badges);
export const useDailyChallengeCompleted = () => useGamificationStore((s) => s.dailyChallengeCompleted);
