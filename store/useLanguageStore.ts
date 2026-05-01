// src/store/useLanguageStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ─── Language Definitions ─────────────────────────────── */
export interface LanguageDef {
  code: string;           // 'en' | 'ja'
  name: string;           // 'English'
  nameLocal: string;      // 'English' | '日本語'
  flag: string;           // country code for flag or emoji fallback
  color: string;          // accent color
  ring: string;
  available: boolean;
  description: string;
}

export const LANGUAGES: LanguageDef[] = [
  {
    code: 'en',
    name: 'English',
    nameLocal: 'English',
    flag: 'GB',
    color: '#3b82f6',
    ring: '#60a5fa',
    available: true,
    description: 'Bahasa Inggris — bahasa internasional yang paling banyak digunakan di dunia',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nameLocal: '日本語',
    flag: 'JP',
    color: '#ef4444',
    ring: '#f87171',
    available: true,
    description: 'Bahasa Jepang — bahasa yang indah dengan tiga sistem tulisan unik',
  },
  {
    code: 'zh',
    name: 'Mandarin',
    nameLocal: '普通话',
    flag: 'CN',
    description: 'Pinyin, karakter & percakapan',
    color: '#f59e0b',
    ring: '#fbbf24',
    available: true,   // ganti false jika belum siap
  },
  {
    code: 'ko',
    name: 'Korean',
    nameLocal: '한국어',
    flag: 'KR',
    description: 'Hangul & bahasa sehari-hari',
    color: '#6366f1',
    ring: '#818cf8',
    available: true,
  },
  {
    code: 'fr',
    name: 'French',
    nameLocal: 'Français',
    flag: 'FR',
    color: '#a855f7',
    ring: '#c084fc',
    available: false,
    description: 'Segera hadir',
  },
];

/* ─── Per-language progress (mirrors useUserStore shape) ── */
export interface LangProgress {
  xp: number;
  streak: number;
  combo: number;
  stageStars: Record<string, number>;
  stageUnlocked: Record<string, boolean>;
  completedStages: Record<string, boolean>;
}

function emptyProgress(): LangProgress {
  return {
    xp: 0,
    streak: 0,
    combo: 0,
    stageStars: {},
    stageUnlocked: {},
    completedStages: {},
  };
}

/* ─── Store ─────────────────────────────────────────────── */
interface LanguageState {
  /** null = not yet selected (show language picker) */
  selectedLanguage: string | null;

  /** progress keyed by language code */
  progress: Record<string, LangProgress>;

  /* actions */
  selectLanguage: (code: string) => void;
  clearLanguage: () => void;

  /* progress mutators for current language */
  addXp: (amount: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setStreak: (n: number) => void;
  unlockStage: (stageId: string, allStages: any[]) => void;
  setStageStars: (stageId: string, stars: number) => void;
  markStageComplete: (stageId: string) => void;

  /* selectors for current language */
  getXp: () => number;
  getCombo: () => number;
  getStreak: () => number;
  getStageStars: (stageId: string) => number;
  isStageUnlocked: (stageId: string, xpRequired: number) => boolean;
  isStageCompleted: (stageId: string) => boolean;
  getProgress: () => LangProgress;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      selectedLanguage: null,
      progress: {},

      selectLanguage: (code) => {
        set((s) => ({
          selectedLanguage: code,
          // init progress for this language if not exists
          progress: s.progress[code]
            ? s.progress
            : { ...s.progress, [code]: emptyProgress() },
        }));
      },

      clearLanguage: () => set({ selectedLanguage: null }),

      /* ── Internal helper: update current lang's progress ── */
      _update: (fn: (p: LangProgress) => Partial<LangProgress>) => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        const updated = { ...cur, ...fn(cur) };
        set({ progress: { ...progress, [selectedLanguage]: updated } });
      },

      addXp: (amount) => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        const updated = { ...cur, xp: cur.xp + amount };
        set({ progress: { ...progress, [selectedLanguage]: updated } });
      },

      incrementCombo: () => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        const updated = { ...cur, combo: cur.combo + 1 };
        set({ progress: { ...progress, [selectedLanguage]: updated } });
      },

      resetCombo: () => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        set({ progress: { ...progress, [selectedLanguage]: { ...cur, combo: 0 } } });
      },

      setStreak: (n) => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        set({ progress: { ...progress, [selectedLanguage]: { ...cur, streak: n } } });
      },

      unlockStage: (stageId, allStages) => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        const newUnlocked = { ...cur.stageUnlocked, [stageId]: true };

        // find next stage in allStages flat array and unlock it
        const idx = allStages.findIndex((s: any) => s.id === stageId);
        if (idx !== -1 && idx + 1 < allStages.length) {
          newUnlocked[allStages[idx + 1].id] = true;
        }

        set({
          progress: {
            ...progress,
            [selectedLanguage]: { ...cur, stageUnlocked: newUnlocked },
          },
        });
      },

      setStageStars: (stageId, stars) => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        const current = cur.stageStars[stageId] ?? 0;
        if (stars <= current) return;
        set({
          progress: {
            ...progress,
            [selectedLanguage]: {
              ...cur,
              stageStars: { ...cur.stageStars, [stageId]: stars },
            },
          },
        });
      },

      markStageComplete: (stageId) => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return;
        const cur = progress[selectedLanguage] ?? emptyProgress();
        set({
          progress: {
            ...progress,
            [selectedLanguage]: {
              ...cur,
              completedStages: { ...cur.completedStages, [stageId]: true },
            },
          },
        });
      },

      /* ── Selectors ── */
      getProgress: () => {
        const { selectedLanguage, progress } = get();
        if (!selectedLanguage) return emptyProgress();
        return progress[selectedLanguage] ?? emptyProgress();
      },

      getXp: () => get().getProgress().xp,
      getCombo: () => get().getProgress().combo,
      getStreak: () => get().getProgress().streak,
      getStageStars: (stageId) => get().getProgress().stageStars[stageId] ?? 0,

      isStageUnlocked: (stageId, xpRequired) => {
        const p = get().getProgress();
        if (p.xp < xpRequired) return false;
        return p.stageUnlocked[stageId] ?? false;
      },

      isStageCompleted: (stageId) => {
        return get().getProgress().completedStages[stageId] === true;
      },
    }),
    {
      name: 'lingora-language-store-v5',
      partialize: (s) => ({
        selectedLanguage: s.selectedLanguage,
        progress: s.progress,
      }),
    }
  )
);