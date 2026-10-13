'use client';

import BottomNav from '@/components/Layout/BottomNav';
import AchievementPopup from '@/components/Achievement/AchievementPopup';
import { useUserStore, ACHIEVEMENT_DEFS } from '@/store/useUserStore';
import { useProgress } from '@/hooks/useProgress';
import { useLanguageStore } from '@/store/useLanguageStore'; // <-- IMPORT BARU
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRankStore } from '@/store/useRankStore';
import {
  Zap, Target, CheckCircle, Timer, BookOpen, Library, GraduationCap,
  Flame, Compass, Globe, Moon, Sunrise, Sprout, Star, Gem, Crown, Trophy,
  CalendarCheck, Languages, BookMarked, Sparkles, Shield, PenLine, Sword,
  PenTool, Mountain, LogOut, LucideIcon, Loader2, Edit3, X, Check
} from 'lucide-react';

/* ── Icon registry & Config ── */
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

/* ── 10 LEVEL & TRANSLASI BAHASA ── */
const LEVEL_LABELS: Record<string, string[]> = {
  en: ['Novice', 'Beginner', 'Learner', 'Intermediate', 'Skilled', 'Proficient', 'Advanced', 'Expert', 'Master', 'Legend'],
  ja: ['Nyūmonsha (入門者)', 'Shoshinsha (初心者)', 'Gakushūsha (学習者)', 'Chūkyūsha (中級者)', 'Jukurensha (熟練者)', 'Tassha (達者)', 'Jōkyūsha (上級者)', 'Senmonka (専門家)', 'Tatsujin (達人)', 'Densetsu (伝説)'],
  zh: ['Xīnshǒu (新手)', 'Chūxuézhě (初学者)', 'Xuéxízhě (学习者)', 'Zhōngjízhě (中级者)', 'Shúliànzhě (熟练者)', 'Jīngtōngzhě (精通者)', 'Gāojízhě (高级者)', 'Zhuānjiā (专家)', 'Dàshī (大师)', 'Chuánqí (传奇)'],
  ko: ['Ipmunja (입문자)', 'Choboja (초보자)', 'Hakseupja (학습자)', 'Junggeupja (중급자)', 'Suknyeonja (숙련자)', 'Neungsukja (능숙자)', 'Gogeupja (고급자)', 'Jeonmunga (전문가)', 'Dosa (도사)', 'Jeonseol (전설)'],
};

function getLevelInfo(xp: number, lang: string) {
  const labels = LEVEL_LABELS[lang] || LEVEL_LABELS.en;
  
  const LEVELS = [
    { level: 1,  min: 0,      max: 500,    label: labels[0], color: '#94a3b8', ring: '#cbd5e1', iconName: 'Sprout' },       
    { level: 2,  min: 500,    max: 1200,   label: labels[1], color: '#10b981', ring: '#34d399', iconName: 'BookOpen' },     
    { level: 3,  min: 1200,   max: 2500,   label: labels[2], color: '#06b6d4', ring: '#22d3ee', iconName: 'PenTool' },      
    { level: 4,  min: 2500,   max: 4500,   label: labels[3], color: '#3b82f6', ring: '#60a5fa', iconName: 'Compass' },      
    { level: 5,  min: 4500,   max: 7500,   label: labels[4], color: '#6366f1', ring: '#818cf8', iconName: 'Mountain' },     
    { level: 6,  min: 7500,   max: 12000,  label: labels[5], color: '#8b5cf6', ring: '#a78bfa', iconName: 'Target' },       
    { level: 7,  min: 12000,  max: 18000,  label: labels[6], color: '#a855f7', ring: '#c084fc', iconName: 'Shield' },       
    { level: 8,  min: 18000,  max: 26000,  label: labels[7], color: '#ec4899', ring: '#f472b6', iconName: 'Sword' },        
    { level: 9,  min: 26000,  max: 38000,  label: labels[8], color: '#f43f5e', ring: '#fb7185', iconName: 'Crown' },        
    { level: 10, min: 38000,  max: 60000,  label: labels[9], color: '#f59e0b', ring: '#fcd34d', iconName: 'Trophy' },       
  ];

  const lvl  = [...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0];
  const next = LEVELS.find(l => l.level === lvl.level + 1);
  const progress = next ? Math.min(100, ((xp - lvl.min) / (next.min - lvl.min)) * 100) : 100;
  return { ...lvl, next, progress, allLevels: LEVELS };
}

