'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Download, Instagram, Map as MapIcon,
  House, BotMessageSquare, BookOpen, UserRound, Flame, Lock,
  ChevronRight, Zap, Globe, CheckCircle2, Cpu,
  AlertCircle, Layers, Code2, Volume2, MessageSquare, Mic, Target, Lightbulb,  Bot, Map, Link as LinkIcon, Headphones, Gift, Edit3,
  TrendingUp,
  Star,
  Award,
  List,
  ChevronLeft,
  Repeat,
  FastForward,
  Sparkles,
  Play,
  MessageCircle,
  Sprout,
  Trophy,
  BadgeCheck,
  Check
} from 'lucide-react';

// ─── FONT INJECTION ────────────────────────────────────────────────────────────
const FONT_URL = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap');`;

// ─── DESIGN TOKENS (slide-level only) ─────────────────────────────────────────
const T = {
  bg: '#06060e',
  card: '#0f0f1c',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0ff',
  sub: '#9090b0',
  muted: '#585870',
  dim: '#2e2e48',
  green: '#05e89c',
  green2: '#03c282',
  blue: '#3d9eff',
  purple: '#b06aff',
  amber: '#ffbf2e',
  red: '#ff5252',
  sky: '#28d4f0',
};

// ─── SLIDE TYPOGRAPHY ─────────────────────────────────────────────────────────
const syne = "'Bricolage Grotesque', sans-serif";
const dm = "'DM Sans', sans-serif";

// ─── DUMMY DATA (SAMA PERSIS ASLI) ────────────────────────────────────────────
const CHAPTER = { id: '1', title: 'Chapter 1', subtitle: 'Greetings & Basic Introduction', xpRequired: 0, color: '#10b981', ring: '#34d399' };
const STAGE_DATA = [
  { id: '1-1', label: 'Greetings',        type: 'vocabulary',   xpReward: 100, unlocked: true,  stars: 3, completed: true  },
  { id: '1-2', label: 'Expressions',      type: 'quiz',         xpReward: 100, unlocked: true,  stars: 1, completed: false },
  { id: '1-3', label: 'Introducing',      type: 'conversation', xpReward: 100, unlocked: false, stars: 0, completed: false },
  { id: '1-4', label: 'Basic Pronouns',   type: 'vocabulary',   xpReward: 100, unlocked: false, stars: 0, completed: false },
  { id: '1-5', label: 'Simple Sentences', type: 'quiz',         xpReward: 100, unlocked: false, stars: 0, completed: false },
];
const MOCK_STATE = { xp: 340, streak: 5, completedCount: 1 };

// ─── SHARED PHONE COMPONENTS (SAMA PERSIS ASLI) ───────────────────────────────

