"use client";

// src/app/register/page.tsx

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  User,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";

type Step = "step1" | "step2" | "success";

export default function RegisterPage() {
  const router = useRouter();

  // Navigation state
  const [step, setStep] = useState<Step>("step1");
  
  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  
  // UI state
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clear = () => setError("");

  // ── Validasi ──────────────────────────────────────────────
  const validateUsername = (u: string) => {
    if (u.length < 3) return "Username minimal 3 karakter";
    if (u.length > 20) return "Username maksimal 20 karakter";
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return "Hanya huruf, angka, dan underscore";
    return "";
  };

  const handleNextStep = () => {
    clear();
    const uErr = validateUsername(username);
    if (uErr) return setError(uErr);
    
    // Pindah ke step 2 jika username valid
    setStep("step2");
  };

  const registerEmail = async () => {
    clear();

    if (!email) return setError("Masukkan email kamu.");
    if (password.length < 6) return setError("Password minimal 6 karakter.");
    if (password !== confirm) return setError("Password dan konfirmasi tidak sama.");

    setLoading(true);

    const exactUsername = username.trim();
    const randomAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(exactUsername)}`;

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: exactUsername,
          avatar_url: randomAvatarUrl,
        },
      },
    });

    if (signUpErr) {
      setLoading(false);
      if (signUpErr.message.includes("already registered")) {
        return setError("Email sudah terdaftar. Silakan masuk.");
      }
      return setError(signUpErr.message);
    }

    if (data.user) {
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: data.user.id,
        username: exactUsername,
        avatar_url: randomAvatarUrl,
      });

      if (profileErr) {
        console.warn("[register] profile upsert:", profileErr.message);
      }
    }

    setLoading(false);
    setStep("success");
  };

  const registerGoogle = async () => {
    setLoading(true);
    clear();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const usernameErr = username.length > 0 ? validateUsername(username) : "";
  const usernameOk = username.length > 0 && !usernameErr;

  return (
    <main style={pageStyle}>
      <Glow accent="#10b981" />

      <div style={cardStyle}>
        
        {/* Tombol Back Dinamis (Hanya muncul di Step 2) */}
        {step === "step2" && (
          <button 
            onClick={() => { setStep("step1"); clear(); }} 
            style={backBtnSt}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Header & Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <img
            src="/logo-home.png"
            alt="Lingora"
            style={{ width: 100, height: 100, objectFit: "contain", marginBottom: 0 }}
          />
          <h1
            style={{
              color: "#f4f4f5",
              fontSize: 24,
              fontWeight: 800,
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
              textAlign: "center",
            }}
          >
            {step === "success" ? "Akun berhasil dibuat!" : "Buat akun LINGORA"}
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
            {step === "success"
              ? "Cek kotak masuk emailmu"
              : step === "step1" 
                ? "Pilih identitas belajarmu" 
                : "Masukkan email dan buat password untuk masuk ke akunmu nanti"}
          </p>
        </div>

        {/* Error State */}
        {error && <ErrorBox message={error} />}

        {/* --- STATE: SUCCESS --- */}
        {step === "success" ? (
          <div style={{ textAlign: "center", animation: 'fadeUp 0.3s ease' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2 size={28} color="#10b981" />
            </div>
            <p style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.7, margin: "0 0 8px" }}>
              Kami kirim link verifikasi ke
            </p>
            <p style={{ color: "#f4f4f5", fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>
              {email}
            </p>
            <p style={{ color: "#71717a", fontSize: 13.5, margin: "0 0 24px", lineHeight: 1.6 }}>
              Setelah verifikasi, kamu bisa langsung masuk dengan email dan password yang tadi didaftarkan.
            </p>
            <button onClick={() => router.push("/login")} style={primaryBtn}>
              <span>Pergi ke halaman masuk</span>
              <ArrowRight size={16} />
            </button>
          </div>

        /* --- STATE: STEP 1 (USERNAME) --- */
        ) : step === "step1" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: 'fadeUp 0.3s ease' }}>
            
            <div>
              <label style={labelSt}>Username</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Masukkan Username Anda"
                  value={username}
                  maxLength={20}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clear();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  style={{
                    ...inputSt,
                    paddingLeft: 42,
                    borderColor: usernameOk
                      ? "rgba(16,185,129,0.4)"
                      : usernameErr
                        ? "rgba(239,68,68,0.4)"
                        : "rgba(255,255,255,0.1)",
                  }}
                />
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: usernameOk ? "#10b981" : "#71717a" }}>
                  <User size={16} />
                </div>
                {usernameOk && (
                  <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                    <CheckCircle2 size={16} color="#10b981" />
                  </div>
                )}
              </div>
              {usernameErr && <p style={hintRed}>{usernameErr}</p>}
              {usernameOk && <p style={hintGreen}>Username tersedia</p>}
              {!username && <p style={hint}>Nama yang akan tampil di leaderboard</p>}
            </div>

            <button 
              onClick={handleNextStep} 
              disabled={!usernameOk} 
              style={{ ...primaryBtn, marginTop: 8, opacity: usernameOk ? 1 : 0.5 }}
            >
              <span>Lanjut</span>
              <ArrowRight size={18} />
            </button>

            {/* Navigasi Footer Step 1 */}
            <div style={{ textAlign: "center", paddingTop: 0, paddingBottom: 4 }}>
              <span style={{ color: "#71717a", fontSize: 13 }}>Sudah punya akun? </span>
              <Link href="/login" style={{ color: "#10b981", fontSize: 13, fontWeight: 700, textDecoration: "none", transition: "color 0.2s" }}>
                Masuk di sini
              </Link>
            </div>

            <Divider />

            <button onClick={registerGoogle} disabled={loading} style={secondaryBtn}>
              {loading ? <Loader2 size={18} style={spin} /> : <GoogleIcon />}
              <span>Daftar dengan Google</span>
            </button>

          </div>

        /* --- STATE: STEP 2 (EMAIL & PASSWORD) --- */
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: 'fadeRight 0.3s ease' }}>
            
            {/* Email */}
            <div>
              <label style={labelSt}>Email</label>
              <input
                type="email"
                placeholder="Masukkan Email Anda"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clear(); }}
                style={inputSt}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelSt}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clear(); }}
                  style={{ ...inputSt, paddingRight: 48 }}
                />
                <button onClick={() => setShowPw(!showPw)} style={eyeBtn}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  {[1, 2, 3].map((i) => {
                    const strength = password.length >= 10 ? 3 : password.length >= 6 ? 2 : 1;
                    const color = strength >= 3 ? "#10b981" : strength >= 2 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i <= strength ? color : "rgba(255,255,255,0.08)" }} />
                    );
                  })}
                  <span style={{ color: "#71717a", fontSize: 11, marginLeft: 6, fontWeight: 500 }}>
                    {password.length >= 10 ? "Kuat" : password.length >= 6 ? "Cukup" : "Lemah"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label style={labelSt}>Konfirmasi Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCf ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clear(); }}
                  onKeyDown={(e) => e.key === "Enter" && registerEmail()}
                  style={{
                    ...inputSt,
                    paddingRight: 48,
                    borderColor: confirm && confirm !== password ? "rgba(239,68,68,0.4)" : confirm && confirm === password ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)",
                  }}
                />
                <button onClick={() => setShowCf(!showCf)} style={eyeBtn}>
                  {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p style={hintRed}>Password tidak sama</p>
              )}
            </div>

            <button onClick={registerEmail} disabled={loading} style={{ ...primaryBtn, marginTop: 8 }}>
              {loading ? <Loader2 size={18} style={spin} /> : <ArrowRight size={18} />}
              <span>Buat Akun Sekarang</span>
            </button>
            
          </div>
        )}
      </div>

      <p style={footerNote}>
        Dengan mendaftar, kamu menyetujui Ketentuan Layanan dan Kebijakan Privasi LINGORA.
      </p>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeRight { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        input::placeholder { color: #52525b; }
        input:focus { border-color: rgba(16,185,129,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
      `}</style>
    </main>
  );
}

