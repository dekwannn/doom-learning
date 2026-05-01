// src/store/useUserStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import dummyData from "@/data/dummyData.json";

/* ─── Achievement definitions ──────────────────────────────────────────────
   iconName = nama komponen Lucide (import dinamis di AchievementPopup/profile)
   category = untuk grouping di profile page
   rarity   = common | rare | epic | legendary
────────────────────────────────────────────────────────────────────────── */
export interface AchievementDef {
  id: string;
  iconName: string; // Lucide icon component name, e.g. 'Zap', 'Trophy', 'Star'
  color: string; // warna aksen ikon
  label: string;
  desc: string;
  category:
    | "general"
    | "english"
    | "japanese"
    | "mandarin"
    | "korean"
    | "streak"
    | "xp"
    | "mastery";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  /* ── General / Onboarding ─────────────────────────────────────────── */
  {
    id: "first_blood",
    iconName: "Zap",
    color: "#10b981",
    label: "First Step",
    desc: "Selesaikan stage pertamamu",
    category: "general",
    rarity: "common",
  },
  {
    id: "hat_trick",
    iconName: "Target",
    color: "#3b82f6",
    label: "Hat Trick",
    desc: "Raih bintang 3 di satu stage",
    category: "mastery",
    rarity: "rare",
  },
  {
    id: "perfectionist",
    iconName: "CheckCircle",
    color: "#a855f7",
    label: "Perfectionist",
    desc: "Jawab semua soal benar dalam satu stage",
    category: "mastery",
    rarity: "rare",
  },
  {
    id: "speedrun",
    iconName: "Timer",
    color: "#f59e0b",
    label: "Speed Run",
    desc: "Selesaikan stage tanpa satu pun jawaban salah",
    category: "mastery",
    rarity: "rare",
  },
  {
    id: "scholar",
    iconName: "BookOpen",
    color: "#60a5fa",
    label: "Scholar",
    desc: "Selesaikan 5 stage",
    category: "general",
    rarity: "common",
  },
  {
    id: "bookworm",
    iconName: "Library",
    color: "#818cf8",
    label: "Bookworm",
    desc: "Selesaikan 15 stage",
    category: "general",
    rarity: "rare",
  },
  {
    id: "graduate",
    iconName: "GraduationCap",
    color: "#c084fc",
    label: "Graduate",
    desc: "Selesaikan 30 stage",
    category: "general",
    rarity: "epic",
  },
  {
    id: "combo_master",
    iconName: "Flame",
    color: "#ef4444",
    label: "Combo Master",
    desc: "Capai combo ×5 dalam satu sesi",
    category: "mastery",
    rarity: "rare",
  },
  {
    id: "explorer",
    iconName: "Compass",
    color: "#14b8a6",
    label: "Explorer",
    desc: "Selesaikan stage di 3 chapter berbeda",
    category: "general",
    rarity: "rare",
  },
  {
    id: "polyglot",
    iconName: "Globe",
    color: "#f97316",
    label: "Polyglot",
    desc: "Aktifkan 3 bahasa berbeda",
    category: "general",
    rarity: "epic",
  },
  {
    id: "night_owl",
    iconName: "Moon",
    color: "#818cf8",
    label: "Night Owl",
    desc: "Selesaikan stage setelah pukul 22:00",
    category: "general",
    rarity: "common",
  },
  {
    id: "early_bird",
    iconName: "Sunrise",
    color: "#fb923c",
    label: "Early Bird",
    desc: "Selesaikan stage sebelum pukul 07:00",
    category: "general",
    rarity: "common",
  },

  /* ── XP milestones ────────────────────────────────────────────────── */
  {
    id: "xp_100",
    iconName: "Sprout",
    color: "#34d399",
    label: "Seedling",
    desc: "Kumpulkan 100 XP",
    category: "xp",
    rarity: "common",
  },
  {
    id: "xp_500",
    iconName: "Star",
    color: "#10b981",
    label: "Rising Star",
    desc: "Kumpulkan 500 XP",
    category: "xp",
    rarity: "common",
  },
  {
    id: "xp_1500",
    iconName: "Gem",
    color: "#3b82f6",
    label: "Diamond",
    desc: "Kumpulkan 1.500 XP",
    category: "xp",
    rarity: "rare",
  },
  {
    id: "xp_3000",
    iconName: "Crown",
    color: "#f59e0b",
    label: "Legend",
    desc: "Kumpulkan 3.000 XP",
    category: "xp",
    rarity: "epic",
  },
  {
    id: "xp_6000",
    iconName: "Trophy",
    color: "#ec4899",
    label: "Grand Master",
    desc: "Kumpulkan 6.000 XP",
    category: "xp",
    rarity: "legendary",
  },

