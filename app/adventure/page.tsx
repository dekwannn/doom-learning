// src/app/adventure/page.tsx
'use client';
import Link from 'next/link';
import BottomNav from '@/components/Layout/BottomNav';
import AchievementPopup from '@/components/Achievement/AchievementPopup';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore, LANGUAGES } from '@/store/useLanguageStore';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import dummyData from '@/data/dummyData.json';
import jaData from '@/data/jaData.json';
import zhData from '@/data/zhData.json';
import koData from '@/data/koData.json';

// ── IMPORT DRIVER.JS ──
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Lock } from "lucide-react";

/* ─── Language data resolver ──────────────────────────── */
const DATA_MAP: Record<string, any> = {
  en: dummyData,
  ja: jaData,
  zh: zhData,
  ko: koData,
};

function getLangData(code: string | null) {
  return DATA_MAP[code ?? 'en'] ?? dummyData;
}

const CHAPTER_STAGE_COLS: Record<number, number[]> = {
  0: [0.22, 0.50, 0.78, 0.50, 0.22],
  1: [0.78, 0.50, 0.22, 0.50, 0.78],
  2: [0.15, 0.40, 0.70, 0.88, 0.60, 0.25],
  3: [0.85, 0.55, 0.22, 0.55, 0.85, 0.55],
  4: [0.20, 0.80, 0.20, 0.80, 0.20],
  5: [0.50, 0.20, 0.50, 0.80, 0.50],
};
const getColsForChapter = (ci: number) =>
  CHAPTER_STAGE_COLS[ci % Object.keys(CHAPTER_STAGE_COLS).length] ?? CHAPTER_STAGE_COLS[0];
const NODE_D = 72;
const STAGE_ROW_H = 110;
const CHAPTER_HEADER_H = 130;

/* ─── Responsive Hook ─────────────────────────────────────── */
function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setBp('desktop');
      else if (w >= 640) setBp('tablet');
      else setBp('mobile');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

