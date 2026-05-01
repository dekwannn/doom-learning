// src/components/SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // enter → hold after 600ms
    const t1 = setTimeout(() => setPhase('hold'), 600);
    // hold → exit after 2000ms
    const t2 = setTimeout(() => setPhase('exit'), 2000);
    // call onFinish after exit animation (300ms)
    const t3 = setTimeout(() => onFinish(), 2350);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#07070f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'exit' ? 0 : 1,
        transition: phase === 'exit' ? 'opacity 0.35s ease' : 'none',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Radial glow behind logo */}
      {/* <div
        style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.6)' : 'scale(1)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          pointerEvents: 'none',
        }}
      /> */}

      {/* ── LOGO CONTAINER ── */}
      {/* Ganti src="/images/logo.png" dengan path logo Anda */}
      <div
        style={{
          width: 280,
          height: 280,
        //   borderRadius: 30,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        //   background: 'rgba(255,255,255,0.04)',
        //   border: '1px solid rgba(255,255,255,0.08)',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'scale(0.75) translateY(16px)' : 'scale(1) translateY(0)',
          transition: 'opacity 0.55s cubic-bezier(0.34,1.56,0.64,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 8px 48px rgba(16,185,129,0.15)',
        }}
      >
        
        

          <img
            src="/logo-splash.png" 
            alt="Lingora"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />

          
       
        {/* <span
          style={{
            color: '#10b981',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.05em',
            opacity: 0.4,
          }}
        >
          LOGO
        </span> */}
      </div>

      {/* App name */}
      <p
        style={{
          marginTop: 20,
          color: '#f4f4f5',
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
        }}
      >
        Lingora
      </p>

      {/* Tagline */}
      <p
        style={{
          marginTop: 6,
          color: 'rgba(255,255,255,0.25)',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.08em',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease 0.25s, transform 0.5s ease 0.25s',
        }}
      >
        Belajar Bahasa Inggris
      </p>

      {/* Loading dot indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 56,
          display: 'flex',
          gap: 6,
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.7); opacity: 0.3; }
          50% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}