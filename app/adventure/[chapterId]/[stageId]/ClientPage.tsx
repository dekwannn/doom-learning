// src/app/adventure/[chapterId]/[stageId]/page.tsx
'use client';
import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useProgress } from '@/hooks/useProgress';
import AdventureQuiz from '@/components/Adventure/AdventureQuiz';
import dummyData from '@/data/dummyData.json';
import jaData from '@/data/jaData.json';
import zhData from '@/data/zhData.json';
import koData from '@/data/koData.json';

const DATA_MAP: Record<string, any> = {
  en: dummyData,
  ja: jaData,
  zh: zhData,
  ko: koData,
};

function getLangData(code: string | null) { return DATA_MAP[code ?? 'en'] ?? dummyData; }

interface Props { params: Promise<{chapterId:string;stageId:string}>; }

/* ─── Lofi Player Component ───────────────────────────── */
function LofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15; 
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log('Audio error:', e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button
      onClick={togglePlay}
      title={isPlaying ? "Pause Lo-Fi" : "Play Lo-Fi"}
      style={{
        position: 'fixed',
        bottom: 110, // <--- UBAH DI SINI: Naikkan dari 24 menjadi 110
        right: 24,
        zIndex: 999,
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: isPlaying ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
        border: isPlaying ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isPlaying ? '#10b981' : '#a1a1aa',
        cursor: 'pointer',
        boxShadow: isPlaying ? '0 4px 20px rgba(16,185,129,0.2)' : '0 4px 10px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease'
      }}
    >
      <style>{`
        @keyframes pulseLofi { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      `}</style>
      {isPlaying ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pulseLofi 2s infinite' }}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
          <line x1="3" y1="3" x2="21" y2="21" strokeOpacity="0.5"/>
        </svg>
      )}
    </button>
  );
}

/* ─── Responsive Hook ─────────────────────────────────── */
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

