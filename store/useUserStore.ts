// src/store/useUserStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import dummyData from "@/data/dummyData.json";
import jaData from "@/data/jaData.json";
import zhData from "@/data/zhData.json";
import koData from "@/data/koData.json";
import { useLanguageStore } from "@/store/useLanguageStore";

export interface AchievementDef {
  id: string;
  iconName: string;
  color: string;
  label: string;
  desc: string;
  category: "general" | "english" | "japanese" | "mandarin" | "korean" | "streak" | "xp" | "mastery";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "first_blood", iconName: "Zap", color: "#10b981", label: "First Step", desc: "Selesaikan stage pertamamu", category: "general", rarity: "common" },
  { id: "hat_trick", iconName: "Target", color: "#3b82f6", label: "Hat Trick", desc: "Raih bintang 3 di satu stage", category: "mastery", rarity: "rare" },
  { id: "perfectionist", iconName: "CheckCircle", color: "#a855f7", label: "Perfectionist", desc: "Jawab semua soal benar dalam satu stage", category: "mastery", rarity: "rare" },
  { id: "speedrun", iconName: "Timer", color: "#f59e0b", label: "Speed Run", desc: "Selesaikan stage tanpa satu pun jawaban salah", category: "mastery", rarity: "rare" },
  { id: "scholar", iconName: "BookOpen", color: "#60a5fa", label: "Scholar", desc: "Selesaikan 5 stage", category: "general", rarity: "common" },
  { id: "bookworm", iconName: "Library", color: "#818cf8", label: "Bookworm", desc: "Selesaikan 15 stage", category: "general", rarity: "rare" },
  { id: "graduate", iconName: "GraduationCap", color: "#c084fc", label: "Graduate", desc: "Selesaikan 30 stage", category: "general", rarity: "epic" },
  { id: "combo_master", iconName: "Flame", color: "#ef4444", label: "Combo Master", desc: "Capai combo ×5 dalam satu sesi", category: "mastery", rarity: "rare" },
  { id: "explorer", iconName: "Compass", color: "#14b8a6", label: "Explorer", desc: "Selesaikan stage di 3 chapter berbeda", category: "general", rarity: "rare" },
  { id: "polyglot", iconName: "Globe", color: "#f97316", label: "Polyglot", desc: "Aktifkan 3 bahasa berbeda", category: "general", rarity: "epic" },
  { id: "night_owl", iconName: "Moon", color: "#818cf8", label: "Night Owl", desc: "Selesaikan stage setelah pukul 22:00", category: "general", rarity: "common" },
  { id: "early_bird", iconName: "Sunrise", color: "#fb923c", label: "Early Bird", desc: "Selesaikan stage sebelum pukul 07:00", category: "general", rarity: "common" },
  { id: "xp_100", iconName: "Sprout", color: "#34d399", label: "Seedling", desc: "Kumpulkan 100 XP", category: "xp", rarity: "common" },
  { id: "xp_500", iconName: "Star", color: "#10b981", label: "Rising Star", desc: "Kumpulkan 500 XP", category: "xp", rarity: "common" },
  { id: "xp_1500", iconName: "Gem", color: "#3b82f6", label: "Diamond", desc: "Kumpulkan 1.500 XP", category: "xp", rarity: "rare" },
  { id: "xp_3000", iconName: "Crown", color: "#f59e0b", label: "Legend", desc: "Kumpulkan 3.000 XP", category: "xp", rarity: "epic" },
  { id: "xp_6000", iconName: "Trophy", color: "#ec4899", label: "Grand Master", desc: "Kumpulkan 6.000 XP", category: "xp", rarity: "legendary" },
  { id: "streak_3", iconName: "Flame", color: "#f97316", label: "On a Roll", desc: "Streak 3 hari berturut-turut", category: "streak", rarity: "common" },
  { id: "on_fire", iconName: "Flame", color: "#ef4444", label: "On Fire", desc: "Streak 7 hari berturut-turut", category: "streak", rarity: "rare" },
  { id: "dedicated", iconName: "CalendarCheck", color: "#a855f7", label: "Dedicated", desc: "Streak 30 hari belajar", category: "streak", rarity: "legendary" },
  { id: "en_first", iconName: "Languages", color: "#3b82f6", label: "Hello World", desc: "Selesaikan stage pertama Bahasa Inggris", category: "english", rarity: "common" },
  { id: "en_chapter1", iconName: "BookMarked", color: "#60a5fa", label: "English Chapter I", desc: "Selesaikan semua stage di Chapter 1 Inggris", category: "english", rarity: "rare" },
  { id: "en_all_stars", iconName: "Stars", color: "#93c5fd", label: "English All-Stars", desc: "Raih bintang 3 di 5 stage Inggris", category: "english", rarity: "epic" },
  { id: "en_master", iconName: "Shield", color: "#1d4ed8", label: "English Master", desc: "Selesaikan semua chapter Bahasa Inggris", category: "english", rarity: "legendary" },
  { id: "ja_first", iconName: "Languages", color: "#f43f5e", label: "はじめまして", desc: "Selesaikan stage pertama Bahasa Jepang", category: "japanese", rarity: "common" },
  { id: "ja_hiragana", iconName: "PenLine", color: "#fb7185", label: "Hiragana Hero", desc: "Selesaikan semua stage di Chapter 1 Jepang", category: "japanese", rarity: "rare" },
  { id: "ja_all_stars", iconName: "Sparkles", color: "#fda4af", label: "Sakura Stars", desc: "Raih bintang 3 di 5 stage Jepang", category: "japanese", rarity: "epic" },
  { id: "ja_master", iconName: "Sword", color: "#e11d48", label: "Samurai Scholar", desc: "Selesaikan semua chapter Bahasa Jepang", category: "japanese", rarity: "legendary" },
  { id: "zh_first", iconName: "Languages", color: "#f59e0b", label: "你好世界", desc: "Selesaikan stage pertama Bahasa Mandarin", category: "mandarin", rarity: "common" },
  { id: "zh_pinyin", iconName: "PenTool", color: "#fbbf24", label: "Pinyin Pro", desc: "Selesaikan semua stage di Chapter 1 Mandarin", category: "mandarin", rarity: "rare" },
  { id: "zh_all_stars", iconName: "Sparkles", color: "#fcd34d", label: "Dragon Stars", desc: "Raih bintang 3 di 5 stage Mandarin", category: "mandarin", rarity: "epic" },
  { id: "zh_master", iconName: "Mountain", color: "#d97706", label: "Dragon Scholar", desc: "Selesaikan semua chapter Bahasa Mandarin", category: "mandarin", rarity: "legendary" },
  { id: "ko_first", iconName: "Languages", color: "#8b5cf6", label: "안녕하세요", desc: "Selesaikan stage pertama Bahasa Korea", category: "korean", rarity: "common" },
  { id: "ko_hangul", iconName: "PenLine", color: "#a78bfa", label: "Hangul Hero", desc: "Selesaikan semua stage di Chapter 1 Korea", category: "korean", rarity: "rare" },
  { id: "ko_all_stars", iconName: "Sparkles", color: "#c4b5fd", label: "K-Stars", desc: "Raih bintang 3 di 5 stage Korea", category: "korean", rarity: "epic" },
  { id: "ko_master", iconName: "Shield", color: "#7c3aed", label: "Hallyu Scholar", desc: "Selesaikan semua chapter Bahasa Korea", category: "korean", rarity: "legendary" },
];