  /* ── Streak ───────────────────────────────────────────────────────── */
  {
    id: "streak_3",
    iconName: "Flame",
    color: "#f97316",
    label: "On a Roll",
    desc: "Streak 3 hari berturut-turut",
    category: "streak",
    rarity: "common",
  },
  {
    id: "on_fire",
    iconName: "Flame",
    color: "#ef4444",
    label: "On Fire",
    desc: "Streak 7 hari berturut-turut",
    category: "streak",
    rarity: "rare",
  },
  {
    id: "dedicated",
    iconName: "CalendarCheck",
    color: "#a855f7",
    label: "Dedicated",
    desc: "Streak 30 hari belajar",
    category: "streak",
    rarity: "legendary",
  },

  /* ── English ──────────────────────────────────────────────────────── */
  {
    id: "en_first",
    iconName: "Languages",
    color: "#3b82f6",
    label: "Hello World",
    desc: "Selesaikan stage pertama Bahasa Inggris",
    category: "english",
    rarity: "common",
  },
  {
    id: "en_chapter1",
    iconName: "BookMarked",
    color: "#60a5fa",
    label: "English Chapter I",
    desc: "Selesaikan semua stage di Chapter 1 Inggris",
    category: "english",
    rarity: "rare",
  },
  {
    id: "en_all_stars",
    iconName: "Stars",
    color: "#93c5fd",
    label: "English All-Stars",
    desc: "Raih bintang 3 di 5 stage Inggris",
    category: "english",
    rarity: "epic",
  },
  {
    id: "en_master",
    iconName: "Shield",
    color: "#1d4ed8",
    label: "English Master",
    desc: "Selesaikan semua chapter Bahasa Inggris",
    category: "english",
    rarity: "legendary",
  },

  /* ── Japanese ─────────────────────────────────────────────────────── */
  {
    id: "ja_first",
    iconName: "Languages",
    color: "#f43f5e",
    label: "はじめまして",
    desc: "Selesaikan stage pertama Bahasa Jepang",
    category: "japanese",
    rarity: "common",
  },
  {
    id: "ja_hiragana",
    iconName: "PenLine",
    color: "#fb7185",
    label: "Hiragana Hero",
    desc: "Selesaikan semua stage di Chapter 1 Jepang",
    category: "japanese",
    rarity: "rare",
  },
  {
    id: "ja_all_stars",
    iconName: "Sparkles",
    color: "#fda4af",
    label: "Sakura Stars",
    desc: "Raih bintang 3 di 5 stage Jepang",
    category: "japanese",
    rarity: "epic",
  },
  {
    id: "ja_master",
    iconName: "Sword",
    color: "#e11d48",
    label: "Samurai Scholar",
    desc: "Selesaikan semua chapter Bahasa Jepang",
    category: "japanese",
    rarity: "legendary",
  },

  /* ── Mandarin ─────────────────────────────────────────────────────── */
  {
    id: "zh_first",
    iconName: "Languages",
    color: "#f59e0b",
    label: "你好世界",
    desc: "Selesaikan stage pertama Bahasa Mandarin",
    category: "mandarin",
    rarity: "common",
  },
  {
    id: "zh_pinyin",
    iconName: "PenTool",
    color: "#fbbf24",
    label: "Pinyin Pro",
    desc: "Selesaikan semua stage di Chapter 1 Mandarin",
    category: "mandarin",
    rarity: "rare",
  },
  {
    id: "zh_all_stars",
    iconName: "Sparkles",
    color: "#fcd34d",
    label: "Dragon Stars",
    desc: "Raih bintang 3 di 5 stage Mandarin",
    category: "mandarin",
    rarity: "epic",
  },
  {
    id: "zh_master",
    iconName: "Mountain",
    color: "#d97706",
    label: "Dragon Scholar",
    desc: "Selesaikan semua chapter Bahasa Mandarin",
    category: "mandarin",
    rarity: "legendary",
  },

  // ── Korean ─────────────────────────────────────────────
  {
    id: "ko_first",
    iconName: "Languages",
    color: "#8b5cf6",
    label: "안녕하세요",
    desc: "Selesaikan stage pertama Bahasa Korea",
    category: "korean",
    rarity: "common",
  },
  {
    id: "ko_hangul",
    iconName: "PenLine",
    color: "#a78bfa",
    label: "Hangul Hero",
    desc: "Selesaikan semua stage di Chapter 1 Korea",
    category: "korean",
    rarity: "rare",
  },
  {
    id: "ko_all_stars",
    iconName: "Sparkles",
    color: "#c4b5fd",
    label: "K-Stars",
    desc: "Raih bintang 3 di 5 stage Korea",
    category: "korean",
    rarity: "epic",
  },
  {
    id: "ko_master",
    iconName: "Shield",
    color: "#7c3aed",
    label: "Hallyu Scholar",
    desc: "Selesaikan semua chapter Bahasa Korea",
    category: "korean",
    rarity: "legendary",
  },
];

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

