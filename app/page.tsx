// src/app/page.tsx
'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useLanguageStore, LANGUAGES } from '@/store/useLanguageStore';
import BottomNav from '@/components/Layout/BottomNav';
import dummyData from '@/data/dummyData.json';
import jaData from '@/data/jaData.json';
import zhData from '@/data/zhData.json';
import koData from '@/data/koData.json';
import { Map, PenLine, Flame, Star, ChevronRight, BookOpen, Zap, Trophy, TrendingUp } from 'lucide-react';

const DATA_MAP: Record<string, any> = {
  en: dummyData,
  ja: jaData,
  zh: zhData,
  ko: koData,
};

function getLangData(code: string | null) { return DATA_MAP[code ?? 'en'] ?? dummyData; }

const EMPTY_OBJ: Record<string, any> = {};
const LANG_CHOSEN_KEY = 'lingora_lang_chosen';

/* ─── Splash ─────────────────────────────────────────────── */
type SplashPhase = 'enter' | 'hold' | 'exit' | 'done';

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<SplashPhase>('enter');
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTimeout(() => setVisible(true), 30));
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => { setPhase('done'); onFinish(); }, 2600);
    return () => { cancelAnimationFrame(frame); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);
  if (phase === 'done') return null;
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'#07070f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:phase==='exit'?0:1,transition:phase==='exit'?'opacity 0.4s ease':'none',pointerEvents:phase==='exit'?'none':'all' }}>
      <div style={{ width:280,height:280,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',position:'relative',zIndex:1,opacity:visible?1:0,transform:visible?'scale(1) translateY(0px)':'scale(0.78) translateY(18px)',transition:'opacity 0.55s cubic-bezier(0.34,1.56,0.64,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <img src="/logo-splash.png" alt="Lingora" style={{ width:'100%',height:'100%',objectFit:'contain' }} />
      </div>
      <div style={{ position:'absolute',bottom:56,display:'flex',gap:6,opacity:phase==='hold'?1:0,transition:'opacity 0.3s ease' }}>
        {[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:'50%',background:'#10b981',animation:'dotPulse 1.2s ease-in-out infinite',animationDelay:`${i*0.18}s` }}/>)}
      </div>
      <style>{`@keyframes dotPulse{0%,100%{transform:scale(0.7);opacity:0.3}50%{transform:scale(1);opacity:0.9}}`}</style>
    </div>
  );
}

/* ─── Responsive Hook ────────────────────────────────────── */
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

function AppLogo({ sizeHeight=36, sizeWidth=100, radius=0 }: { sizeHeight?:number; sizeWidth?:number; radius?:number }) {
  return (
    <div style={{ width:sizeWidth,height:sizeHeight,borderRadius:radius,overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <img src="/logo-home.png" alt="Lingora" style={{ width:'100%',height:'100%',objectFit:'contain' }} />
    </div>
  );
}

function StatCard({ icon, value, label, color, wide=false }: { icon:React.ReactNode; value:number|string; label:string; color:string; wide?:boolean }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:wide?'16px 20px':'14px 16px',display:'flex',alignItems:'center',gap:14 }}>
      <div style={{ width:wide?44:36,height:wide?44:36,borderRadius:wide?13:10,background:`${color}12`,border:`1px solid ${color}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{icon}</div>
      <div>
        <p style={{ color:'#fff',fontSize:wide?24:20,fontWeight:900,lineHeight:1 }}>{value}</p>
        <p style={{ color:'#52525b',fontSize:wide?12:11,fontWeight:600,marginTop:3 }}>{label}</p>
      </div>
    </div>
  );
}

function ChapterRow({ ch, xp, stageStars, stageUnlocked, wide=false }: { ch:any; xp:number; stageStars:any; stageUnlocked:any; wide?:boolean }) {
  const chUnlocked = xp >= ch.xpRequired;
  const chStages = ch.stages as any[];
  const chCompleted = chStages.filter((s:any)=>(stageStars[s.id]??0)>0).length;
  const chPct = Math.round((chCompleted/chStages.length)*100);
  return (
    <Link href={chUnlocked?'/adventure':'#'} style={{ textDecoration:'none' }}>
      <div style={{ background:chUnlocked?'rgba(255,255,255,0.025)':'rgba(255,255,255,0.012)',border:`1px solid ${chUnlocked?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,borderRadius:16,padding:wide?'16px 18px':'14px 16px',display:'flex',alignItems:'center',gap:14,opacity:chUnlocked?1:0.45,transition:'all 0.2s' }}>
        <div style={{ width:wide?12:10,height:wide?12:10,borderRadius:'50%',flexShrink:0,background:chUnlocked?ch.color:'#27272a',boxShadow:chUnlocked?`0 0 10px ${ch.color}80`:'none' }}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:chUnlocked?7:0 }}>
            <div>
              <span style={{ color:chUnlocked?'#e4e4e7':'#3f3f46',fontSize:wide?14:13,fontWeight:700,display:'block' }}>{ch.title}</span>
              {wide&&<span style={{ color:'#52525b',fontSize:11,fontWeight:500 }}>{ch.subtitle}</span>}
            </div>
            <span style={{ color:'#52525b',fontSize:11,flexShrink:0,marginLeft:8 }}>{chUnlocked?`${chCompleted}/${chStages.length}`:`🔒 ${ch.xpRequired} XP`}</span>
          </div>
          {chUnlocked&&<div style={{ height:3,background:'rgba(255,255,255,0.05)',borderRadius:99,overflow:'hidden' }}><div style={{ height:'100%',width:`${chPct}%`,background:ch.color,borderRadius:99,boxShadow:`0 0 6px ${ch.color}60`,transition:'width 0.8s ease' }}/></div>}
        </div>
        {chUnlocked&&<ChevronRight size={wide?16:14} color="#3f3f46"/>}
      </div>
    </Link>
  );
}

