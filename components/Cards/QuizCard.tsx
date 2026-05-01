'use client';
import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import BilingualExplanation from '@/components/Cards/BilingualExplanation';

const TYPE_LABEL: Record<string, string> = {
  fill_in_blank: 'Fill in the Blank',
  translation_quiz: 'Translation',
  mini_conversation: 'Conversation',
};

export default function QuizCard({ data, xpReward, type }: { data: any; xpReward: number; type: string }) {
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
      className="w-full h-full flex flex-col items-stretch justify-center px-5 text-white overflow-hidden"
      style={{ background: '#0a0a0d' }}
    >
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {TYPE_LABEL[type] ?? 'Quiz'}
        </p>
        {!selected && <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700 }}>+{xpReward} XP</p>}
      </div>

      {/* Question rectangle */}
      <div className="rounded-2xl px-5 py-6 mb-4"
        style={{
          background: 'linear-gradient(160deg, #13131a 0%, #0f0f14 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
        {data.context && (
          <p style={{ color: '#52525b', fontSize: 12, fontStyle: 'italic', marginBottom: 12 }}>
            {data.context}
          </p>
        )}
        {data.dialogue && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.dialogue.map((d: any, i: number) => (
              <div key={i} style={{ borderLeft: '2px solid rgba(99,102,241,0.3)', paddingLeft: 12 }}>
                <p style={{ color: '#6366f1', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                  {d.speaker}
                </p>
                <p style={{ color: '#d4d4d8', fontSize: 14, lineHeight: 1.55 }}>"{d.text}"</p>
              </div>
            ))}
          </div>
        )}
        <h2 className="font-black leading-snug"
          style={{ fontSize: 20, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
          {data.sentence || data.question}
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
                borderRadius: 12, padding: '13px 16px',
                textAlign: 'left', fontSize: 14, fontWeight: 500,
                lineHeight: 1.45, transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
              <span style={{ color: '#3f3f46', fontWeight: 800, fontSize: 11, marginTop: 2, flexShrink: 0 }}>
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {selected && (
        <div style={{
          borderTop: `1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          paddingTop: 14, marginTop: 14,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: isCorrect ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 800 }}>
              {isCorrect ? 'Correct' : 'Incorrect'}
            </p>
            {isCorrect && <p style={{ color: '#facc15', fontSize: 12, fontWeight: 800 }}>+{earnedXp} XP</p>}
          </div>
          <BilingualExplanation text={data.explanation} />
        </div>
      )}
    </div>
  );
}