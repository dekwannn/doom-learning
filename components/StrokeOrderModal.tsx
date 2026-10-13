// src/components/StrokeOrderModal.tsx
// KanjiVG data: CC BY 3.0 Ulrich Apel — https://kanjivg.tagaini.net
// Fetches real SVG paths from GitHub raw CDN. viewBox 0 0 109 109.
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
/* ── filename helper ─────────────────────────────────────── */
const toKanjiVGFilename = (char: string): string =>
  `${char.codePointAt(0)!.toString(16).padStart(5, '0')}.svg`;

const KANJIVG_BASE =
  'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';

/* ── types ───────────────────────────────────────────────── */
interface StrokeInfo {
  d: string;                  // SVG path data
  id: string;                 // KanjiVG element id (for ordering)
}

/* ── parse KanjiVG SVG XML ───────────────────────────────── */
function parseKanjiVG(svgText: string): StrokeInfo[] {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(svgText, 'image/svg+xml');
  const paths = doc.querySelectorAll('path[d]');
  return Array.from(paths)
    .filter(p => {
      const d = p.getAttribute('d') ?? '';
      const fill = p.getAttribute('fill') ?? '';
      return fill === '' || fill === 'none' || fill.toLowerCase() === 'none';
    })
    .map(p => ({
      d:  p.getAttribute('d') ?? '',
      id: p.getAttribute('id') ?? '',
    }))
    .filter(s => s.d.length > 0);
}

/* ── cache to avoid re-fetching ─────────────────────────── */
const svgCache: Record<string, StrokeInfo[]> = {};

/* ── row config ─────────────────────────────────────────── */
const ROWS = [
  { label: 'あ行', chars: 'あいうえお' },
  { label: 'か行', chars: 'かきくけこ' },
  { label: 'さ行', chars: 'さしすせそ' },
  { label: 'た行', chars: 'たちつてと' },
  { label: 'な行', chars: 'なにぬねの' },
  { label: 'は行', chars: 'はひふへほ' },
  { label: 'ま行', chars: 'まみむめも' },
  { label: 'や行', chars: 'やゆよ'    },
  { label: 'ら行', chars: 'らりるれろ' },
  { label: 'わ行・ん', chars: 'わをん' },
];

const CHAR_LABELS: Record<string, string> = {
  あ:'A', い:'I', う:'U', え:'E', お:'O',
  か:'KA', き:'KI', く:'KU', け:'KE', こ:'KO',
  さ:'SA', し:'SHI', す:'SU', せ:'SE', そ:'SO',
  た:'TA', ち:'CHI', つ:'TSU', て:'TE', と:'TO',
  な:'NA', に:'NI', ぬ:'NU', ね:'NE', の:'NO',
  は:'HA', ひ:'HI', ふ:'FU', へ:'HE', ほ:'HO',
  ま:'MA', み:'MI', む:'MU', め:'ME', も:'MO',
  や:'YA', ゆ:'YU', よ:'YO',
  ら:'RA', り:'RI', る:'RU', れ:'RE', ろ:'RO',
  わ:'WA', を:'WO', ん:'N',
};

/* ══════════════════════════════════════════════════════════
   ANIMATED STROKE component
   ══════════════════════════════════════════════════════════ */
interface AnimatedStrokeProps {
  d: string;
  state: 'hidden' | 'drawing' | 'done';
  strokeWidth?: number;
  color?: string;
  duration?: number; // ms
}

function AnimatedStroke({
  d, state, strokeWidth = 4.5, color = '#e4e4e7', duration = 700,
}: AnimatedStrokeProps) {
  const pathRef   = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(1000);

  useEffect(() => {
    if (pathRef.current) {
      const l = pathRef.current.getTotalLength();
      if (l > 0) setLen(l);
    }
  }, [d]);

  const dashArray  = len;
  const dashOffset = state === 'done' ? 0 : state === 'drawing' ? 0 : len;
  const transition = state === 'drawing' ? `stroke-dashoffset ${duration}ms cubic-bezier(0.4,0,0.2,1)` : 'none';
  const [offset, setOffset] = useState(len);

  useEffect(() => {
    if (state === 'drawing') {
      setOffset(len);
      requestAnimationFrame(() => requestAnimationFrame(() => setOffset(0)));
    } else if (state === 'done') {
      setOffset(0);
    } else {
      setOffset(len);
    }
  }, [state, len]);

  const isVisible = state !== 'hidden';
  const strokeColor = state === 'drawing' ? '#f59e0b' : state === 'done' ? color : 'rgba(255,255,255,0.08)';
  const sw = state === 'drawing' ? strokeWidth + 0.5 : strokeWidth;

  return (
    <path
      ref={pathRef}
      d={d}
      fill="none"
      stroke={strokeColor}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashArray}
      strokeDashoffset={offset}
      opacity={isVisible ? 1 : 0.08}
      style={{ transition, filter: state === 'drawing' ? `drop-shadow(0 0 4px #f59e0b88)` : 'none' }}
    />
  );
}