function XpProgressCard({ currentChapter, nextChapter, xp, xpPct, wide=false }: { currentChapter:any; nextChapter:any; xp:number; xpPct:number; wide?:boolean }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:18,padding:wide?'18px 20px':'14px 16px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:currentChapter.color,boxShadow:`0 0 8px ${currentChapter.color}` }}/>
          <span style={{ color:'#e4e4e7',fontSize:wide?14:13,fontWeight:700 }}>{currentChapter.title}</span>
          <span style={{ color:'#3f3f46',fontSize:11 }}>·</span>
          <span style={{ color:'#52525b',fontSize:wide?13:12 }}>{currentChapter.subtitle}</span>
        </div>
        <span style={{ color:'#52525b',fontSize:11,fontWeight:700 }}>{xpPct}%</span>
      </div>
      <div style={{ height:6,background:'rgba(255,255,255,0.05)',borderRadius:99,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${xpPct}%`,background:`linear-gradient(90deg,${currentChapter.color},${currentChapter.ring})`,borderRadius:99,boxShadow:`0 0 12px ${currentChapter.color}60`,transition:'width 1s cubic-bezier(0.34,1.56,0.64,1)' }}/>
      </div>
      {nextChapter&&<p style={{ color:'#3f3f46',fontSize:11,marginTop:10 }}>{nextChapter.xpRequired-xp} XP to unlock {nextChapter.title}</p>}
    </div>
  );
}

function ContinueBanner({ continueStage, wide=false }: { continueStage:{ch:any;stage:any}; wide?:boolean }) {
  return (
    <div>
      <p style={{ color:'#3f3f46',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:10 }}>Continue where you left off</p>
      <Link href={`/adventure/${continueStage.ch.id}/${continueStage.stage.id}`} style={{ textDecoration:'none' }}>
        <div style={{ background:`linear-gradient(135deg,${continueStage.ch.color}14,${continueStage.ch.color}08)`,border:`1px solid ${continueStage.ch.color}30`,borderRadius:18,padding:wide?'18px 20px':'16px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:`0 4px 32px ${continueStage.ch.color}12` }}>
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:wide?50:44,height:wide?50:44,borderRadius:wide?15:13,background:`${continueStage.ch.color}20`,border:`1px solid ${continueStage.ch.color}35`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Flame size={wide?22:20} color={continueStage.ch.color}/>
            </div>
            <div>
              <p style={{ color:'#fff',fontSize:wide?15:14,fontWeight:800,marginBottom:3 }}>{continueStage.stage.label}</p>
              <p style={{ color:'#52525b',fontSize:wide?13:12 }}>{continueStage.ch.title} · {continueStage.ch.subtitle.split(' ')[0]}</p>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:`${continueStage.ch.color}15`,border:`1px solid ${continueStage.ch.color}30`,borderRadius:10,padding:wide?'8px 14px':'6px 10px' }}>
            {wide&&<span style={{ color:continueStage.ch.color,fontSize:12,fontWeight:700 }}>Continue</span>}
            <ChevronRight size={wide?16:18} color={continueStage.ch.color}/>
          </div>
        </div>
      </Link>
    </div>
  );
}

function LanguagePill() {
  const router = useRouter();
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const lang = LANGUAGES.find(l => l.code === (selectedLanguage ?? 'en'));
  if (!lang) return null;
  const flagMap: Record<string, string> = { ja:'🇯🇵', zh:'🇨🇳', ko:'🇰🇷', fr:'🇫🇷' };
  const flag = flagMap[selectedLanguage ?? ''] ?? '🇬🇧';
  return (
    <button
      onClick={() => router.push('/language-select')}
      style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:`${lang.color}15`,border:`1px solid ${lang.color}30`,borderRadius:99,cursor:'pointer',flexShrink:0 }}
    >
      <span style={{ fontSize:13 }}>{flag}</span>
      <span style={{ color:lang.color,fontSize:11,fontWeight:700 }}>{lang.name}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="M7 10l5 5 5-5" stroke={lang.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const bp = useBreakpoint();
  const isWide = bp === 'tablet' || bp === 'desktop';
  const isDesktop = bp === 'desktop';

  const [splashDone, setSplashDone] = useState<boolean | null>(null);

  useEffect(() => {
    const alreadySeen = !!sessionStorage.getItem('splashShown');
    setSplashDone(alreadySeen);
  }, []);

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem('splashShown', '1');
    setSplashDone(true);
  }, []);

  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const activeLang       = selectedLanguage ?? 'en';
  const isEnglish = !selectedLanguage || selectedLanguage === 'en';

  const enXp            = useUserStore(s => s.xp);
  const enStageUnlocked = useUserStore(s => s.stageUnlocked);
  const enStageStars    = useUserStore(s => s.stageStars);

  const langXp            = useLanguageStore(s => s.progress[activeLang]?.xp ?? 0);
  const langStageUnlocked = useLanguageStore(s => s.progress[activeLang]?.stageUnlocked ?? EMPTY_OBJ);
  const langStageStars    = useLanguageStore(s => s.progress[activeLang]?.stageStars ?? EMPTY_OBJ);

  const xp            = isEnglish ? enXp            : langXp;
  const stageUnlocked = isEnglish ? enStageUnlocked : langStageUnlocked;
  const stageStars    = isEnglish ? enStageStars    : langStageStars;

  const CHAPTERS        = getLangData(selectedLanguage).chapters as any[];
  const currentChapter  = [...CHAPTERS].reverse().find((ch:any) => xp >= ch.xpRequired) ?? CHAPTERS[0];
  const nextChapter     = CHAPTERS.find((ch:any) => ch.xpRequired > xp);
  const xpBase          = currentChapter.xpRequired;
  const xpTarget        = nextChapter ? nextChapter.xpRequired : xpBase + 600;
  const xpPct           = Math.min(100, Math.round(((xp - xpBase) / (xpTarget - xpBase)) * 100));
  const completedStages = Object.values(stageStars as Record<string, number>).filter(s => s > 0).length;
  const totalStages     = CHAPTERS.reduce((acc:number, ch:any) => acc + ch.stages.length, 0);

  let continueStage: { ch:any; stage:any } | null = null;
  outer: for (const ch of CHAPTERS) {
    if (xp < ch.xpRequired) break;
    for (const stage of ch.stages) {
      if ((stageUnlocked[stage.id] ?? false) && (stageStars[stage.id] ?? 0) === 0) {
        continueStage = { ch, stage };
        break outer;
      }
    }
  }

  useEffect(() => {
    if (!splashDone) return;
    const hasChosen = localStorage.getItem(LANG_CHOSEN_KEY);
    if (!hasChosen || !selectedLanguage) {
      router.replace('/language-select');
    }
  }, [splashDone, selectedLanguage, router]);

  const BgDecorations = () => (
    <>
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)',backgroundSize:isWide?'64px 64px':'52px 52px',maskImage:'linear-gradient(to bottom,transparent 0%,black 8%,black 90%,transparent 100%)' }}/>
      <div style={{ position:'absolute',top:-80,left:isWide?'30%':'50%',transform:'translateX(-50%)',width:isWide?500:340,height:isWide?320:220,background:`radial-gradient(ellipse at center,${currentChapter.color}15 0%,transparent 70%)`,pointerEvents:'none',zIndex:0 }}/>
    </>
  );

  if (splashDone === null) return null;

  /* ─ TABLET / DESKTOP ─ */
  if (isWide) {
    const maxW = isDesktop ? 1100 : 860;
    const sidebarW = isDesktop ? 300 : 260;
    return (
      <main style={{ background:'#07070f',minHeight:'100vh',display:'flex',justifyContent:'center',alignItems:'flex-start' }}>
        {!splashDone && <SplashScreen onFinish={handleSplashFinish}/>}
        <div style={{ width:'100%',maxWidth:maxW,minHeight:'100vh',background:'linear-gradient(170deg,#0c0c18 0%,#07070f 55%,#0a0710 100%)',borderLeft:'1px solid rgba(255,255,255,0.03)',borderRight:'1px solid rgba(255,255,255,0.03)',position:'relative',overflow:'hidden' }}>
          <BgDecorations/>
          <div style={{ position:'relative',zIndex:1,borderBottom:'1px solid rgba(255,255,255,0.04)',padding:'20px 32px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <AppLogo sizeWidth={112} sizeHeight={38} radius={0}/>
            <div style={{ display:'flex',alignItems:'center',gap:16 }}>
              <LanguagePill/>
              <Link href="/adventure" style={{ textDecoration:'none' }}>
                <div style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10 }}>
                  <Map size={14} color="#71717a"/>
                  <span style={{ color:'#71717a',fontSize:12,fontWeight:700 }}>Adventure Map</span>
                </div>
              </Link>
              <div style={{ background:'rgba(250,204,21,0.08)',border:'1px solid rgba(250,204,21,0.2)',borderRadius:12,padding:'8px 16px',display:'flex',alignItems:'center',gap:8 }}>
                <Star size={14} color="#facc15" strokeWidth={2.5}/>
                <span style={{ color:'#facc15',fontSize:12,fontWeight:900 }}>{xp}</span>
                <span style={{ color:'#52525b',fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase' }}>XP</span>
              </div>
            </div>
          </div>
          <div style={{ position:'relative',zIndex:1,display:'grid',gridTemplateColumns:`${sidebarW}px 1fr`,minHeight:'calc(100vh - 73px)' }}>
            <div style={{ borderRight:'1px solid rgba(255,255,255,0.04)',padding:isDesktop?'28px 24px':'24px 20px',display:'flex',flexDirection:'column',gap:20,overflowY:'auto',maxHeight:'calc(100vh - 73px)',position:'sticky',top:73 }}>
              <XpProgressCard currentChapter={currentChapter} nextChapter={nextChapter} xp={xp} xpPct={xpPct} wide/>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                <StatCard icon={<BookOpen size={18} color="#60a5fa"/>} value={completedStages} label="Stages Completed" color="#60a5fa" wide/>
                <StatCard icon={<Zap size={18} color="#f59e0b"/>} value={totalStages-completedStages} label="Stages Remaining" color="#f59e0b" wide/>
                <StatCard icon={<Trophy size={18} color="#a855f7"/>} value={`${Math.round((completedStages/totalStages)*100)}%`} label="Overall Progress" color="#a855f7" wide/>
              </div>
              <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:16,padding:'16px',display:'flex',alignItems:'center',gap:16 }}>
                <svg width={56} height={56} viewBox="0 0 56 56" style={{ flexShrink:0 }}>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke={currentChapter.color} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2*Math.PI*22}`} strokeDashoffset={`${2*Math.PI*22*(1-completedStages/totalStages)}`}
                    transform="rotate(-90 28 28)" style={{ transition:'stroke-dashoffset 1s ease',filter:`drop-shadow(0 0 4px ${currentChapter.color})` }}/>
                  <text x="28" y="33" textAnchor="middle" fill="#f4f4f5" fontSize="12" fontWeight="800">{Math.round((completedStages/totalStages)*100)}%</text>
                </svg>
                <div>
                  <p style={{ color:'#f4f4f5',fontSize:13,fontWeight:700,marginBottom:3 }}>Course Progress</p>
                  <p style={{ color:'#52525b',fontSize:11,lineHeight:1.5 }}>{completedStages} of {totalStages} stages completed</p>
                </div>
              </div>
            </div>
            <div style={{ padding:isDesktop?'28px 32px':'24px 24px',overflowY:'auto',maxHeight:'calc(100vh - 73px)' }}>
              {continueStage&&<div style={{ marginBottom:28 }}><ContinueBanner continueStage={continueStage} wide/></div>}
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
                <p style={{ color:'#3f3f46',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase' }}>All Chapters</p>
                <span style={{ color:'#3f3f46',fontSize:11 }}>{CHAPTERS.filter((ch:any)=>xp>=ch.xpRequired).length} / {CHAPTERS.length} unlocked</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:isDesktop?'1fr 1fr':'1fr',gap:10 }}>
                {CHAPTERS.map((ch:any)=><ChapterRow key={ch.id} ch={ch} xp={xp} stageStars={stageStars} stageUnlocked={stageUnlocked} wide/>)}
              </div>
              <div style={{ marginTop:28 }}>
                <p style={{ color:'#3f3f46',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14 }}>Quick Actions</p>
                <div style={{ display:'grid',gridTemplateColumns:isDesktop?'1fr 1fr 1fr':'1fr 1fr',gap:10 }}>
                  {[
                    { icon:<Map size={18} color="#10b981"/>, label:'Adventure Map', sub:'Continue your journey', href:'/adventure', color:'#10b981' },
                    { icon:<PenLine size={18} color="#3b82f6"/>, label:'Learning', sub:'Test your knowledge', href:'/learn', color:'#3b82f6' },
                    { icon:<TrendingUp size={18} color="#f59e0b"/>, label:'Progress', sub:'View your stats', href:'/profile', color:'#f59e0b' },
                  ].map((action,i)=>(
                    <Link key={i} href={action.href} style={{ textDecoration:'none' }}>
                      <div style={{ background:`${action.color}08`,border:`1px solid ${action.color}20`,borderRadius:16,padding:'16px 18px',display:'flex',alignItems:'center',gap:12 }}>
                        <div style={{ width:40,height:40,borderRadius:12,background:`${action.color}15`,border:`1px solid ${action.color}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{action.icon}</div>
                        <div>
                          <p style={{ color:'#e4e4e7',fontSize:13,fontWeight:700,marginBottom:2 }}>{action.label}</p>
                          <p style={{ color:'#52525b',fontSize:11 }}>{action.sub}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <BottomNav/>
      </main>
    );
  }

  /* ─ MOBILE ─ */
  return (
    <main style={{ background:'#07070f',minHeight:'100vh',display:'flex',justifyContent:'center' }}>
      {!splashDone&&<SplashScreen onFinish={handleSplashFinish}/>}
      <div className="relative w-full sm:max-w-md" style={{ minHeight:'100vh',background:'linear-gradient(170deg,#0c0c18 0%,#07070f 55%,#0a0710 100%)',borderLeft:'1px solid rgba(255,255,255,0.03)',borderRight:'1px solid rgba(255,255,255,0.03)',paddingBottom:86,overflow:'hidden' }}>
        <BgDecorations/>
        <div className="relative" style={{ zIndex:1 }}>
          <div style={{ padding:'20px 22px 0' }}>

            
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <AppLogo sizeWidth={112} sizeHeight={36} radius={0}/>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <LanguagePill/>
                <div style={{ display:'flex',alignItems:'center',gap:5,background:'rgba(250,204,21,0.08)',border:'1px solid rgba(250,204,21,0.2)',borderRadius:99,padding:'6px 12px' }}>
                  <span style={{ color:'#facc15',fontSize:14,fontWeight:900,lineHeight:1 }}>{xp}</span>
                  <span style={{ color:'#52525b',fontSize:9,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase' }}>XP</span>
                </div>
              </div>
            </div>

            <XpProgressCard currentChapter={currentChapter} nextChapter={nextChapter} xp={xp} xpPct={xpPct}/>
            <div style={{ marginBottom:24 }}/>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:28 }}>
              <StatCard icon={<BookOpen size={16} color="#60a5fa"/>} value={completedStages} label="Stages Done" color="#60a5fa"/>
              <StatCard icon={<Zap size={16} color="#f59e0b"/>} value={totalStages-completedStages} label="Remaining" color="#f59e0b"/>
            </div>
          </div>
          {continueStage&&<div style={{ padding:'0 22px',marginBottom:28 }}><ContinueBanner continueStage={continueStage}/></div>}
          <div style={{ padding:'0 22px',marginBottom:12 }}>
            <p style={{ color:'#3f3f46',fontSize:10,fontWeight:800,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12 }}>All Chapters</p>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {CHAPTERS.map((ch:any)=><ChapterRow key={ch.id} ch={ch} xp={xp} stageStars={stageStars} stageUnlocked={stageUnlocked}/>)}
            </div>
          </div>
        </div>
        <BottomNav/>
      </div>
    </main>
  );
}