'use client'

// src/app/auth/callback/page.tsx
// Tujuan redirect setelah login Google & Magic Link.
// Aplikasi di-build sebagai situs statis (output: 'export', untuk Capacitor), jadi route handler server
// tidak jalan; kode login (?code=...) ditukar menjadi sesi di sisi klien.

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { safeRedirect } from '@/lib/safe-redirect'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const redirectTo = safeRedirect(searchParams.get('redirectTo'))
    const code = searchParams.get('code')
    const providerError = searchParams.get('error_description') || searchParams.get('error')

    let cancelled = false
    const finish = async () => {
      if (providerError) throw new Error(providerError)
      // Klien Supabase biasanya sudah menukar ?code= sendiri saat dimuat; getSession() menunggu proses itu
      let { data: { session } } = await supabase.auth.getSession()
      if (!session && code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error
        session = data.session
      }
      if (!session) throw new Error('Sesi login tidak ditemukan.')
      if (!cancelled) router.replace(redirectTo)
    }
    finish().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Login gagal.')
    })
    return () => { cancelled = true }
  }, [router, searchParams])

  return (
    <div style={pageStyle}>
      {error ? (
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p style={{ color: '#f4f4f5', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Login belum berhasil</p>
          <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
          <Link href="/login" style={buttonStyle}>Coba login lagi</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#a1a1aa', fontSize: 14 }}>
          <Loader2 size={20} className="animate-spin" color="#10b981" />
          Sedang masuk...
        </div>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={pageStyle} />}>
      <CallbackContent />
    </Suspense>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui,sans-serif' }
const buttonStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 48, padding: '0 28px', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }
