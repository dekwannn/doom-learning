'use client';
import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import BilingualExplanation from '@/components/Cards/BilingualExplanation';

export default function CheckpointCard({ data, xpReward }: { data: any; xpReward: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [earnedXp, setEarnedXp] = useState(0);
  const { combo, addXp, incrementCombo, resetCombo } = useUserStore();

  const handleSelect = (option: string) => {
    if (selected) return;
    const correct = option === data.correctAnswer;
    setSelected(option); setIsCorrect(correct);
    if (correct) {
      const m = combo >= 4 ? 2.0 : combo >= 2 ? 1.5 : 1;
      const xp = Math.floor(xpReward * m);
      setEarnedXp(xp); addXp(xp); incrementCombo();
    } else { resetCombo(); }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-stretch justify-center px-5 text-white overflow-hidden relative"
      style={{ background: '#0a0a0d' }}
    >
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)' }} />

      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Level {data.levelTarget} — Boss
        </p>
        <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700 }}>+{xpReward} XP</p>
      </div>

      {/* Question rectangle */}
      <div className="rounded-2xl px-5 py-6 mb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #140a0a 0%, #0f0a0a 100%)',
          border: '1px solid rgba(239,68,68,0.15)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(239,68,68,0.06)',
        }}>
        {/* Ghost level number */}
        <p className="absolute font-black select-none pointer-events-none"
          style={{ fontSize: 120, color: 'rgba(239,68,68,0.05)', letterSpacing: '-0.05em', lineHeight: 1, right: -10, top: -10 }}>
          {data.levelTarget}
        </p>
        <h2 className="font-black relative"
          style={{ fontSize: 20, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
          {data.question}
        </h2>
      </div>

      {/* Options */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        {data.options.map((option: string, i: number) => {
          let bg = 'rgba(255,255,255,0.03)', border = '1px solid rgba(255,255,255,0.07)', color = '#d4d4d8', opacity = 1;
          if (selected) {
            if (option === data.correctAnswer) { bg = 'rgba(16,185,129,0.08)'; border = '1px solid rgba(16,185,129,0.35)'; color = '#6ee7b7'; }
            else if (option === selected) { bg = 'rgba(239,68,68,0.08)'; border = '1px solid rgba(239,68,68,0.35)'; color = '#fca5a5'; }
            else { opacity = 0.3; }
          }
          return (
            <button key={i} onClick={() => handleSelect(option)} disabled={!!selected}
              style={{
                background: bg, border, color, opacity,
                borderRadius: 12, padding: '14px 16px',
                textAlign: 'left', fontSize: 14, fontWeight: 500,
                lineHeight: 1.45, transition: 'all 0.15s ease',
              }}>
              {option}
            </button>
          );
        })}
      </div>

      {selected && (
        <div style={{
          borderTop: `1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          paddingTop: 14, marginTop: 14,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="font-black" style={{ color: isCorrect ? '#34d399' : '#f87171', fontSize: 15, letterSpacing: '-0.01em' }}>
              {isCorrect ? 'Level Up' : 'Try Again'}
            </p>
            {isCorrect && <p style={{ color: '#facc15', fontSize: 13, fontWeight: 800 }}>+{earnedXp} XP</p>}
          </div>
          <BilingualExplanation text={data.explanation} />
        </div>
      )}
    </div>
  );
}