function AppLogo() {
  return (
    <div style={{ width: 100, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src="/logo-home.png" alt="Lingora" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

function BottomNavBar({ activeTab = 'Home' }: { activeTab?: string }) {
  const NAV = [
    { label: 'Home', Icon: House, color: '#34d399', active: activeTab === 'Home' },
    { label: 'Adventure', Icon: MapIcon, color: '#fb923c', active: activeTab === 'Adventure' },
    { label: 'Assistant', Icon: BotMessageSquare, color: '#6366f1', active: activeTab === 'Assistant', elevated: true },
    { label: 'Courses', Icon: BookOpen, color: '#60a5fa', active: activeTab === 'Courses' },
    { label: 'Profile', Icon: UserRound, color: '#c084fc', active: activeTab === 'Profile' },
  ];
  return (
    <div style={{ width: '100%', height: 70, background: 'rgba(7,7,12,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', borderRadius: '22px 22px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'absolute', bottom: 0, left: 0, zIndex: 50 }}>
      {NAV.map((n) => {
        if (n.elevated) return (
          <div key={n.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: -26 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', border: '2.5px solid rgba(7,7,12,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.55)' }}>
              <n.Icon size={22} color={n.active ? n.color : '#52525b'} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: n.active ? n.color : '#3f3f46' }}>{n.label}</span>
          </div>
        );
        return (
          <div key={n.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 40, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.active ? `${n.color}14` : 'transparent', border: n.active ? `1px solid ${n.color}28` : '1px solid transparent' }}>
              <n.Icon size={20} color={n.active ? n.color : '#3f3f46'} strokeWidth={n.active ? 2.2 : 1.8} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: n.active ? n.color : '#3f3f46' }}>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const PhoneWrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    width: 390, height: 750, background: '#0a0a0d', position: 'relative', overflow: 'hidden',
    borderRadius: 44, border: '12px solid #1e1e2e',
    boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.05)',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)', zIndex: 100, pointerEvents: 'none' }} />
    {children}
  </div>
);

// ─── MOCKUP SCREEN COMPONENTS (SAMA PERSIS ASLI) ──────────────────────────────

const SplashContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#07070f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.01) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
    <div style={{ width: 280, height: 280, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
      <img src="/logo-splash.png" alt="Lingora" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
    <div style={{ position: 'absolute', bottom: 56, display: 'flex', gap: 6 }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', opacity: 0.9 }} />
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', opacity: 0.5 }} />
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', opacity: 0.3 }} />
    </div>
  </div>
);

// ─── 2. HOME SCREEN (Sesuai dengan page.tsx terbaru) ───
const HomeContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0d', position: 'relative', overflow: 'hidden' }}>
    
    {/* Background Decorations */}
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'linear-gradient(to bottom,transparent 0%,black 8%,black 90%,transparent 100%)' }} />
    <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 340, height: 220, background: `radial-gradient(ellipse at center, rgba(16,185,129,0.15) 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

    <div style={{ position: 'relative', zIndex: 1, padding: '48px 22px 0', height: '100%', overflowY: 'hidden', scrollbarWidth: 'none' }}>
      
      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <img src="/logo-home.png" alt="Lingora" style={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: `rgba(59,130,246,0.15)`, border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 99, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1 }}>EN</span>
            <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700 }}>English</span>
          </div>
          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 99, padding: '6px 12px' }}>
            <span style={{ color: '#facc15', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>{MOCK_STATE.xp}</span>
            <span style={{ color: '#52525b', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>XP</span>
          </div>
        </div>
      </div>

      {/* ── XP Progress Card ── */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: `0 0 8px #10b981` }} />
            <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 700 }}>Chapter 1</span>
            <span style={{ color: '#3f3f46', fontSize: 11 }}>·</span>
            <span style={{ color: '#52525b', fontSize: 12 }}>Greetings</span>
          </div>
          <span style={{ color: '#52525b', fontSize: 11, fontWeight: 700 }}>68%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `68%`, background: `linear-gradient(90deg,#10b981,#34d399)`, borderRadius: 99, boxShadow: `0 0 12px rgba(16,185,129,0.6)` }} />
        </div>
        <p style={{ color: '#3f3f46', fontSize: 11, marginTop: 10 }}>260 XP to unlock Chapter 2</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(96,165,250,0.12)`, border: `1px solid rgba(96,165,250,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BookOpen size={16} color="#60a5fa" /></div>
          <div>
            <p style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>1</p>
            <p style={{ color: '#52525b', fontSize: 11, fontWeight: 600, marginTop: 3 }}>Stages Done</p>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(245,158,11,0.12)`, border: `1px solid rgba(245,158,11,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Zap size={16} color="#f59e0b" /></div>
          <div>
            <p style={{ color: '#fff', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>23</p>
            <p style={{ color: '#52525b', fontSize: 11, fontWeight: 600, marginTop: 3 }}>Remaining</p>
          </div>
        </div>
      </div>

      {/* ── Continue Banner ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Continue where you left off</p>
        <div style={{ background: `linear-gradient(135deg,rgba(16,185,129,0.14),rgba(16,185,129,0.08))`, border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 18, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 4px 32px rgba(16,185,129,0.12)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `rgba(16,185,129,0.2)`, border: `1px solid rgba(16,185,129,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={20} color="#10b981" />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Expressions</p>
              <p style={{ color: '#52525b', fontSize: 12 }}>Chapter 1 · Greetings</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `rgba(16,185,129,0.15)`, border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 10, padding: '6px 10px' }}>
            <ChevronRight size={18} color="#10b981" />
          </div>
        </div>
      </div>

      {/* ── All Chapters ── */}
      <div style={{ marginBottom: 12 }}>
        <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>All Chapters</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Chapter 1 Unlocked */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: '#10b981', boxShadow: `0 0 10px rgba(16,185,129,0.8)` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 700, display: 'block' }}>Chapter 1</span>
                <span style={{ color: '#52525b', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>1/5</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `20%`, background: '#10b981', borderRadius: 99, boxShadow: `0 0 6px rgba(16,185,129,0.6)` }} />
              </div>
            </div>
            <ChevronRight size={14} color="#3f3f46" />
          </div>
          
          {/* Chapter 2 Locked */}
          <div style={{ background: 'rgba(255,255,255,0.012)', border: `1px solid rgba(255,255,255,0.03)`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.45 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: '#27272a' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#3f3f46', fontSize: 13, fontWeight: 700, display: 'block' }}>Chapter 2</span>
                <span style={{ color: '#52525b', fontSize: 11, flexShrink: 0, marginLeft: 8 }}><Lock size={10} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 3 }} />600 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    
    <BottomNavBar activeTab="Home" />
  </div>
);

// ─── ADVENTURE UI SUB-COMPONENTS ─────────────────────────────────────────────

function CompletedBadge({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <div style={{ position: 'absolute', top: -2, right: -2, width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', border: '2px solid #0a0a0d', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, boxShadow: '0 2px 8px rgba(16,185,129,0.5)' }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

function AdvStars({ count, max = 3, size = 10 }: { count: number; max?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < count ? '#facc15' : 'none'} stroke={i < count ? '#facc15' : '#3f3f46'} strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
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
      <circle cx={w*0.91} cy={h*0.18} r="22" fill="none" stroke="white" strokeWidth="1" opacity="0.04"/>
      <circle cx={w*0.04} cy={h*0.50} r="2.5" fill="white" opacity="0.07"/>
      <circle cx={w*0.07} cy={h*0.12} r="3"   fill="white" opacity="0.05"/>
    </svg>
  );
}

// ─── MAIN ADVENTURE CONTENT ──────────────────────────────────────────────────
const AdventureContent = () => {
  const W = 390; 
  const NODE_D = 72; 
  const STAGE_ROW_H = 110;
  // ── DIPERBESAR: Agar ada ruang untuk tulisan chapter di bawah header ──
  const CHAPTER_HEADER_H = 220; 
  
  const COLS = [0.22, 0.50, 0.78, 0.50, 0.22, 0.50];
  
  const positions = STAGE_DATA.map((stage, si) => ({ 
    ...stage, 
    x: COLS[si % COLS.length] * W, 
    y: CHAPTER_HEADER_H + si * STAGE_ROW_H + NODE_D / 2 
  }));

  const path = positions.reduce((acc, c, i, arr) => { 
    if (i === 0) return `M ${c.x} ${c.y}`; 
    const p = arr[i - 1]; 
    const cy = (p.y + c.y) / 2; 
    return acc + ` C ${p.x} ${cy}, ${c.x} ${cy}, ${c.x} ${c.y}`; 
  }, '');

  const totalH = CHAPTER_HEADER_H + STAGE_DATA.length * STAGE_ROW_H + 40;
  const completedStages = STAGE_DATA.filter(s => s.completed).length;
  const progressPct = Math.round((completedStages / STAGE_DATA.length) * 100) || 8;

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'linear-gradient(170deg,#0c0c16 0%,#08080f 50%,#0c0a14 100%)', 
      position: 'relative', 
      overflow: 'hidden', 
      scrollbarWidth: 'none' 
    }}>
      
      {/* ── HEADER STICKY ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, padding: '48px 20px 16px', background: 'linear-gradient(to bottom, #0c0c16 75%, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          
          <img src="/logo-home.png" alt="Lingora" style={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.18)', borderRadius: 99, padding: '6px 12px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M6 2h12v7a6 6 0 0 1-12 0V2z"/><path d="M12 15v6"/><path d="M8 21h8"/><path d="M9 15a6 6 0 0 0 6 0"/>
              </svg>
              <span style={{ color: '#facc15', fontSize: 11, fontWeight: 800, letterSpacing: '0.02em' }}>Rank</span>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(250,204,21,0.07)', border:'1px solid rgba(250,204,21,0.16)', borderRadius:99, padding:'6px 11px' }}>
              <span style={{ color:'#facc15', fontSize:10, fontWeight:500, letterSpacing:'0.04em' }}>XP</span>
              <span style={{ color:'#facc15', fontSize:13, fontWeight:900 }}>{MOCK_STATE.xp}</span>
            </div>
          </div>
        </div>

        <div style={{ width:'100%', height:3, borderRadius:99, background:'#1a1a28', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg,#10b981,#3b82f6,#a855f7)', borderRadius:99, boxShadow: '0 0 10px rgba(99,102,241,0.55)' }} />
        </div>
      </div>

      {/* ── MAP AREA ── */}
      <div style={{ position: 'relative', height: totalH, paddingBottom: 100 }}>
        <ChapterDecorations w={W} h={totalH} color={CHAPTER.color} offsetY={0} />

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: totalH, overflow: 'visible', zIndex: 2, pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHAPTER.ring} stopOpacity="0.6"/>
              <stop offset="100%" stopColor={CHAPTER.ring} stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="6" strokeDasharray="12 9" strokeLinecap="round"/>
          <path d={path} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" strokeDasharray="12 9" strokeLinecap="round"/>
          <path d={path} fill="none" stroke={CHAPTER.ring} strokeWidth="6" strokeDasharray="12 9" strokeLinecap="round" opacity="0.12"/>
          <path d={path} fill="none" stroke="url(#pathGrad)" strokeWidth="3" strokeDasharray="12 9" strokeLinecap="round"/>
        </svg>

        {/* ── POSISI CHAPTER TEXT DITURUNKAN KE BAWAH (top: 70) ── */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 100, height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: CHAPTER.color, textShadow: `0 0 40px ${CHAPTER.color}44`, margin: '0 0 4px' }}>{CHAPTER.title}</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#71717a', letterSpacing: '0.01em', margin: 0 }}>{CHAPTER.subtitle}</p>
        </div>

        {positions.map((sp) => {
          const r = 32; const circ = 2 * Math.PI * r;
          const dashArray = sp.completed ? circ : sp.unlocked ? (sp.stars > 0 ? circ : circ * 0.35) : 0;
          const xRatio = sp.x / W; 
          const labelSide = xRatio <= 0.35 ? 'right' : xRatio >= 0.65 ? 'left' : 'bottom';

          return (
            <div key={sp.id} style={{ position: 'absolute', left: sp.x - NODE_D / 2, top: sp.y - NODE_D / 2, width: NODE_D, height: NODE_D, zIndex: 10 }}>
              {sp.unlocked && <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `radial-gradient(circle,${CHAPTER.color}25 0%,transparent 70%)` }} />}
              <svg width={NODE_D} height={NODE_D} viewBox={`0 0 ${NODE_D} ${NODE_D}`} style={{ display: 'block', transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
                <circle cx={NODE_D/2} cy={NODE_D/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4.5} />
                <circle cx={NODE_D/2} cy={NODE_D/2} r={r} fill="none" stroke={sp.completed ? '#10b981' : sp.unlocked ? CHAPTER.ring : '#1e1e2e'} strokeWidth={2.5} strokeDasharray={`${dashArray} ${circ}`} strokeLinecap="round" style={{ filter: sp.unlocked ? `drop-shadow(0 0 5px ${sp.completed ? '#10b981' : CHAPTER.ring}88)` : 'none' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: sp.completed ? 'radial-gradient(135deg at 35% 25%, rgba(16,185,129,0.15), #0e0e18)' : sp.unlocked ? `radial-gradient(135deg at 35% 25%, ${CHAPTER.color}18, #0e0e18)` : '#0c0c18', border: `1.5px solid ${sp.completed ? '#10b98144' : sp.unlocked ? CHAPTER.color+'44' : '#1a1a28'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 2, boxShadow: sp.completed ? 'inset 0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.18)' : sp.unlocked ? `inset 0 2px 12px rgba(0,0,0,0.6), 0 0 20px ${CHAPTER.color}18` : 'none' }}>
                <img src={`/stage/${sp.label}.webp`} alt={sp.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: sp.unlocked ? 'none' : 'grayscale(1) brightness(0.2)', position: 'absolute', top: 0, left: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {!sp.unlocked && <Lock size={16} color="#2d2d3d" strokeWidth={1.5} style={{ position: 'relative', zIndex: 1 }} />}
              </div>
              {sp.completed && <CompletedBadge color={CHAPTER.color} size={20} />}
              <div style={{ position: 'absolute', ...(labelSide === 'right' ? { top: '50%', transform: 'translateY(-50%)', left: NODE_D + 10, textAlign: 'left', width: 110 } : labelSide === 'left' ? { top: '50%', transform: 'translateY(-50%)', right: NODE_D + 10, textAlign: 'right', width: 110 } : { bottom: -32, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: 110 }) }}>
                <p style={{ color: sp.unlocked ? '#e4e4e7' : '#2d2d3d', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', margin: 0, lineHeight: 1.25 }}>{sp.label}</p>
                {sp.unlocked && <div style={{ display: 'flex', justifyContent: labelSide === 'right' ? 'flex-start' : labelSide === 'left' ? 'flex-end' : 'center' }}><AdvStars count={sp.stars} /></div>}
              </div>
            </div>
          );
        })}
      </div>
      
      <BottomNavBar activeTab="Adventure" />
    </div>
  );
};

const QuizContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0d', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ color:'#71717a' }}><ChevronRight size={20} style={{ transform:'rotate(180deg)' }} /></div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981' }} /><span style={{ color:'#d4d4d8', fontSize:12, fontWeight:700 }}>Expressions</span></div>
      <div style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)', borderRadius:99, padding:'4px 10px' }}><span style={{ color:'#facc15', fontSize:12, fontWeight:800 }}>340 XP</span></div>
    </div>
    <div style={{ height:3, background:`linear-gradient(90deg,#10b981,#34d399)` }} />
    <div style={{ padding:'12px 18px 8px' }}>
      <div style={{display:'flex',alignItems:'center',gap:10}}><div style={{flex:1,height:6,background:'rgba(255,255,255,0.06)',borderRadius:99}}><div style={{height:'100%',width:`33%`,background:'#10b981',borderRadius:99}}/></div><span style={{color:'#3f3f46',fontSize:11,fontWeight:700}}>2/6</span></div>
    </div>
    <div style={{ flex:1, padding:'24px 18px', display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{background:'linear-gradient(160deg,#13131a,#0f0f14)',borderRadius:22,padding:'20px',border:'1px solid rgba(255,255,255,0.07)'}}>
        <p style={{color:'#3f3f46',fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Translation</p>
        <p style={{color:'#52525b',fontSize:12,fontStyle:'italic',marginBottom:10,borderLeft:`2px solid #10b98130`,paddingLeft:10}}>Choose correct meaning</p>
        <h2 style={{fontSize:20,fontWeight:900,color:'#fff',lineHeight:1.4}}>Good morning, how are you?</h2>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8, marginTop: 8}}>
        <div style={{background:`#10b98118`,border:`1px solid #10b981`,color:'#fff',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <span style={{color:'#10b981',fontWeight:800,fontSize:11}}>A</span><span style={{fontSize:14,fontWeight:500}}>Selamat pagi, apa kabar?</span>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:`1px solid rgba(255,255,255,0.07)`,color:'#d4d4d8',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
          <span style={{color:'#3f3f46',fontWeight:800,fontSize:11}}>B</span><span style={{fontSize:14,fontWeight:500}}>Selamat malam, sampai jumpa.</span>
        </div>
      </div>
    </div>
    <div style={{ padding:'10px 18px 24px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width:'100%', height:52, borderRadius:14, background:`#10b9811a`, border:`1px solid #10b98144`, color:'#10b981', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>Check Answer</div>
    </div>
  </div>
);

const AssistantContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0d', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', paddingTop: '28px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,13,0.85)', zIndex: 10 }}>
      <div style={{ color: '#a1a1aa' }}><ChevronRight size={24} style={{ transform:'rotate(180deg)' }} /></div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}><img src="/logo-home.png" alt="Lingora" style={{ width: 72, height: 72, objectFit: 'contain' }} /></div>
      <div style={{ width: 24 }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '62px 20px', textAlign: 'center' }}>
      <div style={{ width: 250, height: 86, borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}><img src="/maskot.png" alt="Lingo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f4f4f5', margin: '0 0 8px' }}>Hello, I'm Lingo</h2>
      <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 280 }}>Your personal English assistant. Ask me anything about grammar or vocabulary.</p>
    </div>
    <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,16,0.96)', display: 'flex', gap: 10, paddingBottom: 85 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 13, padding: '10px 14px', color: '#52525b', fontSize: 13 }}>Ask Lingo...</div>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} color="#52525b" /></div>
    </div>
    <BottomNavBar activeTab="Assistant" />
  </div>
);

const AssistantChatContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0d', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', flexShrink: 0 }}>
      <div style={{ color: '#a1a1aa' }}><ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /></div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <img src="/logo-home.png" alt="Lingora" style={{ width: 60, height: 60, objectFit: 'contain' }} />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 10px' }}>
        <span style={{ color: '#71717a', fontSize: 10, fontWeight: 600 }}>Reset</span>
      </div>
    </div>
    <div style={{ flex: 1, overflowY: 'hidden', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 2 }}>
        {['EN Inggris', 'KO Korea', 'JA Jepang', 'ZH Mandarin'].map((l, i) => (
          <div key={i} style={{ padding: '2px 8px', borderRadius: 99, border: i === 0 ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.07)', background: i === 0 ? 'rgba(59,130,246,0.1)' : 'transparent', color: i === 0 ? '#93c5fd' : '#52525b', fontSize: 9, fontWeight: 600 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: '14px 14px 3px 14px', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', fontSize: 12, lineHeight: 1.6, color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
          Bagaimana cara mengucapkan "I'm grateful for your help"?
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
        <img src="/maskot.png" alt="Lingo" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ maxWidth: '83%', padding: '9px 13px', borderRadius: '14px 14px 14px 3px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11.5, lineHeight: 1.65, color: '#d4d4d8' }}>
          Kalimat <strong style={{ color: '#60a5fa' }}>"I'm grateful for your help"</strong> diucapkan seperti ini:
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 6px', padding: '7px 10px', borderRadius: 9, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none"><polygon points="6,3 20,12 6,21" fill="#60a5fa" /></svg>
            </div>
            <span style={{ color: '#93c5fd', fontSize: 11, fontWeight: 600 }}>I'm grateful for your help</span>
          </div>
          Tekanan pada <strong style={{ color: '#60a5fa' }}>"GRATE-ful"</strong> — ucapkan pelan dan jelas.
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: '14px 14px 3px 14px', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', fontSize: 12, lineHeight: 1.6, color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
          Beri saya contoh kalimat lain
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
        <img src="/maskot.png" alt="Lingo" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ maxWidth: '83%', padding: '9px 13px', borderRadius: '14px 14px 14px 3px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11.5, lineHeight: 1.65, color: '#d4d4d8' }}>
          Tentu! Beberapa contoh:<br />
          • <strong style={{ color: '#60a5fa' }}>"Thank you so much"</strong> — Terima kasih banyak<br />
          • <strong style={{ color: '#60a5fa' }}>"You're very kind"</strong> — Kamu sangat baik<br />
          • <strong style={{ color: '#60a5fa' }}>"I really appreciate it"</strong> — Saya sangat menghargainya
        </div>
      </div>
    </div>
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,16,0.96)', padding: '7px 12px 10px', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="#c084fc" strokeWidth="1.8" /><path d="M5 10a7 7 0 0014 0" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="22" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '9px 12px', color: '#3f3f46', fontSize: 11 }}>
          Tanya Lingo tentang Inggris...
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#52525b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="#52525b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
    </div>
  </div>
);

const SpeakingFeedbackContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#0a0a0d', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif', position: 'relative' }}>
    <AssistantChatContent />
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 5 }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#0e0e18', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 11px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="#c084fc" strokeWidth="1.8" /><path d="M5 10a7 7 0 0014 0" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" /><line x1="12" y1="19" x2="12" y2="22" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </div>
          <div>
            <p style={{ color: '#f4f4f5', fontSize: 12, fontWeight: 700, margin: 0 }}>Hasil Penilaian</p>
            <p style={{ color: '#52525b', fontSize: 9, margin: 0 }}>EN Inggris · Greetings</p>
          </div>
        </div>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#71717a" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </div>
      </div>
      <div style={{ padding: '12px 16px 22px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.13)' }}>
          <p style={{ color: '#52525b', fontSize: 8, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 3px' }}>Ucapan kamu</p>
          <p style={{ color: '#d4d4d8', fontSize: 11, fontStyle: 'italic', margin: 0 }}>"I'm grateful for your help today"</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#10b981', fontSize: 14, fontWeight: 800 }}>88</span>
          </div>
          <div>
            <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: '0 0 1px' }}>Bagus sekali!</p>
            <p style={{ color: '#71717a', fontSize: 10, margin: 0 }}>Skor speaking kamu</p>
          </div>
        </div>
        <div style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.13)', display: 'flex', gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}><path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <p style={{ color: '#10b981', fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 2px' }}>Yang sudah bagus</p>
            <p style={{ color: '#a1a1aa', fontSize: 11, lineHeight: 1.5, margin: 0 }}>Pengucapan jelas, struktur kalimat benar, intonasi natural.</p>
          </div>
        </div>
        <div style={{ padding: '9px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', display: 'flex', gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}><path d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8A6 6 0 0112 3z" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <p style={{ color: '#f59e0b', fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 2px' }}>Saran Lingo</p>
            <p style={{ color: '#a1a1aa', fontSize: 11, lineHeight: 1.5, margin: 0 }}>Perlambat di kata "grateful" agar lebih jelas terdengar.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <div style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(168,85,247,0.09)', border: '1px solid rgba(168,85,247,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#c084fc', fontSize: 11, fontWeight: 600 }}>Coba Lagi</span>
          </div>
          <div style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#71717a', fontSize: 11, fontWeight: 600 }}>Kalimat Baru</span>
          </div>
        </div>
        <div style={{ height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Simpan ke Chat</span>
        </div>
      </div>
    </div>
  </div>
);

const PROFILE_MOCK = { xp: 340, streak: 5, completedCount: 1, level: 1, label: 'Pemula', color: '#10b981', ring: '#34d399', emoji: <Sprout size={26} color="#fff" />, progress: 68, nextXp: 500 };
const ACHIEVEMENTS_MOCK = [
  { id: 'first',   icon: <Star size={17} color="#facc15" fill="#facc15" />, label: 'Mulai Belajar',  desc: 'Selesaikan 1 stage',   unlocked: true,  rarity: 'common'    },
  { id: 'streak3', icon: <Flame size={17} color="#f97316" />, label: 'Streak 3 Hari',  desc: 'Belajar 3 hari',       unlocked: true,  rarity: 'rare'      },
  { id: 'vocab',   icon: <BookOpen size={17} color="#3b82f6" />, label: 'Pencinta Vocab', desc: 'Baca 5 vocab',          unlocked: false, rarity: 'common'    },
  { id: 'chat',    icon: <MessageCircle size={17} color="#6366f1" />, label: 'Si Penanya',     desc: 'Tanya Lingo 3x',       unlocked: false, rarity: 'rare'      },
  { id: 'perfect', icon: <BadgeCheck size={17} color="#10b981" />, label: 'Sempurna',       desc: 'Nilai 100% di quiz',   unlocked: false, rarity: 'epic'      },
  { id: 'legend',  icon: <Trophy size={17} color="#f59e0b" />, label: 'Legenda',        desc: 'Capai level 4',        unlocked: false, rarity: 'legendary' },
];
const RARITY_COL: Record<string, string> = { common: '#71717a', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };
const LEVELS_MOCK = [
  { level: 1, min: 0,    max: 500,  label: 'Pemula',  color: '#10b981', emoji: <Sprout size={14} color="#10b981" /> },
  { level: 2, min: 500,  max: 1500, label: 'Pelajar', color: '#3b82f6', emoji: <BookOpen size={14} color="#3b82f6" /> },
  { level: 3, min: 1500, max: 3000, label: 'Mahir',   color: '#a855f7', emoji: <Zap size={14} color="#a855f7" /> },
  { level: 4, min: 3000, max: 6000, label: 'Ahli',    color: '#f59e0b', emoji: <Trophy size={14} color="#f59e0b" /> },
];

const ProfileContent = () => {
  const p = PROFILE_MOCK;
  const ringSize = 88; const r = (ringSize - 10) / 2; const circ = 2 * Math.PI * r;
  const dash = (p.progress / 100) * circ;
  return (
    <div style={{ width: '100%', height: '100%', background: '#080810', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(180deg, ${p.color}18 0%, transparent 100%)`, padding: '28px 16px 18px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${p.color}18, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', width: ringSize, height: ringSize, margin: '0 auto 12px' }}>
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
              <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
              <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none" stroke={p.color} strokeWidth={5} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 5, borderRadius: '50%', background: `linear-gradient(135deg, ${p.color}, ${p.ring})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 22px ${p.color}50` }}>{p.emoji}</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${p.color}18`, border: `1px solid ${p.color}35`, borderRadius: 99, padding: '3px 10px', marginBottom: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color }} />
            <span style={{ color: p.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>LEVEL {p.level} · {p.label.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.04em', lineHeight: 1 }}>Anonim</div>
          <div style={{ fontSize: 9, color: '#52525b', marginTop: 3 }}>Bergabung sejak Maret 2026</div>
          <div style={{ marginTop: 12, background: '#0e0e14', border: `1px solid ${p.color}18`, borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#71717a', fontSize: 9 }}>Menuju Level 2</span>
              <span style={{ color: p.color, fontSize: 9, fontWeight: 700 }}>{p.xp} / {p.nextXp} XP</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p.progress}%`, background: `linear-gradient(90deg, ${p.color}, ${p.ring})`, borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 9, color: '#3f3f46', marginTop: 5 }}>{p.progress}% · butuh {p.nextXp - p.xp} XP lagi</div>
          </div>
        </div>
        <div style={{ padding: '12px 12px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, flexShrink: 0 }}>
          {[{ icon: <Flame size={16} color="#ef4444" />, value: p.streak, label: 'Streak', color: '#ef4444' },{ icon: <Star size={16} color="#facc15" fill="#facc15" />, value: p.xp, label: 'Total XP', color: '#facc15' },{ icon: <Target size={16} color={p.color} />, value: p.completedCount, label: 'Selesai', color: p.color }].map((s, i) => (
            <div key={i} style={{ background: '#0e0e14', border: `1px solid ${s.color}18`, borderRadius: 13, padding: '11px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f4f4f5', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52525b', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 12px 0', flexShrink: 0 }}>
          <div style={{ background: '#0e0e14', border: `1px solid ${p.color}20`, borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ color: '#3f3f46', fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Target Hari Ini</p>
            {[{ label: 'Selesaikan 1 stage', done: true, xp: 50 },{ label: 'Kerjakan 5 soal', done: true, xp: 30 },{ label: 'Baca 2 materi', done: false, xp: 20 }].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, background: t.done ? `${p.color}25` : 'rgba(255,255,255,0.04)', border: `1px solid ${t.done ? p.color+'40' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.done && <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ flex: 1, color: t.done ? '#71717a' : '#52525b', fontSize: 10, textDecoration: t.done ? 'line-through' : 'none' }}>{t.label}</span>
                <span style={{ color: '#facc15', fontSize: 9, fontWeight: 700 }}>+{t.xp}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '10px 12px 0', flexShrink: 0 }}>
          <p style={{ color: '#3f3f46', fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Perjalanan Level</p>
          <div style={{ background: '#0e0e14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            {LEVELS_MOCK.map((l, i) => {
              const isCurrent = l.level === p.level; const isPast = p.xp >= l.max; const isLocked = p.xp < l.min;
              return (
                <div key={l.level} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: isCurrent ? `${l.color}0a` : 'transparent', borderBottom: i < LEVELS_MOCK.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: isLocked ? 0.4 : 1 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: isPast || isCurrent ? `${l.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${isPast || isCurrent ? l.color+'35' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{l.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: isCurrent ? l.color : isPast ? '#71717a' : '#52525b', fontSize: 10, fontWeight: 700 }}>Lv.{l.level} — {l.label}</span>
                      {isCurrent && <div style={{ width: 4, height: 4, borderRadius: '50%', background: l.color }} />}
                      {isPast && <Check size={10} color="#10b981" strokeWidth={3} />}
                    </div>
                    <span style={{ color: '#3f3f46', fontSize: 8 }}>{l.min.toLocaleString()}–{l.max.toLocaleString()} XP</span>
                  </div>
                  {isCurrent && <span style={{ color: l.color, fontSize: 10, fontWeight: 700 }}>{p.progress}%</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '10px 12px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ color: '#3f3f46', fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Pencapaian</p>
            <span style={{ color: '#52525b', fontSize: 9 }}>2/{ACHIEVEMENTS_MOCK.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {Object.entries(RARITY_COL).map(([r, c]) => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />
                <span style={{ color: '#3f3f46', fontSize: 8, textTransform: 'capitalize' }}>{r}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {ACHIEVEMENTS_MOCK.map(a => {
              const rc = RARITY_COL[a.rarity];
              return (
                <div key={a.id} style={{ background: a.unlocked ? `${rc}08` : '#0e0e14', border: `1px solid ${a.unlocked ? rc+'25' : 'rgba(255,255,255,0.05)'}`, borderRadius: 11, padding: '9px 6px', textAlign: 'center', opacity: a.unlocked ? 1 : 0.4, position: 'relative', overflow: 'hidden' }}>
                  {a.unlocked && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: 1, background: `linear-gradient(90deg,transparent,${rc}60,transparent)` }} />}
                  <div style={{ fontSize: 17, marginBottom: 4, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                  <div style={{ color: a.unlocked ? '#e4e4e7' : '#52525b', fontSize: 8, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>{a.label}</div>
                  <div style={{ color: '#3f3f46', fontSize: 7, lineHeight: 1.3 }}>{a.desc}</div>
                  {a.unlocked && <div style={{ position: 'absolute', top: 6, right: 6, width: 4, height: 4, borderRadius: '50%', background: rc }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNavBar activeTab="Profile" />
    </div>
  );
};

const COURSE_CHAPTERS = [
  { id: 1, title: 'Chapter 1 · Greetings', color: '#10b981', img: 'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=400&q=70', stages: [{ label: 'Greetings', types: ['Vocab'], xp: 100, done: true },{ label: 'Expressions', types: ['Dialog'], xp: 100, done: false },{ label: 'Introducing', types: ['Grammar'], xp: 150, done: false }], completedCount: 1 },
  { id: 2, title: 'Chapter 2 · Daily Life', color: '#3b82f6', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70', stages: [{ label: 'At The Market', types: ['Vocab'], xp: 100, done: false },{ label: 'Directions', types: ['Dialog'], xp: 150, done: false }], completedCount: 0 },
  { id: 3, title: 'Chapter 3 · Work & Office', color: '#a78bfa', img: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&q=70', stages: [{ label: 'Job Interview', types: ['Dialog'], xp: 200, done: false },{ label: 'Email Writing', types: ['Grammar'], xp: 150, done: false }], completedCount: 0 },
];

const CourseContent = () => (
  <div style={{ width: '100%', height: '100%', background: '#080810', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <div style={{ background: 'rgba(8,8,16,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '28px 16px 14px', flexShrink: 0 }}>
      <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', margin: '0 0 4px' }}>LINGORA · LEARN</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>Materi Belajar</h1>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', margin: '3px 0 0' }}>Pelajari materi sebelum mengerjakan soal</p>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[{ val: 3, label: 'Bab', c: '#3b82f6' }, { val: 7, label: 'Topik', c: '#10b981' }, { val: 18, label: 'Soal', c: '#f59e0b' }].map(s => (
            <div key={s.label} style={{ background: `${s.c}10`, border: `1px solid ${s.c}25`, borderRadius: 9, padding: '5px 8px', textAlign: 'center' }}>
              <div style={{ color: s.c, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>{s.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div style={{ flex: 1, overflowY: 'hidden', padding: '10px 12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {COURSE_CHAPTERS.map((ch, idx) => {
        const isOpen = idx === 0;
        return (
          <div key={ch.id} style={{ borderRadius: 14, overflow: 'hidden', border: isOpen ? `1px solid ${ch.color}35` : '1px solid rgba(255,255,255,0.07)', boxShadow: isOpen ? `0 4px 20px ${ch.color}12` : 'none', flexShrink: 0 }}>
            <div style={{ position: 'relative', height: 76, overflow: 'hidden' }}>
              <img src={ch.img} alt={ch.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.42) saturate(1.1)', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${ch.color}50 0%, transparent 55%, rgba(8,8,16,0.65) 100%)` }} />
              <div style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderRadius: 8, background: `${ch.color}25`, border: `1.5px solid ${ch.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: ch.color }}>{ch.id}</div>
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.28)', borderRadius: 99, padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="7" height="7" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#facc15"/></svg>
                <span style={{ color: '#facc15', fontSize: 8, fontWeight: 800 }}>{ch.completedCount}/{ch.stages.length} Stage</span>
              </div>
              <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>{ch.title}</p>
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: isOpen ? `${ch.color}0a` : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Vocab', 'Dialog'].map(t => (
                  <div key={t} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '2px 6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: 700 }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: isOpen ? `${ch.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${isOpen ? ch.color + '30' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOpen ? ch.color : 'rgba(255,255,255,0.2)', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop: `1px solid ${ch.color}15`, background: 'rgba(0,0,0,0.22)' }}>
                {ch.stages.map((st, si) => (
                  <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: si < ch.stages.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: st.done ? 0.75 : 1 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: st.done ? '#10b98120' : `${ch.color}15`, border: `1px solid ${st.done ? '#10b98150' : ch.color + '28'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: st.done ? '#10b981' : ch.color }}>
                      {st.done ? <Check size={13} strokeWidth={3} /> : si + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: st.done ? 'rgba(255,255,255,0.5)' : '#e4e4e7', fontSize: 11, fontWeight: 600, margin: 0, textDecoration: st.done ? 'line-through' : 'none' }}>{st.label}</p>
                      <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
                        {st.types.map(t => (
                          <span key={t} style={{ fontSize: 8, color: `${ch.color}90`, background: `${ch.color}10`, border: `1px solid ${ch.color}20`, borderRadius: 99, padding: '1px 5px' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {!st.done && (
                        <div style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.15)', borderRadius: 99, padding: '1px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <svg width="6" height="6" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#facc15"/></svg>
                          <span style={{ color: '#facc15', fontSize: 8, fontWeight: 700 }}>+{st.xp}</span>
                        </div>
                      )}
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
    <BottomNavBar activeTab="Courses" />
  </div>
);

// ─── REDESIGNED SLIDE-LEVEL ATOMS ─────────────────────────────────────────────

const GridBg = () => (
  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)', backgroundSize: '72px 72px', pointerEvents: 'none', zIndex: 0 }} />
);

const Glow = ({ top, left, right, bottom, color, size = 700 }: any) => (
  <div style={{ position: 'absolute', top, left, right, bottom, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle,${color} 0%,transparent 65%)`, filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
);

const Wm = ({ text, bottom = 60, left = -20, size = 200 }: any) => (
  <div style={{ position: 'absolute', bottom, left, fontFamily: syne, fontSize: size, fontWeight: 800, color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.028)', whiteSpace: 'nowrap', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}>{text}</div>
);

const SlidePill = ({ text, color, icon }: any) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 99, padding: '8px 20px', marginBottom: 28 }}>
    {icon ? <span style={{ fontSize: 14 }}>{icon}</span> : <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />}
    <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 12, color, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>{text}</span>
  </div>
);

const SlideH1 = ({ children, size = 72 }: any) => (
  <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: '-0.028em', color: '#fff', margin: '0 0 22px' }}>{children}</h1>
);

const SlideSub = ({ children, maxWidth = 680 }: any) => (
  <p style={{ fontFamily: dm, fontSize: 19, lineHeight: 1.65, color: T.sub, maxWidth, margin: '0 0 32px' }}>{children}</p>
);

const FeatRow = ({ icon, color, title, desc }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px', marginBottom: 10 }}>
    <div style={{ width: 44, height: 44, borderRadius: 13, background: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 17, color: T.text, marginBottom: 3 }}>{title}</div>
      <div style={{ fontFamily: dm, fontSize: 13, color: T.sub }}>{desc}</div>
    </div>
  </div>
);

const StatBox = ({ value, label, color }: any) => (
  <div style={{ background: T.card, border: `1px solid ${color}20`, borderRadius: 20, padding: '22px 16px', textAlign: 'center' }}>
    <div style={{ fontFamily: syne, fontWeight: 800, fontSize: 48, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
    <div style={{ fontFamily: dm, fontSize: 13, color: T.sub }}>{label}</div>
  </div>
);

const IGFooter = ({ handle }: { handle: string }) => (
  <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 99 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 99, padding: '12px 30px', backdropFilter: 'blur(12px)' }}>
      <Instagram size={18} color="#fff" />
      <span style={{ fontFamily: dm, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>{handle}</span>
    </div>
  </div>
);

const SlideNum = ({ n, total = 11 }: any) => (
  <div style={{ position: 'absolute', top: 44, right: 48, fontFamily: syne, fontWeight: 700, fontSize: 13, color: T.dim, letterSpacing: '0.12em', zIndex: 99 }}>
    {String(n).padStart(2, '0')} / {total}
  </div>
);

const CanvasLogo = () => (
  <div style={{ position: 'absolute', top: 15, left: 0, right: 0, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, pointerEvents: 'none' }}>
    <img src="/logo-home.png" alt="Lingora" style={{ height: 34, objectFit: 'contain' }} />
  </div>
);

const Canvas = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 1080, height: 1350, background: T.bg, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
    <GridBg />
    {children}
    <CanvasLogo />
  </div>
);

const Callout = ({ top, left, right, color, icon, title, desc, extra, width = 290 }: any) => (
  <div style={{ position: 'absolute', top, left, right, width, zIndex: 26, background: 'rgba(6,6,18,0.97)', border: `1px solid ${color}25`, borderRadius: 18, padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{icon}</div>
      <p style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: T.text, margin: 0 }}>{title}</p>
    </div>
    <p style={{ fontFamily: dm, fontSize: 13, color: T.muted, lineHeight: 1.55, margin: 0 }}>{desc}</p>
    {extra}
  </div>
);

const MiniSpeakingCard = ({ top, left, right, bottom, zIndex = 15, transform }: any) => (
  <div style={{
    position: 'absolute', top, left, right, bottom, zIndex, transform,
    width: 205,
    background: 'linear-gradient(145deg, #16142a 0%, #0f0d1e 100%)',
    border: '1px solid rgba(176,106,255,0.22)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(176,106,255,0.22)',
  }}>
    <div style={{ height: 2.5, background: `linear-gradient(90deg, ${T.purple}, rgba(176,106,255,0.1))` }} />
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(176,106,255,0.15)', border: '1px solid rgba(176,106,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={11} color={T.purple} />
          </div>
          <span style={{ color: T.purple, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' }}>SPEAKING</span>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 99, padding: '2px 7px' }}>
          <span style={{ color: T.green, fontSize: 9, fontWeight: 800 }}>88</span>
        </div>
      </div>
      <p style={{ color: '#e4e4e7', fontSize: 12, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.35, fontFamily: syne }}>
        "I'm grateful for your help"
      </p>
      {/* Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 24, marginBottom: 10 }}>
        {[10,15,22,14,28,18,24,20,14,18,24,14,10,16,22].map((h, i) => (
          <div key={i} style={{
            flex: 1, height: h, borderRadius: 2,
            background: i < 9 ? `rgba(176,106,255,${0.28 + (i / 9) * 0.72})` : 'rgba(255,255,255,0.08)',
          }} />
        ))}
      </div>
      <div style={{ padding: '6px 9px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 15, height: 15, borderRadius: '50%', background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span style={{ color: '#6ee7b7', fontSize: 10, fontWeight: 700 }}>Great pronunciation!</span>
      </div>
    </div>
  </div>
);

const MiniListeningCard = ({ top, left, right, bottom, zIndex = 15, transform }: any) => (
  <div style={{
    position: 'absolute', top, left, right, bottom, zIndex, transform,
    width: 205,
    background: 'linear-gradient(145deg, #0e1822 0%, #0a1018 100%)',
    border: '1px solid rgba(40,212,240,0.2)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(40,212,240,0.18)',
  }}>
    <div style={{ height: 2.5, background: `linear-gradient(90deg, ${T.sky}, rgba(40,212,240,0.1))` }} />
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(40,212,240,0.12)', border: '1px solid rgba(40,212,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headphones size={11} color={T.sky} />
          </div>
          <span style={{ color: T.sky, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' }}>LISTENING</span>
        </div>
        <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end' }}>
          {[6, 10, 7].map((h, i) => (
            <div key={i} style={{ width: 3.5, height: h, borderRadius: 2, background: T.sky, opacity: i === 2 ? 0.35 : 1 }} />
          ))}
        </div>
      </div>
      <p style={{ color: '#a1a1aa', fontSize: 10, margin: '0 0 8px', fontStyle: 'italic' }}>Where is Tom going?</p>
      {/* Audio player */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(40,212,240,0.08)', border: '1px solid rgba(40,212,240,0.18)', borderRadius: 10, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.sky, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="7" height="7" viewBox="0 0 10 10"><polygon points="2,1 9,5 2,9" fill="#000"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 3, background: 'rgba(40,212,240,0.15)', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
            <div style={{ width: '42%', height: '100%', background: T.sky, borderRadius: 99 }} />
          </div>
          <span style={{ color: 'rgba(40,212,240,0.45)', fontSize: 8, fontWeight: 600 }}>0:04 / 0:09</span>
        </div>
      </div>
      {/* Options */}
      {[{ l: 'A', t: 'The train station', active: true }, { l: 'B', t: 'The market', active: false }].map(o => (
        <div key={o.l} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', marginBottom: 5, background: o.active ? 'rgba(40,212,240,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${o.active ? 'rgba(40,212,240,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: o.active ? T.sky : '#52525b' }}>{o.l}</span>
          <span style={{ fontSize: 11, color: o.active ? '#7dd3fc' : '#71717a', fontWeight: o.active ? 700 : 400 }}>{o.t}</span>
        </div>
      ))}
    </div>
  </div>
);

const MiniQuizCard = ({ top, left, right, bottom, zIndex = 15, transform }: any) => (
  <div style={{
    position: 'absolute', top, left, right, bottom, zIndex, transform,
    width: 205,
    background: 'linear-gradient(145deg, #1a1508 0%, #140f06 100%)',
    border: '1px solid rgba(255,191,46,0.2)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(255,191,46,0.18)',
  }}>
    <div style={{ height: 2.5, background: `linear-gradient(90deg, ${T.amber}, rgba(255,191,46,0.1))` }} />
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,191,46,0.12)', border: '1px solid rgba(255,191,46,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Edit3 size={11} color={T.amber} />
          </div>
          <span style={{ color: T.amber, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' }}>QUIZ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: T.amber, fontSize: 9, fontWeight: 700 }}>2 / 6</span>
          <div style={{ width: 28, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
            <div style={{ width: '33%', height: '100%', background: T.amber, borderRadius: 99 }} />
          </div>
        </div>
      </div>
      <p style={{ color: '#a1a1aa', fontSize: 10, margin: '0 0 5px', fontStyle: 'italic' }}>Translate this sentence:</p>
      <p style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>Good morning, how are you?</p>
      {[{ l: 'A', t: 'Selamat pagi, apa kabar?', ok: true }, { l: 'B', t: 'Selamat malam...', ok: false }].map(o => (
        <div key={o.l} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', marginBottom: 5, background: o.ok ? 'rgba(16,185,129,0.09)' : 'rgba(255,255,255,0.03)', border: `1px solid ${o.ok ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: o.ok ? T.green : '#52525b' }}>{o.l}</span>
          <span style={{ fontSize: 11, color: o.ok ? '#6ee7b7' : '#71717a', fontWeight: o.ok ? 700 : 400 }}>{o.t}</span>
        </div>
      ))}
    </div>
  </div>
);

const MiniSentenceCard = ({ top, left, right, bottom, zIndex = 15, transform }: any) => (
  <div style={{
    position: 'absolute', top, left, right, bottom, zIndex, transform,
    width: 205,
    background: 'linear-gradient(145deg, #0c1a12 0%, #080f0c 100%)',
    border: '1px solid rgba(5,232,156,0.2)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(5,232,156,0.14)',
  }}>
    <div style={{ height: 2.5, background: `linear-gradient(90deg, ${T.green}, rgba(5,232,156,0.1))` }} />
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(5,232,156,0.12)', border: '1px solid rgba(5,232,156,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={11} color={T.green} />
        </div>
        <span style={{ color: T.green, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em' }}>SENTENCE BUILD</span>
      </div>
      <p style={{ color: '#a1a1aa', fontSize: 10, margin: '0 0 8px', fontStyle: 'italic' }}>Susun kalimat yang benar:</p>
      {/* Answer slots */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(5,232,156,0.14)`, borderRadius: 10, marginBottom: 8, minHeight: 36 }}>
        {['I am', 'grateful'].map(w => (
          <span key={w} style={{ background: 'rgba(5,232,156,0.14)', border: '1px solid rgba(5,232,156,0.28)', color: '#6ee7b7', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{w}</span>
        ))}
        <div style={{ width: 32, alignSelf: 'flex-end', borderBottom: '1.5px dashed rgba(255,255,255,0.12)', marginBottom: 3 }} />
      </div>
      {/* Word bank */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {['for', 'your', 'help', 'today'].map(w => (
          <span key={w} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#a1a1aa', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 500 }}>{w}</span>
        ))}
      </div>
    </div>
  </div>
);

// ─── DATA MATERI (Dari JSON c1s1) ───────────────────────────────────────────
const MOCK_STAGE_DATA = {
  title: "Basic Greetings",
  intro: "Greetings are the first thing you say when you meet someone. In English, the greeting you use depends on the time of day and how well you know the person.",
  sections: [
    {
      type: "vocabulary",
      heading: "Essential Greetings",
      body: "These are the most common English greetings. Use them when you first see or meet someone.",
      examples: [
        { en: "Hello!", id: "Halo!" },
        { en: "Hi!", id: "Hai!" },
        { en: "Good morning!", id: "Selamat pagi! (used before noon)" },
        { en: "Good afternoon!", id: "Selamat siang! (noon–5 PM)" },
        { en: "Good evening!", id: "Selamat sore/malam! (after 5 PM)" },
        { en: "Goodbye!", id: "Selamat tinggal!" },
        { en: "Good night!", id: "Selamat malam! (when parting at night)" }
      ],
      tip: "\"Good night\" is only used when saying goodbye late at night, not as a greeting."
    },
    {
      type: "grammar",
      heading: "Time-based Greetings",
      body: "English greetings change depending on the time of day. Memorise this simple pattern:",
      examples: [
        { en: "Morning (before 12 PM) → Good morning", id: "Pagi hari → Selamat pagi" },
        { en: "Afternoon (12–5 PM)   → Good afternoon", id: "Siang hari → Selamat siang" },
        { en: "Evening (after 5 PM)  → Good evening", id: "Malam hari → Selamat malam" }
      ],
      tip: "When in doubt, \"Hello\" or \"Hi\" works at ANY time of day."
    },
    {
      type: "pronunciation",
      heading: "How to Pronounce",
      body: "Listen carefully to the stress in each greeting. The stressed syllable is shown in CAPS.",
      examples: [
        { en: "hel-LO", id: "/həˈloʊ/" },
        { en: "good MOR-ning", id: "/ɡʊd ˈmɔːrnɪŋ/" },
        { en: "GOOD-bye", id: "/ˌɡʊdˈbaɪ/" }
      ],
      tip: "Smile when you say hello — it makes your English sound more natural and friendly!"
    }
  ]
};

// Helper untuk metadata section
const getSectionMeta = (type: string) => {
  switch (type) {
    case 'vocabulary': return { label: 'Kosakata', color: '#10b981', Icon: BookOpen };
    case 'grammar': return { label: 'Tata Bahasa', color: '#3b82f6', Icon: List };
    case 'pronunciation': return { label: 'Pengucapan', color: '#f59e0b', Icon: Mic };
    default: return { label: type, color: '#71717a', Icon: BookOpen };
  }
};

// ─── 1. MOCKUP HALAMAN MATERI FULL (Sesuai page.tsx) ─────────────────────────
const LearnStageContent = () => {
  const chColor = '#10b981'; 
  
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0d', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      {/* ── Top Nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, background: 'rgba(10,10,13,0.9)', zIndex: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>
          <ChevronLeft size={18} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: chColor, boxShadow: `0 0 8px ${chColor}` }} />
          <span style={{ color: '#71717a', fontSize: 11, fontWeight: 700 }}>Chapter 1 · Greetings</span>
        </div>
        <div style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)', borderRadius: 99, padding: '4px 10px' }}>
          <span style={{ color: '#facc15', fontSize: 11, fontWeight: 800 }}>340 XP</span>
        </div>
      </div>

      {/* ── Scroll Area (Bisa di-scroll / terpotong natural) ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 60, scrollbarWidth: 'none' }}>
        
        {/* Hero Section */}
        <div style={{ padding: '22px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle,${chColor}18 0%,transparent 70%)`, pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#52525b', fontSize: 10, fontWeight: 600 }}>Basic Intro</span>
            <ChevronRight size={10} color="#3f3f46" />
            <span style={{ color: chColor, fontSize: 10, fontWeight: 700 }}>Greetings</span>
          </div>
          
          <h1 style={{ color: '#f4f4f5', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 8px' }}>
            {MOCK_STAGE_DATA.title}
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>
            {MOCK_STAGE_DATA.intro}
          </p>
          
          {/* Pills */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <div style={{ background: `${chColor}14`, border: `1px solid ${chColor}30`, borderRadius: 99, padding: '4px 11px' }}>
              <span style={{ color: chColor, fontSize: 10, fontWeight: 700 }}>3 menit</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '4px 11px' }}>
              <span style={{ color: '#71717a', fontSize: 10, fontWeight: 700 }}>3 topik</span>
            </div>
            <div style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)', borderRadius: 99, padding: '4px 11px' }}>
              <span style={{ color: '#facc15', fontSize: 10, fontWeight: 700 }}>+150 XP</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ padding: '18px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ color: '#3f3f46', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Materi Pembelajaran</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* ── Mapping Sections dari Data ── */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MOCK_STAGE_DATA.sections.map((section, idx) => {
            const meta = getSectionMeta(section.type);

            return (
              <div key={idx} style={{ background: '#0e0e14', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                
                {/* Section Header */}
                <div style={{ padding: '13px 16px 11px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, background: `${meta.color}08` }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: meta.color }}>{meta.label}</span>
                      <meta.Icon size={10} color={meta.color} />
                    </div>
                    <h3 style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{section.heading}</h3>
                  </div>
                  {/* Tanya Lingo Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                    <img src="/maskot.png" alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                    <span style={{ fontSize: 10, fontWeight: 700 }}>Tanya</span>
                  </div>
                </div>

                {/* Section Body */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.7, margin: '0 0 14px' }}>{section.body}</p>
                  
                  {/* Examples Rendering */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.examples.map((ex, i) => {
                      const hasArrow = ex.en.includes("→");

                      // Render Arrow Row (Grammar style)
                      if (hasArrow) {
                        const [left, right] = ex.en.split("→").map((s) => s.trim());
                        return (
                          <div key={i} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${meta.color}20`, background: `${meta.color}06`, display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'center' }}>
                            <div style={{ padding: '10px 14px', background: `${meta.color}12`, borderRight: `1px solid ${meta.color}18` }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#f4f4f5', whiteSpace: 'nowrap' }}>{left}</span>
                            </div>
                            <div style={{ padding: '0 10px', color: '#facc15', fontSize: 14, fontWeight: 900 }}>→</div>
                            <div style={{ padding: '10px 14px 10px 0' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: meta.color, display: 'block', lineHeight: 1.5 }}>{right}</span>
                              <span style={{ fontSize: 11, color: '#71717a', fontStyle: 'italic', marginTop: 2, display: 'block' }}>{ex.id}</span>
                            </div>
                          </div>
                        );
                      }

                      // Render Regular Bilingual Row (Vocab/Pronunciation style)
                      return (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Volume2 size={10} color={meta.color} />
                            </div>
                            <span style={{ color: '#f4f4f5', fontSize: 12, fontWeight: 500 }}>{ex.en}</span>
                          </div>
                          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#a1a1aa', fontSize: 12, fontStyle: 'italic' }}>{ex.id}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tip Box */}
                  {section.tip && (
                    <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.12)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Lightbulb size={14} color="#facc15" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ color: '#a08a30', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{section.tip}</p>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Floating Action Button (Tanya Lingo) ── */}
      <div style={{ position: 'absolute', bottom: 20, right: 16, display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 14px', borderRadius: 21, background: 'linear-gradient(135deg,#1e40af,#2563eb)', border: '1px solid rgba(96,165,250,0.3)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)', zIndex: 40 }}>
        <img src="/maskot.png" alt="Lingo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Tanya Lingo</span>
      </div>

    </div>
  );
};
// ─── SLIDES ────────────────────────────────────────────────────────────────────

// Slide 1 — Hero
const Slide1 = ({ handle }: any) => (
  <Canvas>
    <Glow top={-150} left={-100} color="rgba(5,232,156,0.16)" size={900} />
    <Glow bottom={-100} right={-100} color="rgba(61,158,255,0.12)" size={700} />
    <Wm text="GAMIFIED." bottom={60} left={-10} size={210} />
    <div style={{ position: 'absolute', top: 90, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 100px', zIndex: 10, height: 400 }}>
      {/* <SlidePill text="UI/UX Case Study · 2024" color={T.green} /> */}
      <SlideH1>Belajar Bahasa <br /><span style={{ color: T.green, fontStyle: 'italic' }}>Lebih Menyenangkan</span></SlideH1>
      <SlideSub>Aplikasi edukasi dengan gamifikasi, peta belajar visual, dan asisten AI yang dapat melatih speaking</SlideSub>
      {/* <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['Mobile App', T.green],['React Native', T.blue],['AI Integration', T.amber],['Gamification', T.purple]].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${c}25`, borderRadius: 99, padding: '7px 18px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
            <span style={{ fontFamily: dm, fontSize: 14, color: T.sub }}>{l}</span>
          </div>
        ))}
      </div> */}
    </div>
    <div style={{ position: 'absolute', top: 540, left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: `radial-gradient(circle,rgba(5,232,156,0.28) 0%,transparent 60%)`, filter: 'blur(80px)', zIndex: 15, pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', left: 70, top: 405, transform: 'rotate(-7deg) scale(0.82)', zIndex: 20, transformOrigin: 'bottom center' }}>
      <PhoneWrap><AssistantContent /></PhoneWrap>
    </div>
    <div style={{ position: 'absolute', right: 70, top: 405, transform: 'rotate(7deg) scale(0.82)', zIndex: 20, transformOrigin: 'bottom center' }}>
      <PhoneWrap><AdventureContent /></PhoneWrap>
    </div>
    <div style={{ position: 'absolute', left: '50%', top: 445, transform: 'translateX(-50%)', zIndex: 30, boxShadow: '0 60px 120px rgba(0,0,0,0.95)' }}>
      <PhoneWrap><SplashContent /></PhoneWrap>
    </div>
    <IGFooter handle={handle} />
  </Canvas>
);

// Slide 11 — Data & Riset
const Slide11 = ({ handle }: any) => (
  <Canvas>
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 900px 600px at 80% 30%,rgba(255,82,82,0.07) 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
    <div style={{ position: 'absolute', top: 0, left: 0, width: 6, height: '100%', background: `linear-gradient(to bottom,${T.red},#b91c1c)`, zIndex: 5 }} />
    <div style={{ position: 'absolute', top: 116, left: 0, right: 0, bottom: 100, display: 'flex', alignItems: 'center', zIndex: 10 }}>
      <div style={{ width: 430, flexShrink: 0, paddingLeft: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 32, height: 1, background: T.red }} />
          <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, color: T.red, letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>Problem Statement</span>
        </div>
        <h1 style={{ fontFamily: syne, fontWeight: 900, fontSize: 76, lineHeight: 0.95, letterSpacing: '-0.04em', margin: '0 0 20px', color: T.text }}>
          Why<br /><span style={{ color: T.red }}>People</span><br />Quit
        </h1>
        <p style={{ fontFamily: dm, fontSize: 15, color: T.sub, maxWidth: 330, margin: '0 0 28px', lineHeight: 1.7 }}>
          Kami identifikasi friksi nyata yang membuat pelajar bahasa asing berhenti — jauh sebelum bisa bicara lancar.
        </p>
        {[['01','Metode pasif tanpa feedback','Membaca & menghafal tidak membangun kemampuan aktif'],
          ['02','Tidak ada konteks lokal','Konten global tidak relevan bagi pelajar Indonesia'],
          ['03','Motivasi tidak terjaga','Tanpa reward & progress visual, semangat cepat padam']].map(([n,t,s],i) => (
          <div key={n} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i<2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 11, color: T.red, opacity: 0.6, flexShrink: 0, marginTop: 2 }}>{n}</span>
            <div>
              <p style={{ fontFamily: syne, fontWeight: 700, fontSize: 15, color: T.text, margin: '0 0 4px' }}>{t}</p>
              <p style={{ fontFamily: dm, fontSize: 13, color: T.muted, lineHeight: 1.55, margin: 0 }}>{s}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', margin: '0 40px', background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.08) 15%,rgba(255,255,255,0.08) 85%,transparent)', flexShrink: 0 }} />
      <div style={{ flex: 1, paddingRight: 56, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 32, height: 1, background: T.muted }} />
          <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, color: T.muted, letterSpacing: '0.22em', textTransform: 'uppercase' as const }}>Data & Research</span>
        </div>
        {[{ val:'69%', desc:'pelajar berhenti dalam 30 hari pertama', src:'Duolingo Language Report, 2023', w:69, col:T.red },
          { val:'82%', desc:'tidak merasakan kemajuan nyata dalam speaking', src:'British Council ELT Research, 2022', w:82, col:T.amber },
          { val:'3.4×', desc:'lebih efektif belajar dengan feedback langsung', src:'Hattie & Timperley, 2007', w:100, col:T.green }].map(s => (
          <div key={s.val} style={{ background: `${s.col}06`, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px', position: 'relative', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: s.col }} />
            <div style={{ paddingLeft: 12 }}>
              <p style={{ fontFamily: syne, fontWeight: 800, fontSize: 54, lineHeight: 1, color: s.col, margin: '0 0 5px', letterSpacing: '-0.04em' }}>{s.val}</p>
              <p style={{ fontFamily: dm, fontWeight: 600, fontSize: 15, color: T.text, margin: '0 0 8px', lineHeight: 1.4 }}>{s.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ width: `${s.w}%`, height: '100%', background: s.col, borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 10, color: s.col }}>{s.val}</span>
              </div>
              <p style={{ fontFamily: dm, fontSize: 11, color: T.dim, fontStyle: 'italic', margin: 0 }}>Source: {s.src}</p>
            </div>
          </div>
        ))}
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 22px' }}>
          <div style={{ width: 24, height: 2, background: T.red, marginBottom: 11 }} />
          <p style={{ fontFamily: dm, fontSize: 14, color: T.sub, fontStyle: 'italic', lineHeight: 1.65, margin: '0 0 9px' }}>"The single biggest predictor of language learning failure is not ability — it's the absence of timely, meaningful feedback."</p>
          <p style={{ fontFamily: dm, fontSize: 11, color: T.muted, margin: 0 }}>— John Hattie · Visible Learning (2009)</p>
        </div>
      </div>
    </div>
    <IGFooter handle={handle} />
    {/* <SlideNum n={2} /> */}
  </Canvas>
);

const FEATURES = [
  { 
    Icon: Mic, 
    col: T.purple, 
    t: 'Latihan Speaking AI', 
    d: 'Penilaian pronunciation real-time untuk akurasi bicara.', 
    tag: 'Unik' 
  },
  { 
    Icon: Map, 
    col: T.amber, 
    t: 'Peta Belajar Visual', 
    d: 'Progres divisualisasikan dalam peta petualangan interaktif layaknya game. Belajar jadi tidak membosankan.',
  },
  { 
    Icon: Bot, 
    col: '#8b8ff8', 
    t: 'Asisten AI Lingo', 
    d: 'Tanya jawab grammar & vocab sesuai konteks materi.', 
    tag: 'AI Built-in' 
  },
  { 
    Icon: Globe, 
    col: T.blue, 
    t: 'Full Bahasa Indonesia', 
    d: 'UI dan instruksi lengkap dalam Bahasa Indonesia.', 
    tag: 'Lokal' 
  },
];

// Slide 9 — Diferensiasi
const Slide9 = ({ handle }: any) => (
  <Canvas>
    {/* Ambient Glows */}
    <Glow top={-100} left={-100} color="rgba(176,106,255,0.12)" size={800} />
    <Glow bottom={-100} right={-100} color="rgba(5,232,156,0.1)" size={800} />

    <div style={{ position: 'absolute', top: 350, left: 72, right: 72, bottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
      
      {/* ── 1. HEADER (Rata Tengah) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 58, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 16px 0' }}>
          Mengapa <span style={{ color: T.purple, fontStyle: 'italic' }}>LINGORA?</span>
        </h1>
        
        <p style={{ fontFamily: dm, fontSize: 18, color: T.sub, lineHeight: 1.5, maxWidth: 640, margin: 0 }}>
          Mengatasi masalah utama pelajar bahasa di Indonesia melalui integrasi AI yang interaktif dan sistem Gamifikasi.
        </p>
      </div>

      {/* ── 2. BANNER IMAGE (Lebar Penuh, Tetap Simetris) ── */}
      {/* <div style={{ width: '100%', height: 320, borderRadius: 28, background: '#111', border: `1px solid rgba(255,255,255,0.08)`, overflow: 'hidden', position: 'relative', marginBottom: 40, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80" 
          alt="People studying together"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,14,0.8) 0%, transparent 60%)' }} />
      </div> */}

      {/* ── 3. FEATURES GRID (Dibungkus Kotak, Konten Rata Tengah) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, width: '100%' }}>
        {FEATURES.map((f) => (
          <div key={f.t} style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 24, padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Icon Box */}
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${f.col}12`, border: `1px solid ${f.col}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 16 }}>
              <f.Icon size={26} color={f.col} strokeWidth={1.8} />
            </div>
            
            {/* Judul & Teks */}
            <h3 style={{ fontFamily: syne, fontWeight: 700, fontSize: 18, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              {f.t}
            </h3>
            <p style={{ fontFamily: dm, fontSize: 14, color: T.muted, lineHeight: 1.55, margin: 0 }}>
              {f.d}
            </p>
          </div>
        ))}
      </div>

    </div>

    <IGFooter handle={handle} />
    {/* <SlideNum n={3} /> */}
  </Canvas>
);

// Slide 2 — Adventure Map
const Slide2 = ({ handle }: any) => (
  <Canvas>
    <Glow top={-100} right={-100} color="rgba(255,191,46,0.15)" size={800} />
    <Glow bottom={0} left={-100} color="rgba(5,232,156,0.1)" size={600} />
    <Wm text="JOURNEY." bottom={60} left={-20} size={190} />
    
    <div style={{ position: 'absolute', top: 305, left: 80, width: 480, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
      
      {/* SlidePill diaktifkan kembali dengan icon Lucide */}
      {/* <SlidePill text="Interactive UI" color={T.amber} icon={<Map size={14} color={T.amber} />} /> */}
      
      <SlideH1>
        Visual<br />
        <span style={{ color: T.amber, fontStyle: 'italic' }}>Learning Path.</span>
      </SlideH1>
      
      <SlideSub maxWidth={420}>
        Peta petualangan interaktif yang memberi rasa pencapaian nyata. Level terkunci sampai misi sebelumnya selesai.
      </SlideSub>
      
      {/* Menggunakan Lucide Icons untuk FeatRow */}
      <FeatRow 
        icon={<Lock size={22} color={T.amber} />} 
        color={T.amber} 
        title="Progressive Unlock" 
        desc="Level terkunci sampai misi selesai" 
      />
      <FeatRow 
        icon={<Star size={22} color={T.amber} />} 
        color={T.amber} 
        title="3-Star Rating" 
        desc="Mendorong pengguna untuk replay lesson" 
      />
      <FeatRow 
        icon={<TrendingUp size={22} color={T.green} />} 
        color={T.green} 
        title="XP Progress Bar" 
        desc="Progres real-time yang terasa bermakna" 
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <StatBox value="6" label="Stage per Chapter" color={T.amber} />
        <StatBox value="12" label="Questions per Stage" color={T.green} />
      </div>
    </div>
    
    <div style={{ position: 'absolute', top: 280, right: 80, zIndex: 20 }}>
      <PhoneWrap><AdventureContent /></PhoneWrap>
    </div>
    
    <IGFooter handle={handle} />
    {/* <SlideNum n={4} /> */}
  </Canvas>
);

// ─── UPDATE SLIDE5 UTAMA ──────────────────────────────────────────────────
const Slide5 = ({ handle }: any) => {
  return (
    <Canvas>
      <Glow top={60} left={-100} color="rgba(5,232,156,0.14)" size={700} />
      <Glow top={60} right={-100} color="rgba(61,158,255,0.12)" size={700} />
      
      {/* ── Left Phone (Course Content / Daftar Materi) ── */}
      {/* ── Left Phone (Course Content / Daftar Materi) ── */}
      <div style={{ 
        position: 'absolute', top: 150, left: 209, zIndex: 20, 
        boxShadow: '0 -8px 40px rgba(5,232,156,0.18), 0 40px 80px rgba(0,0,0,0.9)', 
        borderRadius: 44, 
        transform: 'rotate(-4deg)', 
        transformOrigin: 'bottom center' 
      }}>
        <PhoneWrap><CourseContent /></PhoneWrap>
      </div>
      
      {/* Divider Line di Tengah */}
      <div style={{ position: 'absolute', top: 90, left: '50%', width: 1, height: 750, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.06) 20%,rgba(255,255,255,0.06) 80%,transparent)', transform: 'translateX(-50%)', zIndex: 15 }} />
      
      {/* ── Right Phone (Learn Stage Content / Isi Materi Asli) ── */}
      <div style={{ 
        position: 'absolute', top: 150, right: 209, zIndex: 20, 
        boxShadow: '0 -8px 40px rgba(61,158,255,0.18), 0 40px 80px rgba(0,0,0,0.9)', 
        borderRadius: 44, 
        transform: 'rotate(4deg)', 
        transformOrigin: 'bottom center' 
      }}>
        <PhoneWrap><LearnStageContent /></PhoneWrap>
      </div>
      
      {/* ── Bottom Text & Tags ── */}
      <div style={{ position: 'absolute', bottom: 130, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 30 }}>
        
        {/* Judul */}
        <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: 68, color: '#fff', textAlign: 'center', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.1 }}>
          Materi Terstruktur <br />
          <span style={{ color: T.blue, fontStyle: 'italic' }}>Per Stage</span>
        </h2>
        
        {/* Teks Deskripsi Tambahan */}
        <p style={{ fontFamily: dm, fontSize: 18, color: T.muted, textAlign: 'center', maxWidth: 740, lineHeight: 1.5, margin: '0 0 20px' }}>
          Materi disusun ke dalam format bite-sized yang mencakup kosakata, tata bahasa, dan pengucapan yang dilengkapi dengan bantuan visual & audio native.
        </p>
      </div>
      
      <IGFooter handle={handle} />
      {/* <SlideNum n={5} /> */}
    </Canvas>
  );
};


// Slide 6 — Card Types (Redesigned)
const Slide6 = ({ handle }: any) => {
  const CARD_TYPES = [
    { Icon: Mic,        l: 'Speaking Card',  d: 'Penilaian pronunciation real-time untuk akurasi bicara.',  c: T.purple },
    { Icon: Headphones, l: 'Listening Quiz', d: 'Dengar audio & pilih jawaban yang paling tepat.',          c: T.sky    },
    { Icon: Edit3,      l: 'Quiz Card',      d: 'Pilihan ganda dengan skor & penjelasan detail.',           c: T.amber  },
    { Icon: Layers,     l: 'Sentence Build', d: 'Susun kata menjadi kalimat yang tepat.',                   c: T.green  },
  ];

  // Accent dots — ditempatkan di 4 sudut phone sebagai visual connector
  const CORNER_DOTS = [
    { top: 294, left: 80,  c: T.purple },
    { top: 294, left: 462, c: T.sky    },
    { top: 1042, left: 80,  c: T.amber  },
    { top: 1042, left: 462, c: T.green  },
  ];

  return (
    <Canvas>
      <Glow top={-100} left={-80}  color="rgba(176,106,255,0.15)" size={700} />
      <Glow bottom={-80} right={-80} color="rgba(40,212,240,0.1)"  size={700} />
      <Glow top={350} left={80}    color="rgba(255,191,46,0.07)"  size={560} />
      <Wm text="PRACTICE." bottom={80} left={-20} size={190} />

      {/* ── LEFT PANEL: Phone + 4 Floating Cards ── */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 560, zIndex: 20 }}>

        {/* Radial glow behind phone */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 340, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 1, pointerEvents: 'none' }} />

        {/* Orbital ring decoration */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 535, height: 535, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.04)', zIndex: 1, pointerEvents: 'none' }} />

        {/* Phone — QuizContent for thematic relevance */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 12, boxShadow: '0 50px 120px rgba(0,0,0,0.85)' }}>
          <PhoneWrap><QuizContent /></PhoneWrap>
        </div>

        {/* ── Floating Cards (4 corners) ── */}
        <MiniSpeakingCard  top={320}    left={40}    zIndex={22} transform="rotate(-7deg)"   />
        <MiniListeningCard top={244}    right={-2}  zIndex={20} transform="rotate(6deg)"    />
        <MiniQuizCard      bottom={400} left={30}    zIndex={26} transform="rotate(-5.5deg)" />
        <MiniSentenceCard  bottom={358} right={-6}  zIndex={24} transform="rotate(5deg)"    />

        {/* Accent dots at phone corners */}
        {/* {CORNER_DOTS.map((d, i) => (
          <div key={i} style={{ position: 'absolute', top: d.top, left: d.left, width: 8, height: 8, borderRadius: '50%', background: d.c, boxShadow: `0 0 14px ${d.c}`, zIndex: 18 }} />
        ))} */}
      </div>

      {/* Vertical divider */}
      {/* <div style={{ position: 'absolute', left: 578, top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)', zIndex: 5 }} /> */}

      {/* ── RIGHT PANEL: Text Content ── */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 598, right: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>

        {/* <SlidePill text="Feature 05 — Practice" color={T.purple} icon={<CheckCircle2 size={14} color={T.purple} />} /> */}

        <SlideH1 size={60}>4 Tipe Soal,<br /><span style={{ color: T.purple, fontStyle: 'italic' }}>Satu Stage.</span></SlideH1>

        <SlideSub maxWidth={400}>
          Setiap stage menggabungkan 4 format latihan berbeda agar belajar tidak monoton dan semua aspek bahasa terlatih secara aktif.
        </SlideSub>

        {/* Feature grid 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 30 }}>
          {CARD_TYPES.map((f) => (
            <div key={f.l} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: `${f.c}08`, border: `1px solid ${f.c}1e`, borderRadius: 18, padding: '16px 14px', position: 'relative', overflow: 'hidden' }}>
              {/* Top accent stripe */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${f.c}55, transparent)` }} />
              <div style={{ width: 36, height: 36, borderRadius: 11, background: `${f.c}15`, border: `1px solid ${f.c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <f.Icon size={17} color={f.c} />
              </div>
              <div>
                <p style={{ fontFamily: syne, fontWeight: 700, fontSize: 14, color: T.text, margin: '0 0 4px' }}>{f.l}</p>
                <p style={{ fontFamily: dm, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.45 }}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <StatBox value="4"  label="Tipe Soal"  color={T.purple} />
          <StatBox value="2×" label="Combo XP"   color={T.amber}  />
          <StatBox value="∞"  label="Replayable" color={T.green}  />
        </div>
      </div>

      <IGFooter handle={handle} />
      {/* <SlideNum n={6} /> */}
    </Canvas>
  );
};
// Slide 4 — Profile & Streaks
const Slide4 = ({ handle }: any) => (
  <Canvas>
    <Glow top={-100} left={200} color="rgba(255,82,82,0.14)" size={800} />
    <Glow bottom={100} right={0} color="rgba(255,191,46,0.08)" size={600} />
    <Wm text="REWARDS." bottom={60} left={200} size={190} />
    
    <div style={{ position: 'absolute', top: 280, right: 80, width: 490, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
      
      {/* ── SlidePill Diaktifkan ── */}
      {/* <SlidePill text="User Progression" color={T.red} icon={<Flame size={14} color={T.red} />} /> */}
      
      <SlideH1>
        Track &<br />
        <span style={{ color: T.red, fontStyle: 'italic' }}>Build Streaks.</span>
      </SlideH1>
      
      <SlideSub maxWidth={420}>
        Profil pengguna komprehensif yang menonjolkan pencapaian XP, sistem Level, dan target harian untuk motivasi belajar konsisten.
      </SlideSub>
      
      {/* ── StatBox Disesuaikan dengan Mockup ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        <StatBox value="5" label="Day Streak" color={T.red} />
        <StatBox value="340" label="Total XP" color={T.amber} />
        <StatBox value="Lv. 1" label="Current Level" color={T.green} />
      </div>
      
      {/* ── Fitur Disesuaikan dengan Komponen ProfileContent ── */}
      <FeatRow 
        icon={<Flame size={22} color={T.red} />} 
        color={T.red} 
        title="Daily Streaks" 
        desc="Membangun kebiasaan belajar harian yang konsisten" 
      />
      <FeatRow 
        icon={<TrendingUp size={22} color={T.amber} />} 
        color={T.amber} 
        title="Level Progression" 
        desc="Kumpulkan XP untuk naik tingkatan layaknya bermain game" 
      />
      <FeatRow 
        icon={<Award size={22} color={T.green} />} 
        color={T.green} 
        title="Goals & Achievements" 
        desc="Selesaikan target hari ini dan kumpulkan lencana pencapaian" 
      />
    </div>
    
    <div style={{ position: 'absolute', top: 270, left: 80, zIndex: 20 }}>
      <PhoneWrap><ProfileContent /></PhoneWrap>
    </div>
    
    <IGFooter handle={handle} />
    {/* <SlideNum n={7} /> */}
  </Canvas>
);

// Slide 10 — AI Feature
const Slide10 = ({ handle }: any) => (
  <Canvas>
    <Glow top={-120} left={-80} color="rgba(99,102,241,0.18)" size={750} />
    <Glow top={-60} right={-60} color="rgba(176,106,255,0.14)" size={600} />
    <Wm text="LINGO AI." bottom={40} left={-10} size={185} />
    <div style={{ position: 'absolute', top: 280, left: 80, width: 380, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
      <SlidePill text="Feature — AI Assistant" color={T.purple} icon={<Bot size={14} color={T.purple} />} />
      <SlideH1 size={60}>Tanya Apa Saja,<br /><span style={{ color: '#8b8ff8', fontStyle: 'italic' }}>Kapan Saja.</span></SlideH1>
      <SlideSub maxWidth={360}>Lingo menjawab pertanyaan grammar, kosakata, dan pengucapan — sesuai konteks materi yang sedang dipelajari.</SlideSub>
      <FeatRow icon={<MessageCircle size={22} color="#6366f1" />} color="#6366f1" title="Chat Kontekstual" desc="Lingo tahu stage yang dipelajari" />
      <FeatRow icon={<Mic size={22} color={T.purple} />} color={T.purple} title="Speaking + Skor AI" desc="Ucapkan kalimat → dapat penilaian detail" />
      <FeatRow icon={<Volume2 size={22} color={T.blue} />} color={T.blue} title="Audio Pronunciation" desc="Dengarkan contoh ucapan langsung" />
      <FeatRow icon={<Globe size={22} color={T.green} />} color={T.green} title="4 Bahasa Didukung" desc="Inggris, Jepang, Mandarin, Korea" />
    </div>
    <div style={{ position: 'absolute', top: 258, left: '50%', marginLeft: -15, transform: 'translateX(-50%) rotate(-3deg)', zIndex: 20, transformOrigin: 'bottom center', boxShadow: '0 50px 100px rgba(0,0,0,0.9)' }}>
      <PhoneWrap><AssistantChatContent /></PhoneWrap>
    </div>
    <div style={{ position: 'absolute', top: 280, right: 55, transform: 'rotate(3.5deg)', zIndex: 18, transformOrigin: 'bottom center', opacity: 0.88 }}>
      <PhoneWrap><SpeakingFeedbackContent /></PhoneWrap>
    </div>
    {[{ label: 'Chat Mode', color: '#8b8ff8', offset: 0 }].map(lb => (
      <div key={lb.label} style={{ position: 'absolute', top: 208, left: '50%', transform: 'translateX(-50%)', zIndex: 25 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', borderRadius: 99, padding: '8px 18px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b8ff8' }} />
          <span style={{ fontFamily: dm, fontSize: 14, fontWeight: 700, color: '#8b8ff8' }}>Chat Mode</span>
        </div>
      </div>
    ))}
    <div style={{ position: 'absolute', top: 222, right: 78, zIndex: 25 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `rgba(176,106,255,0.12)`, border: `1px solid rgba(176,106,255,0.28)`, borderRadius: 99, padding: '8px 18px' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.purple }} />
        <span style={{ fontFamily: dm, fontSize: 14, fontWeight: 700, color: T.purple }}>Speaking Mode</span>
      </div>
    </div>
    <IGFooter handle={handle} />
    {/* <SlideNum n={8} /> */}
  </Canvas>
);

// Slide 12 — Chat AI
const Slide12 = ({ handle }: any) => (
  <Canvas>
    <Glow top={-100} left={-100} color="rgba(99,102,241,0.16)" size={700} />
    <Glow bottom={-80} right={-80} color="rgba(61,158,255,0.1)" size={600} />
    <Wm text="CHAT AI." bottom={80} right={-10} size={185} />
    <div style={{ position: 'absolute', top: 174, left: 0, right: 0, textAlign: 'center', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 64, lineHeight: 1.05, letterSpacing: '-0.03em', color: T.text, margin: '0 0 16px' }}>
        Tanya Apa Saja,<br /><span style={{ color: '#8b8ff8', fontStyle: 'italic' }}>Kapan Saja.</span>
      </h1>
      <p style={{ fontFamily: dm, fontSize: 17, color: T.muted, maxWidth: 500 }}>
        Lingo menjawab grammar, vocab, dan pengucapan sesuai konteks stage yang sedang dipelajari.
      </p>
    </div>
    <div style={{ position: 'absolute', top: 420, left: '50%', transform: 'translateX(-50%)', zIndex: 22, boxShadow: '0 50px 120px rgba(0,0,0,0.95)' }}>
      <PhoneWrap><AssistantChatContent /></PhoneWrap>
    </div>
    <div style={{ position: 'absolute', top: 440, left: '50%', transform: 'translateX(-50%)', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 60%)', filter: 'blur(70px)', zIndex: 8, pointerEvents: 'none' }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 25, pointerEvents: 'none' }} viewBox="0 0 1080 1350">
      <line x1="310" y1="528" x2="345" y2="528" stroke={T.blue} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
      <circle cx="310" cy="528" r="3" fill={T.blue} opacity="0.8"/>
      <line x1="310" y1="980" x2="345" y2="980" stroke="#8b8ff8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
      <circle cx="310" cy="980" r="3" fill="#8b8ff8" opacity="0.8"/>
      <line x1="770" y1="750" x2="735" y2="750" stroke={T.green} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
      <circle cx="770" cy="750" r="3" fill={T.green} opacity="0.8"/>
    </svg>
    <Callout top={450} left={28} color={T.blue} icon={<Globe size={18} color={T.blue} />} title="4 Bahasa Didukung" desc="EN · JA · ZH · KO — ganti bahasa dari input bar" extra={
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {[['EN',T.blue],['JA',T.purple],['ZH',T.amber],['KO',T.green]].map(([l,c]) => (
          <div key={l} style={{ padding: '3px 10px', background: `${c}10`, border: `1px solid ${c}25`, borderRadius: 7 }}>
            <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 10, color: c }}>{l}</span>
          </div>
        ))}
      </div>
    } />
    <Callout top={900} left={28} color="#8b8ff8" icon={<Volume2 size={18} color="#8b8ff8" />} title="Audio Pronunciation" desc="Lingo mainkan contoh ucapan langsung dalam chat" extra={
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 9, marginTop: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="7" height="7" viewBox="0 0 10 10"><polygon points="2,1 9,5 2,9" fill="#8b8ff8"/></svg>
        </div>
        <span style={{ fontFamily: dm, fontSize: 12, fontWeight: 600, color: '#8b8ff8' }}>I'm grateful for your help</span>
      </div>
    } />
    <Callout top={665} right={28} color={T.green} icon={<MessageCircle size={18} color={T.green} />} title="Chat Kontekstual" desc="Lingo tahu stage yang dipelajari — jawaban selalu relevan dengan materi" extra={
      <div style={{ padding: '8px 12px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 9, marginTop: 12 }}>
        <p style={{ fontFamily: dm, fontSize: 12, color: T.sub, lineHeight: 1.55, margin: 0 }}>Tekan pada <strong style={{ color: T.blue }}>"GRATE-ful"</strong> — ucapkan pelan dan jelas.</p>
      </div>
    } />
    <IGFooter handle={handle} />
    {/* <SlideNum n={9} /> */}
  </Canvas>
);

// Slide 13 — Speaking Mode
const Slide13 = ({ handle }: any) => (
  <Canvas>
    <Glow top={-100} right={-100} color="rgba(176,106,255,0.16)" size={700} />
    <Glow bottom={-80} left={-80} color="rgba(5,232,156,0.1)" size={600} />
    <Wm text="SPEAKING." bottom={80} left={-10} size={180} />
    <div style={{ position: 'absolute', top: 174, left: 0, right: 0, textAlign: 'center', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 64, lineHeight: 1.05, letterSpacing: '-0.03em', color: T.text, margin: '0 0 14px' }}>
        Ucapkan, Dapat<br /><span style={{ color: T.purple, fontStyle: 'italic' }}>Feedback AI.</span>
      </h1>
      <p style={{ fontFamily: dm, fontSize: 17, color: T.muted, maxWidth: 500 }}>
        Bukan hanya membaca — latih cara berbicara dan terima penilaian langsung dari AI.
      </p>
    </div>
    <div style={{ position: 'absolute', top: 420, left: '50%', transform: 'translateX(-50%)', zIndex: 22, boxShadow: '0 50px 120px rgba(0,0,0,0.95)' }}>
      <PhoneWrap><SpeakingFeedbackContent /></PhoneWrap>
    </div>
    <div style={{ position: 'absolute', top: 440, left: '50%', transform: 'translateX(-50%)', width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(circle,rgba(176,106,255,0.22) 0%,transparent 60%)`, filter: 'blur(70px)', zIndex: 8, pointerEvents: 'none' }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 25, pointerEvents: 'none' }} viewBox="0 0 1080 1350">
      <line x1="310" y1="735" x2="345" y2="735" stroke={T.purple} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
      <circle cx="310" cy="735" r="3" fill={T.purple} opacity="0.8"/>
      <line x1="770" y1="560" x2="735" y2="560" stroke={T.green} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
      <circle cx="770" cy="560" r="3" fill={T.green} opacity="0.8"/>
      <line x1="770" y1="960" x2="735" y2="960" stroke={T.amber} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
      <circle cx="770" cy="960" r="3" fill={T.amber} opacity="0.8"/>
    </svg>
    <Callout top={665} left={28} color={T.purple} icon={<Mic size={18} color={T.purple} />} title="Tap untuk Berbicara" desc="Satu tombol — rekam suara dan kirim ke AI untuk dinilai langsung" extra={
      <div style={{ height: 36, background: 'rgba(124,58,237,0.12)', border: `1px solid rgba(176,106,255,0.25)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        <Mic size={13} color={T.purple} />
        <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 13, color: T.purple }}>Tap untuk Berbicara</span>
      </div>
    } />
    <Callout top={480} right={28} color={T.green} icon={<Target size={18} color={T.green} />} title="Skor 0–100 Instan" desc="AI nilai pronunciation & fluency dalam hitungan detik" extra={
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', border: `2.5px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: syne, fontWeight: 800, fontSize: 16, color: T.green }}>88</span>
        </div>
        <div>
          <p style={{ fontFamily: dm, fontWeight: 700, fontSize: 13, color: T.green, margin: '0 0 2px' }}>Bagus sekali!</p>
          <p style={{ fontFamily: dm, fontSize: 11, color: T.muted, margin: 0 }}>Skor speaking kamu</p>
        </div>
      </div>
    } />
    <Callout top={870} right={28} color={T.amber} icon={<Lightbulb size={18} color={T.amber} />} title="Feedback 3 Kategori" desc="Bagus · Perbaikan · Saran — spesifik per kalimat, bukan sekadar nilai" extra={
      <div style={{ padding: '8px 12px', background: `rgba(255,191,46,0.05)`, border: `1px solid rgba(255,191,46,0.15)`, borderRadius: 9, marginTop: 12 }}>
        <p style={{ fontFamily: dm, fontSize: 12, color: '#a08a30', lineHeight: 1.55, margin: 0 }}>Perlambat di kata "grateful" agar lebih jelas terdengar.</p>
      </div>
    } />
    <IGFooter handle={handle} />
    {/* <SlideNum n={10} /> */}
  </Canvas>
);

// Slide 7 — CTA
const Slide7 = ({ handle, wa, porto }: any) => (
  <Canvas>
    <Glow top="8%" left="8%" color="rgba(61,158,255,0.18)" size={550} />
    <Glow bottom="8%" right="8%" color="rgba(5,232,156,0.14)" size={650} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.065) 1.5px,transparent 1.5px)', backgroundSize: '34px 34px', maskImage: 'radial-gradient(ellipse at center,black 30%,transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at center,black 30%,transparent 75%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, textAlign: 'center', padding: '60px 80px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `${T.green}12`, border: `1px solid ${T.green}28`, borderRadius: 99, padding: '10px 26px', marginBottom: 44 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, boxShadow: `0 0 10px ${T.green}` }} />
        <span style={{ fontFamily: dm, fontWeight: 800, fontSize: 14, color: T.green, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Available For Freelance</span>
      </div>
      <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 44 }}>
        <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.14)' }} />
        <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `1.5px solid ${T.blue}40` }} />
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: `linear-gradient(135deg,${T.green},${T.blue})`, padding: 5, boxShadow: `0 20px 50px rgba(61,158,255,0.28)` }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserRound size={72} color="#f4f4f5" />
          </div>
        </div>
      </div>
      <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 68, lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 20px' }}>
        Let's create something<br /><span style={{ color: T.blue, fontStyle: 'italic' }}>extraordinary together.</span>
      </h1>
      <p style={{ fontFamily: dm, fontSize: 20, lineHeight: 1.6, color: T.sub, marginBottom: 56, maxWidth: 620 }}>
        Tertarik membangun UI/UX aplikasi yang interaktif dan memanjakan mata? Mari berkolaborasi!
      </p>
      <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 860, justifyContent: 'center' }}>
        {[{ icon: <Globe size={30} color={T.blue} />, color: T.blue, label: 'Portfolio', value: porto },{ icon: <MessageCircle size={30} color={T.green} />, color: T.green, label: 'WhatsApp', value: wa },{ icon: <Instagram size={30} color={T.purple} />, color: T.purple, label: 'Instagram', value: handle }].map(ct => (
          <div key={ct.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg,rgba(28,28,40,0.9),rgba(14,14,20,0.9))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 28, padding: '28px 20px' }}>
            <div style={{ width: 62, height: 62, borderRadius: 18, background: `${ct.color}18`, border: `1px solid ${ct.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 30 }}>{ct.icon}</div>
            <p style={{ fontFamily: dm, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>{ct.label}</p>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: 18, color: '#fff', margin: 0, textAlign: 'center' }}>{ct.value}</p>
          </div>
        ))}
      </div>
    </div>
    {/* <SlideNum n={11} /> */}
  </Canvas>
);

// Slide Cover — Features Section
const SlideCoverFeatures = ({ handle }: any) => (
  <Canvas>
    <Glow top={-200} left={-200} color="rgba(255,191,46,0.14)" size={900} />
    <Glow bottom={-100} right={-100} color="rgba(5,232,156,0.12)" size={700} />
    <Glow top={400} left={300} color="rgba(61,158,255,0.1)" size={600} />

    {/* vertical accent */}
    {/* <div style={{ position: 'absolute', top: 0, right: 180, width: 1, height: '100%', background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.06) 20%,rgba(255,255,255,0.06) 80%,transparent)', zIndex: 0 }} />
    <div style={{ position: 'absolute', top: 0, right: 182, width: 3, height: '100%', background: `linear-gradient(to bottom,transparent,${T.amber}40 30%,${T.green}40 70%,transparent)`, zIndex: 0 }} /> */}

    {/* watermark number */}
    <div style={{ position: 'absolute', bottom: 80, right: 60, fontFamily: syne, fontSize: 220, fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.035)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}>FEATURES</div>

    {/* dot grid */}
    <div style={{ position: 'absolute', top: 120, right: 220, width: 200, height: 200, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.5px,transparent 1.5px)', backgroundSize: '20px 20px', zIndex: 1, opacity: 0.6, maskImage: 'radial-gradient(ellipse at top right,black,transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at top right,black,transparent 80%)' }} />

    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 80, right: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
      {/* section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
        <div style={{ width: 52, height: 2, background: `linear-gradient(90deg,${T.amber},${T.green})` }} />
        <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: '0.3em', textTransform: 'uppercase' as const }}>Part Two</span>
      </div>

      {/* headline */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: syne, fontWeight: 900, fontSize: 100, lineHeight: 0.92, letterSpacing: '-0.04em', color: T.text, margin: '0 0 4px' }}>KEY</p>
        <p style={{ fontFamily: syne, fontWeight: 900, fontSize: 100, lineHeight: 0.92, letterSpacing: '-0.04em', color: 'transparent', WebkitTextStroke: `2px ${T.amber}`, margin: '0 0 4px' }}>FEATURES</p>
        <p style={{ fontFamily: syne, fontWeight: 900, fontSize: 100, lineHeight: 0.92, letterSpacing: '-0.04em', color: T.green, margin: 0 }}>OVERVIEW</p>
      </div>

      <p style={{ fontFamily: dm, fontSize: 18, color: T.sub, maxWidth: 500, lineHeight: 1.7, marginBottom: 48 }}>
        Empat fitur inti yang membentuk pengalaman belajar Lingora dari peta visual hingga latihan soal adaptif.
      </p>

      {/* feature rows — lucide icons only */}
      <div style={{ display: 'flex', flexDirection: 'row' as const, gap: 10 }}>
        {([
          { Icon: Map,      label: 'Learning Map',        color: T.amber  },
          { Icon: BookOpen, label: 'Materi Terstruktur',  color: T.blue   },
          { Icon: Layers,   label: '5 Tipe Soal',         color: T.purple },
          { Icon: Flame,    label: 'Streak & XP',         color: T.red    },
        ] as { Icon: React.ElementType; label: string; color: string }[]).map(({ Icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: `${color}0d`, border: `1px solid ${color}22`, borderRadius: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color={color} strokeWidth={1.8} />
            </div>
            <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 17, color: T.text }}>{label}</span>
          </div>
        ))}
      </div>
    </div>

    <IGFooter handle={handle} />
    {/* <SlideNum n={4} /> */}
  </Canvas>
);

// Slide Cover — AI Feature Section
const SlideCoverAI = ({ handle }: any) => (
  <Canvas>
    <Glow top={300} left={-200} color="rgba(99,102,241,0.22)" size={1000} />
    <Glow top={100} right={-200} color="rgba(176,106,255,0.18)" size={800} />
    <Glow bottom={-200} left={200} color="rgba(5,232,156,0.1)" size={700} />

    {/* scan lines */}
    {Array.from({ length: 18 }).map((_, i) => (
      <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: 80 + i * 72, height: 1, background: 'rgba(255,255,255,0.025)', zIndex: 1 }} />
    ))}

    {/* watermark */}
    <div style={{ position: 'absolute', bottom: 40, left: -30, fontFamily: syne, fontSize: 360, fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px rgba(139,143,248,0.07)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}>AI</div>

    {/* ── MASKOT SLOT (kanan) ── */}
    <div style={{ position: 'absolute', right: 50, top: '50%', transform: 'translateY(-50%)', width: 380, height: 500, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* decorative rings */}
      {/* <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(176,106,255,0.18)', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', border: '1px solid rgba(139,143,248,0.1)', zIndex: 1 }} /> */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,143,248,0.1) 0%,transparent 70%)', zIndex: 1 }} />

      {/* maskot image */}
      <div style={{ position: 'relative', width: 300, height: 380, zIndex: 2 }}>
        <img
          src="/maskot.png"
          alt="Lingo"
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 48px rgba(139,143,248,0.5)) drop-shadow(0 20px 40px rgba(0,0,0,0.6))', display: 'block' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
        />
        {/* fallback — selalu ada di belakang, tertutup gambar jika berhasil load */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -1 }}>
          <div style={{ width: 130, height: 130, borderRadius: '50%', background: `linear-gradient(135deg,#6366f1,${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 70px rgba(99,102,241,0.55)` }}>
            <Bot size={60} color="#fff" strokeWidth={1.3} />
          </div>
        </div>
      </div>

      {/* label bawah */}
      
    </div>

    {/* ── KONTEN KIRI ── */}
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 80, right: 500, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
        <div style={{ width: 52, height: 2, background: `linear-gradient(90deg,#6366f1,${T.purple})` }} />
        <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 12, color: T.muted, letterSpacing: '0.3em', textTransform: 'uppercase' as const }}>Part Three</span>
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: syne, fontWeight: 900, fontSize: 92, lineHeight: 0.92, letterSpacing: '-0.04em', color: T.text, margin: '0 0 4px' }}>MEET</p>
        <p style={{ fontFamily: syne, fontWeight: 900, fontSize: 92, lineHeight: 0.92, letterSpacing: '-0.04em', color: '#8b8ff8', margin: '0 0 4px' }}>LINGO,</p>
        <p style={{ fontFamily: syne, fontWeight: 900, fontSize: 92, lineHeight: 0.92, letterSpacing: '-0.04em', color: 'transparent', WebkitTextStroke: `2px ${T.purple}`, margin: 0 }}>YOUR AI.</p>
      </div>

      <p style={{ fontFamily: dm, fontSize: 16, color: T.sub, lineHeight: 1.75, marginBottom: 40 }}>
        Asisten pintar yang menjawab pertanyaan grammar, melatih speaking, dan memberi feedback real-time.
      </p>

      {/* capability rows — lucide icons only */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {([
          { Icon: MessageSquare, label: 'Chat Kontekstual',    color: '#6366f1' },
          { Icon: Mic,           label: 'Speaking Assessment', color: T.purple  },
          { Icon: Volume2,       label: 'Audio Pronunciation', color: T.blue    },
        ] as { Icon: React.ElementType; label: string; color: string }[]).map(({ Icon, label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', background: `${color}0d`, border: `1px solid ${color}22`, borderRadius: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color={color} strokeWidth={1.8} />
            </div>
            <span style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: T.text }}>{label}</span>
          </div>
        ))}
      </div>
    </div>

    <IGFooter handle={handle} />
    {/* <SlideNum n={8} /> */}
  </Canvas>
);


// ─── SLIDE 8 — ANIMATED APP FLOW SHOWCASE (7 Layar) ──────────────────────────
// ─── SLIDE 8 — DEMO LINGORA (VIDEO PLACEHOLDER) ──────────────────────────────
const Slide8 = ({ handle }: any) => (
  <Canvas>
    {/* Ambient Glows */}
    <Glow top={-100} left={-100} color="rgba(16,185,129,0.15)" size={800} />
    <Glow bottom={-100} right={-100} color="rgba(99,102,241,0.15)" size={900} />

    {/* Animasi melayang halus untuk ornamen di sekitar HP */}
    <style>{`
      @keyframes floatSoft {
        0%, 100% { transform: translateY(0px); }
        50%      { transform: translateY(-12px); }
      }
      .floating-tag { animation: floatSoft 6s ease-in-out infinite; }
      .floating-tag.delay-1 { animation-delay: 1s; }
      .floating-tag.delay-2 { animation-delay: 2s; }
      .floating-tag.delay-3 { animation-delay: 3.5s; }
    `}</style>

    <div style={{ position: 'absolute', top: 100, left: 60, right: 60, bottom: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
      
      {/* ── HEADER AREA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 50 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 99, padding: '8px 18px', marginBottom: 20 }}>
          <Play size={14} color={T.green} />
          <span style={{ fontFamily: dm, fontWeight: 700, fontSize: 11, color: T.green, letterSpacing: '0.12em', textTransform: 'uppercase' }}>App Flow</span>
        </div>
        
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: 64, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#fff', margin: '0 0 16px 0' }}>
          Demo <span style={{ color: T.green, fontStyle: 'italic' }}>LINGORA.</span>
        </h1>
        
        <p style={{ fontFamily: dm, fontSize: 18, color: T.sub, lineHeight: 1.5, maxWidth: 700, margin: 0 }}>
          Tonton bagaimana keseluruhan ekosistem aplikasi bekerja secara nyata dari awal hingga akhir.
        </p>
      </div>

      {/* ── CENTER STAGE: VIDEO PLACEHOLDER ── */}
      <div style={{ position: 'relative', width: 390, height: 750, zIndex: 20 }}>
        
        {/* Background Pulse di belakang HP */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 70%)', filter: 'blur(40px)', zIndex: 0, animation: 'floatSoft 4s infinite' }} />

        {/* Frame HP dengan Placeholder di dalamnya */}
        <div style={{ position: 'relative', zIndex: 20, boxShadow: '0 50px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)', borderRadius: 44 }}>
          <PhoneWrap>
            <div style={{ width: '100%', height: '100%', background: '#07070a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              
              {/* Garis putus-putus sebagai area penempatan video */}
              <div style={{ position: 'absolute', inset: 8, borderRadius: 36, border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Play size={28} color={T.green} style={{ marginLeft: 4 }} />
                </div>
                <p style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                  Video Placeholder
                </p>
                <p style={{ fontFamily: dm, fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>
                  Timpa area kosong ini dengan video screen record aplikasimu saat diedit nanti.
                </p>
              </div>

            </div>
          </PhoneWrap>
        </div>

        {/* ── FLOATING CALLOUTS DI SEKELILING HP ── */}
        <div className="floating-tag" style={{ position: 'absolute', top: 80, left: -280 }}>
          <Callout top={0} left={0} color={T.sky} icon={<Layers size={18} color={T.sky} />} title="Seamless Transition" desc="Navigasi antar fitur yang mulus tanpa hambatan." width={260} />
        </div>
        
        <div className="floating-tag delay-2" style={{ position: 'absolute', bottom: 120, left: -270 }}>
          <Callout top={0} left={0} color={T.green} icon={<Sparkles size={18} color={T.green} />} title="Engaging UI" desc="Visual interaktif yang memanjakan mata pelajar." width={250} />
        </div>

        <div className="floating-tag delay-1" style={{ position: 'absolute', top: 160, right: -280 }}>
          <Callout top={0} right={0} color={T.amber} icon={<FastForward size={18} color={T.amber} />} title="Dynamic Content" desc="Konten bergerak secara dinamis seiring eksplorasi." width={260} />
        </div>

        <div className="floating-tag delay-3" style={{ position: 'absolute', bottom: 200, right: -270 }}>
          <Callout top={0} right={0} color={T.purple} icon={<Repeat size={18} color={T.purple} />} title="Looping Habit" desc="Desain yang mendorong pengguna untuk terus belajar." width={250} />
        </div>

      </div>
    </div>

    <IGFooter handle={handle} />
    <SlideNum n={8} />
  </Canvas>
);

// ─── SLIDE ORDER (naratif: Intro → Data → Solusi → Fitur → CTA) ───────────────
//
//  1  Hero            — Perkenalan produk
//  2  Data & Riset    — Masalah & data riset
//  3  Diferensiasi    — Apa yang membuat Lingora beda
//  4  Adventure Map   — Fitur peta belajar visual
//  5  Materi          — Struktur materi per stage
//  6  Card Types      — Tipe-tipe kartu latihan
//  7  Profile         — Sistem progres & reward
//  8  AI Feature      — Overview AI assistant
//  9  Chat AI         — Demo chat Lingo
// 10  Speaking        — Demo speaking feedback
// 11  CTA             — Ajakan kolaborasi

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function IGPostMockupV3() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [igHandle, setIgHandle] = useState('@wandevp');
  const [waNumber, setWaNumber] = useState('+62 812-3456-7890');
  const [portfolio, setPortfolio] = useState('bento.me/wandev');

  // ── Ordered slide definitions (hanya slide yang dipakai, urutan naratif) ──
const SLIDES_ORDER = [
    { key: 1,  label: 'Hero'          },
    { key: 11, label: 'Data & Riset'  },
    { key: 9,  label: 'Diferensiasi'  },
    { key: 2,  label: 'Adventure Map' },
    { key: 5,  label: 'Materi'        },
    { key: 6,  label: 'Card Types'    },
    { key: 4,  label: 'Profile'       },
    { key: 10, label: 'AI Feature'    },
    { key: 12, label: 'Chat AI'       },
    { key: 13, label: 'Speaking'      },
    { key: 8,  label: 'App Flow'      }, // <--- TAMBAHKAN DI SINI
    { key: 7,  label: 'CTA'           },
  ];

  const [activeSlide, setActiveSlide] = useState(SLIDES_ORDER[0].key);

  const activeIdx = SLIDES_ORDER.findIndex(s => s.key === activeSlide);
  const activeLabel = SLIDES_ORDER[activeIdx]?.label ?? '';

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(canvasRef.current, { backgroundColor: '#06060e', pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `lingora-slide-${activeIdx + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); }
    finally { setDownloading(false); }
  };

const renderSlide = () => {
    const p = { handle: igHandle, wa: waNumber, porto: portfolio };
    const map: Record<number, React.ReactNode> = {
      1:  <Slide1  {...p} />,
      11: <Slide11 {...p} />,
      9:  <Slide9  {...p} />,
      2:  <Slide2  {...p} />,
      5:  <Slide5  {...p} />,
      6:  <Slide6  {...p} />,
      4:  <Slide4  {...p} />,
      10: <Slide10 {...p} />,
      12: <Slide12 {...p} />,
      13: <Slide13 {...p} />,
      8:  <Slide8  {...p} />, // <--- TAUTKAN KOMPONENNYA DI SINI
      7:  <Slide7  {...p} />,
    };
    return map[activeSlide] ?? null;
  };

  return (
    <>
      <style>{`
        ${FONT_URL}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', fontFamily: dm }}>

        {/* ── TOOLBAR ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,18,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontFamily: dm, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, marginBottom: 2 }}>Lingora — UI Case Study</p>
            <h1 style={{ fontFamily: syne, fontSize: 20, fontWeight: 800, color: '#fff' }}>IG Slides v3</h1>
          </div>

          {/* Slide tabs — hanya 11 slide aktif, urutan naratif */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
            {SLIDES_ORDER.map((slide, idx) => (
              <button
                key={slide.key}
                onClick={() => setActiveSlide(slide.key)}
                title={slide.label}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: activeSlide === slide.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: activeSlide === slide.key ? '#fff' : T.muted,
                  fontSize: 13, fontWeight: 700, transition: 'all .2s', fontFamily: syne,
                }}>
                {idx + 1}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeSlide === 7 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[['Portfolio', portfolio, setPortfolio, 130],['WhatsApp', waNumber, setWaNumber, 140],['Instagram', igHandle, setIgHandle, 110]] .map(([ph, val, set, w]: any) => (
                  <input key={ph} type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, borderRadius: 8, padding: '7px 11px', width: w, fontFamily: dm }} />
                ))}
              </div>
            )}
            <button onClick={handleDownload} disabled={downloading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,${T.green},${T.blue})`, border: 'none', borderRadius: 10, padding: '10px 20px', color: '#000', fontSize: 13, fontWeight: 800, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, fontFamily: syne }}>
              <Download size={15} />
              {downloading ? 'Exporting...' : `Save Slide ${activeIdx + 1}`}
            </button>
          </div>
        </div>

        {/* ── CANVAS ── */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 20px', overflow: 'auto', background: '#020209' }}>
          <div ref={canvasRef}>
            {renderSlide()}
          </div>
        </div>

        {/* Slide info */}
        <div style={{ textAlign: 'center', padding: '10px 0 20px', fontFamily: dm, fontSize: 13, color: T.muted }}>
          Slide {activeIdx + 1} / {SLIDES_ORDER.length} — {activeLabel}
        </div>
      </div>
    </>
  );
}