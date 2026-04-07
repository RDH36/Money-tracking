import { create } from 'zustand';

export interface QuestProgress {
  id: string;
  currentStep: number; // number of completed steps
  completedAt: string | null;
  metricValue: number; // raw current metric value (for progress bar)
}

interface QuestsState {
  quests: Record<string, QuestProgress>;
  isInitialized: boolean;

  initialize: (quests: QuestProgress[]) => void;
  setQuest: (quest: QuestProgress) => void;
}

export const useQuestsStore = create<QuestsState>((set) => ({
  quests: {},
  isInitialized: false,

  initialize: (quests) =>
    set({
      quests: Object.fromEntries(quests.map((q) => [q.id, q])),
      isInitialized: true,
    }),

  setQuest: (quest) =>
    set((state) => ({
      quests: { ...state.quests, [quest.id]: quest },
    })),
}));
