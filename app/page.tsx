// src/app/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';
import { useProgress } from '@/hooks/useProgress';
import DailyTargets, { DAILY_MISSIONS, useDailyProgress } from '@/components/DailyTargets';
import { activeStreak, AllDoneCard, ChapterCard, ContinueCard, GreetingCard, LatestAchievement, QuickPractice, RankCard, ReviewCard, SectionLabel, type HomeChapter, type HomeStage } from '@/components/Home/HomeSections';
import { useLanguageStore, LANGUAGES } from '@/store/useLanguageStore';
import BottomNav from '@/components/Layout/BottomNav';
import dummyData from '@/data/dummyData.json';
import jaData from '@/data/jaData.json';
import zhData from '@/data/zhData.json';
import koData from '@/data/koData.json';
import { Flame, Zap } from 'lucide-react';

const DATA_MAP: Record<string, { chapters: unknown[] }> = {
  en: dummyData,
  ja: jaData,
  zh: zhData,
  ko: koData,
};

function getLangData(code: string | null) { return DATA_MAP[code ?? 'en'] ?? dummyData; }

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

function LanguagePill() {
  const router = useRouter();
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const lang = LANGUAGES.find(l => l.code === (selectedLanguage ?? 'en'));
  if (!lang) return null;
  const flagMap: Record<string, string> = { ja:'JA', zh:'ZH', ko:'KO', fr:'FR' };
  const flag = flagMap[selectedLanguage ?? ''] ?? 'EN';
  return (
    <button
      onClick={() => router.push('/language-select')}
      style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 10px',background:`${lang.color}15`,border:`1px solid ${lang.color}30`,borderRadius:99,cursor:'pointer',flexShrink:0 }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', color:lang.color }}>{flag}</span>
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
    setSplashDone(alreadySeen); // eslint-disable-line react-hooks/set-state-in-effect -- sessionStorage exists only in the browser
  }, []);

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem('splashShown', '1');
    setSplashDone(true);
  }, []);

  const selectedLanguage = useLanguageStore(s => s.selectedLanguage);
  const activeLang = selectedLanguage ?? 'en';
  const { xp, stageUnlocked, completedStages } = useProgress();
  const streak = useUserStore(s => activeStreak(s.streak, s.lastStreakDate));
  const { doneCount } = useDailyProgress();

  const CHAPTERS = getLangData(selectedLanguage).chapters as HomeChapter[];
  const isDone = (id: string) => completedStages[id] === true;

  // The next stage to play: the first open stage not finished yet
  let continueStage: { ch: HomeChapter; stage: HomeStage; index: number } | null = null;
  outer: for (const ch of CHAPTERS) {
    if (xp < ch.xpRequired) break;
    for (let i = 0; i < ch.stages.length; i++) {
      const stage = ch.stages[i];
      if ((stageUnlocked[stage.id] ?? false) && !isDone(stage.id)) {
        continueStage = { ch, stage, index: i };
        break outer;
      }
    }
  }
  const unlockedChapters = CHAPTERS.filter((ch) => xp >= ch.xpRequired);
  const currentChapter = continueStage?.ch ?? unlockedChapters[unlockedChapters.length - 1] ?? CHAPTERS[0];
  const nextChapter = CHAPTERS[CHAPTERS.indexOf(currentChapter) + 1];
  const chapterDone = currentChapter.stages.filter((s) => isDone(s.id)).length;

  useEffect(() => {
    if (!splashDone) return;
    // Read the store itself: during the first (hydration) render the hook still shows the empty server state
    const hasChosen = localStorage.getItem(LANG_CHOSEN_KEY);
    if (!hasChosen || !useLanguageStore.getState().selectedLanguage) {
      router.replace('/language-select');
    }
  }, [splashDone, selectedLanguage, router]);

  if (splashDone === null) return null;

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <AppLogo sizeWidth={isWide ? 112 : 100} sizeHeight={36} radius={0} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LanguagePill />
        <div title="Streak" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 99, padding: '5px 10px' }}>
          <Flame size={13} color="#fb923c" />
          <span style={{ color: '#fb923c', fontSize: 12, fontWeight: 900 }}>{streak}</span>
        </div>
        <div title="XP" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 99, padding: '5px 10px' }}>
          <Zap size={13} color="#facc15" />
          <span style={{ color: '#facc15', fontSize: 12, fontWeight: 900 }}>{xp}</span>
        </div>
      </div>
    </div>
  );

  const greeting = <GreetingCard streak={streak} done={doneCount} total={DAILY_MISSIONS.length} />;
  const continueBlock = (
    <>
      <SectionLabel>Lanjutkan</SectionLabel>
      {continueStage
        ? <ContinueCard ch={continueStage.ch} stage={continueStage.stage} index={continueStage.index} count={continueStage.ch.stages.length} />
        : <AllDoneCard />}
      <ReviewCard lang={activeLang} />
    </>
  );
  const practice = (<><SectionLabel>Latihan cepat</SectionLabel><QuickPractice voiceReady={activeLang === 'en'} /></>);
  const targets = (<><SectionLabel>Target hari ini</SectionLabel><DailyTargets /></>);
  const chapter = (<><SectionLabel>Chapter kamu</SectionLabel><ChapterCard ch={currentChapter} done={chapterDone} count={currentChapter.stages.length} nextChapter={nextChapter} xp={xp} /></>);
  const rank = <RankCard lang={activeLang} />;
  const latest = <LatestAchievement />;

  const background = (
    <>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: isWide ? '64px 64px' : '52px 52px', maskImage: 'linear-gradient(to bottom,transparent 0%,black 8%,black 90%,transparent 100%)' }} />
      <div style={{ position: 'absolute', top: -80, left: isWide ? '30%' : '50%', transform: 'translateX(-50%)', width: isWide ? 500 : 340, height: isWide ? 320 : 220, background: `radial-gradient(ellipse at center,${currentChapter.color}15 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
    </>
  );

  /* ─ TABLET / DESKTOP: two columns ─ */
  if (isWide) {
    const maxW = isDesktop ? 1100 : 860;
    return (
      <main style={{ background: '#07070f', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
        <div style={{ width: '100%', maxWidth: maxW, minHeight: '100vh', background: 'linear-gradient(170deg,#0c0c18 0%,#07070f 55%,#0a0710 100%)', borderLeft: '1px solid rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', paddingBottom: 100 }}>
          {background}
          <div style={{ position: 'relative', zIndex: 1, padding: isDesktop ? '24px 32px' : '20px 24px' }}>
            {header}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '360px 1fr' : '300px 1fr', gap: isDesktop ? 28 : 20, marginTop: 20 }}>
              <div>{greeting}{targets}{rank}</div>
              <div>{continueBlock}{practice}{chapter}{latest}</div>
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  /* ─ MOBILE ─ */
  return (
    <main style={{ background: '#07070f', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <div className="relative w-full sm:max-w-md" style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#0c0c18 0%,#07070f 55%,#0a0710 100%)', borderLeft: '1px solid rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.03)', paddingBottom: 100, overflow: 'hidden' }}>
        {background}
        <div className="relative" style={{ zIndex: 1, padding: '20px 18px 0' }}>
          {header}
          <div style={{ marginTop: 16 }}>{greeting}</div>
          {continueBlock}
          {practice}
          {targets}
          {chapter}
          {rank}
          {latest}
        </div>
        <BottomNav />
      </div>
    </main>
  );
}
