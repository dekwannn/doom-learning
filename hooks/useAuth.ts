// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Import store Zustand kita
import { useUserStore } from '@/store/useUserStore'
import { useLanguageStore } from '@/store/useLanguageStore'

// Fungsi untuk mendownload dan merestore data dari Cloud ke Device lokal
async function restoreProgressFromCloud(userId: string) {
  try {
    const { data, error } = await supabase.from('profiles').select('save_data').eq('id', userId).single()
    if (error) return

    if (data && data.save_data) {
      const { userStore, langStore } = data.save_data as any
      
      // 1. Ambil data pending achievement yang mungkin sedang berjalan di layar
      if (userStore) {
        const currentPending = useUserStore.getState().pendingAchievements || [];
        useUserStore.setState({ ...userStore, pendingAchievements: currentPending });
      }
      
      // 2. Jangan timpa pilihan bahasa (selectedLanguage) jika di Cloud ternyata kosong
      if (langStore) {
        const currentLang = useLanguageStore.getState().selectedLanguage;
        useLanguageStore.setState({ 
          ...langStore, 
          // currentLang ditaruh di depan agar selalu menang!
          selectedLanguage: currentLang || langStore.selectedLanguage 
        });
      }
      console.log('✅ Cloud Save berhasil di-download!')
    }
  } catch (error) {
    console.error('Gagal mendownload Cloud Save:', error)
  }
}

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ambil session awal
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Jika sudah login saat web baru dibuka, download progress
      if (session?.user) {
        await restoreProgressFromCloud(session.user.id)
      }
      setLoading(false)
    })

    // Listen perubahan auth state (misal: baru saja login / daftar)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Cukup panggil saat event SIGNED_IN (login / register sukses)
        if (session?.user && event === 'SIGNED_IN') {
           await restoreProgressFromCloud(session.user.id)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    // ── PENTING: Bersihkan memori lokal saat logout! ──
    // Ini agar jika temanmu meminjam HP-mu untuk login ke akunnya,
    // dia tidak akan melihat progress map stage milikmu.
    localStorage.removeItem('langlearn-user-store-v1')
    localStorage.removeItem('lingora-language-store-v5')
    
    useUserStore.getState().reset()
    useLanguageStore.getState().resetAll()

    await supabase.auth.signOut()
  }

  return { user, session, loading, signOut }
}