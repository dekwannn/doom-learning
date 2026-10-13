// src/hooks/useProgress.ts
'use client';

import { useUserStore }     from '@/store/useUserStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { supabase }         from '@/lib/supabase';
import { saveToCloud, whenCloudReady } from '@/lib/cloud-save';
import { useCallback }      from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// KRITIS: Konstanta fallback HARUS di level modul (luar komponen/hook).
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_OBJ: Record<string, any> = {};

export function useProgress() {
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const isEnglish = !selectedLanguage || selectedLanguage === 'en';
  const activeLang = selectedLanguage ?? 'en';

  // ── English store (KINI SEBAGAI GLOBAL STORE) ─────────────────────────────
  const enXp              = useUserStore(s => s.xp);
  const enCombo           = useUserStore(s => s.combo);
  const enStreak          = useUserStore(s => s.streak); // <-- INI GLOBAL STREAK SEKARANG
  const enStageStars      = useUserStore(s => s.stageStars);
  const enStageUnlocked   = useUserStore(s => s.stageUnlocked);
  const enCompletedStages = useUserStore(s => s.completedStages);

  const enAddXp          = useUserStore(s => s.addXp);
  const enIncrementCombo = useUserStore(s => s.incrementCombo);
  const enResetCombo     = useUserStore(s => s.resetCombo);
  const enSetStreak      = useUserStore(s => s.setStreak); // <-- INI GLOBAL SETTER
  const enSetStageStars  = useUserStore(s => s.setStageStars);
  const enUnlockStage    = useUserStore(s => s.unlockStage);
  const enMarkComplete   = useUserStore(s => s.markStageComplete);
  const enIsCompleted    = useUserStore(s => s.isStageCompleted);

  // ── Language store ────────────────────────────────────────────────────────
  const langXp = useLanguageStore(s => s.progress[activeLang]?.xp ?? 0);
  const langCombo = useLanguageStore(s => s.progress[activeLang]?.combo ?? 0);
  // (langStreak kita buang dari sini karena tidak dipakai lagi)
  const langStageStars = useLanguageStore(s => s.progress[activeLang]?.stageStars ?? EMPTY_OBJ);
  const langStageUnlocked = useLanguageStore(s => s.progress[activeLang]?.stageUnlocked ?? EMPTY_OBJ);
  const langCompletedStages = useLanguageStore(s => s.progress[activeLang]?.completedStages ?? EMPTY_OBJ);

  // ── Language store — actions ───────────────────────────────────────────────
  const langAddXp         = useLanguageStore(s => s.addXp);
  const langIncrCombo     = useLanguageStore(s => s.incrementCombo);
  const langResetCombo    = useLanguageStore(s => s.resetCombo);
  // (langSetStreak kita buang)
  const langSetStageStars = useLanguageStore(s => s.setStageStars);
  const langMarkComplete  = useLanguageStore(s => s.markStageComplete);
  const langIsCompleted   = useLanguageStore(s => s.isStageCompleted);
  const langUnlockStage   = useLanguageStore(s => s.unlockStage);

  // ── Unified read values ────────────────────────────────────────────────────
  const xp              = isEnglish ? enXp              : langXp;
  const combo           = isEnglish ? enCombo           : langCombo;
  
  // 🔥 PERUBAHAN UTAMA: Streak selalu global, tidak peduli isEnglish atau bukan!
  const streak          = enStreak; 

  const stageStars      = isEnglish ? enStageStars      : langStageStars;
  const stageUnlocked   = isEnglish ? enStageUnlocked   : langStageUnlocked;
  const completedStages = isEnglish ? enCompletedStages : langCompletedStages;

  // ── Supabase sync — CLOUD SAVE ───────────────────────────────────────────
  const syncToSupabase = useCallback(async (
    xpToAdd:     number,
    stagesToAdd: number = 0,
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // 1. Sync XP ke Leaderboard (Kode lama)
      await supabase.rpc('upsert_xp', {
        p_language_code: activeLang,
        p_xp_to_add:     xpToAdd,
        p_stages_to_add: stagesToAdd,
      });

      // 2. CLOUD SAVE ke tabel profiles — tunggu sampai progres dari cloud sudah diambil,
      //    supaya HP baru tidak menimpa progres lama dengan data kosong
      await whenCloudReady();
      await saveToCloud(user.id);

    } catch (err) {
      console.warn('[useProgress] Supabase sync failed:', err);
    }
  }, [activeLang]);

  // ── Unified write actions ──────────────────────────────────────────────────

  const addXp = (amount: number, skipSync: boolean = false) => {
    if (isEnglish) { enAddXp(amount); } else { langAddXp(amount); }
    if (!skipSync) syncToSupabase(amount); 
  };

  const incrementCombo = () =>
    isEnglish ? enIncrementCombo() : langIncrCombo();

  const resetCombo = () =>
    isEnglish ? enResetCombo() : langResetCombo();

  // 🔥 PERUBAHAN UTAMA: Fungsi setStreak selalu menembak ke brankas global
  const setStreak = (n: number) => {
    enSetStreak(n);
  };

  const setStageStars = (stageId: string, stars: number) =>
    isEnglish ? enSetStageStars(stageId, stars) : langSetStageStars(stageId, stars);

  const markStageComplete = (stageId: string, batchedXp: number = 0) => {
    if (isEnglish) { enMarkComplete(stageId); } else { langMarkComplete(stageId); }
    syncToSupabase(batchedXp, 1); // Kirim XP dan +1 stage SEKALIGUS!
  };

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
    xp, combo, streak, stageStars, stageUnlocked, completedStages,
    selectedLanguage, isEnglish,
    addXp, incrementCombo, resetCombo, setStreak, setStageStars,
    markStageComplete, isStageCompleted, unlockStage, getStageStars,
  };
}