/* ── start-point dot ─────────────────────────────────────── */
function StartDot({ d, index, visible }: { d: string; index: number; visible: boolean }) {
  const m = d.match(/M\s*([\d.]+)[,\s]+([\d.]+)/);
  if (!m || !visible) return null;
  const x = parseFloat(m[1]), y = parseFloat(m[2]);
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill="#f59e0b" opacity={0.92}/>
      <text x={x} y={y + 3.8} textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#000" fontFamily="sans-serif">
        {index + 1}
      </text>
    </g>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN MODAL
   ══════════════════════════════════════════════════════════ */
export function StrokeOrderModal({ onClose }: { onClose: () => void }) {
  const [selectedChar, setSelectedChar] = useState('あ');
  const [strokes, setStrokes]   = useState<StrokeInfo[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [phase, setPhase]       = useState<'idle' | 'playing' | 'done'>('idle');
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [doneCount, setDoneCount]   = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const loadChar = useCallback(async (char: string) => {
    clearTimers(); setPhase('idle'); setCurrentIdx(-1); setDoneCount(0); setError('');
    if (svgCache[char]) { setStrokes(svgCache[char]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${KANJIVG_BASE}${toKanjiVGFilename(char)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseKanjiVG(text);
      if (parsed.length === 0) throw new Error('No strokes found');
      svgCache[char] = parsed;
      setStrokes(parsed);
    } catch (e: any) {
      setError(`Gagal memuat data (${e.message}).`); setStrokes([]);
    } finally {
      setLoading(false);
    }
  }, [clearTimers]);

  useEffect(() => { loadChar('あ'); }, [loadChar]);
  const selectChar = (char: string) => { setSelectedChar(char); loadChar(char); };

  const STROKE_DURATION = 750; const PAUSE_AFTER = 200;
  const startAnimation = () => {
    if (phase === 'playing' || strokes.length === 0) return;
    clearTimers(); setDoneCount(0); setCurrentIdx(-1); setPhase('playing');
    strokes.forEach((_, i) => {
      timersRef.current.push(setTimeout(() => setCurrentIdx(i), i * (STROKE_DURATION + PAUSE_AFTER)));
      timersRef.current.push(setTimeout(() => { setDoneCount(i + 1); setCurrentIdx(-1); }, i * (STROKE_DURATION + PAUSE_AFTER) + STROKE_DURATION));
    });
    timersRef.current.push(setTimeout(() => setPhase('done'), strokes.length * (STROKE_DURATION + PAUSE_AFTER)));
  };

  const reset = () => { clearTimers(); setPhase('idle'); setCurrentIdx(-1); setDoneCount(0); };
  const showAll = () => { clearTimers(); setPhase('done'); setCurrentIdx(-1); setDoneCount(strokes.length); };
  const getStrokeState = (i: number): 'hidden' | 'drawing' | 'done' => {
    if (phase === 'idle') return 'hidden';
    if (i < doneCount) return 'done';
    if (i === currentIdx) return 'drawing';
    return 'hidden';
  };

  const label = CHAR_LABELS[selectedChar] ?? selectedChar;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      {/* ─── CSS Media Query untuk Responsivitas ─── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .som-container {
          width: 100%; max-width: 800px; max-height: 92vh; background: #0e0e14; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.9);
        }
        .som-body {
          display: flex; flex: 1; min-height: 0; overflow: hidden; flex-direction: row;
        }
        .som-sidebar {
          width: 220px; border-right: 1px solid rgba(255,255,255,0.05); overflow-y: auto; scrollbar-width: none;
          flex-shrink: 0; padding: 12px 0 16px;
        }
        .som-sidebar::-webkit-scrollbar, .som-content::-webkit-scrollbar { display: none; }
        .som-content {
          flex: 1; display: flex; flex-direction: column; padding: 18px 20px; gap: 14px; overflow-y: auto; scrollbar-width: none;
        }
        .som-controls {
          display: flex; gap: 8px;
        }
        @media (max-width: 768px) {
          .som-container {
            height: 96vh; border-radius: 16px;
          }
          .som-body {
            flex-direction: column-reverse; /* Pindahkan daftar huruf ke bawah pada mode HP */
          }
          .som-sidebar {
            width: 100%; height: 32%; border-right: none; border-top: 1px solid rgba(255,255,255,0.05);
            padding-bottom: 24px; padding-top: 14px;
          }
          .som-content {
            height: 68%; padding: 14px 16px; gap: 12px;
          }
          .som-char-info { gap: 12px !important; }
          .som-char-box { width: 56px !important; height: 56px !important; }
          .som-char-text { font-size: 34px !important; }
          .som-controls { flex-wrap: wrap; }
          .som-btn-anim { flex: 0 0 100%; } /* Tombol animasi full width pada mobile */
        }
      `}</style>

      <div className="som-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ color: '#f59e0b', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 3px' }}>Animasi Stroke Order · KanjiVG</p>
            <h3 style={{ color: '#f4f4f5', fontSize: 16, fontWeight: 800, margin: 0 }}>Urutan Goresan Hiragana</h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#71717a' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="som-body">
          {/* Left / Bottom: char picker */}
          <div className="som-sidebar">
            {ROWS.map(row => (
              <div key={row.label} style={{ marginBottom: 10 }}>
                <p style={{ color: '#3f3f46', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 12px 5px', margin: 0 }}>{row.label}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 8px' }}>
                  {[...row.chars].map(ch => {
                    const isSel = selectedChar === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => selectChar(ch)}
                        style={{ width: 38, height: 38, borderRadius: 10, background: isSel ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.07)'}`, color: isSel ? '#f59e0b' : '#a1a1aa', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right / Top: canvas content */}
          <div className="som-content">
            {/* Char info */}
            <div className="som-char-info" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="som-char-box" style={{ width: 68, height: 68, borderRadius: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="som-char-text" style={{ fontSize: 42, lineHeight: 1 }}>{selectedChar}</span>
              </div>
              <div>
                <p style={{ color: '#f4f4f5', fontSize: 22, fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{label}</p>
                <p style={{ color: '#52525b', fontSize: 11, margin: '0 0 8px' }}>
                  {loading ? 'Memuat...' : error ? 'Error' : `${strokes.length} goresan`}
                </p>
                {/* stroke counter pills */}
                {!loading && !error && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {strokes.map((_, i) => {
                      const state = getStrokeState(i);
                      const isDone   = state === 'done';
                      const isActive = state === 'drawing';
                      return (
                        <div key={i} style={{ width: 26, height: 26, borderRadius: 8, background: isDone ? 'rgba(245,158,11,0.18)' : isActive ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isDone ? 'rgba(245,158,11,0.5)' : isActive ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? '#f59e0b' : isActive ? '#fff' : '#3f3f46' }}>{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* SVG canvas */}
            <div style={{ background: '#06060f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: 10, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid rgba(245,158,11,0.25)', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite' }}/>
                  <p style={{ color: '#52525b', fontSize: 12, margin: 0 }}>Memuat KanjiVG...</p>
                </div>
              )}
              {error && (
                <div style={{ textAlign: 'center', padding: '0 20px' }}>
                  <p style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>Gagal memuat</p>
                  <p style={{ color: '#71717a', fontSize: 11, margin: 0 }}>{error}</p>
                </div>
              )}
              {!loading && !error && strokes.length > 0 && (
                <svg viewBox="0 0 109 109" style={{ width: '100%', height: '100%', display: 'block' }}>
                  <line x1="54.5" y1="3"   x2="54.5" y2="106" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                  <line x1="3"   y1="54.5" x2="106"  y2="54.5" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
                  <rect x="3" y="3" width="103" height="103" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" rx="2"/>
                  {strokes.map((stroke, i) => (
                    <AnimatedStroke key={`${selectedChar}-${i}`} d={stroke.d} state={getStrokeState(i)} duration={STROKE_DURATION} />
                  ))}
                  {strokes.map((stroke, i) => (
                    <StartDot key={`dot-${i}`} d={stroke.d} index={i} visible={getStrokeState(i) !== 'hidden'} />
                  ))}
                </svg>
              )}
            </div>

            {/* Controls */}
            <div className="som-controls">
              <button
                className="som-btn-anim"
                onClick={startAnimation}
                disabled={loading || !!error || phase === 'playing'}
                style={{ flex: 2, height: 44, borderRadius: 12, background: (loading || !!error || phase === 'playing') ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.12)', border: `1px solid ${(loading || !!error || phase === 'playing') ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.4)'}`, color: (loading || !!error || phase === 'playing') ? '#71717a' : '#f59e0b', fontSize: 13, fontWeight: 700, cursor: (loading || !!error || phase === 'playing') ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
              >
                {phase === 'playing'
                  ? <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #f59e0b', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }}/> Sedang animasi...</>
                  : <><svg width="11" height="12" viewBox="0 0 11 12" fill="none"><polygon points="1,0.5 10.5,6 1,11.5" fill="#f59e0b"/></svg> Mulai Animasi</>
                }
              </button>
              <button onClick={reset} disabled={loading} style={{ flex: 1, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
                Reset
              </button>
              <button onClick={showAll} disabled={loading || !!error} style={{ flex: 1, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 13, fontWeight: 700, cursor: (loading || !!error) ? 'default' : 'pointer' }}>
                Semua
              </button>
            </div>

            {/* Tip */}
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <p style={{ color: '#a08a30', fontSize: 11, lineHeight: 1.65, margin: 0 }}>
                Data goresan menggunakan <strong style={{ color: '#f59e0b' }}>KanjiVG</strong> (CC BY 3.0) — yang tersedia open source.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}