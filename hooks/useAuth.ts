// src/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Import store Zustand kita
import { useUserStore } from '@/store/useUserStore'
import { useLanguageStore } from '@/store/useLanguageStore'

// Catatan: progres dari cloud dipulihkan sekali oleh AuthProvider (lib/cloud-save.ts), bukan di sini,
// supaya tidak ada dua proses yang saling menimpa progres.

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ambil session awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen perubahan auth state (misal: baru saja login / daftar)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
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