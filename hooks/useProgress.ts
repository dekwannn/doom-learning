// src/hooks/useProgress.ts
'use client';

import { useUserStore } from '@/store/useUserStore';
import { useLanguageStore } from '@/store/useLanguageStore';

// ─────────────────────────────────────────────────────────────────────────────
// KRITIS: Konstanta fallback HARUS di level modul (luar komponen/hook).
//
// Masalah: `?? {}` di dalam Zustand selector menghasilkan object baru setiap
// kali selector dipanggil. React SSR (getServerSnapshot) dan useSyncExternalStore
// membandingkan hasil dengan referensi (===). Karena {} !== {}, React menganggap
// state selalu berubah → infinite re-render (Error #185 / getServerSnapshot loop).
//
// Solusi: gunakan EMPTY_OBJ yang referensinya tidak pernah berubah.
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_OBJ: Record<string, any> = {};

export function useProgress() {
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const isEnglish = !selectedLanguage || selectedLanguage === 'en';
  const activeLang = selectedLanguage ?? 'en';

  // ── English store — baca sebagai primitif individual ──────────────────────
  const enXp              = useUserStore(s => s.xp);
  const enCombo           = useUserStore(s => s.combo);
  const enStreak          = useUserStore(s => s.streak);
  const enStageStars      = useUserStore(s => s.stageStars);
  const enStageUnlocked   = useUserStore(s => s.stageUnlocked);
  const enCompletedStages = useUserStore(s => s.completedStages);

  const enAddXp          = useUserStore(s => s.addXp);
  const enIncrementCombo = useUserStore(s => s.incrementCombo);
  const enResetCombo     = useUserStore(s => s.resetCombo);
  const enSetStreak      = useUserStore(s => s.setStreak);
  const enSetStageStars  = useUserStore(s => s.setStageStars);
  const enUnlockStage    = useUserStore(s => s.unlockStage);
  const enMarkComplete   = useUserStore(s => s.markStageComplete);
  const enIsCompleted    = useUserStore(s => s.isStageCompleted);

  // ── Language store — baca PRIMITIF, fallback ke EMPTY_OBJ stabil ──────────
  const langXp = useLanguageStore(s =>
    s.progress[activeLang]?.xp ?? 0
  );
  const langCombo = useLanguageStore(s =>
    s.progress[activeLang]?.combo ?? 0
  );
  const langStreak = useLanguageStore(s =>
    s.progress[activeLang]?.streak ?? 0
  );
  const langStageStars = useLanguageStore(s =>
    s.progress[activeLang]?.stageStars ?? EMPTY_OBJ
  );
  const langStageUnlocked = useLanguageStore(s =>
    s.progress[activeLang]?.stageUnlocked ?? EMPTY_OBJ
  );
  const langCompletedStages = useLanguageStore(s =>
    s.progress[activeLang]?.completedStages ?? EMPTY_OBJ
  );

  // ── Language store — actions ───────────────────────────────────────────────
  const langAddXp         = useLanguageStore(s => s.addXp);
  const langIncrCombo     = useLanguageStore(s => s.incrementCombo);
  const langResetCombo    = useLanguageStore(s => s.resetCombo);
  const langSetStreak     = useLanguageStore(s => s.setStreak);
  const langSetStageStars = useLanguageStore(s => s.setStageStars);
  const langMarkComplete  = useLanguageStore(s => s.markStageComplete);
  const langIsCompleted   = useLanguageStore(s => s.isStageCompleted);
  const langUnlockStage   = useLanguageStore(s => s.unlockStage);

  // ── Unified read values ────────────────────────────────────────────────────
  const xp              = isEnglish ? enXp              : langXp;
  const combo           = isEnglish ? enCombo           : langCombo;
  const streak          = isEnglish ? enStreak          : langStreak;
  const stageStars      = isEnglish ? enStageStars      : langStageStars;
  const stageUnlocked   = isEnglish ? enStageUnlocked   : langStageUnlocked;
  const completedStages = isEnglish ? enCompletedStages : langCompletedStages;

  // ── Unified write actions ──────────────────────────────────────────────────
  const addXp = (amount: number) =>
    isEnglish ? enAddXp(amount) : langAddXp(amount);

  const incrementCombo = () =>
    isEnglish ? enIncrementCombo() : langIncrCombo();

  const resetCombo = () =>
    isEnglish ? enResetCombo() : langResetCombo();

  const setStreak = (n: number) =>
    isEnglish ? enSetStreak(n) : langSetStreak(n);

  const setStageStars = (stageId: string, stars: number) =>
    isEnglish ? enSetStageStars(stageId, stars) : langSetStageStars(stageId, stars);

  const markStageComplete = (stageId: string) =>
    isEnglish ? enMarkComplete(stageId) : langMarkComplete(stageId);

  const isStageCompleted = (stageId: string): boolean =>
    isEnglish ? enIsCompleted(stageId) : langIsCompleted(stageId);

  const unlockStage = (stageId: string, allStages?: any[]) => {
    if (isEnglish) {
      enUnlockStage(stageId);
    } else {
      langUnlockStage(stageId, allStages ?? []);
    }
  };

  const getStageStars = (stageId: string): number =>
    stageStars[stageId] ?? 0;

  return {
    xp,
    combo,
    streak,
    stageStars,
    stageUnlocked,
    completedStages,
    selectedLanguage,
    isEnglish,
    addXp,
    incrementCombo,
    resetCombo,
    setStreak,
    setStageStars,
    markStageComplete,
    isStageCompleted,
    unlockStage,
    getStageStars,
  };
}