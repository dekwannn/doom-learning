'use client';

// src/components/GuestLimitScreen.tsx
// Shown instead of a new stage when a guest has used their free stages: sign in (or sign up) to go on.

import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { GUEST_FREE_STAGES } from '@/lib/guest-limit';

export default function GuestLimitScreen({ backTo, backLabel }: { backTo: string; backLabel: string }) {
  const router = useRouter();
  const here = typeof window === 'undefined' ? backTo : window.location.pathname;
  const login = `/login?redirectTo=${encodeURIComponent(here)}`;

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center', background: '#0e0e14', border: '1px solid rgba(92,250,46,0.18)', borderRadius: 24, padding: '32px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <img src="/maskot.png" alt="Lingo" style={{ width: 112, height: 'auto', margin: '0 auto 16px', display: 'block' }} />
        <h1 style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>
          Kamu sudah main {GUEST_FREE_STAGES} stage!
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          Masuk atau daftar dulu untuk melanjutkan petualanganmu. Progres yang sudah kamu kumpulkan di HP ini ikut tersimpan ke akunmu.
        </p>
        <button
          onClick={() => router.push(login)}
          style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
        >
          <LogIn size={16} /> Masuk
        </button>
        <button
          onClick={() => router.push('/register')}
          style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}
        >
          <UserPlus size={16} /> Daftar gratis
        </button>
        <button
          onClick={() => router.push(backTo)}
          style={{ background: 'none', border: 'none', color: '#71717a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {backLabel}
        </button>
      </div>
    </main>
  );
}
