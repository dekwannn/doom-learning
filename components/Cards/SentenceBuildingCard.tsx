'use client';
import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import BilingualExplanation from '@/components/Cards/BilingualExplanation';

export default function SentenceBuildingCard({ data, xpReward }: { data: any; xpReward: number }) {
  const [available, setAvailable] = useState<string[]>(data.jumbledWords);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const { combo, addXp, incrementCombo, resetCombo } = useUserStore();

  const addWord = (word: string, i: number) => {
    if (checked) return;
    setSelected([...selected, word]);
    const next = [...available]; next.splice(i, 1); setAvailable(next);
  };
  const removeWord = (word: string, i: number) => {
    if (checked) return;
    const next = [...selected]; next.splice(i, 1); setSelected(next);
    setAvailable([...available, word]);
  };
  const check = () => {
    const correct = selected.join(' ') === data.correctSentence;
    setIsCorrect(correct); setChecked(true);
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
        style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)' }} />

      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Arrange the Sentence
        </p>
        {!checked && <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700 }}>+{xpReward} XP</p>}
      </div>

      {/* Question rectangle — instruction + answer tray */}
      <div className="rounded-2xl px-5 py-6 mb-4"
        style={{
          background: 'linear-gradient(160deg, #13131a 0%, #0f0f14 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
        <h2 className="font-black mb-5"
          style={{ fontSize: 20, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
          {data.instruction}
        </h2>

        {/* Answer tray */}
        <div style={{
          minHeight: 52,
          borderRadius: 10,
          border: `1px solid ${selected.length > 0 ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.06)'}`,
          background: 'rgba(0,0,0,0.3)',
          padding: '10px 12px',
          display: 'flex', flexWrap: 'wrap', gap: 7, alignContent: 'flex-start',
          transition: 'border-color 0.2s',
        }}>
          {selected.length === 0 && !checked && (
            <p style={{ color: '#3f3f46', fontSize: 12, width: '100%', textAlign: 'center', paddingTop: 4 }}>
              Tap words below to build your answer
            </p>
          )}
          {selected.map((word, i) => (
            <button key={`s-${i}`} onClick={() => removeWord(word, i)} style={{
              padding: '6px 11px', borderRadius: 7, fontSize: 13, fontWeight: 600,
              background: checked ? (isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)') : 'rgba(168,85,247,0.15)',
              border: checked ? `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` : '1px solid rgba(168,85,247,0.3)',
              color: checked ? (isCorrect ? '#6ee7b7' : '#fca5a5') : '#d8b4fe',
              transition: 'all 0.15s',
            }}>
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Word bank */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
        {available.map((word, i) => (
          <button key={`a-${i}`} onClick={() => addWord(word, i)} style={{
            padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            color: '#a1a1aa', transition: 'all 0.15s',
          }}>
            {word}
          </button>
        ))}
      </div>

      {!checked ? (
        <button onClick={check} disabled={selected.length === 0} style={{
          width: '100%', height: 50, borderRadius: 14,
          background: selected.length === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(168,85,247,0.12)',
          border: `1px solid ${selected.length === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(168,85,247,0.3)'}`,
          color: selected.length === 0 ? '#3f3f46' : '#d8b4fe',
          fontSize: 13, fontWeight: 700, transition: 'all 0.2s', letterSpacing: '0.02em',
        }}>
          Check Answer
        </button>
      ) : (
        <div style={{
          borderTop: `1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          paddingTop: 14,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: isCorrect ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 800 }}>
              {isCorrect ? 'Correct' : 'Incorrect'}
            </p>
            {isCorrect && <p style={{ color: '#facc15', fontSize: 12, fontWeight: 800 }}>+{earnedXp} XP</p>}
          </div>
          {isCorrect
            ? <BilingualExplanation text={data.explanation} />
            : <p style={{ color: '#71717a', fontSize: 13 }}>Answer: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{data.correctSentence}</span></p>
          }
        </div>
      )}
    </div>
  );
}