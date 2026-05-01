// src/app/profile/page.tsx
'use client';

import BottomNav from '@/components/Layout/BottomNav';
import AchievementPopup from '@/components/Achievement/AchievementPopup';
import { useUserStore, ACHIEVEMENT_DEFS } from '@/store/useUserStore';
import { useProgress } from '@/hooks/useProgress';   // ← pakai useProgress untuk multi-bahasa
import { useEffect, useState } from 'react';
import {
  Zap, Target, CheckCircle, Timer, BookOpen, Library, GraduationCap,
  Flame, Compass, Globe, Moon, Sunrise, Sprout, Star, Gem, Crown, Trophy,
  CalendarCheck, Languages, BookMarked, Sparkles, Shield, PenLine, Sword,
  PenTool, Mountain, LucideIcon,
} from 'lucide-react';

/* ── Icon registry ── */
const ICON_MAP: Record<string, LucideIcon> = {
  Zap, Target, CheckCircle, Timer, BookOpen, Library, GraduationCap,
  Flame, Compass, Globe, Moon, Sunrise, Sprout, Star, Gem, Crown, Trophy,
  CalendarCheck, Languages, BookMarked, Sparkles, Shield, PenLine, Sword,
  PenTool, Mountain,
};
function AchIcon({ name, color, size = 18 }: { name: string; color: string; size?: number }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={2}/>;
}

