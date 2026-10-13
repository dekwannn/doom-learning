// src/app/splash/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

type Phase = 'idle' | 'enter' | 'hold' | 'exit' | 'done';
type Speed = 0.5 | 1 | 2;

const BASE_TIMINGS = {
  enter: 600,
  hold: 2000,
  exit: 2350,
  done: 2500,
};

/* ── Logo Placeholder ───────────────────────────────────────
   Ganti isi div ini dengan:
   <img src="/images/logo.png" alt="Lingora"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
──────────────────────────────────────────────────────────── */
function LogoPlaceholder({ size }: { size: 'splash' | 'header' }) {
  const isSplash = size === 'splash';
  return (
    <img src="/logo-splash.png" alt="Lingora"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  );
}

/* ── Splash Overlay ─────────────────────────────────────── */
function SplashOverlay({ phase }: { phase: Phase }) {
  const visible = phase === 'hold' || phase === 'exit';
  const entering = phase === 'enter' || phase === 'hold' || phase === 'exit';

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#07070f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'exit' ? 0 : 1,
      transition: phase === 'exit' ? 'opacity 0.35s ease' : 'none',
      pointerEvents: phase === 'exit' ? 'none' : 'all',
    }}>
      {/* Radial glow */}
      {/* <div style={{
        position: 'absolute',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)',
        opacity: entering ? 1 : 0,
        transform: entering ? 'scale(1)' : 'scale(0.6)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        pointerEvents: 'none',
      }} /> */}

      {/* Logo */}
      <div style={{
        width: 280, height: 280, borderRadius: 0, padding: '20px 20px',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        // background: 'rgba(255,255,255,0.04)',
        // border: '1px solid rgba(255,255,255,0.08)',
        // boxShadow: '0 8px 48px rgba(16,185,129,0.15)',
        opacity: entering ? 1 : 0,
        transform: entering ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(16px)',
        transition: 'opacity 0.55s cubic-bezier(0.34,1.56,0.64,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative', zIndex: 1,
      }}>
        <LogoPlaceholder size="splash" />
      </div>


      {/* Loading dots */}
      <div style={{
        position: 'absolute', bottom: 56,
        display: 'flex', gap: 6,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#10b981', opacity: 0.5,
            animation: 'dotPulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%,100% { transform: scale(0.7); opacity: 0.3; }
          50%      { transform: scale(1);   opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

/* ── Status Badge ───────────────────────────────────────── */
const PHASE_META: Record<Phase, { color: string; label: string }> = {
  idle:  { color: '#3f3f46', label: 'Siap' },
  enter: { color: '#f59e0b', label: 'Enter — logo muncul' },
  hold:  { color: '#3b82f6', label: 'Hold — menahan tampilan' },
  exit:  { color: '#a855f7', label: 'Exit — fade out' },
  done:  { color: '#10b981', label: 'Selesai' },
};

/* ── Main Test Page ─────────────────────────────────────── */
export default function SplashTestPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [speed, setSpeed] = useState<Speed>(1);
  const [timers, setTimers] = useState<ReturnType<typeof setTimeout>[]>([]);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const t = useCallback((ms: number) => ms / speed, [speed]);

  const clearAll = useCallback(() => {
    timers.forEach(clearTimeout);
    setTimers([]);
  }, [timers]);

  const runSplash = useCallback(() => {
    clearAll();
    setPhase('enter');
    setElapsed(null);
    setStartTime(Date.now());

    const ids: ReturnType<typeof setTimeout>[] = [];

    ids.push(setTimeout(() => setPhase('hold'), t(BASE_TIMINGS.enter)));
    ids.push(setTimeout(() => setPhase('exit'), t(BASE_TIMINGS.exit)));
    ids.push(setTimeout(() => {
      setPhase('done');
      setElapsed(Date.now() - Date.now()); // will recalculate below
    }, t(BASE_TIMINGS.done)));

    setTimers(ids);
  }, [t, clearAll]);

  // Track elapsed on done
  useEffect(() => {
    if (phase === 'done' && startTime) {
      setElapsed(Date.now() - startTime);
    }
  }, [phase, startTime]);

  // Auto-run on mount
  useEffect(() => {
    const id = setTimeout(() => runSplash(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = PHASE_META[phase];

  return (
    <main style={{
      minHeight: '100vh',
      background: '#07070f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <SplashOverlay phase={phase} />

      {/* ── Header with logo placeholder ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        display: 'flex', alignItems: 'center',
        gap: 12,
        opacity: phase === 'done' || phase === 'idle' ? 1 : 0.3,
        transition: 'opacity 0.4s ease',
      }}>
        {/* Logo di header */}
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.22)',
          flexShrink: 0,
        }}>
          <LogoPlaceholder size="header" />
        </div>
        <div>
          <p style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Lingora
          </p>
          <p style={{ color: '#52525b', fontSize: 12, marginTop: 2 }}>Good day, keep it up!</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)',
            borderRadius: 10, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: '#facc15', fontSize: 14, fontWeight: 900 }}>0</span>
            <span style={{ color: '#52525b', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP</span>
          </div>
        </div>
      </div>

      {/* ── Phase status ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: meta.color,
          boxShadow: `0 0 8px ${meta.color}`,
          flexShrink: 0,
          transition: 'background 0.3s, box-shadow 0.3s',
        }} />
        <div style={{ flex: 1 }}>
          <p style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 700 }}>{meta.label}</p>
          {phase === 'done' && elapsed != null && (
            <p style={{ color: '#52525b', fontSize: 11, marginTop: 2 }}>
              Total durasi: {(elapsed / 1000).toFixed(2)}s
            </p>
          )}
        </div>
        <div style={{
          background: `${meta.color}15`,
          border: `1px solid ${meta.color}30`,
          borderRadius: 8, padding: '3px 10px',
        }}>
          <span style={{ color: meta.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {phase}
          </span>
        </div>
      </div>

      {/* ── Phase timeline ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Timeline
        </p>
        {(['enter', 'hold', 'exit', 'done'] as Phase[]).map((p, i) => {
          const labels: Record<string, string> = {
            enter: `+${(BASE_TIMINGS.enter / speed / 1000).toFixed(1)}s — Logo muncul`,
            hold:  `+${(BASE_TIMINGS.hold  / speed / 1000).toFixed(1)}s — Dots muncul`,
            exit:  `+${(BASE_TIMINGS.exit  / speed / 1000).toFixed(1)}s — Fade out mulai`,
            done:  `+${(BASE_TIMINGS.done  / speed / 1000).toFixed(1)}s — Home tampil`,
          };
          const phaseOrder: Phase[] = ['idle', 'enter', 'hold', 'exit', 'done'];
          const isDone = phaseOrder.indexOf(phase) > phaseOrder.indexOf(p);
          const isCurrent = phase === p;

          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: isDone ? '#10b981' : isCurrent ? PHASE_META[p].color : '#27272a',
                boxShadow: isCurrent ? `0 0 6px ${PHASE_META[p].color}` : 'none',
                transition: 'all 0.3s',
              }} />
              <span style={{
                fontSize: 12,
                color: isDone ? '#71717a' : isCurrent ? '#e4e4e7' : '#3f3f46',
                transition: 'color 0.3s',
              }}>
                {labels[p]}
              </span>
              {isDone && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Speed selector ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Kecepatan
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {([0.5, 1, 2] as Speed[]).map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '5px 14px', borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                border: '1px solid',
                borderColor: speed === s ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)',
                background: speed === s ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                color: speed === s ? '#10b981' : '#52525b',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── Buttons ── */}
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={runSplash}
          style={{
            height: 50, borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            color: '#fff', fontSize: 14, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '-0.01em',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ulangi Splash Screen
        </button>

        <button
          onClick={() => { clearAll(); setPhase('idle'); }}
          style={{
            height: 46, borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#52525b', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          Reset
        </button>
      </div>

      {/* ── Note ── */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'rgba(250,204,21,0.04)',
        border: '1px solid rgba(250,204,21,0.12)',
        borderRadius: 12, padding: '12px 16px',
      }}>
        <p style={{ color: '#a08a30', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          Ganti <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>LogoPlaceholder</code> dengan{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{`<img src="/images/logo.png" />`}</code>{' '}
          di dua tempat (splash & header).
        </p>
      </div>
    </main>
  );
}