/** The chapters of each language (from the lesson data), so chapter and "master" achievements follow the real content */
type ChapterData = { id: number | string; stages: { id: string }[] }[];
const ACHIEVEMENT_LANGS = ["en", "ja", "zh", "ko"] as const;
const LANG_CHAPTERS: Record<(typeof ACHIEVEMENT_LANGS)[number], ChapterData> = {
  en: (dummyData as { chapters: ChapterData }).chapters,
  ja: (jaData as { chapters: ChapterData }).chapters,
  zh: (zhData as { chapters: ChapterData }).chapters,
  ko: (koData as { chapters: ChapterData }).chapters,
};
const CHAPTER_ONE_ACHIEVEMENT: Record<(typeof ACHIEVEMENT_LANGS)[number], string> = { en: "en_chapter1", ja: "ja_hiragana", zh: "zh_pinyin", ko: "ko_hangul" };

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

export interface DailyStats {
  date: string;
  stagesCompleted: number;
  questionsAnswered: number;
  materialsRead: number;
  claimed: Record<string, boolean>;
}

interface UserState {
  xp: number;
  streak: number;
  lastStreakDate: string | null;
  combo: number;
  stageStars: Record<string, number>;
  stageUnlocked: Record<string, boolean>;
  completedStages: Record<string, boolean>;
  /** Chapter the placement test started the learner at (its chapters are open without the XP); 0 = no test */
  placedChapter: number;
  unlockedAchievements: UnlockedAchievement[];
  pendingAchievements: string[];
  