/* ── Responsive Hook ── */
function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet'>('mobile');
  useEffect(() => {
    const update = () => setBp(window.innerWidth >= 640 ? 'tablet' : 'mobile');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

/* ── Level config ── */
const LEVELS = [
  { level: 1, min: 0,    max: 500,  label: 'Pemula',  color: '#10b981', ring: '#34d399', iconName: 'Sprout' },
  { level: 2, min: 500,  max: 1500, label: 'Pelajar', color: '#3b82f6', ring: '#60a5fa', iconName: 'BookOpen' },
  { level: 3, min: 1500, max: 3000, label: 'Mahir',   color: '#a855f7', ring: '#c084fc', iconName: 'Zap' },
  { level: 4, min: 3000, max: 6000, label: 'Ahli',    color: '#f59e0b', ring: '#fcd34d', iconName: 'Trophy' },
];
function getLevelInfo(xp: number) {
  const lvl  = [...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0];
  const next = LEVELS.find(l => l.level === lvl.level + 1);
  const progress = next ? Math.min(100, ((xp - lvl.min) / (next.min - lvl.min)) * 100) : 100;
  return { ...lvl, next, progress };
}

/* ── Rarity config ── */
const RARITY: Record<string, { color: string; label: string; bg: string; border: string }> = {
  common:    { color: '#71717a', label: 'Common',    bg: 'rgba(113,113,122,0.08)',  border: 'rgba(113,113,122,0.18)' },
  rare:      { color: '#3b82f6', label: 'Rare',      bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.22)' },
  epic:      { color: '#a855f7', label: 'Epic',      bg: 'rgba(168,85,247,0.08)',   border: 'rgba(168,85,247,0.25)' },
  legendary: { color: '#f59e0b', label: 'Legendary', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.3)' },
};

/* ── Category config ── */
const CATEGORIES: { id: string; label: string; color: string }[] = [
  { id: 'all',      label: 'Semua',   color: '#71717a' },
  { id: 'general',  label: 'Umum',    color: '#10b981' },
  { id: 'xp',       label: 'XP',      color: '#facc15' },
  { id: 'streak',   label: 'Streak',  color: '#ef4444' },
  { id: 'mastery',  label: 'Mastery', color: '#a855f7' },
  { id: 'english',  label: '🇬🇧 EN',  color: '#3b82f6' },
  { id: 'japanese', label: '🇯🇵 JA',  color: '#f43f5e' },
  { id: 'mandarin', label: '🇨🇳 ZH',  color: '#f59e0b' },
  { id: 'korean',   label: '🇰🇷 KO',  color: '#8b5cf6' },
];

/* ── Circular progress ── */
function RingProgress({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 6px ${color}80)` }}/>
    </svg>
  );
}

/* ── Stat card ── */
function StatCard({ iconName, value, label, color, wide = false }: {
  iconName: string; value: string | number; label: string; color: string; wide?: boolean;
}) {
  return (
    <div style={{ flex:1, background:'#0e0e14', border:`1px solid ${color}20`, borderRadius:18, padding:wide?'16px 18px':'14px 16px', display:'flex', flexDirection:wide?'row':'column', alignItems:'center', gap:wide?12:8, boxShadow:`0 4px 24px ${color}08` }}>
      <div style={{ width:wide?40:40, height:wide?40:40, borderRadius:12, background:`${color}15`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <AchIcon name={iconName} color={color} size={18}/>
      </div>
      <div style={{ textAlign:wide?'left':'center', minWidth:0 }}>
        <div style={{ fontSize:wide?22:22, fontWeight:900, color:'#f4f4f5', lineHeight:1, fontFamily:'system-ui,sans-serif' }}>{value}</div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#52525b', marginTop:4, fontFamily:'system-ui,sans-serif', whiteSpace:'nowrap' }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Achievement card ── */
function AchievementCard({ def, unlocked }: { def: (typeof ACHIEVEMENT_DEFS)[number]; unlocked: boolean }) {
  const r = RARITY[def.rarity] ?? RARITY.common;
  return (
    <div style={{
      background: unlocked ? r.bg : '#0e0e14',
      border: `1px solid ${unlocked ? r.border : 'rgba(255,255,255,0.05)'}`,
      borderRadius:14, padding:'12px 8px', textAlign:'center',
      opacity: unlocked ? 1 : 0.38,
      position:'relative', overflow:'hidden',
      transition:'all 0.2s',
    }}>
      {unlocked && (
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'80%', height:1, background:`linear-gradient(90deg,transparent,${def.color}60,transparent)` }}/>
      )}
      <div style={{
        width:36, height:36, borderRadius:10, margin:'0 auto 7px',
        background: unlocked ? `${def.color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${unlocked ? def.color+'30' : 'rgba(255,255,255,0.07)'}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        filter: unlocked ? 'none' : 'grayscale(1)',
        boxShadow: unlocked ? `0 4px 12px ${def.color}25` : 'none',
      }}>
        <AchIcon name={def.iconName} color={unlocked ? def.color : '#52525b'} size={17}/>
      </div>
      <div style={{ color:unlocked?'#e4e4e7':'#52525b', fontSize:10, fontWeight:700, lineHeight:1.3, fontFamily:'system-ui,sans-serif', marginBottom:3 }}>{def.label}</div>
      <div style={{ color:'#3f3f46', fontSize:9, lineHeight:1.3, fontFamily:'system-ui,sans-serif' }}>{def.desc}</div>
      {unlocked && (
        <div style={{ position:'absolute', top:7, right:7, width:5, height:5, borderRadius:'50%', background:r.color, boxShadow:`0 0 4px ${r.color}` }}/>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function ProfilePage() {
  // ── FIX 1: pakai useProgress agar XP mengikuti bahasa aktif ───────────────
  // useUserStore hanya untuk achievements (EN-only feature)
  const { xp, streak, completedStages } = useProgress();
  const { unlockedAchievements } = useUserStore();

  const [mounted, setMounted]     = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const bp       = useBreakpoint();
  const isTablet = bp === 'tablet';

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div style={{ background:'#080810', minHeight:'100vh' }}/>;

  const lvl            = getLevelInfo(xp);
  const completedCount = Object.values(completedStages).filter(Boolean).length;
  const unlockedSet    = new Set((unlockedAchievements || []).map(a => a.id));
  const unlockedCount  = unlockedAchievements.length;

  const filteredDefs = activeTab === 'all'
    ? ACHIEVEMENT_DEFS
    : ACHIEVEMENT_DEFS.filter(d => d.category === activeTab);

  /* ── Category tabs ── */
  const CategoryTabs = () => (
    <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
      {CATEGORIES.map(cat => {
        const catDefs    = cat.id === 'all' ? ACHIEVEMENT_DEFS : ACHIEVEMENT_DEFS.filter(d => d.category === cat.id);
        const catUnlocked = catDefs.filter(d => unlockedSet.has(d.id)).length;
        const isActive   = activeTab === cat.id;
        return (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
            flexShrink:0, display:'flex', alignItems:'center', gap:5,
            padding:'6px 12px', borderRadius:99, cursor:'pointer',
            background: isActive ? `${cat.color}20` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isActive ? cat.color+'45' : 'rgba(255,255,255,0.07)'}`,
            transition:'all 0.2s',
          }}>
            <span style={{ color:isActive?cat.color:'#52525b', fontSize:11, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>{cat.label}</span>
            <span style={{ color:isActive?cat.color:'#3f3f46', fontSize:9, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>{catUnlocked}/{catDefs.length}</span>
          </button>
        );
      })}
    </div>
  );

  /* ── Achievement section ── */
  const AchievementsSection = ({ cols = 3 }: { cols?: number }) => (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'system-ui,sans-serif', margin:0 }}>Pencapaian</p>
        <span style={{ color:'#52525b', fontSize:10, fontFamily:'system-ui,sans-serif' }}>{unlockedCount}/{ACHIEVEMENT_DEFS.length} unlocked</span>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
        {Object.entries(RARITY).map(([key, r]) => (
          <div key={key} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:r.color }}/>
            <span style={{ color:'#3f3f46', fontSize:9, fontWeight:700, textTransform:'capitalize', fontFamily:'system-ui,sans-serif' }}>{r.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:12 }}><CategoryTabs/></div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:8 }}>
        {filteredDefs.map(def => (
          <AchievementCard key={def.id} def={def} unlocked={unlockedSet.has(def.id)}/>
        ))}
      </div>
    </div>
  );

  const DailyTargets = () => (
    <div style={{ background:'#0e0e14', border:`1px solid ${lvl.color}20`, borderRadius:18, padding:'18px 20px' }}>
      <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14, fontFamily:'system-ui,sans-serif' }}>Target Hari Ini</p>
      {[
        { label:'Selesaikan 1 stage', done: completedCount >= 1, xp: 50 },
        { label:'Kerjakan 5 soal',    done: completedCount >= 1, xp: 30 },
        { label:'Baca 2 materi',      done: false,               xp: 20 },
      ].map((t, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i<2?'1px solid rgba(255,255,255,0.04)':'none' }}>
          <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background:t.done?`${lvl.color}25`:'rgba(255,255,255,0.04)', border:`1px solid ${t.done?lvl.color+'40':'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={lvl.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{ flex:1, color:t.done?'#a1a1aa':'#71717a', fontSize:12, fontFamily:'system-ui,sans-serif', textDecoration:t.done?'line-through':'none' }}>{t.label}</span>
          <span style={{ color:'#facc15', fontSize:10, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>+{t.xp} XP</span>
        </div>
      ))}
    </div>
  );

  const LevelRoadmap = () => (
    <div>
      <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontFamily:'system-ui,sans-serif' }}>Perjalanan Level</p>
      <div style={{ background:'#0e0e14', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, overflow:'hidden' }}>
        {LEVELS.map((l, i) => {
          const isCurrent = l.level === lvl.level;
          const isPast    = xp >= l.max;
          const isLocked  = xp < l.min;
          return (
            <div key={l.level} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:isCurrent?`${l.color}0a`:'transparent', borderBottom:i<LEVELS.length-1?'1px solid rgba(255,255,255,0.04)':'none', opacity:isLocked?0.4:1 }}>
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:isPast||isCurrent?`${l.color}20`:'rgba(255,255,255,0.04)', border:`1px solid ${isPast||isCurrent?l.color+'35':'rgba(255,255,255,0.07)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AchIcon name={l.iconName} color={isPast||isCurrent?l.color:'#52525b'} size={16}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ color:isCurrent?l.color:isPast?'#71717a':'#52525b', fontSize:12, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>Level {l.level} — {l.label}</span>
                  {isCurrent && <div style={{ width:5, height:5, borderRadius:'50%', background:l.color, boxShadow:`0 0 6px ${l.color}`, animation:'pulse 2s infinite', flexShrink:0 }}/>}
                  {isPast && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}><path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ color:'#3f3f46', fontSize:10, fontFamily:'system-ui,sans-serif' }}>{l.min.toLocaleString()} – {l.max.toLocaleString()} XP</span>
              </div>
              {isCurrent && (
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:11, color:l.color, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>{Math.round(lvl.progress)}%</div>
                  <div style={{ fontSize:9, color:'#52525b', fontFamily:'system-ui,sans-serif' }}>progress</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ═══════════════════════════════ TABLET ═══════════════════════════════ */
  if (isTablet) {
    return (
      <main style={{ background:'#080810', minHeight:'100vh', display:'flex', justifyContent:'center' }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

        {/* FIX 2: maxWidth 640px + overflow hidden agar tidak scroll samping */}
        <div style={{
          width:'100%', maxWidth:840, minHeight:'100vh',
          background:'#0a0a0d',
          borderLeft:'1px solid rgba(255,255,255,0.04)',
          borderRight:'1px solid rgba(255,255,255,0.04)',
          paddingBottom:100,
          overflowX:'hidden',   // ← kunci: tidak ada scroll horizontal
        }}>

          {/* Top banner */}
          <div style={{ position:'relative', overflow:'hidden', background:`linear-gradient(135deg,${lvl.color}18 0%,rgba(8,8,16,0) 60%)`, padding:'48px 28px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:`radial-gradient(circle,${lvl.color}20,transparent 70%)`, pointerEvents:'none' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <RingProgress pct={lvl.progress} color={lvl.color} size={100}/>
                <div style={{ position:'absolute', inset:6, borderRadius:'50%', background:`linear-gradient(135deg,${lvl.color},${lvl.ring})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 30px ${lvl.color}50` }}>
                  <AchIcon name={lvl.iconName} color="#fff" size={24}/>
                </div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${lvl.color}18`, border:`1px solid ${lvl.color}35`, borderRadius:99, padding:'4px 12px', marginBottom:10 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:lvl.color, boxShadow:`0 0 6px ${lvl.color}` }}/>
                  <span style={{ color:lvl.color, fontSize:11, fontWeight:700, letterSpacing:'0.06em', fontFamily:'system-ui,sans-serif' }}>LEVEL {lvl.level} · {lvl.label.toUpperCase()}</span>
                </div>
                <h1 style={{ fontSize:26, fontWeight:900, color:'#f4f4f5', letterSpacing:'-0.04em', margin:'0 0 4px', lineHeight:1 }}>Anonim</h1>
                <p style={{ fontSize:12, color:'#52525b', margin:0, fontFamily:'system-ui,sans-serif' }}>Bergabung sejak Maret 2026</p>
                {lvl.next && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ color:'#52525b', fontSize:11, fontFamily:'system-ui,sans-serif' }}>Menuju Level {lvl.next.level}</span>
                      <span style={{ color:lvl.color, fontSize:11, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>{xp} / {lvl.next.min} XP</span>
                    </div>
                    <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${lvl.progress}%`, background:`linear-gradient(90deg,${lvl.color},${lvl.ring})`, borderRadius:99, boxShadow:`0 0 8px ${lvl.color}60`, transition:'width 1s ease' }}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FIX 3: single column layout — tidak pakai grid 2 kolom yang overflow */}
          <div style={{ padding:'20px 20px 0', display:'flex', flexDirection:'column', gap:14 }}>

            {/* Stats — 2x2 grid yang aman */}
            <div>
              <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontFamily:'system-ui,sans-serif' }}>Statistik</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <StatCard iconName="Flame"    value={streak}         label="Hari Streak"   color="#ef4444" wide/>
                <StatCard iconName="Star"     value={xp}             label="Total XP"      color="#facc15" wide/>
                <StatCard iconName="BookOpen" value={completedCount} label="Stage Selesai" color={lvl.color} wide/>
                <StatCard iconName="Trophy"   value={unlockedCount}  label="Achievement"   color="#a855f7" wide/>
              </div>
            </div>

            {/* XP bar */}
            {lvl.next && (
              <div style={{ background:'#0e0e14', border:`1px solid ${lvl.color}18`, borderRadius:18, padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:'#a1a1aa', margin:'0 0 2px', fontFamily:'system-ui,sans-serif' }}>Menuju Level {lvl.next.level}</p>
                    <p style={{ fontSize:11, color:'#3f3f46', margin:0, fontFamily:'system-ui,sans-serif' }}>Terus semangat belajar!</p>
                  </div>
                  <span style={{ color:lvl.color, fontWeight:800, fontSize:12, fontFamily:'system-ui,sans-serif' }}>{xp} / {lvl.next.min} XP</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${lvl.progress}%`, background:`linear-gradient(90deg,${lvl.color},${lvl.ring})`, borderRadius:99, boxShadow:`0 0 8px ${lvl.color}60`, transition:'width 1s ease' }}/>
                </div>
                <p style={{ fontSize:10, color:'#3f3f46', margin:'8px 0 0', fontFamily:'system-ui,sans-serif' }}>
                  {Math.round(lvl.progress)}% selesai · butuh {lvl.next.min - xp} XP lagi
                </p>
              </div>
            )}

            <DailyTargets/>
            <LevelRoadmap/>
            <AchievementsSection cols={3}/>
          </div>
        </div>
        <AchievementPopup/>
        <BottomNav/>
      </main>
    );
  }

  /* ═══════════════════════════════ MOBILE ═══════════════════════════════ */
  return (
    <main style={{ background:'#080810', minHeight:'100vh', display:'flex', justifyContent:'center' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div style={{ width:'100%', maxWidth:448, minHeight:'100vh', background:'#0a0a0d', borderLeft:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)', overflowY:'auto', overflowX:'hidden', paddingBottom:100 }}>

        {/* Hero */}
        <div style={{ position:'relative', overflow:'hidden', background:`linear-gradient(180deg,${lvl.color}18 0%,transparent 100%)`, padding:'52px 20px 28px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)', width:260, height:260, borderRadius:'50%', background:`radial-gradient(circle,${lvl.color}18,transparent 70%)`, pointerEvents:'none' }}/>
          <div style={{ position:'relative', width:100, height:100, margin:'0 auto 16px' }}>
            <RingProgress pct={lvl.progress} color={lvl.color} size={100}/>
            <div style={{ position:'absolute', inset:6, borderRadius:'50%', background:`linear-gradient(135deg,${lvl.color},${lvl.ring})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 28px ${lvl.color}50` }}>
              <AchIcon name={lvl.iconName} color="#fff" size={24}/>
            </div>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${lvl.color}18`, border:`1px solid ${lvl.color}35`, borderRadius:99, padding:'4px 12px', marginBottom:10 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:lvl.color, boxShadow:`0 0 6px ${lvl.color}`, animation:'pulse 2s infinite' }}/>
            <span style={{ color:lvl.color, fontSize:10, fontWeight:700, letterSpacing:'0.08em', fontFamily:'system-ui,sans-serif' }}>LEVEL {lvl.level} · {lvl.label.toUpperCase()}</span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#f4f4f5', letterSpacing:'-0.04em', margin:'0 0 4px', lineHeight:1 }}>Anonim</h1>
          <p style={{ fontSize:12, color:'#52525b', margin:0, fontFamily:'system-ui,sans-serif' }}>Bergabung sejak Maret 2026</p>
        </div>

        {/* Stats */}
        <div style={{ padding:'20px 16px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { iconName:'Flame',    value:streak,         label:'Streak',   color:'#ef4444' },
            { iconName:'Star',     value:xp,             label:'Total XP', color:'#facc15' },
            { iconName:'BookOpen', value:completedCount, label:'Selesai',  color:lvl.color },
            { iconName:'Trophy',   value:unlockedCount,  label:'Badge',    color:'#a855f7' },
          ].map((s, i) => (
            <div key={i} style={{ background:'#0e0e14', border:`1px solid ${s.color}18`, borderRadius:16, padding:'14px 12px', display:'flex', alignItems:'center', gap:10, animation:`fadeUp 0.3s ease ${i*0.08}s both` }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}15`, border:`1px solid ${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <AchIcon name={s.iconName} color={s.color} size={17}/>
              </div>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'#f4f4f5', lineHeight:1, fontFamily:'system-ui,sans-serif' }}>{s.value}</div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#52525b', marginTop:3, fontFamily:'system-ui,sans-serif' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        {lvl.next && (
          <div style={{ padding:'16px 16px 0' }}>
            <div style={{ background:'#0e0e14', border:`1px solid ${lvl.color}18`, borderRadius:18, padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'#a1a1aa', margin:'0 0 2px', fontFamily:'system-ui,sans-serif' }}>Menuju Level {lvl.next.level}</p>
                  <p style={{ fontSize:11, color:'#3f3f46', margin:0, fontFamily:'system-ui,sans-serif' }}>Terus semangat belajar!</p>
                </div>
                <span style={{ color:lvl.color, fontWeight:800, fontSize:12, fontFamily:'system-ui,sans-serif' }}>{xp} / {lvl.next.min} XP</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden', border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ height:'100%', width:`${lvl.progress}%`, background:`linear-gradient(90deg,${lvl.color},${lvl.ring})`, borderRadius:99, boxShadow:`0 0 8px ${lvl.color}60`, transition:'width 1s ease' }}/>
              </div>
              <p style={{ fontSize:10, color:'#3f3f46', margin:'8px 0 0', fontFamily:'system-ui,sans-serif' }}>
                {Math.round(lvl.progress)}% selesai · butuh {lvl.next.min - xp} XP lagi
              </p>
            </div>
          </div>
        )}

        <div style={{ padding:'16px 16px 0' }}><DailyTargets/></div>
        <div style={{ padding:'16px 16px 0' }}><LevelRoadmap/></div>
        <div style={{ padding:'16px 16px 0' }}><AchievementsSection cols={3}/></div>
      </div>
      <AchievementPopup/>
      <BottomNav/>
    </main>
  );
}