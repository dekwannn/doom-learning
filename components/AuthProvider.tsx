'use client'

// src/components/AuthProvider.tsx

import { useEffect, useRef } from 'react'
import { supabase }          from '@/lib/supabase'
import { useUserStore }      from '@/store/useUserStore'
import { useLanguageStore }  from '@/store/useLanguageStore'
import { resetCloudGate, restoreFromCloud } from '@/lib/cloud-save'

const STORE_KEYS = [
  'langlearn-user-store-v1',
  'lingora-language-store-v5',
]

// Key untuk simpan userId terakhir di localStorage
// Ini yang jadi patokan "apakah ini user baru atau reload biasa"
const LAST_USER_KEY = 'lingora-last-user-id'

type LangCode = 'en' | 'ja' | 'zh' | 'ko'
let isHandlingLogin = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) return
    isMounted.current = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleLogin(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleLogin(session.user.id)
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
      return
    }

    // ── User berbeda / pertama kali login di HP ini → reset semua lalu ambil dari cloud
    clearLocalStorage()
    resetStores()
    localStorage.setItem(LAST_USER_KEY, userId)
    await createLeaderboardRows(userId)
    await restoreFromCloud(userId)

  } finally {
    isHandlingLogin = false
  }
}

// Buat row kosong untuk semua bahasa di leaderboard jika belum ada
// ignoreDuplicates: true — tidak overwrite data yang sudah ada
async function createLeaderboardRows(userId: string) {
  const langs: LangCode[] = ['en', 'ja', 'zh', 'ko']
  for (const lang of langs) {
    await supabase
      .from('xp_progress')
      .upsert(
        { user_id: userId, language_code: lang, total_xp: 0, stages_completed: 0 },
        { onConflict: 'user_id,language_code', ignoreDuplicates: true }
      )
  }
}