  dailyStats: DailyStats;

  setXP: (xp: number) => void;
  setStreak: (streak: number) => void;
  updateStreak: () => boolean;
  addXp: (amount: number, saveToCloud?: boolean) => void;
  incrementCombo: () => void;
  resetCombo: () => void;

  incrementDailyStage: () => void;
  incrementDailyQuestion: () => void;
  incrementDailyMaterial: () => void;
  /** true jika target ini baru saja diklaim (belum pernah hari ini) */
  claimDailyReward: (taskId: string) => boolean;

  unlockStage: (stageId: string) => void;
  setPlacedChapter: (chapter: number) => void;
  setStageStars: (stageId: string, stars: number) => void;
  isStageUnlocked: (chapterId: number, stageId: string) => boolean;
  isChapterUnlocked: (chapterXpRequired: number) => boolean;
  getStageStars: (stageId: string) => number;

  markStageComplete: (stageId: string, xpEarned?: number) => void;
  isStageCompleted: (stageId: string) => boolean;
  /** `silent`: unlocked without the popup (e.g. found again from saved progress on app start) */
  unlockAchievement: (id: string, silent?: boolean) => void;
  dismissPendingAchievement: () => void;
  checkAndUnlockAchievements: (context?: {
    /** A stage was just finished (for the time-of-day achievements) */
    stageFinished?: boolean;
    justCompletedStars?: number;
    allCorrect?: boolean;
    /** Unlock without popups */
    silent?: boolean;
  }) => void;

  unlockAll: () => void;
  reset: () => void;
  setXpDirect: (xp: number) => void;
}

function buildInitialUnlocks(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  const chapters = (dummyData as any).chapters;
  if (!chapters) return map;
  chapters.forEach((ch: any, ci: number) => {
    ch.stages.forEach((st: any, si: number) => {
      map[st.id] = ci === 0 && si === 0;
    });
  });
  return map;
}