/* ─── Stage Info Sidebar (tablet/desktop) ─────────────── */
function StageInfoSidebar({
  chapter, stage, stageIndex, totalStages, feedData, xp, stageStars, onBack,
}: {
  chapter: any; stage: any; stageIndex: number; totalStages: number;
  feedData: any[]; xp: number; stageStars: Record<string, number>; onBack: () => void;
}) {
  const completedStages = chapter.stages.filter((s: any) => (stageStars[s.id] ?? 0) > 0).length;
  const chPct = Math.round((completedStages / totalStages) * 100);

  const topicTags: string[] = [];
  feedData.forEach((item: any) => {
    if (item.type && !topicTags.includes(item.type)) topicTags.push(item.type);
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, height:'100%', overflowY:'auto', scrollbarWidth:'none' }}>
      <div style={{ padding:'24px 24px 0' }}>
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'8px 14px', color:'#71717a', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Map
        </button>
      </div>

      <div style={{ padding:'24px 24px 0' }}>
        <div style={{ width:'100%', height:3, borderRadius:99, background:`linear-gradient(90deg,${chapter.color},${chapter.ring})`, marginBottom:20 }}/>
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:`${chapter.color}12`, border:`1px solid ${chapter.color}25`, borderRadius:99, padding:'5px 12px', marginBottom:14 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:chapter.color, boxShadow:`0 0 6px ${chapter.color}` }}/>
          <span style={{ color:chapter.color, fontSize:11, fontWeight:700 }}>{chapter.title}</span>
        </div>
        <h2 style={{ color:'#f4f4f5', fontSize:22, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:6 }}>{stage.label}</h2>
        <p style={{ color:'#52525b', fontSize:12, marginBottom:20 }}>{chapter.subtitle}</p>

        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20 }}>
          {chapter.stages.map((s: any, i: number) => {
            const stars = stageStars[s.id] ?? 0;
            const isCurrent = i === stageIndex;
            return (
              <div key={s.id} style={{ height:4, flex:1, borderRadius:99, background:stars>0?chapter.color:isCurrent?`${chapter.color}60`:'rgba(255,255,255,0.06)', boxShadow:(stars>0||isCurrent)?`0 0 6px ${chapter.color}60`:'none', transition:'all 0.3s' }}/>
            );
          })}
        </div>
        <p style={{ color:'#3f3f46', fontSize:11, marginBottom:24 }}>Stage {stageIndex+1} of {totalStages}</p>
      </div>

      <div style={{ padding:'0 24px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:'rgba(250,204,21,0.05)', border:'1px solid rgba(250,204,21,0.12)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(250,204,21,0.1)', border:'1px solid rgba(250,204,21,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#facc15"/></svg>
          </div>
          <div>
            <p style={{ color:'#facc15', fontSize:20, fontWeight:900, lineHeight:1 }}>{xp}</p>
            <p style={{ color:'#52525b', fontSize:11, fontWeight:600, marginTop:2 }}>Total XP</p>
          </div>
        </div>

        <div style={{ background:`${chapter.color}08`, border:`1px solid ${chapter.color}18`, borderRadius:14, padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ color:'#d4d4d8', fontSize:12, fontWeight:700 }}>Chapter Progress</span>
            <span style={{ color:chapter.color, fontSize:12, fontWeight:800 }}>{chPct}%</span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${chPct}%`, background:`linear-gradient(90deg,${chapter.color},${chapter.ring})`, borderRadius:99, boxShadow:`0 0 8px ${chapter.color}60`, transition:'width 0.8s ease' }}/>
          </div>
          <p style={{ color:'#52525b', fontSize:11, marginTop:8 }}>{completedStages}/{totalStages} stages completed</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#71717a" strokeWidth="2"/><path d="M9 9h6M9 12h6M9 15h4" stroke="#71717a" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p style={{ color:'#e4e4e7', fontSize:20, fontWeight:900, lineHeight:1 }}>{feedData.length}</p>
            <p style={{ color:'#52525b', fontSize:11, fontWeight:600, marginTop:2 }}>Questions</p>
          </div>
        </div>
      </div>

      {topicTags.length > 0 && (
        <div style={{ padding:'20px 24px 0' }}>
          <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Question Types</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {topicTags.map((tag, i) => (
              <div key={i} style={{ padding:'5px 12px', borderRadius:99, background:`${chapter.color}10`, border:`1px solid ${chapter.color}25`, fontSize:11, fontWeight:700, color:chapter.color, textTransform:'capitalize' }}>
                {tag.replace(/_/g,' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding:'20px 24px' }}>
        <p style={{ color:'#3f3f46', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Stars Earned</p>
        <div style={{ display:'flex', gap:8 }}>
          {[1,2,3].map(i => {
            const earned = (stageStars[stage.id] ?? 0) >= i;
            return (
              <div key={i} style={{ flex:1, height:44, borderRadius:12, background:earned?`${chapter.color}15`:'rgba(255,255,255,0.03)', border:`1px solid ${earned?chapter.color+'30':'rgba(255,255,255,0.06)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={earned?'#facc15':'none'} stroke={earned?'#facc15':'#3f3f46'} strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function AdventureStage({ params }: Props) {
  const router    = useRouter();
  const bp        = useBreakpoint();
  const isWide    = bp === 'tablet' || bp === 'desktop';
  const isDesktop = bp === 'desktop';

  const { chapterId, stageId } = use(params);
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);

  const { xp, stageStars, stageUnlocked, completedStages } = useProgress();

  const langData   = getLangData(selectedLanguage);
  const chapters   = langData.chapters;
  const chapter    = chapters.find((c: any) => String(c.id) === chapterId);
  const stageIndex = chapter?.stages.findIndex((s: any) => s.id === stageId) ?? -1;
  const stage      = stageIndex >= 0 ? chapter.stages[stageIndex] : null;
  const feeds      = langData.feeds;
  const feedData: any[] = stage?.feedKey ? (feeds[stage.feedKey] ?? []) : [];

  if (!chapter || !stage) return (
    <main style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a0d' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#52525b', fontSize:14 }}>Stage not found.</p>
        <button onClick={() => router.push('/adventure')} style={{ color:chapter?.color??'#6366f1', fontSize:13, fontWeight:700, marginTop:12, background:'none', border:'none', cursor:'pointer' }}>
          ← Back to Map
        </button>
      </div>
    </main>
  );

  if (stage.type === 'intro' || feedData.length === 0) {
    if (isWide) {
      return (
        <main style={{ display:'flex', justifyContent:'center', minHeight:'100vh', background:'#050507' }}>
          <div style={{ width:'100%', maxWidth:isDesktop?1000:800, minHeight:'100vh', background:'#0a0a0d', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ textAlign:'center', padding:'0 48px', maxWidth:520 }}>
              <div style={{ width:96, height:96, borderRadius:'50%', background:`${chapter.color}14`, border:`2px solid ${chapter.color}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:chapter.color }}/>
              </div>
              <h1 style={{ color:'#fff', fontSize:32, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:12 }}>{chapter.subtitle}</h1>
              <p style={{ color:'#52525b', fontSize:14, lineHeight:1.7, marginBottom:40 }}>
                Welcome to {chapter.title}. You'll learn {chapter.subtitle.toLowerCase()} through interactive exercises including listening and speaking practice.
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => router.push('/adventure')} style={{ flex:1, height:52, borderRadius:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a', fontSize:14, fontWeight:700, cursor:'pointer' }}>← Back</button>
                <button onClick={() => router.push('/adventure')} style={{ flex:2, height:52, borderRadius:14, background:`linear-gradient(135deg,${chapter.color},${chapter.ring})`, border:'none', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer', boxShadow:`0 6px 22px ${chapter.color}40` }}>Start Adventure</button>
              </div>
            </div>
          </div>
          <LofiPlayer />
        </main>
      );
    }
    return (
      <main style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a0d' }}>
        <div style={{ width:'100%', maxWidth:448, height:'100vh', background:'#0a0a0d', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 28px', textAlign:'center', position:'relative' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${chapter.color},${chapter.ring})` }}/>
          <div style={{ width:80, height:80, borderRadius:'50%', background:`${chapter.color}14`, border:`2px solid ${chapter.color}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:chapter.color }}/>
          </div>
          <h1 style={{ color:'#fff', fontSize:26, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:10 }}>{chapter.subtitle}</h1>
          <p style={{ color:'#52525b', fontSize:13, lineHeight:1.7, marginBottom:32 }}>
            Welcome to {chapter.title}. You'll learn {chapter.subtitle.toLowerCase()} through interactive exercises including listening and speaking practice.
          </p>
          <button onClick={() => router.push('/adventure')} style={{ width:'100%', height:52, borderRadius:14, background:`linear-gradient(135deg,${chapter.color},${chapter.ring})`, border:'none', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer', boxShadow:`0 6px 22px ${chapter.color}40` }}>
            Start Adventure
          </button>
        </div>
        <LofiPlayer />
      </main>
    );
  }

  /* ── TABLET / DESKTOP ── */
  if (isWide) {
    const sidebarW = isDesktop ? 300 : 260;
    const maxW     = isDesktop ? 1100 : 900;
    return (
      <main style={{ display:'flex', justifyContent:'center', minHeight:'100vh', background:'#050507' }}>
        <div style={{ width:'100%', maxWidth:maxW, minHeight:'100vh', background:'#0a0a0d', display:'flex', flexDirection:'column', borderLeft:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(10,10,13,0.95)', backdropFilter:'blur(12px)', flexShrink:0, position:'sticky', top:0, zIndex:30 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => router.push('/adventure')} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#71717a' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <div style={{ width:1, height:20, background:'rgba(255,255,255,0.06)' }}/>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:chapter.color, boxShadow:`0 0 8px ${chapter.color}` }}/>
                <span style={{ color:'#71717a', fontSize:12, fontWeight:700 }}>{chapter.title}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round"/></svg>
                <span style={{ color:'#d4d4d8', fontSize:12, fontWeight:700 }}>{stage.label}</span>
              </div>
            </div>

            {/* Stage dots */}
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              {chapter.stages.map((s: any, i: number) => {
                const stars     = stageStars[s.id] ?? 0;
                const isCurrent = i === stageIndex;
                return (
                  <div key={s.id} style={{ width:isCurrent?20:6, height:6, borderRadius:99, background:stars>0?chapter.color:isCurrent?`${chapter.color}80`:'rgba(255,255,255,0.08)', transition:'all 0.3s', boxShadow:(stars>0||isCurrent)?`0 0 4px ${chapter.color}60`:'none' }}/>
                );
              })}
            </div>

            {/* XP */}
            <div style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)', borderRadius:99, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#facc15"/></svg>
              <span style={{ color:'#facc15', fontSize:12, fontWeight:800 }}>{xp} XP</span>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:`${sidebarW}px 1fr`, flex:1, minHeight:0, overflow:'hidden' }}>
            <div style={{ borderRight:'1px solid rgba(255,255,255,0.04)', background:'rgba(8,8,13,0.6)', height:'calc(100vh - 65px)', position:'sticky', top:65, overflowY:'auto', scrollbarWidth:'none' }}>
              <StageInfoSidebar
                chapter={chapter} stage={stage}
                stageIndex={stageIndex} totalStages={chapter.stages.length}
                feedData={feedData}
                xp={xp}
                stageStars={stageStars}
                onBack={() => router.push('/adventure')}
              />
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', height:'calc(100vh - 65px)', background:'#0a0a0d', padding:isDesktop?'0 40px':'0 24px' }}>
              <div style={{ width:'100%', maxWidth:520, display:'flex', flexDirection:'column', minHeight:'100%' }}>
                <AdventureQuiz feedData={feedData} chapter={chapter} stage={stage} stageIndex={stageIndex} totalStages={chapter.stages.length}/>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tombol Lofi Desktop */}
        <LofiPlayer />
      </main>
    );
  }

  /* ── MOBILE ── */
  return (
    <main style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#050507' }}>
      <div style={{ width:'100%', maxWidth:448, height:'100vh', background:'#0a0a0d', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 0 60px rgba(0,0,0,0.8)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
          <button onClick={() => router.push('/adventure')} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#52525b' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:chapter.color, boxShadow:`0 0 8px ${chapter.color}` }}/>
            <span style={{ color:'#52525b', fontSize:12, fontWeight:700 }}>{chapter.title} · {stage.label}</span>
          </div>
          {/* XP mobile */}
          <div style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)', borderRadius:99, padding:'4px 10px' }}>
            <span style={{ color:'#facc15', fontSize:12, fontWeight:800 }}>{xp} XP</span>
          </div>
        </div>
        <AdventureQuiz feedData={feedData} chapter={chapter} stage={stage} stageIndex={stageIndex} totalStages={chapter.stages.length}/>
      </div>
      
      {/* Tombol Lofi Mobile */}
      <LofiPlayer />
    </main>
  );
}