// ── Shared components ──
function Glow({ accent = "#10b981" }: { accent?: string }) {
  return <>
    <div style={{ position:'absolute', top:-150, left:-150, width:500, height:500, background:`radial-gradient(circle,${accent}15 0%,transparent 70%)`, filter:'blur(60px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:-150, right:-150, width:600, height:600, background:'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)', filter:'blur(70px)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }} />
  </>
}

function ErrorBox({ message }: { message: string }) {
  return <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, color:'#fca5a5', fontSize:13, lineHeight: 1.5, animation: 'fadeUp 0.3s ease' }}>{message}</div>
}

function Divider() {
  return <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0' }}>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
    <span style={{ color:'#52525b', fontSize:11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>atau</span>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
  </div>
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Styles ──
const pageStyle: React.CSSProperties = { minHeight:'100vh', background:'#050508', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'system-ui,sans-serif', position:'relative', overflow:'hidden' }
const cardStyle: React.CSSProperties = { width:'100%', maxWidth:420, position:'relative', zIndex:10, background:'rgba(10,10,14,0.8)', backdropFilter: 'blur(20px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:'40px', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }
const backBtnSt: React.CSSProperties = { position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s', zIndex: 20 }
const primaryBtn: React.CSSProperties = { width:'100%', height:48, borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition: 'transform 0.1s, filter 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }
const secondaryBtn: React.CSSProperties = { width:'100%', height:48, borderRadius:12, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.03)', color:'#e4e4e7', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition: 'background 0.2s' }
const inputSt: React.CSSProperties = { width:'100%', height:50, borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)', color:'#f4f4f5', fontSize:14, padding:'0 16px', outline:'none', boxSizing:'border-box', fontFamily:'system-ui,sans-serif', transition:'all 0.2s' }
const labelSt: React.CSSProperties = { display:'block', color:'#a1a1aa', fontSize:12, fontWeight:600, marginBottom:8 }
const eyeBtn: React.CSSProperties = { position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#71717a', padding:0, display:'flex', transition: 'color 0.2s' }
const hint: React.CSSProperties = { color: "#71717a", fontSize: 11, margin: "6px 0 0", fontWeight: 500 };
const hintRed: React.CSSProperties = { color: "#f87171", fontSize: 11, margin: "6px 0 0", fontWeight: 500 };
const hintGreen: React.CSSProperties = { color: "#10b981", fontSize: 11, margin: "6px 0 0", fontWeight: 500 };
const footerNote: React.CSSProperties = { color:'#52525b', fontSize:12, marginTop:32, zIndex:10, position:'relative', textAlign:'center', maxWidth: 320, lineHeight: 1.6 }
const spin: React.CSSProperties = { animation: "spin 1s linear infinite" };