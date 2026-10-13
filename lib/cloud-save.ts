// src/lib/cloud-save.ts
// Satu-satunya jalur Cloud Save: progres disimpan di profiles.save_data dan dipulihkan dari sana.
//
// Aturannya: setelah login, progres dari cloud diambil DULU, baru boleh menulis ke cloud.
// Tanpa urutan ini, HP baru (progres lokal masih kosong) bisa menimpa progres lama di cloud.

import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/useUserStore'
import { useLanguageStore } from '@/store/useLanguageStore'

type UserSave = Partial<ReturnType<typeof userSnapshot>>
type LangSave = Partial<ReturnType<typeof langSnapshot>>
type SaveData = { userStore?: UserSave; langStore?: LangSave; savedAt?: string }

// Hanya data yang memang disimpan di HP (sama dengan partialize di store), bukan fungsi atau state sementara
function userSnapshot() {
  const s = useUserStore.getState()
  return {
    xp: s.xp,
    combo: s.combo,
    streak: s.streak,
    lastStreakDate: s.lastStreakDate,
    stageStars: s.stageStars,
    stageUnlocked: s.stageUnlocked,
    completedStages: s.completedStages,
    unlockedAchievements: s.unlockedAchievements,
    dailyStats: s.dailyStats,
  }
}

function langSnapshot() {
  const s = useLanguageStore.getState()
  return { selectedLanguage: s.selectedLanguage, progress: s.progress }
}

const count = (r?: Record<string, boolean>) => Object.values(r ?? {}).filter(Boolean).length

/** Seberapa jauh sebuah progres (XP + stage selesai, semua bahasa). Progres belajar hanya bertambah, jadi yang lebih besar = lebih baru. */
function progressScore(save: SaveData): number {
  const u = save.userStore ?? {}
  const langs = Object.values(save.langStore?.progress ?? {})
  return (u.xp ?? 0) + count(u.completedStages) + langs.reduce((sum, p) => sum + (p?.xp ?? 0) + count(p?.completedStages), 0)
}

// ── Gerbang: menulis ke cloud menunggu sampai progres dari cloud selesai diambil ──
let markReady: () => void = () => {}
let ready = new Promise<void>((resolve) => { markReady = resolve })
export const whenCloudReady = () => ready
/** Saat logout: akun berikutnya harus memulihkan progresnya dulu sebelum boleh menulis */
export function resetCloudGate() {
  ready = new Promise<void>((resolve) => { markReady = resolve })
}

export async function saveToCloud(userId: string) {
  const save_data: SaveData = { userStore: userSnapshot(), langStore: langSnapshot(), savedAt: new Date().toISOString() }
  const { error } = await supabase.from('profiles').update({ save_data }).eq('id', userId)
  if (error) console.warn('[cloud-save] Gagal menyimpan:', error.message)
}

function applySave(save: SaveData) {
  if (save.userStore) {
    // Achievement yang sedang tampil di layar tetap dipertahankan
    useUserStore.setState({ ...save.userStore, pendingAchievements: useUserStore.getState().pendingAchievements })
  }
  if (save.langStore) {
    const currentLang = useLanguageStore.getState().selectedLanguage
    useLanguageStore.setState({
      progress: save.langStore.progress ?? {},
      // Pilihan bahasa di HP ini menang; kalau belum ada, pakai yang di cloud
      selectedLanguage: currentLang || save.langStore.selectedLanguage || null,
    })
  }
}

/**
 * Setelah login: ambil progres dari cloud dan pakai yang lebih jauh (cloud atau HP ini).
 * Kalau HP ini yang lebih jauh (misalnya sempat main offline), progres HP ini yang dikirim ke cloud.
 */
export async function restoreFromCloud(userId: string) {
  try {
    const { data, error } = await supabase.from('profiles').select('save_data').eq('id', userId).single()
    if (error) {
      console.warn('[cloud-save] Gagal mengambil progres:', error.message)
      return
    }
    const cloud = (data?.save_data ?? null) as SaveData | null
    const local: SaveData = { userStore: userSnapshot(), langStore: langSnapshot() }

    if (cloud && progressScore(cloud) >= progressScore(local)) {
      applySave(cloud)
      return
    }
    if (!cloud) await restoreXpFromLeaderboard(userId) // akun lama yang belum punya Cloud Save
    if (progressScore({ userStore: userSnapshot(), langStore: langSnapshot() }) > 0) await saveToCloud(userId)
  } finally {
    markReady()
  }
}

/** Akun lama: belum ada save_data, tapi XP-nya tercatat di xp_progress (leaderboard) */
async function restoreXpFromLeaderboard(userId: string) {
  const { data, error } = await supabase.from('xp_progress').select('language_code, total_xp').eq('user_id', userId)
  if (error || !data) return
  for (const row of data) {
    if (!row.total_xp) continue
    if (row.language_code === 'en') {
      if (row.total_xp > useUserStore.getState().xp) useUserStore.getState().setXpDirect?.(row.total_xp)
    } else if (row.total_xp > (useLanguageStore.getState().progress[row.language_code]?.xp ?? 0)) {
      useLanguageStore.getState().setXpDirect?.(row.language_code, row.total_xp)
    }
  }
}
