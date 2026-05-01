'use client';
import { useState, useEffect } from 'react';

function typeLabel(type: string): string {
  switch (type) {
    case 'vocabulary': return 'Vocabulary';
    case 'fill_in_blank': return 'Fill in the Blank';
    case 'translation_quiz': return 'Translation Quiz';
    case 'mini_conversation': return 'Mini Conversation';
    case 'listening_quiz': return 'Listening Quiz';
    case 'sentence_building': return 'Sentence Building';
    case 'checkpoint': return 'Boss Challenge';
    case 'reward': return 'Reward';
    case 'meme': return 'Fun Break';
    case 'daily_target': return 'Daily Target';
    default: return type;
  }
}

interface Props {
  feedData: any[];
  onDone: () => void;
}

export default function OnboardingGuide({ feedData, onDone }: Props) {
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDone, 320);
  };

  const totalXp = feedData.reduce((s, i) => s + (i.xpReward || 0), 0);

  const typeCounts: Record<string, number> = {};
  feedData.forEach((item) => {
    const l = typeLabel(item.type);
    typeCounts[l] = (typeCounts[l] || 0) + 1;
  });

  const tabs = ["What's Inside", 'How to Play'];

  const steps: [string, string][] = [
    ['Swipe up', 'to move to the next card'],
    ['Tap an option', 'to submit your answer'],
    ['Tap the play button', 'to hear the audio pronunciation'],
    ['Tap words', 'to build your sentence in the correct order'],
    ['Wrong answer', 'resets your combo — stay sharp!'],
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      style={{
        background: visible ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(6px)',
        transition: 'background 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className="w-full sm:max-w-md flex flex-col"
        style={{
          background: '#0e0e11',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px 20px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          maxHeight: '86vh',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Tabs + Skip */}
        <div className="flex items-center px-5 pt-3">
          {tabs.map((label, i) => (
            <button
              key={label}
              onClick={() => setSlide(i)}
              className="relative pb-3 pr-6 transition-colors"
              style={{
                color: slide === i ? '#fff' : '#3f3f46',
                fontSize: 14,
                fontWeight: slide === i ? 700 : 500,
              }}
            >
              {label}
              {slide === i && (
                <span
                  className="absolute bottom-0 left-0 rounded-full"
                  style={{ width: '70%', height: 2, background: '#10b981' }}
                />
              )}
            </button>
          ))}
          <button
            onClick={dismiss}
            className="ml-auto pb-3"
            style={{ color: '#3f3f46', fontSize: 13, fontWeight: 500 }}
          >
            Skip
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* SLIDE 0 — What's Inside */}
        {slide === 0 && (
          <div className="flex flex-col px-5 pt-5 pb-6 overflow-y-auto" style={{ gap: 20 }}>
            <div className="flex items-end justify-between">
              <div>
                <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Total Cards
                </p>
                <p style={{ color: '#fff', fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
                  {feedData.length}
                </p>
              </div>
              <div className="text-right">
                <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Max XP
                </p>
                <p style={{ color: '#facc15', fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
                  +{totalXp}
                </p>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

            <div className="flex flex-col" style={{ gap: 14 }}>
              {Object.entries(typeCounts).map(([label, count]) => (
                <div key={label} className="flex items-center justify-between">
                  <span style={{ color: '#a1a1aa', fontSize: 14, fontWeight: 500 }}>{label}</span>
                  <span style={{ color: '#52525b', fontSize: 13, fontWeight: 700 }}>×{count}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

            <p style={{ color: '#52525b', fontSize: 13, fontWeight: 500, lineHeight: 1.6 }}>
              Answer correctly in a row to unlock{' '}
              <span style={{ color: '#ca8a04', fontWeight: 700 }}>Combo ×1.5</span> and{' '}
              <span style={{ color: '#ca8a04', fontWeight: 700 }}>×2.0</span> XP multipliers.
            </p>
          </div>
        )}

        {/* SLIDE 1 — How to Play */}
        {slide === 1 && (
          <div className="flex flex-col px-5 pt-5 pb-6 overflow-y-auto" style={{ gap: 20 }}>

            {/* Video slot */}
            <div
              className="w-full relative overflow-hidden rounded-2xl"
              style={{
                aspectRatio: '16/9',
                background: '#111114',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/*
                ── VIDEO SLOT ──────────────────────────────────
                Ganti placeholder ini dengan video kamu:

                <video
                  src="/tutorial.mp4"
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />

                atau YouTube / embed:

                <iframe
                  src="https://www.youtube.com/embed/YOUR_ID"
                  className="w-full h-full"
                  allowFullScreen
                />
                ────────────────────────────────────────────────
              */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polygon points="6,3 20,12 6,21" fill="rgba(255,255,255,0.2)" />
                  </svg>
                </div>
                <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Tutorial Video
                </p>
              </div>
            </div>

            {/* Bullet steps */}
            <div className="flex flex-col" style={{ gap: 0 }}>
              {steps.map(([bold, rest], i) => (
                <div
                  key={i}
                  className="flex items-start gap-4"
                  style={{
                    paddingTop: 14,
                    paddingBottom: 14,
                    borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {/* Bullet number */}
                  <span
                    style={{
                      minWidth: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#52525b',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ color: '#71717a', fontSize: 13, fontWeight: 500, lineHeight: 1.55 }}>
                    <span style={{ color: '#e4e4e7', fontWeight: 700 }}>{bold}</span>{' '}{rest}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-5 pb-8 pt-1">
          <button
            onClick={dismiss}
            className="w-full py-4 rounded-2xl transition-all active:scale-[0.97]"
            style={{
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#e4e4e7',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}