function Stars({ count, max = 3, size = 10 }: { count: number; max?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < count ? '#facc15' : 'none'}
          stroke={i < count ? '#facc15' : '#3f3f46'} strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function CompletedBadge({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <div style={{
      position: 'absolute', top: -2, right: -2, width: size, height: size,
      borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)',
      border: '2px solid #0a0a0d', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 20, boxShadow: '0 2px 8px rgba(16,185,129,0.5)',
    }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function ChapterDecorations({ w, h, color, offsetY }: { w: number; h: number; color: string; offsetY: number }) {
  return (
    <svg className="absolute pointer-events-none" style={{ left: 0, top: offsetY, width: w, height: h, overflow: 'visible' }}>
      <defs>
        <radialGradient id={`cg${offsetY}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} fill={`url(#cg${offsetY})`} />
      <circle cx={w*0.06} cy={h*0.3}  r="18" fill="none" stroke="white" strokeWidth="1" opacity="0.05"/>
      <circle cx={w*0.94} cy={h*0.65} r="14" fill="none" stroke="white" strokeWidth="1" opacity="0.05"/>
      <circle cx={w*0.10} cy={h*0.80} r="8"  fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      <circle cx={w*0.91} cy={h*0.18} r="22" fill="none" stroke="white" strokeWidth="1" opacity="0.04"/>
      <circle cx={w*0.04} cy={h*0.50} r="2.5" fill="white" opacity="0.07"/>
      <circle cx={w*0.96} cy={h*0.42} r="2"   fill="white" opacity="0.06"/>
      <circle cx={w*0.07} cy={h*0.12} r="3"   fill="white" opacity="0.05"/>
      <circle cx={w*0.93} cy={h*0.88} r="2.5" fill="white" opacity="0.05"/>
      <line x1={w*0.02} y1={h*0.22} x2={w*0.12} y2={h*0.22} stroke="white" strokeWidth="1" opacity="0.05" strokeLinecap="round"/>
      <line x1={w*0.88} y1={h*0.75} x2={w*0.98} y2={h*0.75} stroke="white" strokeWidth="1" opacity="0.05" strokeLinecap="round"/>
      <rect x={w*0.04} y={h*0.68} width="5" height="5" rx="1" fill="white" opacity="0.06" transform={`rotate(30,${w*0.04+2.5},${h*0.68+2.5})`}/>
      <rect x={w*0.92} y={h*0.35} width="4" height="4" rx="1" fill="white" opacity="0.06" transform={`rotate(20,${w*0.92+2},${h*0.35+2})`}/>
    </svg>
  );
}

/* ─── Sidebar ─────────────────────────────────────────────── */
function ChapterSidePanel({
  chapters, xp, stageStars, stageUnlocked, completedStages, activeChapterIdx, onChapterClick,
}: {
  chapters: any[]; xp: number; stageStars: any; stageUnlocked: any;
  completedStages: any; activeChapterIdx: number; onChapterClick: (ci: number) => void;
}) {
  const totalStages = chapters.reduce((a: number, ch: any) => a + ch.stages.length, 0);
  const completedCount = Object.values(completedStages as Record<string, boolean>).filter(Boolean).length;
  const pct = Math.round((completedCount / totalStages) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 20px', overflowY: 'auto', height: '100%' }}>
      {/* Progress ring */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width={56} height={56} viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
          <circle cx="28" cy="28" r="22" fill="none" stroke="url(#progressGrad)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${2*Math.PI*22}`}
            strokeDashoffset={`${2*Math.PI*22*(1-completedCount/totalStages)}`}
            transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
          <defs>
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981"/>
              <stop offset="50%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
          </defs>
          <text x="28" y="33" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="800">{pct}%</text>
        </svg>
        <div>
          <p style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Overall</p>
          <p style={{ color: '#52525b', fontSize: 12, lineHeight: 1.5 }}>{completedCount}/{totalStages} stages done</p>
          <div style={{ marginTop: 6, height: 3, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#10b981,#3b82f6,#a855f7)', borderRadius: 99, transition: 'width 1s ease' }}/>
          </div>
        </div>
      </div>

      {/* XP */}
      <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.12)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#facc15"/></svg>
        </div>
        <div>
          <p style={{ color: '#facc15', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{xp}</p>
          <p style={{ color: '#52525b', fontSize: 11, fontWeight: 600, marginTop: 2 }}>Total XP Earned</p>
        </div>
      </div>

      {/* Chapter list */}
      <div>
        <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Chapters</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chapters.map((ch: any, ci: number) => {
            const chUnlocked = xp >= ch.xpRequired;
            const chStages = ch.stages as any[];
            const chCompleted = chStages.filter((s: any) => completedStages[s.id]).length;
            const chPct = Math.round((chCompleted / chStages.length) * 100);
            const isActive = ci === activeChapterIdx;
            return (
              <button key={ch.id} onClick={() => onChapterClick(ci)} style={{
                background: isActive ? `${ch.color}14` : chUnlocked ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.012)',
                border: `1px solid ${isActive ? ch.color+'40' : chUnlocked ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`,
                borderRadius: 14, padding: '12px 14px',
                cursor: chUnlocked ? 'pointer' : 'default',
                opacity: chUnlocked ? 1 : 0.45, textAlign: 'left', transition: 'all 0.2s', width: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: chUnlocked ? 8 : 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: chUnlocked ? ch.color : '#27272a', boxShadow: chUnlocked && isActive ? `0 0 8px ${ch.color}` : 'none' }}/>
                  <span style={{ color: chUnlocked ? (isActive ? '#f4f4f5' : '#e4e4e7') : '#3f3f46', fontSize: 13, fontWeight: 700, flex: 1 }}>{ch.title}</span>
                  <span style={{ color: '#52525b', fontSize: 11 }}>{chUnlocked ? `${chCompleted}/${chStages.length}` : <Lock size={11} />}</span>
                </div>
                {chUnlocked && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${chPct}%`, background: ch.color, borderRadius: 99, boxShadow: `0 0 4px ${ch.color}60`, transition: 'width 0.8s ease' }}/>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Stage Node ──────────────────────────────────────────── */
function StageNode({ stage, ch, si, x, y, w, isUnlocked, isCompleted, stageStarCount, isPressed, onPressStart, onPressEnd, isFirstNode }: {
  stage: any; ch: any; si: number; x: number; y: number; w: number;
  isUnlocked: boolean; isCompleted: boolean; stageStarCount: number; isPressed: boolean;
  onPressStart: () => void; onPressEnd: () => void;
  isFirstNode?: boolean; // ← NEW: tandai node pertama untuk tour
}) {
  const r = 32, circ = 2 * Math.PI * r;
  const nodeXRatio = x / w;
  const labelOnRight = nodeXRatio <= 0.35;
  const labelOnLeft  = nodeXRatio >= 0.65;
  const labelCenter  = !labelOnRight && !labelOnLeft;

  return (
    // ← id="tour-stage-node" hanya pada node pertama yang unlocked
    <div
      id={isFirstNode ? 'tour-stage-node' : undefined}
      style={{ position: 'absolute', left: x - NODE_D/2, top: y - NODE_D/2, width: NODE_D, zIndex: 10 }}
    >
      {isUnlocked && (
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: `radial-gradient(circle,${ch.color}20 0%,transparent 70%)`,
          animation: 'haloPulse 3s ease-in-out infinite',
          animationDelay: `${si * 0.45}s`,
        }}/>
      )}
      <svg width={NODE_D} height={NODE_D} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={NODE_D/2} cy={NODE_D/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4.5"/>
        <circle cx={NODE_D/2} cy={NODE_D/2} r={r} fill="none"
          stroke={isCompleted ? '#10b981' : isUnlocked ? ch.ring : '#1e1e2e'}
          strokeWidth="2.5"
          strokeDasharray={`${isUnlocked ? (stageStarCount > 0 ? circ : circ * 0.35) : 0} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: isUnlocked ? `drop-shadow(0 0 5px ${isCompleted ? '#10b981' : ch.ring}88)` : 'none' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 7, borderRadius: '50%',
        background: isCompleted ? 'radial-gradient(135deg at 35% 25%, rgba(16,185,129,0.15), #0e0e18)' : isUnlocked ? `radial-gradient(135deg at 35% 25%, ${ch.color}18, #0e0e18)` : '#0c0c18',
        border: `1.5px solid ${isCompleted ? '#10b98144' : isUnlocked ? ch.color+'44' : '#1a1a28'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isCompleted ? 'inset 0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.18)' : isUnlocked ? `inset 0 2px 12px rgba(0,0,0,0.6), 0 0 20px ${ch.color}18` : 'none',
        transform: isPressed ? 'scale(0.86)' : 'scale(1)', transition: 'transform 0.12s ease', overflow: 'hidden',
      }}>
        <img src={`/stage/${stage.label}.webp`} alt={stage.label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.2)', position: 'absolute', inset: 0 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}/>
      </div>
      {isCompleted && <CompletedBadge color={ch.color} size={20}/>}
      <div style={{
        position: 'absolute',
        ...(labelCenter
          ? { bottom: -32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: 80 }
          : labelOnRight
            ? { top: '50%', transform: 'translateY(-50%)', left: NODE_D+10, textAlign: 'left', width: 90 }
            : { top: '50%', transform: 'translateY(-50%)', right: NODE_D+10, textAlign: 'right', width: 90 }),
      }}>
        <p style={{ color: isUnlocked ? '#e4e4e7' : '#2d2d3d', fontSize: 11, fontWeight: 800, lineHeight: 1.25, whiteSpace: 'nowrap' }}>{stage.label}</p>
        {isUnlocked && <Stars count={stageStarCount}/>}
      </div>
    </div>
  );
}

/* ─── Language Badge ──────────────────────────────────────── */
function LanguageBadge() {
  const router = useRouter();
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const lang = LANGUAGES.find(l => l.code === (selectedLanguage ?? 'en'));
  if (!lang) return null;
  const flag = selectedLanguage === 'ja' ? 'JA' : selectedLanguage === 'zh' ? 'ZH' : selectedLanguage === 'ko' ? 'KO' : 'EN';
  return (
    <button id="tour-language" onClick={() => router.push('/language-select')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', background: `${lang.color}12`, border: `1px solid ${lang.color}28`, borderRadius: 99, cursor: 'pointer' }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1, color: lang.color }}>{flag}</span>
      <span style={{ color: lang.color, fontSize: 11, fontWeight: 700 }}>{lang.name}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M7 10l5 5 5-5" stroke={lang.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
}

/* ─── Trophy / Leaderboard Button ─────────────────────────── */
function LeaderboardButton() {
  return (
    <Link id="tour-leaderboard" href="/leaderboard" style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(250,204,21,0.07)',
      border: '1px solid rgba(250,204,21,0.18)',
      borderRadius: 99,
      padding: '6px 12px',
      textDecoration: 'none',
      transition: 'all 0.2s',
      flexShrink: 0,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/>
        <path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
        <path d="M6 2h12v7a6 6 0 0 1-12 0V2z"/>
        <path d="M12 15v6"/>
        <path d="M8 21h8"/>
        <path d="M9 15a6 6 0 0 0 6 0"/>
      </svg>
      <span style={{ color: '#facc15', fontSize: 11, fontWeight: 800, letterSpacing: '0.02em' }}>Rank</span>
    </Link>
  );
}

/* ─── Help / Replay Tour Button ───────────────────────────── */
// ← NEW COMPONENT: tombol "?" mengambang di pojok kanan bawah
function HelpButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      title="Show tour guide"
      style={{
        position: 'fixed',
        bottom: 88,          // di atas BottomNav (tinggi ~64px + sedikit margin)
        right: 20,
        zIndex: 50,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.35)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.28)';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.15)';
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </button>
  );
}

/* ─── Tour factory ────────────────────────────────────────── */
// ← NEW: fungsi terpisah agar bisa dipanggil ulang kapanpun
function createTour(onDone?: () => void) {
  return driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    overlayColor: 'rgba(0,0,0,0.72)',
    // ── Custom style via CSS variable override ──
    // Driver.js memakai CSS variables — kita inject style global sekali
    popoverClass: 'lingora-tour-popover',
    steps: [
      {
        element: '#tour-stage-node',
        popover: {
          title: 'Stage',
          description: 'Tap stage untuk mulai sesi belajar. Kumpulkan 3 bintang di tiap stage untuk XP maksimal.',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-xp',
        popover: {
          title: 'XP',
          description: 'XP terkumpul dari setiap stage. Makin banyak XP, makin banyak chapter terbuka.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '#tour-language',
        popover: {
          title: 'Ganti Bahasa',
          description: 'Ganti bahasa target kapan saja. Progres tiap bahasa tersimpan terpisah.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-leaderboard',
        popover: {
          title: 'Peringkat',
          description: 'Lihat posisimu di antara semua pemain. Update setiap kali kamu selesai stage.',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem('tour_adventure_done', 'true');
      onDone?.();
    },
  });
}

/* ─── Main ────────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const bp = useBreakpoint();
  const isWide    = bp === 'tablet' || bp === 'desktop';
  const isDesktop = bp === 'desktop';
  const { loading } = useAuth();

  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const { xp, stageStars, stageUnlocked, completedStages } = useProgress();

  const [mounted,          setMounted]          = useState(false);
  const [pressed,          setPressed]          = useState<string | null>(null);
  const [containerW,       setContainerW]       = useState(390);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Read the store itself: during the first (hydration) render the hook still shows the empty server state
    if (!useLanguageStore.getState().selectedLanguage) router.replace('/language-select');
  }, [selectedLanguage, router]);

  useEffect(() => {
    const el = document.getElementById('map-container');
    if (!el) return;
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── startTour: bisa dipanggil dari auto-run ATAU tombol ? ──
  const startTour = useCallback(() => {
    const tour = createTour();
    setTimeout(() => tour.drive(), 300);
  }, []);

  // ── Auto-run hanya sekali saat first visit ──
  useEffect(() => {
    if (!mounted || loading || !selectedLanguage) return;
    const hasSeenTour = localStorage.getItem('tour_adventure_done');
    if (hasSeenTour) return;
    const tour = createTour();
    const timer = setTimeout(() => tour.drive(), 600);
    return () => { clearTimeout(timer); if (tour.isActive()) tour.destroy(); };
  }, [mounted, loading, selectedLanguage]);

  // ── EARLY RETURN: loading screen ──
  if (!mounted || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0a0d', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#818cf8', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', animation: 'pulse 1.5s infinite' }}>Menyiapkan petualanganmu...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  if (!selectedLanguage) return <div style={{ minHeight: '100vh', background: '#08080f' }}/>;

  // ── Data & layout ──
  const chapters = getLangData(selectedLanguage).chapters as any[];
  const w = containerW;
  const sidebarW = isDesktop ? 280 : 240;

  type StagePos = { x: number; y: number; stageIdx: number; chapterIdx: number; stage: any; ch: any };
  let runningY = 0;

  const chapterLayouts = chapters.map((ch: any, ci: number) => {
    const headerY      = runningY;
    const stagesStartY = runningY + CHAPTER_HEADER_H;
    const cols         = getColsForChapter(ci);
    const stagePositions: StagePos[] = ch.stages.map((stage: any, si: number) => ({
      x: cols[si % cols.length] * w, y: stagesStartY + si * STAGE_ROW_H + NODE_D/2,
      stageIdx: si, chapterIdx: ci, stage, ch,
    }));
    const sectionH = CHAPTER_HEADER_H + ch.stages.length * STAGE_ROW_H + 40;
    runningY += sectionH;
    return { ch, ci, headerY, stagesStartY, stagePositions, sectionH };
  });

  const totalH = runningY + 80;
  const allStagePositions: StagePos[] = chapterLayouts.flatMap((cl: any) => cl.stagePositions);

  const buildContinuousPath = (pts: StagePos[]) => {
    if (pts.length < 2) return '';
    return pts.reduce((acc: string, c: StagePos, i: number) => {
      if (i === 0) return `M ${c.x} ${c.y}`;
      const prev = pts[i-1];
      const cpY  = (prev.y + c.y) / 2;
      return acc + ` C ${prev.x} ${cpY},${c.x} ${cpY},${c.x} ${c.y}`;
    }, '');
  };

  const continuousPath = buildContinuousPath(allStagePositions);

  const chapterSegments: { pathD: string; color: string; ring: string }[] = [];
  let globalIdx = 0;
  for (const { ch, stagePositions } of chapterLayouts) {
    const nextStart = allStagePositions[globalIdx + stagePositions.length];
    const pts = [...stagePositions, ...(nextStart ? [nextStart] : [])];
    chapterSegments.push({ pathD: buildContinuousPath(pts), color: ch.color, ring: ch.ring });
    globalIdx += stagePositions.length;
  }

  const handleChapterClick = (ci: number) => {
    setActiveChapterIdx(ci);
    const el = document.getElementById(`chapter-anchor-${ci}`);
    const scrollEl = document.getElementById('map-scroll');
    if (el && scrollEl) scrollEl.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };

  const handleMapScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = (e.target as HTMLDivElement).scrollTop;
    let best = 0;
    chapterLayouts.forEach(({ headerY, ci }: any) => { if (scrollTop >= headerY - 60) best = ci; });
    setActiveChapterIdx(best);
  };

  // ── Track apakah node pertama sudah dirender ──
  let firstNodeRendered = false;

  /* ── Map renderer ── */
  const renderMap = (mapW: number) => (
    <div id="map-container" style={{ position: 'relative', height: totalH, paddingBottom: 40 }}>
      {chapterLayouts.map(({ ch, ci, headerY, sectionH }: any) => (
        <ChapterDecorations key={ci} w={mapW} h={sectionH} color={ch.color} offsetY={headerY}/>
      ))}

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: totalH, overflow: 'visible', zIndex: 2, pointerEvents: 'none' }}>
        <defs>
          {chapterLayouts.map(({ ch, ci }: any) => (
            <linearGradient key={ci} id={`cgrad${ci}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ch.ring} stopOpacity="0.6"/>
              <stop offset="100%" stopColor={ch.ring} stopOpacity="0.3"/>
            </linearGradient>
          ))}
        </defs>
        <path d={continuousPath} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="6" strokeDasharray="12 9" strokeLinecap="round"/>
        <path d={continuousPath} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" strokeDasharray="12 9" strokeLinecap="round"/>
        {chapterSegments.map((seg, ci) => (
          <g key={ci}>
            <path d={seg.pathD} fill="none" stroke={seg.ring} strokeWidth="6" strokeDasharray="12 9" strokeLinecap="round" opacity="0.12"/>
            <path d={seg.pathD} fill="none" stroke={`url(#cgrad${ci})`} strokeWidth="3" strokeDasharray="12 9" strokeLinecap="round"/>
          </g>
        ))}
      </svg>

      {chapterLayouts.map(({ ch, ci, headerY, stagePositions }: any) => {
        const prevChapter = ci > 0 ? chapters[ci-1] : null;

        // Ambil ID stage terakhir dari chapter sebelumnya
        const lastStageOfPrevChapter = prevChapter ? prevChapter.stages[prevChapter.stages.length - 1].id : null;

        // Chapter terbuka jika: ini chapter pertama ATAU (XP cukup DAN stage terakhir chapter lalu sudah terbuka)
        const isChUnlocked = ci === 0 
          ? xp >= ch.xpRequired 
          : xp >= ch.xpRequired && (lastStageOfPrevChapter ? stageUnlocked[lastStageOfPrevChapter] : true);

        return (
          <div key={ci}>
            <div id={`chapter-anchor-${ci}`} style={{ position: 'absolute', top: headerY, left: 0, height: 1 }}/>
            <div style={{ position: 'absolute', left: 0, right: 0, top: headerY, height: CHAPTER_HEADER_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
              {ci > 0 && <div style={{ width: '60%', height: 1, background: `linear-gradient(90deg,transparent,${ch.color}30,transparent)`, marginBottom: 20 }}/>}
              <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: isChUnlocked ? ch.color : '#2a2a3a', textShadow: isChUnlocked ? `0 0 40px ${ch.color}44` : 'none', transition: 'color 0.3s' }}>{ch.title}</p>
              <p style={{ fontSize: 12, fontWeight: 500, color: isChUnlocked ? '#71717a' : '#2a2a3a', letterSpacing: '0.01em', marginTop: 4 }}>
                {isChUnlocked ? ch.subtitle : `Requires ${ch.xpRequired} XP to unlock`}
              </p>
            </div>

            {ch.stages.map((stage: any, si: number) => {
              const { x, y } = stagePositions[si];
              
              // Syarat 1: Ini stage paling pertama di seluruh aplikasi
              const isFirstStageOverall = ci === 0 && si === 0;
              // Syarat 2: Ini stage pertama di dalam chapternya masing-masing
              const isFirstInChapter = si === 0;

              // Modifikasi: Jika chapter sudah terbuka (XP cukup), maka stage pertamanya otomatis terbuka
              const isUnlocked = isChUnlocked && (
                isFirstStageOverall || 
                isFirstInChapter || 
                (stageUnlocked[stage.id] ?? false)
              );

              const isCompleted  = completedStages[stage.id] === true;
              const starCount    = stageStars[stage.id] ?? 0;
              const isPressedNode = pressed === stage.id;

              // ← Tandai node pertama yang unlocked sebagai anchor tour
              const isFirstUnlockedNode = isUnlocked && !firstNodeRendered;
              if (isFirstUnlockedNode) firstNodeRendered = true;

              const nodeEl = (
                <StageNode
                  stage={stage} ch={ch} si={si} x={x} y={y} w={mapW}
                  isUnlocked={isUnlocked} isCompleted={isCompleted}
                  stageStarCount={starCount} isPressed={isPressedNode}
                  onPressStart={() => setPressed(stage.id)}
                  onPressEnd={() => setPressed(null)}
                  isFirstNode={isFirstUnlockedNode} // ← pass ke StageNode
                />
              );

              return isUnlocked ? (
                <Link key={stage.id} href={`/adventure/${ch.id}/${stage.id}`}
                  onMouseDown={() => setPressed(stage.id)} onMouseUp={() => setPressed(null)}
                  onTouchStart={() => setPressed(stage.id)} onTouchEnd={() => setPressed(null)}>
                  {nodeEl}
                </Link>
              ) : (
                <div key={stage.id}>{nodeEl}</div>
              );
            })}
          </div>
        );
      })}

      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: totalH-68, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0e0e18', border: '2px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#2d2d3d"/></svg>
        </div>
        <p style={{ color: '#1e1e2e', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>To be Continued</p>
      </div>
    </div>
  );

  // ── CSS custom untuk Driver.js popover ──
  const tourStyle = `
    @keyframes haloPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.9;transform:scale(1.18)}}

    /* ── Driver.js popover custom theme ── */
    .lingora-tour-popover.driver-popover {
      background: #12121e !important;
      border: 1px solid rgba(99,102,241,0.25) !important;
      border-radius: 16px !important;
      padding: 18px 20px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1) !important;
      max-width: 260px !important;
      backdrop-filter: blur(12px) !important;
    }
    .lingora-tour-popover .driver-popover-title {
      color: #f4f4f5 !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      margin-bottom: 6px !important;
      letter-spacing: -0.01em !important;
    }
    .lingora-tour-popover .driver-popover-description {
      color: #71717a !important;
      font-size: 12px !important;
      line-height: 1.6 !important;
    }
    .lingora-tour-popover .driver-popover-progress-text {
      color: #3f3f46 !important;
      font-size: 11px !important;
    }
    .lingora-tour-popover .driver-popover-prev-btn,
    .lingora-tour-popover .driver-popover-next-btn {
      background: rgba(99,102,241,0.15) !important;
      border: 1px solid rgba(99,102,241,0.3) !important;
      color: #818cf8 !important;
      border-radius: 8px !important;
      padding: 6px 14px !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      text-shadow: none !important;
      transition: all 0.15s !important;
    }
    .lingora-tour-popover .driver-popover-next-btn {
      background: rgba(99,102,241,0.25) !important;
      border-color: rgba(99,102,241,0.5) !important;
    }
    .lingora-tour-popover .driver-popover-next-btn:hover {
      background: rgba(99,102,241,0.4) !important;
    }
    .lingora-tour-popover .driver-popover-close-btn {
      color: #3f3f46 !important;
      font-size: 16px !important;
    }
    .lingora-tour-popover .driver-popover-close-btn:hover {
      color: #71717a !important;
    }
    /* Arrow warna gelap */
    .driver-popover-arrow-side-top.driver-popover-arrow::before { border-bottom-color: #12121e !important; }
    .driver-popover-arrow-side-bottom.driver-popover-arrow::before { border-top-color: #12121e !important; }
    .driver-popover-arrow-side-left.driver-popover-arrow::before { border-right-color: #12121e !important; }
    .driver-popover-arrow-side-right.driver-popover-arrow::before { border-left-color: #12121e !important; }
  `;

  /* ── TABLET / DESKTOP ── */
  if (isWide) {
    const maxW = isDesktop ? 1100 : 900;
    return (
      <main style={{ background: '#08080f', height: '100vh', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: maxW, height: '100vh', background: 'linear-gradient(170deg,#0c0c16 0%,#08080f 50%,#0c0a14 100%)', borderLeft: '1px solid rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column' }}>

          {/* ── Header tablet/desktop ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0, background: 'rgba(12,12,22,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Adventure</p>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>Learn with LINGORA</h1>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 400, margin: '0 32px' }}>
              {/* ← id="tour-progress" untuk highlight progress bar */}
              <div id="tour-progress" style={{ flex: 1, height: 4, borderRadius: 99, background: '#1a1a28', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100,(xp/6000)*100)}%`, background: 'linear-gradient(90deg,#10b981,#3b82f6,#a855f7)', borderRadius: 99, transition: 'width 1s ease', boxShadow: '0 0 10px rgba(99,102,241,0.55)' }}/>
              </div>
              <span style={{ color: '#52525b', fontSize: 11, whiteSpace: 'nowrap' }}>{Math.round(Math.min(100,(xp/6000)*100))}% complete</span>
            </div>
            {/* Right group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LanguageBadge/>
              <LeaderboardButton/>
              {/* ← id="tour-xp" pada XP counter */}
              <div id="tour-xp" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.16)', borderRadius: 99, padding: '8px 16px' }}>
                <span style={{ color: '#facc15', fontSize: 11, fontWeight: 500, letterSpacing: '0.04em' }}>XP</span>
                <span style={{ color: '#facc15', fontSize: 15, fontWeight: 900 }}>{xp}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `${sidebarW}px 1fr`, flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.04)', background: 'rgba(8,8,15,0.8)', height: 'calc(100vh - 69px)', position: 'sticky', top: 69, overflowY: 'auto', scrollbarWidth: 'none' }}>
              <ChapterSidePanel chapters={chapters} xp={xp} stageStars={stageStars}
                stageUnlocked={stageUnlocked} completedStages={completedStages}
                activeChapterIdx={activeChapterIdx} onChapterClick={handleChapterClick}/>
            </div>
            <div id="map-scroll" onScroll={handleMapScroll} style={{ overflowY: 'auto', overflowX: 'hidden', height: 'calc(100vh - 69px)', scrollbarWidth: 'none', background: 'linear-gradient(170deg,#0c0c16 0%,#08080f 50%,#0c0a14 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'linear-gradient(to bottom,transparent 0%,black 6%,black 94%,transparent 100%)' }}/>
              {renderMap(w)}
            </div>
          </div>
        </div>

        {/* ← Tombol ? replay tour */}
        <HelpButton onStart={startTour}/>
        <style>{tourStyle}</style>
        <AchievementPopup/>
        <BottomNav/>
      </main>
    );
  }

  /* ── MOBILE ── */
  return (
    <main className="flex justify-center" style={{ background: '#08080f', height: '100vh', overflow: 'hidden' }}>
      <div className="relative w-full sm:max-w-md h-full flex flex-col sm:border-x sm:border-white/4"
        style={{ background: 'linear-gradient(170deg,#0c0c16 0%,#08080f 50%,#0c0a14 100%)' }}>
        
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'linear-gradient(to bottom,transparent 0%,black 6%,black 94%,transparent 100%)', zIndex: 0 }}/>

        {/* ── Header mobile (FIXED TOP) ── */}
        <div style={{ paddingTop: 48, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, background: 'rgba(12,12,22,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 40, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <img src="/logo-home.png" alt="Lingora" style={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LanguageBadge/>
              <LeaderboardButton/>
              {/* ← id="tour-xp" pada XP mobile */}
              <div id="tour-xp" style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(250,204,21,0.07)', border:'1px solid rgba(250,204,21,0.16)', borderRadius:99, padding:'6px 11px' }}>
                <span style={{ color:'#facc15', fontSize:10, fontWeight:500, letterSpacing:'0.04em' }}>XP</span>
                <span style={{ color:'#facc15', fontSize:13, fontWeight:900 }}>{xp}</span>
              </div>
            </div>
          </div>

          {/* Progress bar mobile */}
          <div style={{ width:'100%', height:3, borderRadius:99, background:'#1a1a28', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100,(xp/6000)*100)}%`, background:'linear-gradient(90deg,#10b981,#3b82f6,#a855f7)', borderRadius:99, transition:'width 1s ease', boxShadow:'0 0 10px rgba(99,102,241,0.55)' }}/>
          </div>
        </div>

        {/* ── Map Scroll Area ── */}
        <div id="map-scroll" onScroll={handleMapScroll} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', position: 'relative', zIndex: 10, paddingBottom: 112 }}>
          {renderMap(w)}
        </div>

        {/* ← Tombol ? replay tour */}
        <HelpButton onStart={startTour}/>
        <style>{tourStyle}</style>
        <AchievementPopup/>
        <BottomNav/>
      </div>
    </main>
  );
}