// src/app/practice/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import FeedContainer from '@/components/Feed/FeedContainer';
import BottomNav from '@/components/Layout/BottomNav';
import dummyData from '@/data/dummyData.json';

const LEVELS = [
  { id: '1', label: 'Level 1', color: '#10b981' },
  { id: '2', label: 'Level 2', color: '#3b82f6' },
];

export default function PracticePage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const practice = (dummyData as any).practice;

  if (selectedLevel) {
    const feed = practice[selectedLevel] ?? [];
    return (
      <div className="relative w-full h-screen" style={{ background: '#0a0a0d' }}>
        {/* Back button */}
        <button
          onClick={() => setSelectedLevel(null)}
          style={{
            position: 'fixed', top: 52, left: 16, zIndex: 60,
            background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 99, padding: '8px 16px',
            color: '#71717a', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Pick Level
        </button>
        <FeedContainer initialData={feed} />
        <BottomNav />
      </div>
    );
  }

  return (
    <main className="flex justify-center" style={{ background: '#08080f', minHeight: '100vh' }}>
      <div
        className="relative w-full sm:max-w-md min-h-screen sm:border-x sm:border-white/4"
        style={{ background: 'linear-gradient(170deg,#0c0c16 0%,#08080f 60%,#0c0a14 100%)' }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)',
            backgroundSize:'48px 48px',
            maskImage:'linear-gradient(to bottom,transparent 0%,black 6%,black 94%,transparent 100%)',
          }} />

        <div className="relative px-5 pt-16 pb-28">
          {/* Header */}
          <div className="mb-10">
            <p style={{ color:'#3f3f46', fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>
              Practice Mode
            </p>
            <h1 style={{ color:'#fff', fontSize:28, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Practice
            </h1>
            <p style={{ color:'#52525b', fontSize:13, marginTop:8, lineHeight:1.6 }}>
              Scroll through random exercises — no order, just practice anytime, anywhere.
            </p>
          </div>

          {/* Level cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {LEVELS.map((lv) => {
              const feedLen = (practice[lv.id] ?? []).length;
              return (
                <button
                  key={lv.id}
                  onClick={() => setSelectedLevel(lv.id)}
                  style={{
                    width:'100%', textAlign:'left',
                    borderRadius:18, padding:'20px 22px',
                    background:'linear-gradient(160deg,#13131a,#0f0f14)',
                    border:`1px solid ${lv.color}28`,
                    boxShadow:`0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    position:'relative', overflow:'hidden',
                    transition:'transform 0.12s ease, box-shadow 0.12s ease',
                    cursor:'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform='scale(1.02)')}
                  onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
                >
                  {/* Glow blob */}
                  <div style={{
                    position:'absolute', top:-20, right:-20, width:80, height:80,
                    borderRadius:'50%', background:lv.color, opacity:0.07, filter:'blur(24px)',
                  }} />
                  {/* Accent top line */}
                  <div style={{
                    position:'absolute', top:0, left:0, right:0, height:1,
                    background:`linear-gradient(90deg,transparent,${lv.color}50,transparent)`,
                  }} />

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ color:'#3f3f46', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>
                        {lv.label}
                      </p>
                      <p style={{ color:'#e4e4e7', fontSize:18, fontWeight:900, letterSpacing:'-0.02em' }}>
                        Free Practice
                      </p>
                      <p style={{ color:'#52525b', fontSize:12, marginTop:4 }}>
                        {feedLen} exercises · Vocab, Quiz, Listening & more
                      </p>
                    </div>
                    <div style={{
                      width:42, height:42, borderRadius:'50%',
                      background:lv.color, display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 0 16px ${lv.color}55`, flexShrink:0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <polygon points="5,3 19,12 5,21" fill="#000" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info note */}
          <div style={{
            marginTop:28, borderRadius:12, padding:'14px 16px',
            background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ color:'#3f3f46', fontSize:11, lineHeight:1.7 }}>
              Practice mode is different from Adventure — questions appear randomly in a scroll feed, perfect for a quick review or filling spare time.
            </p>
          </div>
        </div>

        <BottomNav />
      </div>
    </main>
  );
}