/* ─── Store Interface ──────────────────────────────────── */
interface UserState {
  xp: number;
  streak: number;
  combo: number;
  stageStars: Record<string, number>;
  stageUnlocked: Record<string, boolean>;
  completedStages: Record<string, boolean>;
  unlockedAchievements: UnlockedAchievement[];
  pendingAchievements: string[];

  setXP: (xp: number) => void;
  setStreak: (streak: number) => void;
  addXp: (amount: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;

  unlockStage: (stageId: string) => void;
  setStageStars: (stageId: string, stars: number) => void;
  isStageUnlocked: (chapterId: number, stageId: string) => boolean;
  isChapterUnlocked: (chapterXpRequired: number) => boolean;
  getStageStars: (stageId: string) => number;

  markStageComplete: (stageId: string) => void;
  isStageCompleted: (stageId: string) => boolean;
  unlockAchievement: (id: string) => void;
  dismissPendingAchievement: () => void;
  checkAndUnlockAchievements: (context: {
    justCompletedStageId?: string;
    justCompletedStars?: number;
    allCorrect?: boolean;
    completedChapterIds?: string[];
    language?: string; // ← baru: 'en' | 'ja' | 'zh'
    completedLangs?: string[]; // ← baru: bahasa yang sudah pernah ada progress
  }) => void;

  unlockAll: () => void;
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

/* ─── Store ─────────────────────────────────────────────── */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      xp: 0,
      streak: 0,
      combo: 0,
      stageStars: {},
      stageUnlocked: buildInitialUnlocks(),
      completedStages: {},
      unlockedAchievements: [],
      pendingAchievements: [],

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
      incrementCombo: () => set((s) => ({ combo: s.combo + 1 })),
      resetCombo: () => set({ combo: 0 }),
      setXP: (xp) => set({ xp }),
      setStreak: (streak) => set({ streak }),

      unlockStage: (stageId) => {
        set((s) => {
          const newUnlocked = { ...s.stageUnlocked, [stageId]: true };
          const chapters = (dummyData as any).chapters;
          if (!chapters) return { stageUnlocked: newUnlocked };
          let ci = -1,
            si = -1;
          for (let i = 0; i < chapters.length; i++) {
            const j = chapters[i].stages.findIndex(
              (st: any) => st.id === stageId,
            );
            if (j !== -1) {
              ci = i;
              si = j;
              break;
            }
          }
          if (ci === -1) return { stageUnlocked: newUnlocked };
          const ch = chapters[ci];
          const nextInCh = ch.stages[si + 1];
          if (nextInCh) {
            newUnlocked[nextInCh.id] = true;
            return { stageUnlocked: newUnlocked };
          }
          const allDone = ch.stages.every(
            (st: any) => newUnlocked[st.id] === true,
          );
          if (allDone) {
            const nextCh = chapters[ci + 1];
            if (nextCh?.stages.length > 0)
              newUnlocked[nextCh.stages[0].id] = true;
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
        set((s) => ({
          completedStages: { ...s.completedStages, [stageId]: true },
        })),

      isStageCompleted: (stageId) => get().completedStages[stageId] === true,

      unlockAchievement: (id) => {
        if (get().unlockedAchievements.some((a) => a.id === id)) return;
        set((s) => ({
          unlockedAchievements: [
            ...s.unlockedAchievements,
            { id, unlockedAt: Date.now() },
          ],
          pendingAchievements: [...s.pendingAchievements, id],
        }));
      },

      dismissPendingAchievement: () =>
        set((s) => ({ pendingAchievements: s.pendingAchievements.slice(1) })),

      checkAndUnlockAchievements: (ctx) => {
        const {
          unlockedAchievements,
          completedStages,
          xp,
          streak,
          combo,
          unlockAchievement,
        } = get();
        const has = (id: string) =>
          unlockedAchievements.some((a) => a.id === id);
        const totalCompleted =
          Object.values(completedStages).filter(Boolean).length;
        const now = new Date();
        const hour = now.getHours();
        const lang = ctx.language ?? "en";

        /* ── General ── */
        if (!has("first_blood") && totalCompleted >= 1)
          unlockAchievement("first_blood");
        if (!has("scholar") && totalCompleted >= 5)
          unlockAchievement("scholar");
        if (!has("bookworm") && totalCompleted >= 15)
          unlockAchievement("bookworm");
        if (!has("graduate") && totalCompleted >= 30)
          unlockAchievement("graduate");
        if (!has("hat_trick") && ctx.justCompletedStars === 3)
          unlockAchievement("hat_trick");
        if (!has("perfectionist") && ctx.allCorrect)
          unlockAchievement("perfectionist");
        if (!has("speedrun") && ctx.allCorrect) unlockAchievement("speedrun");
        if (!has("combo_master") && combo >= 5)
          unlockAchievement("combo_master");
        if (!has("night_owl") && hour >= 22) unlockAchievement("night_owl");
        if (!has("early_bird") && hour < 7) unlockAchievement("early_bird");

        if (
          !has("explorer") &&
          ctx.completedChapterIds &&
          ctx.completedChapterIds.length >= 3
        ) {
          unlockAchievement("explorer");
        }
        if (
          !has("polyglot") &&
          ctx.completedLangs &&
          ctx.completedLangs.length >= 3
        ) {
          unlockAchievement("polyglot");
        }

        /* ── XP milestones ── */
        if (!has("xp_100") && xp >= 100) unlockAchievement("xp_100");
        if (!has("xp_500") && xp >= 500) unlockAchievement("xp_500");
        if (!has("xp_1500") && xp >= 1500) unlockAchievement("xp_1500");
        if (!has("xp_3000") && xp >= 3000) unlockAchievement("xp_3000");
        if (!has("xp_6000") && xp >= 6000) unlockAchievement("xp_6000");

        /* ── Streak ── */
        if (!has("streak_3") && streak >= 3) unlockAchievement("streak_3");
        if (!has("on_fire") && streak >= 7) unlockAchievement("on_fire");
        if (!has("dedicated") && streak >= 30) unlockAchievement("dedicated");

        /* ── English ── */
        if (lang === "en") {
          if (!has("en_first") && totalCompleted >= 1)
            unlockAchievement("en_first");
          if (!has("en_chapter1") && ctx.completedChapterIds?.includes("1"))
            unlockAchievement("en_chapter1");
          const enStars3 = Object.values(get().stageStars).filter(
            (s) => s >= 3,
          ).length;
          if (!has("en_all_stars") && enStars3 >= 5)
            unlockAchievement("en_all_stars");
          const enChapters = (dummyData as any).chapters ?? [];
          const allEnDone = enChapters.every((ch: any) =>
            ch.stages.every((s: any) => completedStages[s.id]),
          );
          if (!has("en_master") && allEnDone) unlockAchievement("en_master");
        }

        /* ── Japanese ── */
        if (lang === "ja") {
          if (!has("ja_first") && totalCompleted >= 1)
            unlockAchievement("ja_first");
          if (!has("ja_hiragana") && ctx.completedChapterIds?.includes("1"))
            unlockAchievement("ja_hiragana");
          const jaStars3 = Object.values(get().stageStars).filter(
            (s) => s >= 3,
          ).length;
          if (!has("ja_all_stars") && jaStars3 >= 5)
            unlockAchievement("ja_all_stars");
        }

        /* ── Mandarin ── */
        if (lang === "zh") {
          if (!has("zh_first") && totalCompleted >= 1)
            unlockAchievement("zh_first");
          if (!has("zh_pinyin") && ctx.completedChapterIds?.includes("1"))
            unlockAchievement("zh_pinyin");
          const zhStars3 = Object.values(get().stageStars).filter(
            (s) => s >= 3,
          ).length;
          if (!has("zh_all_stars") && zhStars3 >= 5)
            unlockAchievement("zh_all_stars");
        }

        if (lang === "ko") {
          if (!has("ko_first") && totalCompleted >= 1)
            unlockAchievement("ko_first");
          if (!has("ko_hangul") && ctx.completedChapterIds?.includes("1"))
            unlockAchievement("ko_hangul");
          const koStars3 = Object.values(get().stageStars).filter(
            (s) => s >= 3,
          ).length;
          if (!has("ko_all_stars") && koStars3 >= 5)
            unlockAchievement("ko_all_stars");
        }
      },

      unlockAll: () => {
        const chapters = (dummyData as any).chapters;
        if (!chapters) return;
        const allUnlocked: Record<string, boolean> = {};
        chapters.forEach((ch: any) => {
          ch.stages.forEach((st: any) => {
            allUnlocked[st.id] = true;
          });
        });
        const maxXp =
          Math.max(...chapters.map((ch: any) => ch.xpRequired ?? 0)) + 9999;
        set({ stageUnlocked: allUnlocked, xp: maxXp });
      },
    }),
    {
      name: "langlearn-user-store-v1",
      partialize: (s) => ({
        xp: s.xp,
        combo: s.combo,
        streak: s.streak,
        stageStars: s.stageStars,
        stageUnlocked: s.stageUnlocked,
        completedStages: s.completedStages,
        unlockedAchievements: s.unlockedAchievements,
      }),
    },
  ),
);
