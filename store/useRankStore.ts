import { create } from 'zustand'

export interface RankData {
  oldRank: number;
  newRank: number;
  category: string;
  languageCode: string; // ── TAMBAHKAN INI
}

interface RankStore {
  rankData: RankData | null;
  showRankUp: (data: RankData) => void;
  hideRankUp: () => void;
}

export const useRankStore = create<RankStore>((set) => ({
  rankData: null,
  showRankUp: (data) => set({ rankData: data }),
  hideRankUp: () => set({ rankData: null }),
}))