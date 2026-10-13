// src/store/useUserStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import dummyData from "@/data/dummyData.json";
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
  setStageStars: (stageId: string, stars: number) => void;
  isStageUnlocked: (chapterId: number, stageId: string) => boolean;
  isChapterUnlocked: (chapterXpRequired: number) => boolean;
  getStageStars: (stageId: string) => number;

  markStageComplete: (stageId: string, xpEarned?: number) => void;
  isStageCompleted: (stageId: string) => boolean;
  unlockAchievement: (id: string) => void;
  dismissPendingAchievement: () => void;
  checkAndUnlockAchievements: (context: {
    justCompletedStageId?: string;
    justCompletedStars?: number;
    allCorrect?: boolean;
    completedChapterIds?: string[];
    language?: string;
    completedLangs?: string[];
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
        if (!ch || get().xp < ch.xpRequired) return false;
        return get().stageUnlocked[stageId] ?? false;
      },

      getStageStars: (stageId) => get().stageStars[stageId] ?? 0,

      markStageComplete: (stageId) =>
        set((s) => ({ completedStages: { ...s.completedStages, [stageId]: true } })),

      isStageCompleted: (stageId) => get().completedStages[stageId] === true,

      unlockAchievement: (id) => {
        if (get().unlockedAchievements.some((a) => a.id === id)) return;
        set((s) => ({
          unlockedAchievements: [...s.unlockedAchievements, { id, unlockedAt: Date.now() }],
          pendingAchievements: [...s.pendingAchievements, id],
        }));
      },

      dismissPendingAchievement: () =>
        set((s) => ({ pendingAchievements: s.pendingAchievements.slice(1) })),

      // ── LOGIKA UNLOCK YANG SUDAH DIPERBAIKI TOTAL ──
      checkAndUnlockAchievements: (ctx) => {
        const { unlockedAchievements, xp, streak, combo, unlockAchievement } = get();
        const has = (id: string) => unlockedAchievements.some((a) => a.id === id);
        const lang = ctx.language ?? "en";
        const now = new Date();
        const hour = now.getHours();

        const langStore = useLanguageStore.getState();

        // Hitung progres akurat dari semua bahasa (termasuk yang baru saja ditamatkan di sesi ini)
        let enCompleted = Object.values(get().completedStages).filter(Boolean).length;
        let jaCompleted = Object.values(langStore.progress['ja']?.completedStages || {}).filter(Boolean).length;
        let zhCompleted = Object.values(langStore.progress['zh']?.completedStages || {}).filter(Boolean).length;
        let koCompleted = Object.values(langStore.progress['ko']?.completedStages || {}).filter(Boolean).length;

        if (ctx.justCompletedStageId) {
          if (lang === 'en' && !get().completedStages[ctx.justCompletedStageId]) enCompleted++;
          if (lang === 'ja' && !langStore.progress['ja']?.completedStages?.[ctx.justCompletedStageId]) jaCompleted++;
          if (lang === 'zh' && !langStore.progress['zh']?.completedStages?.[ctx.justCompletedStageId]) zhCompleted++;
          if (lang === 'ko' && !langStore.progress['ko']?.completedStages?.[ctx.justCompletedStageId]) koCompleted++;
        }

        const globalCompleted = enCompleted + jaCompleted + zhCompleted + koCompleted;

        // Bintang
        let currentStageStars: Record<string, number> = {};
        if (lang === "en") currentStageStars = { ...get().stageStars };
        else currentStageStars = { ...(langStore.progress[lang]?.stageStars || {}) };
        
        if (ctx.justCompletedStageId && ctx.justCompletedStars) {
           currentStageStars[ctx.justCompletedStageId] = Math.max(currentStageStars[ctx.justCompletedStageId] || 0, ctx.justCompletedStars);
        }
        const langStars3 = Object.values(currentStageStars).filter((s) => s >= 3).length;

        // 1. General & Mastery
        if (!has("first_blood") && globalCompleted >= 1) unlockAchievement("first_blood");
        if (!has("scholar") && globalCompleted >= 5) unlockAchievement("scholar");
        if (!has("bookworm") && globalCompleted >= 15) unlockAchievement("bookworm");
        if (!has("graduate") && globalCompleted >= 30) unlockAchievement("graduate");

        if (!has("hat_trick") && ctx.justCompletedStars === 3) unlockAchievement("hat_trick");
        if (!has("perfectionist") && ctx.allCorrect) unlockAchievement("perfectionist");
        if (!has("speedrun") && ctx.allCorrect) unlockAchievement("speedrun");
        if (!has("combo_master") && combo >= 5) unlockAchievement("combo_master");
        
        // Explorer (13 stage = setidaknya sudah menyentuh chapter 3 jika per chapter 6 stage)
        if (!has("explorer") && globalCompleted >= 13) unlockAchievement("explorer");
        
        // Polyglot (Selesaikan minimal 1 stage di 3 bahasa berbeda)
        const activeLangs = [enCompleted, jaCompleted, zhCompleted, koCompleted].filter(c => c > 0).length;
        if (!has("polyglot") && activeLangs >= 3) unlockAchievement("polyglot");
        
        if (!has("night_owl") && hour >= 22) unlockAchievement("night_owl");
        if (!has("early_bird") && hour < 7) unlockAchievement("early_bird");

        // 2. XP & Streak
        if (!has("xp_100") && xp >= 100) unlockAchievement("xp_100");
        if (!has("xp_500") && xp >= 500) unlockAchievement("xp_500");
        if (!has("xp_1500") && xp >= 1500) unlockAchievement("xp_1500");
        if (!has("xp_3000") && xp >= 3000) unlockAchievement("xp_3000");
        if (!has("xp_6000") && xp >= 6000) unlockAchievement("xp_6000");

        if (!has("streak_3") && streak >= 3) unlockAchievement("streak_3");
        if (!has("on_fire") && streak >= 7) unlockAchievement("on_fire");
        if (!has("dedicated") && streak >= 30) unlockAchievement("dedicated");

        // 3. Language Specific Mastery (Kini meng-cover "Master" untuk setiap bahasa)
        if (lang === "en") {
          if (!has("en_first")) unlockAchievement("en_first");
          if (!has("en_chapter1") && ctx.completedChapterIds?.includes("1")) unlockAchievement("en_chapter1");
          if (!has("en_all_stars") && langStars3 >= 5) unlockAchievement("en_all_stars");
          if (!has("en_master") && enCompleted >= 30) unlockAchievement("en_master");
        }
        if (lang === "ja") {
          if (!has("ja_first")) unlockAchievement("ja_first");
          if (!has("ja_hiragana") && ctx.completedChapterIds?.includes("1")) unlockAchievement("ja_hiragana");
          if (!has("ja_all_stars") && langStars3 >= 5) unlockAchievement("ja_all_stars");
          if (!has("ja_master") && jaCompleted >= 30) unlockAchievement("ja_master");
        }
        if (lang === "zh") {
          if (!has("zh_first")) unlockAchievement("zh_first");
          if (!has("zh_pinyin") && ctx.completedChapterIds?.includes("1")) unlockAchievement("zh_pinyin");
          if (!has("zh_all_stars") && langStars3 >= 5) unlockAchievement("zh_all_stars");
          if (!has("zh_master") && zhCompleted >= 30) unlockAchievement("zh_master");
        }
        if (lang === "ko") {
          if (!has("ko_first")) unlockAchievement("ko_first");
          if (!has("ko_hangul") && ctx.completedChapterIds?.includes("1")) unlockAchievement("ko_hangul");
          if (!has("ko_all_stars") && langStars3 >= 5) unlockAchievement("ko_all_stars");
          if (!has("ko_master") && koCompleted >= 30) unlockAchievement("ko_master");
        }
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
        unlockedAchievements: s.unlockedAchievements,
        dailyStats: s.dailyStats,
      }),
    },
  ),
);