const RARITY: Record<string, { color: string; label: string; bg: string; border: string }> = {
  common:    { color: '#71717a', label: 'Common',    bg: 'rgba(113,113,122,0.08)',  border: 'rgba(113,113,122,0.18)' },
  rare:      { color: '#3b82f6', label: 'Rare',      bg: 'rgba(59,130,246,0.08)',   border: 'rgba(59,130,246,0.22)' },
  epic:      { color: '#a855f7', label: 'Epic',      bg: 'rgba(168,85,247,0.08)',   border: 'rgba(168,85,247,0.25)' },
  legendary: { color: '#f59e0b', label: 'Legendary', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.3)' },
};

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

function RingProgress({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const r = (size - 12) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dasharray 1s ease-out' }}/>
    </svg>
  );
}

function StatCard({ iconName, value, label, color, wide = false }: {
  iconName: string; value: string | number; label: string; color: string; wide?: boolean;
}) {
  return (
    <div style={{ flex:1, background:'#0e0e14', border:`1px solid ${color}20`, borderRadius:18, padding:wide?'16px 18px':'14px 16px', display:'flex', flexDirection:wide?'row':'column', alignItems:'center', gap:wide?12:8, boxShadow:`0 4px 24px ${color}08` }}>
      <div style={{ width:40, height:40, borderRadius:12, background:`${color}15`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <AchIcon name={iconName} color={color} size={18}/>
      </div>
      <div style={{ textAlign:wide?'left':'center', minWidth:0 }}>
        <div style={{ fontSize:22, fontWeight:900, color:'#f4f4f5', lineHeight:1, fontFamily:'system-ui,sans-serif' }}>{value}</div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#52525b', marginTop:4, fontFamily:'system-ui,sans-serif', whiteSpace:'nowrap' }}>{label}</div>
      </div>
    </div>
  );
}

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

function ActionButtons({ router, onLogout }: { router: ReturnType<typeof useRouter>; onLogout: () => void }) {
  return (
    <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'center' }}>
      <button
        onClick={() => router.push('/leaderboard')}
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'9px 18px', borderRadius:99, cursor:'pointer',
          background:'rgba(250,204,21,0.1)',
          border:'1px solid rgba(250,204,21,0.28)',
          color:'#facc15', fontSize:13, fontWeight:700,
          fontFamily:'system-ui,sans-serif',
          transition:'all 0.15s',
        }}
      >
        <Trophy size={14} color="#facc15" />
        Leaderboard
      </button>

      <button
        onClick={onLogout}
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'9px 18px', borderRadius:99, cursor:'pointer',
          background:'rgba(239,68,68,0.08)',
          border:'1px solid rgba(239,68,68,0.22)',
          color:'#f87171', fontSize:13, fontWeight:700,
          fontFamily:'system-ui,sans-serif',
          transition:'all 0.15s',
        }}
      >
        <LogOut size={14} color="#f87171" />
        Keluar
      </button>
    </div>
  );
}

