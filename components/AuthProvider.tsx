'use client'

// src/components/AuthProvider.tsx

import { useEffect, useRef } from 'react'
import { supabase }          from '@/lib/supabase'
import { useUserStore }      from '@/store/useUserStore'
import { useLanguageStore }  from '@/store/useLanguageStore'
import { resetCloudGate, restoreFromCloud, saveToCloud } from '@/lib/cloud-save'

const STORE_KEYS = [
  'langlearn-user-store-v1',
  'lingora-language-store-v5',
]

// Key untuk simpan userId terakhir di localStorage
// Ini yang jadi patokan "apakah ini user baru atau reload biasa"
const LAST_USER_KEY = 'lingora-last-user-id'

let isHandlingLogin = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) return
    isMounted.current = true

    // Achievements earned by progress saved on this phone (also for guests), found without popups
    useUserStore.getState().checkAndUnlockAchievements({ silent: true })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleLogin(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // JANGAN await query Supabase di dalam callback ini: Supabase menunggu callback selesai sambil
          // memegang kunci sesi, sementara query butuh kunci yang sama → login tertahan sampai timeout.
          // Jalankan setelah callback selesai (anjuran dokumentasi Supabase).
          const userId = session.user.id
          setTimeout(() => { handleLogin(userId) }, 0)
        }
        if (event === 'SIGNED_OUT') {
          isHandlingLogin = false
          localStorage.removeItem(LAST_USER_KEY)
          clearLocalStorage()
          resetStores()
          resetCloudGate()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      isMounted.current = false
    }
  }, [])

  return <>{children}</>
}

function clearLocalStorage() {
  if (typeof window === 'undefined') return
  STORE_KEYS.forEach(key => localStorage.removeItem(key))
}

function resetStores() {
  useUserStore.getState().reset?.()
  useLanguageStore.getState().resetAll?.()
}

async function handleLogin(userId: string) {
  if (isHandlingLogin) return
  isHandlingLogin = true

  try {
    const lastUserId = localStorage.getItem(LAST_USER_KEY)

    if (lastUserId === userId) {
      // ── User sama, reload biasa → JANGAN reset; pakai progres yang lebih jauh (HP ini atau cloud)
      await restoreFromCloud(userId)
      await unlockFromProgress(userId)
      return
    }

    // ── Akun lain pernah login di HP ini → reset dulu, supaya progresnya tidak tercampur.
    //    Belum pernah ada akun (main sebagai tamu) → progres tamu dipertahankan dan ikut ke akun ini
    //    (restoreFromCloud memakai yang lebih jauh: progres tamu atau progres akun di cloud).
    if (lastUserId) {
      clearLocalStorage()
      resetStores()
    }
    localStorage.setItem(LAST_USER_KEY, userId)
    await restoreFromCloud(userId)
    await unlockFromProgress(userId)

  } finally {
    isHandlingLogin = false
  }
}

// Achievements the restored progress has earned (e.g. stages finished before an achievement existed),
// unlocked without popups and saved to the cloud
async function unlockFromProgress(userId: string) {
  const before = useUserStore.getState().unlockedAchievements.length
  useUserStore.getState().checkAndUnlockAchievements({ silent: true })
  if (useUserStore.getState().unlockedAchievements.length > before) await saveToCloud(userId)
}

// Baris leaderboard (xp_progress) dibuat oleh upsert_xp di database saat XP pertama masuk;
// aplikasi tidak lagi menulis tabel itu sendiri.
