'use client'

// src/app/login/page.tsx

import { useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { safeRedirect } from '@/lib/safe-redirect'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Loader2, Sparkles, ArrowRight } from 'lucide-react'

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = safeRedirect(searchParams.get('redirectTo'))
  const callbackUrl  = () => `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [sent,     setSent]     = useState(false)

  const clear = () => setError('')

  const loginGoogle = async () => {
    setLoading(true); clear()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const loginEmail = async () => {
    if (!email || !password) return setError('Isi email dan password terlebih dahulu.')
    setLoading(true); clear()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login')) {
        return setError('Email atau password salah. Belum punya akun? Daftar dulu.')
      }
      return setError(error.message)
    }
    router.push(redirectTo)
  }

  const loginMagic = async () => {
    if (!email) return setError('Masukkan alamat email kamu di kolom atas untuk menggunakan Magic Link.')
    setLoading(true); clear()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSent(true)
  }

  return (
    <main style={pageStyle}>
      <Glow />

      <div style={cardStyle}>
        
        {/* Header & Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', 
            justifyContent: 'center', marginBottom: 10 
          }}>
            <img src="/logo-splash.png" alt="Lingora" style={{ width: 100, height: 100, objectFit: 'contain' }} />
          </div>
          
          <h1 style={{ color:'#f4f4f5', fontSize:24, fontWeight:800, margin:'0 0 8px', letterSpacing:'-0.02em', textAlign: 'center' }}>
            {sent ? 'Cek kotak masukmu' : 'Selamat datang kembali'}
          </h1>
          <p style={{ color:'#a1a1aa', fontSize:14, margin:0, textAlign: 'center', lineHeight: 1.5 }}>
            {sent ? `Link akses telah dikirim ke ${email}` : 'Masuk untuk melanjutkan belajarmu hari ini'}
          </p>
        </div>

        {/* Error State */}
        {error && <ErrorBox message={error} />}

        {/* --- STATE: SENT MAGIC LINK --- */}
        {sent ? (
          <div style={{ textAlign:'center', animation: 'fadeUp 0.3s ease' }}>
            <div style={iconCircle('#10b981')}>
              <Mail size={24} color="#10b981" />
            </div>
            <p style={{ color:'#71717a', fontSize:13.5, margin:'0 0 24px', lineHeight:1.6 }}>
              Klik tautan aman yang kami kirimkan ke emailmu untuk langsung masuk. Cek folder spam jika perlu.
            </p>
            <button onClick={() => setSent(false)} style={ghostBtn}>
              Kembali ke halaman login
            </button>
          </div>

        /* --- STATE: MAIN LOGIN FORM --- */
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation: 'fadeUp 0.3s ease' }}>
            
            <Field label="Email">
              <input type="email" placeholder="Masukkan Email Anda" value={email}
                onChange={e => { setEmail(e.target.value); clear() }}
                onKeyDown={e => e.key === 'Enter' && loginEmail()}
                style={inputSt} />
            </Field>
            
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => { setPassword(e.target.value); clear() }}
                  onKeyDown={e => e.key === 'Enter' && loginEmail()}
                  style={{ ...inputSt, paddingRight:48 }} />
                <button onClick={() => setShowPw(!showPw)} style={eyeBtn}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>

            {/* Tombol Login Utama */}
            <button onClick={loginEmail} disabled={loading} style={{ ...primaryBtn, marginTop: 4 }}>
              {loading ? <Loader2 size={18} style={spin} /> : <span>Masuk</span>}
            </button>

            <Divider />

            {/* Opsi Login Lainnya */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={loginGoogle} disabled={loading} style={secondaryBtn}>
                {loading ? <Loader2 size={18} style={spin} /> : <GoogleIcon />}
                <span>Lanjutkan dengan Google</span>
              </button>

              <button onClick={loginMagic} disabled={loading} style={ghostBtn}>
                <Sparkles size={16} color="#818cf8" />
                <span>Kirim Magic Link (Tanpa Password)</span>
              </button>
            </div>

            {/* Link Register */}
            <div style={{ textAlign:'center', marginTop: 12, paddingTop: 20, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color:'#71717a', fontSize:13 }}>Belum punya akun? </span>
              <Link href="/register" style={{ color:'#10b981', fontSize:13, fontWeight:700, textDecoration:'none', transition: 'color 0.2s' }}>
                Daftar sekarang
              </Link>
            </div>

          </div>
        )}
      </div>

      <p style={footerNote}>Dengan melanjutkan, kamu menyetujui Ketentuan Layanan dan Kebijakan Privasi LINGORA.</p>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #52525b; }
        input:focus { border-color: rgba(16,185,129,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
      `}</style>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Loader2 size={24} color="#71717a" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

// ── Shared components ──
function Glow() {
  return <>
    <div style={{ position:'absolute', top:-150, left:-150, width:500, height:500, background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:-150, right:-150, width:600, height:600, background:'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)', filter:'blur(70px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }} />
  </>
}

function ErrorBox({ message }: { message: string }) {
  return <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, color:'#fca5a5', fontSize:13, lineHeight: 1.5, animation: 'fadeUp 0.3s ease' }}>{message}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelSt}>{label}</label>{children}</div>
}

function Divider() {
  return <div style={{ display:'flex', alignItems:'center', gap:12, margin:'6px 0' }}>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
    <span style={{ color:'#52525b', fontSize:11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>atau</span>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
  </div>
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
}

function iconCircle(color: string) {
  return { width:64, height:64, borderRadius:'50%', background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' } as React.CSSProperties
}

// ── Styles ──
const pageStyle: React.CSSProperties = { minHeight:'100vh', background:'#050508', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'system-ui,sans-serif', position:'relative', overflow:'hidden' }
const cardStyle: React.CSSProperties = { width:'100%', maxWidth:420, position:'relative', zIndex:10, background:'rgba(10,10,14,0.8)', backdropFilter: 'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:'40px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }
const primaryBtn: React.CSSProperties = { width:'100%', height:48, borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition: 'transform 0.1s, filter 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }
const secondaryBtn: React.CSSProperties = { width:'100%', height:48, borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.03)', color:'#e4e4e7', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition: 'background 0.2s' }
const ghostBtn: React.CSSProperties = { width:'100%', height:44, borderRadius:12, border:'none', background:'transparent', color:'#a1a1aa', fontSize:13.5, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition: 'color 0.2s' }
const inputSt: React.CSSProperties = { width:'100%', height:50, borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)', color:'#f4f4f5', fontSize:14, padding:'0 16px', outline:'none', boxSizing:'border-box', fontFamily:'system-ui,sans-serif', transition:'all 0.2s' }
const labelSt: React.CSSProperties = { display:'block', color:'#a1a1aa', fontSize:12, fontWeight:600, marginBottom:8 }
const eyeBtn: React.CSSProperties = { position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#71717a', padding:0, display:'flex', transition: 'color 0.2s' }
const footerNote: React.CSSProperties = { color:'#52525b', fontSize:12, marginTop:32, zIndex:10, position:'relative', textAlign:'center', maxWidth: 320, lineHeight: 1.6 }
const spin: React.CSSProperties = { animation:'spin 1s linear infinite' }