function ProfileAvatar({ url, name, color, iconName, size = 100, isTablet = false, isEditing = false }: { url: string | null; name: string; color: string; iconName: string; size?: number; isTablet?: boolean; isEditing?: boolean }) {
  const innerSize = size - 16; 
  const initials = name?.slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: isTablet ? '0' : '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      <div style={{ 
        width: innerSize, height: innerSize, borderRadius: '50%', overflow: 'hidden', 
        background: `${color}15`, border: `2px solid ${color}30`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 5,
        opacity: isEditing ? 0.7 : 1, transition: 'opacity 0.2s'
      }}>
        {url ? (
          <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: color, fontSize: size * 0.3, fontWeight: 800 }}>{initials}</span>
        )}
      </div>

      {isEditing ? (
         <div style={{ 
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <Edit3 size={24} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}/>
        </div>
      ) : (
        <div style={{ 
          position: 'absolute', bottom: 0, right: 0, zIndex: 20,
          width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${color},#000)`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          boxShadow: `0 0 12px ${color}80`, border: '2px solid #0a0a0d' 
        }}>
          <AchIcon name={iconName} color="#fff" size={16}/>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function ProfilePage() {
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage) || 'en';
  const { xp: rawXp, streak: rawStreak, completedStages, addXp } = useProgress();
  const { unlockedAchievements } = useUserStore();
  const router = useRouter();

  const [mounted,    setMounted]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('all');
  
  // State User Profil
  const [userId,     setUserId]     = useState<string | null>(null);
  const [username,   setUsername]   = useState('');
  const [joinedAt,   setJoinedAt]   = useState('');
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); 

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName]   = useState('');
  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');

  const bp       = useBreakpoint();
  const isTablet = bp === 'tablet';
  const showRankUp = useRankStore(s => s.showRankUp);

  useEffect(() => {
    setMounted(true);
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }
      setUserId(user.id);
      
      supabase
        .from('profiles')
        .select('username, created_at, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading profile:', error);
            setIsLoadingProfile(false);
            return;
          }
          if (data) {
            const currentName = data.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Pelajar';
            setUsername(currentName);
            setEditName(currentName);
            setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || null);
            
            if (data.created_at) {
              const d = new Date(data.created_at);
              setJoinedAt(d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
            }
          }
          setIsLoadingProfile(false);
        });
    });
  }, []);

  const xp     = mounted ? rawXp     : 0;
  const streak = mounted ? rawStreak : 0;

  // Dapatkan Info Level sesuai bahasa & XP
  const lvlInfo = getLevelInfo(xp, selectedLanguage);
  const lvl = lvlInfo;
  const LEVELS = lvlInfo.allLevels;

  const completedCount = mounted ? Object.values(completedStages).filter(Boolean).length : 0;
  const unlockedSet    = new Set(mounted ? (unlockedAchievements || []).map(a => a.id) : []);
  const unlockedCount  = mounted ? unlockedAchievements.length : 0;

  const filteredDefs = activeTab === 'all'
    ? ACHIEVEMENT_DEFS
    : ACHIEVEMENT_DEFS.filter(d => d.category === activeTab);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Fungsi Simpan Profil Baru ──
  const handleSaveProfile = async () => {
    if (!userId || !editName.trim()) return;
    setSaveError('');
    
    const newName = editName.trim();
    if (newName.length < 3 || newName.length > 20) {
      setSaveError('Nama harus antara 3 - 20 karakter');
      return;
    }
    if (!/^[a-zA-Z0-9_ ]+$/.test(newName)) {
      setSaveError('Hanya huruf, angka, spasi, dan underscore');
      return;
    }

    setIsSaving(true);

    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName)}`;

    const { error } = await supabase
      .from('profiles')
      .update({ username: newName, avatar_url: newAvatarUrl })
      .eq('id', userId);

    if (error) {
      setSaveError('Gagal menyimpan. Coba lagi.');
      setIsSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { username: newName, avatar_url: newAvatarUrl }
    });

    setUsername(newName);
    setAvatarUrl(newAvatarUrl);
    setIsEditing(false);
    setIsSaving(false);
  };

  const CategoryTabs = () => (
    <div style={{ display:'flex', gap:6, overflowX:'auto', scrollbarWidth:'none', paddingBottom:2 }}>
      {CATEGORIES.map(cat => {
        const catDefs     = cat.id === 'all' ? ACHIEVEMENT_DEFS : ACHIEVEMENT_DEFS.filter(d => d.category === cat.id);
        const catUnlocked = catDefs.filter(d => unlockedSet.has(d.id)).length;
        const isActive    = activeTab === cat.id;
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

const DailyTargets = () => {
    // Ambil data real-time dari Store
    const dailyStats = useUserStore(s => s.dailyStats);
    const claimReward = useUserStore(s => s.claimDailyReward);
    
    // Pastikan UI hanya membaca data hari ini (kalau ganti hari, reset otomatis)
    const today = new Date().toDateString();
    const isToday = dailyStats?.date === today;
    
    const stagesDone = isToday ? dailyStats.stagesCompleted : 0;
    const questionsDone = isToday ? dailyStats.questionsAnswered : 0;
    const materialsDone = isToday ? dailyStats.materialsRead : 0;
    const claimed = isToday ? dailyStats.claimed : {};

    const missions = [
      { id: 'stage', label: 'Selesaikan 1 stage', current: stagesDone, target: 1, xp: 50 },
      { id: 'quest', label: 'Kerjakan 5 soal', current: questionsDone, target: 5, xp: 30 },
      { id: 'vocab', label: 'Baca 2 materi (Vocab)', current: materialsDone, target: 2, xp: 20 },
    ];

    return (
      <div style={{ background:'#0e0e14', border:`1px solid ${lvl.color}20`, borderRadius:18, padding:'18px 20px' }}>
        <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14, fontFamily:'system-ui,sans-serif' }}>Target Hari Ini</p>
        
        {missions.map((t, i) => {
          const isCompleted = t.current >= t.target;
          const isClaimed = claimed[t.id] === true;

          return (
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<2?'1px solid rgba(255,255,255,0.04)':'none' }}>
              
              {/* Lingkaran Indikator */}
              <div style={{ width:24, height:24, borderRadius:8, flexShrink:0, background:isClaimed?`${lvl.color}25`:'rgba(255,255,255,0.04)', border:`1px solid ${isClaimed?lvl.color+'40':'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {isClaimed ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={lvl.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <span style={{ fontSize: 10, color: '#71717a', fontWeight: 'bold' }}>{Math.min(t.current, t.target)}/{t.target}</span>
                )}
              </div>

              {/* Teks Misi */}
              <span style={{ flex:1, color:isClaimed?'#71717a':'#d4d4d8', fontSize:13, fontFamily:'system-ui,sans-serif', textDecoration:isClaimed?'line-through':'none' }}>
                {t.label}
              </span>

              {/* Tombol Klaim atau Teks XP */}
              {isClaimed ? (
                <span style={{ color:'#52525b', fontSize:10, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>Diambil</span>
              ) : isCompleted ? (
                <button 
                  onClick={() => { if (claimReward(t.id)) addXp(t.xp); }}
                  style={{ background: lvl.color, border: 'none', color: '#000', fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', boxShadow: `0 0 8px ${lvl.color}80`, animation: 'pulse 2s infinite' }}
                >
                  Klaim +{t.xp}
                </button>
              ) : (
                <span style={{ color:'#facc15', fontSize:11, fontWeight:700, fontFamily:'system-ui,sans-serif' }}>+{t.xp} XP</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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

  /* ═══════════════════════════════ TABLET / DESKTOP ═══════════════════════════════ */
  if (isTablet) {
    return (
      <main suppressHydrationWarning style={{ background:'#080810', minHeight:'100vh', display:'flex', justifyContent:'center' }}>
        <style>{`
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
          @keyframes pulseBg{0%,100%{background-color:rgba(255,255,255,0.05)}50%{background-color:rgba(255,255,255,0.1)}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
        <div style={{ width:'100%', maxWidth:840, minHeight:'100vh', background:'#0a0a0d', borderLeft:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)', paddingBottom:100, overflowX:'hidden' }}>

          <div style={{ position:'relative', overflow:'hidden', background:`linear-gradient(135deg,${lvl.color}18 0%,rgba(8,8,16,0) 60%)`, padding:'48px 28px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:`radial-gradient(circle,${lvl.color}20,transparent 70%)`, pointerEvents:'none' }}/>
            
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              
              <div style={{ position:'relative', flexShrink:0 }}>
                {isLoadingProfile ? (
                   <div style={{ width:100, height:100, borderRadius:'50%', animation:'pulseBg 1.5s infinite', display:'flex', alignItems:'center', justifyContent:'center' }}>
                     <Loader2 size={24} color="#71717a" style={{ animation: 'spin 1s linear infinite' }}/>
                   </div>
                ) : (
                  <>
                    <RingProgress pct={lvl.progress} color={lvl.color} size={100}/>
                    <ProfileAvatar url={avatarUrl} name={isEditing ? editName : username} color={lvl.color} iconName={lvl.iconName} size={100} isTablet={true} isEditing={isEditing} />
                  </>
                )}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${lvl.color}18`, border:`1px solid ${lvl.color}35`, borderRadius:99, padding:'4px 12px', marginBottom:10 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:lvl.color, boxShadow:`0 0 6px ${lvl.color}` }}/>
                  <span style={{ color:lvl.color, fontSize:11, fontWeight:700, letterSpacing:'0.06em', fontFamily:'system-ui,sans-serif' }}>LEVEL {lvl.level} · {lvl.label.toUpperCase()}</span>
                </div>
                
                {isLoadingProfile ? (
                   <div style={{ width: 150, height: 26, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 4, animation: 'pulseBg 1.5s infinite' }} />
                ) : isEditing ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nama kamu..."
                        style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${lvl.color}50`, color: '#fff', fontSize: 20, fontWeight: 800, padding: '4px 12px', borderRadius: 8, outline: 'none', width: '100%', maxWidth: 250 }}
                        maxLength={20}
                        autoFocus
                      />
                      <button onClick={handleSaveProfile} disabled={isSaving} style={{ background: lvl.color, border: 'none', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000' }}>
                        {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <Check size={18} strokeWidth={3} />}
                      </button>
                      <button onClick={() => { setIsEditing(false); setEditName(username); setSaveError(''); }} disabled={isSaving} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <X size={18} />
                      </button>
                    </div>
                    {saveError && <p style={{ color: '#ef4444', fontSize: 11, margin: '4px 0 0', fontWeight: 600 }}>{saveError}</p>}
                    <p style={{ color: '#a1a1aa', fontSize: 11, margin: '4px 0 0' }}>Avatar akan otomatis berubah sesuai nama.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h1 style={{ fontSize:26, fontWeight:900, color:'#f4f4f5', letterSpacing:'-0.04em', margin:'0 0 4px', lineHeight:1 }}>{username || 'Pelajar'}</h1>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                      title="Edit Profil"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>
                )}
                
                {isLoadingProfile ? (
                   <div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, animation: 'pulseBg 1.5s infinite' }} />
                ) : !isEditing && (
                   <p style={{ fontSize:12, color:'#52525b', margin:'0 0 0', fontFamily:'system-ui,sans-serif' }}>Bergabung sejak {joinedAt || '...'}</p>
                )}

                {!isEditing && <ActionButtons router={router} onLogout={handleLogout} />}

                {lvl.next && !isEditing && (
                  <div style={{ marginTop:14 }}>
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

          <div style={{ padding:'20px 20px 0', display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10, fontFamily:'system-ui,sans-serif' }}>Statistik</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <StatCard iconName="Flame"    value={streak}         label="Hari Streak"   color="#ef4444" wide/>
                <StatCard iconName="Star"     value={xp}             label="Total XP"      color="#facc15" wide/>
                <StatCard iconName="BookOpen" value={completedCount} label="Stage Selesai" color={lvl.color} wide/>
                <StatCard iconName="Trophy"   value={unlockedCount}  label="Achievement"   color="#a855f7" wide/>
              </div>
            </div>
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
    <main suppressHydrationWarning style={{ background:'#080810', minHeight:'100vh', display:'flex', justifyContent:'center' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes pulseBg{0%,100%{background-color:rgba(255,255,255,0.05)}50%{background-color:rgba(255,255,255,0.1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ width:'100%', maxWidth:448, minHeight:'100vh', background:'#0a0a0d', borderLeft:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)', overflowY:'auto', overflowX:'hidden', paddingBottom:100 }}>

        <div style={{ position:'relative', overflow:'hidden', background:`linear-gradient(180deg,${lvl.color}18 0%,transparent 100%)`, padding:'52px 20px 28px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)', width:260, height:260, borderRadius:'50%', background:`radial-gradient(circle,${lvl.color}18,transparent 70%)`, pointerEvents:'none' }}/>
          
          <div style={{ position:'relative', width:100, height:100, margin:'0 auto 16px' }}>
            {isLoadingProfile ? (
              <div style={{ width:100, height:100, borderRadius:'50%', animation:'pulseBg 1.5s infinite', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                <Loader2 size={24} color="#71717a" style={{ animation: 'spin 1s linear infinite' }}/>
              </div>
            ) : (
              <>
                <RingProgress pct={lvl.progress} color={lvl.color} size={100}/>
                <ProfileAvatar url={avatarUrl} name={isEditing ? editName : username} color={lvl.color} iconName={lvl.iconName} size={100} isTablet={false} isEditing={isEditing} />
              </>
            )}
          </div>

          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${lvl.color}18`, border:`1px solid ${lvl.color}35`, borderRadius:99, padding:'4px 12px', marginBottom:10 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:lvl.color, boxShadow:`0 0 6px ${lvl.color}`, animation:'pulse 2s infinite' }}/>
            <span style={{ color:lvl.color, fontSize:10, fontWeight:700, letterSpacing:'0.08em', fontFamily:'system-ui,sans-serif' }}>LEVEL {lvl.level} · {lvl.label.toUpperCase()}</span>
          </div>
          
          {isLoadingProfile ? (
            <div style={{ width: 140, height: 26, background: 'rgba(255,255,255,0.05)', borderRadius: 4, margin: '0 auto 4px', animation: 'pulseBg 1.5s infinite' }} />
          ) : isEditing ? (
             <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nama kamu..."
                    style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${lvl.color}50`, color: '#fff', fontSize: 18, fontWeight: 800, padding: '6px 12px', borderRadius: 8, outline: 'none', width: '100%', maxWidth: 200, textAlign: 'center' }}
                    maxLength={20}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  <button onClick={() => { setIsEditing(false); setEditName(username); setSaveError(''); }} disabled={isSaving} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                    <X size={14} /> Batal
                  </button>
                  <button onClick={handleSaveProfile} disabled={isSaving} style={{ background: lvl.color, border: 'none', padding: '6px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#000', fontSize: 12, fontWeight: 700 }}>
                    {isSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Check size={14} strokeWidth={3} />} Simpan
                  </button>
                </div>
                {saveError && <p style={{ color: '#ef4444', fontSize: 11, margin: '8px 0 0', fontWeight: 600 }}>{saveError}</p>}
                <p style={{ color: '#a1a1aa', fontSize: 10, margin: '6px 0 0' }}>Avatar akan berubah otomatis sesuai nama.</p>
             </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '0 0 4px' }}>
              <h1 style={{ fontSize:26, fontWeight:900, color:'#f4f4f5', letterSpacing:'-0.04em', lineHeight:1, margin: 0 }}>{username || 'Pelajar'}</h1>
              <button 
                onClick={() => setIsEditing(true)} 
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                title="Edit Profil"
              >
                <Edit3 size={18} />
              </button>
            </div>
          )}

          {isLoadingProfile ? (
            <div style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, margin: '0 auto', animation: 'pulseBg 1.5s infinite' }} />
          ) : !isEditing && (
             <p style={{ fontSize:12, color:'#52525b', margin:0, fontFamily:'system-ui,sans-serif' }}>Bergabung sejak {joinedAt || '...'}</p>
          )}

          {!isEditing && <ActionButtons router={router} onLogout={handleLogout} />}
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