const getTodayStr = () => new Date().toDateString();
const initialDailyStats: DailyStats = { date: getTodayStr(), stagesCompleted: 0, questionsAnswered: 0, materialsRead: 0, claimed: {} };

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      lastStreakDate: null,
      combo: 0,
      stageStars: {},
      stageUnlocked: buildInitialUnlocks(),
      completedStages: {},
      placedChapter: 0,
      unlockedAchievements: [],
      pendingAchievements: [],
      
      dailyStats: initialDailyStats,

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
      incrementCombo: () => set((s) => ({ combo: s.combo + 1 })),
      resetCombo: () => set({ combo: 0 }),
      setXP: (xp) => set({ xp }),
      setStreak: (streak) => set({ streak }),

      updateStreak: () => {
        const todayStr = getTodayStr();
        const { lastStreakDate, streak } = get();

        if (lastStreakDate === todayStr) return false;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = 1;
        if (lastStreakDate === yesterdayStr) {
          newStreak = streak + 1;
        }

        set({ streak: newStreak, lastStreakDate: todayStr });
        return true; 
      },

      incrementDailyStage: () => set((s) => {
        const today = getTodayStr();
        const stats = s.dailyStats.date === today ? s.dailyStats : initialDailyStats;
        return { dailyStats: { ...stats, stagesCompleted: stats.stagesCompleted + 1, date: today } };
      }),
      incrementDailyQuestion: () => set((s) => {
        const today = getTodayStr();
        const stats = s.dailyStats.date === today ? s.dailyStats : initialDailyStats;
        return { dailyStats: { ...stats, questionsAnswered: stats.questionsAnswered + 1, date: today } };
      }),
      incrementDailyMaterial: () => set((s) => {
        const today = getTodayStr();
        const stats = s.dailyStats.date === today ? s.dailyStats : initialDailyStats;
        return { dailyStats: { ...stats, materialsRead: stats.materialsRead + 1, date: today } };
      }),
      // Hanya menandai target sudah diklaim; XP-nya ditambahkan pemanggil lewat useProgress().addXp,
      // supaya masuk ke bahasa yang sedang dipelajari dan ikut tersimpan ke leaderboard
      claimDailyReward: (taskId) => {
        const s = get();
        if (s.dailyStats.date !== getTodayStr()) return false;
        if (s.dailyStats.claimed[taskId]) return false;
        set({ dailyStats: { ...s.dailyStats, claimed: { ...s.dailyStats.claimed, [taskId]: true } } });
        return true;
      },

      reset: () => set({
        xp: 0,
        streak: 0,
        lastStreakDate: null,
        combo: 0,
        stageStars: {},
        stageUnlocked: buildInitialUnlocks(),
        completedStages: {},
        placedChapter: 0,
        unlockedAchievements: [],
        pendingAchievements: [],
        dailyStats: initialDailyStats,
      }),

      setXpDirect: (xp) => set({ xp }),

      unlockStage: (stageId) => {
        set((s) => {
          const newUnlocked = { ...s.stageUnlocked, [stageId]: true };
          const chapters = (dummyData as any).chapters;
          if (!chapters) return { stageUnlocked: newUnlocked };
          let ci = -1, si = -1;
          for (let i = 0; i < chapters.length; i++) {
            const j = chapters[i].stages.findIndex((st: any) => st.id === stageId);
            if (j !== -1) { ci = i; si = j; break; }
          }
          if (ci === -1) return { stageUnlocked: newUnlocked };
          const ch = chapters[ci];
          const nextInCh = ch.stages[si + 1];
          if (nextInCh) {
            newUnlocked[nextInCh.id] = true;
            return { stageUnlocked: newUnlocked };
          }
          const allDone = ch.stages.every((st: any) => newUnlocked[st.id] === true);
          if (allDone) {
            const nextCh = chapters[ci + 1];
            if (nextCh?.stages.length > 0) newUnlocked[nextCh.stages[0].id] = true;
          }
          return { stageUnlocked: newUnlocked };
        });
      },

      setPlacedChapter: (chapter) => set({ placedChapter: chapter }),

      setStageStars: (stageId, stars) => {
        set((s) => {
          const cur = s.stageStars[stageId] ?? 0;
          if (stars <= cur) return s;
          return { stageStars: { ...s.stageStars, [stageId]: stars } };
        });
      },

      isChapterUnlocked: (xpReq) => get().xp >= xpReq,

      isStageUnlocked: (chapterId, stageId) => {
        const chapters = (dummyData as any).chapters;
        if (!chapters) return false;
        const ch = chapters.find((c: any) => c.id === chapterId);
        if (!ch || (get().xp < ch.xpRequired && get().placedChapter < ch.id)) return false;
        return get().stageUnlocked[stageId] ?? false;
      },

      getStageStars: (stageId) => get().stageStars[stageId] ?? 0,

      markStageComplete: (stageId) =>
        set((s) => ({ completedStages: { ...s.completedStages, [stageId]: true } })),

      isStageCompleted: (stageId) => get().completedStages[stageId] === true,

      unlockAchievement: (id, silent = false) => {
        if (get().unlockedAchievements.some((a) => a.id === id)) return;
        set((s) => ({
          unlockedAchievements: [...s.unlockedAchievements, { id, unlockedAt: Date.now() }],
          pendingAchievements: silent ? s.pendingAchievements : [...s.pendingAchievements, id],
        }));
      },

      dismissPendingAchievement: () =>
        set((s) => ({ pendingAchievements: s.pendingAchievements.slice(1) })),

      // Achievements are worked out from ALL saved progress (every language), not only from the stage that was
      // just finished: progress from before an achievement existed, restored from the cloud, or finished as a replay
      // still counts. Called after each finished stage (with what happened in it) and on app start (silent).
      checkAndUnlockAchievements: (ctx = {}) => {
        const s = get();
        const langStore = useLanguageStore.getState();
        const unlock = (id: string) => s.unlockAchievement(id, ctx.silent);
        let totalCompleted = 0;
        let totalXp = 0;
        let langsStarted = 0;
        let chaptersStarted = 0;
        let anyThreeStars = false;

        for (const lang of ACHIEVEMENT_LANGS) {
          const p = lang === "en"
            ? { xp: s.xp, completed: s.completedStages, stars: s.stageStars }
            : { xp: langStore.progress[lang]?.xp ?? 0, completed: langStore.progress[lang]?.completedStages ?? {}, stars: langStore.progress[lang]?.stageStars ?? {} };
          const chapters = LANG_CHAPTERS[lang];
          const done = (id: string) => p.completed[id] === true;
          const stages = chapters.flatMap((c) => c.stages.map((st) => st.id));
          const completed = stages.filter(done).length;
          const threeStars = Object.values(p.stars).filter((v) => v >= 3).length;

          totalCompleted += completed;
          totalXp += p.xp;
          if (completed > 0) langsStarted++;
          chaptersStarted += chapters.filter((c) => c.stages.some((st) => done(st.id))).length;
          if (threeStars > 0) anyThreeStars = true;

          // Per language: first stage, all of chapter 1, 3 stars on 5 stages, every stage of the language
          if (completed >= 1) unlock(`${lang}_first`);
          if (chapters[0]?.stages.length && chapters[0].stages.every((st) => done(st.id))) unlock(CHAPTER_ONE_ACHIEVEMENT[lang]);
          if (threeStars >= 5) unlock(`${lang}_all_stars`);
          if (stages.length > 0 && completed === stages.length) unlock(`${lang}_master`);
        }

        // General
        if (totalCompleted >= 1) unlock("first_blood");
        if (totalCompleted >= 5) unlock("scholar");
        if (totalCompleted >= 15) unlock("bookworm");
        if (totalCompleted >= 30) unlock("graduate");
        if (chaptersStarted >= 3) unlock("explorer");
        if (langsStarted >= 3) unlock("polyglot");

        // Mastery: from saved stars, or from what happened in the stage just finished
        if (anyThreeStars || ctx.justCompletedStars === 3) unlock("hat_trick");
        if (ctx.allCorrect) {
          unlock("perfectionist");
          unlock("speedrun");
        }
        if (Math.max(s.combo, langStore.getCombo()) >= 5) unlock("combo_master");

        // Time of day: only when a stage was just finished
        if (ctx.stageFinished) {
          const hour = new Date().getHours();
          if (hour >= 22) unlock("night_owl");
          if (hour < 7) unlock("early_bird");
        }

        // XP (all languages together) and streak
        if (totalXp >= 100) unlock("xp_100");
        if (totalXp >= 500) unlock("xp_500");
        if (totalXp >= 1500) unlock("xp_1500");
        if (totalXp >= 3000) unlock("xp_3000");
        if (totalXp >= 6000) unlock("xp_6000");
        if (s.streak >= 3) unlock("streak_3");
        if (s.streak >= 7) unlock("on_fire");
        if (s.streak >= 30) unlock("dedicated");
      },

      unlockAll: () => {
        const chapters = (dummyData as any).chapters;
        if (!chapters) return;
        const allUnlocked: Record<string, boolean> = {};
        chapters.forEach((ch: any) => { ch.stages.forEach((st: any) => { allUnlocked[st.id] = true; }); });
        const maxXp = Math.max(...chapters.map((ch: any) => ch.xpRequired ?? 0)) + 9999;
        set({ stageUnlocked: allUnlocked, xp: maxXp });
      },
    }),
    {
      name: "langlearn-user-store-v1",
      partialize: (s) => ({
        xp: s.xp,
        combo: s.combo,
        streak: s.streak,
        lastStreakDate: s.lastStreakDate,
        stageStars: s.stageStars,
        stageUnlocked: s.stageUnlocked,
        completedStages: s.completedStages,
        placedChapter: s.placedChapter,
        unlockedAchievements: s.unlockedAchievements,
        dailyStats: s.dailyStats,
      }),
    },
  ),
);