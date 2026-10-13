'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import BilingualExplanation from '@/components/Cards/BilingualExplanation';

interface Pair { word: string; meaning: string; }
interface Props { data: any; xpReward: number; onResult?: (correct: boolean) => void; }

// Semua pair pakai warna yang sama — putih/abu netral
const MATCHED = {
  line:   'rgba(255,255,255,0.4)',
  bg:     'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.2)',
  text:   '#e4e4e7',
};

export default function MatchingCard({ data, xpReward, onResult }: Props) {
  const pairs: Pair[]              = data.pairs;
  const shuffledMeanings: string[] = data.shuffledMeanings;

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matches,      setMatches]      = useState<Record<string, string>>({});
  const [checked,      setChecked]      = useState(false);
  const [isCorrect,    setIsCorrect]    = useState(false);
  const [earnedXp,     setEarnedXp]     = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs     = useRef<Record<string, HTMLButtonElement | null>>({});
  const meaningRefs  = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lineCoords, setLineCoords] = useState<{
    x1:number; y1:number; x2:number; y2:number; correct?:boolean;
  }[]>([]);

  const { combo, addXp, incrementCombo, resetCombo } = useUserStore();

  const correctMap: Record<string, string> = {};
  pairs.forEach(p => { correctMap[p.word] = p.meaning; });

  // ── Compute SVG lines ──────────────────────────────────────────────────
  const computeLines = useCallback((currentMatches: Record<string, string>, isChecked = false) => {
    if (!containerRef.current) return;
    const box = containerRef.current.getBoundingClientRect();
    const coords = Object.entries(currentMatches).map(([word, meaning]) => {
      const wEl = wordRefs.current[word];
      const mEl = meaningRefs.current[meaning];
      if (!wEl || !mEl) return null;
      const wr = wEl.getBoundingClientRect();
      const mr = mEl.getBoundingClientRect();
      return {
        x1: wr.right  - box.left,
        y1: wr.top + wr.height / 2 - box.top,
        x2: mr.left   - box.left,
        y2: mr.top + mr.height / 2 - box.top,
        correct: isChecked ? correctMap[word] === meaning : undefined,
      };
    }).filter(Boolean) as any[];
    setLineCoords(coords);
  }, []);

  useEffect(() => { computeLines(matches, checked); }, [matches, checked]);

  // ── Tap handlers ──────────────────────────────────────────────────────
  const handleWordTap = (word: string) => {
    if (checked) return;
    setSelectedWord(prev => prev === word ? null : word);
  };

  const handleMeaningTap = (meaning: string) => {
    if (checked || !selectedWord) return;
    const next = { ...matches };
    const existing = Object.keys(next).find(w => next[w] === meaning);
    if (existing) delete next[existing];
    next[selectedWord] = meaning;
    setMatches(next);
    setSelectedWord(null);
    setTimeout(() => computeLines(next, false), 20);
  };

  // ── Check ──────────────────────────────────────────────────────────────
  const checkAnswer = () => {
    const allCorrect = pairs.every(p => matches[p.word] === p.meaning);
    setIsCorrect(allCorrect);
    setChecked(true);
    onResult?.(allCorrect);
    computeLines(matches, true);
    if (allCorrect) {
      const m  = combo >= 4 ? 2.0 : combo >= 2 ? 1.5 : 1;
      const xp = Math.floor(xpReward * m);
      setEarnedXp(xp); addXp(xp); incrementCombo();
    } else {
      resetCombo();
    }
  };

  const allMatched   = Object.keys(matches).length === pairs.length;
  const matchedCount = Object.keys(matches).length;

  // ── Style helpers ──────────────────────────────────────────────────────
  const wordStyle = (word: string): React.CSSProperties => {
    const isSelected = selectedWord === word;
    const isMatched  = !!matches[word];

    if (checked) {
      const ok = matches[word] === correctMap[word];
      return {
        background: ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.09)',
        border:     `2px solid ${ok ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        color:      ok ? '#6ee7b7' : '#fca5a5',
      };
    }
    if (isSelected) return {
      background: 'rgba(255,255,255,0.10)',
      border:     '2px solid rgba(255,255,255,0.45)',
      color:      '#fff',
      transform:  'scale(1.02)',
    };
    if (isMatched) return {
      background: MATCHED.bg,
      border:     `2px solid ${MATCHED.border}`,
      color:      MATCHED.text,
    };
    return {
      background: 'rgba(255,255,255,0.03)',
      border:     '2px solid rgba(255,255,255,0.08)',
      color:      '#a1a1aa',
    };
  };

  const meaningStyle = (meaning: string): React.CSSProperties => {
    const matchedWord  = Object.keys(matches).find(w => matches[w] === meaning);
    const isHoverable  = !!selectedWord && !matchedWord;

    if (checked && matchedWord) {
      const ok = correctMap[matchedWord] === meaning;
      return {
        background: ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.09)',
        border:     `2px solid ${ok ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}`,
        color:      ok ? '#6ee7b7' : '#fca5a5',
      };
    }
    if (matchedWord) return {
      background: MATCHED.bg,
      border:     `2px solid ${MATCHED.border}`,
      color:      MATCHED.text,
    };
    if (isHoverable) return {
      background: 'rgba(255,255,255,0.06)',
      border:     '2px solid rgba(255,255,255,0.2)',
      color:      '#e4e4e7',
    };
    return {
      background: 'rgba(255,255,255,0.03)',
      border:     '2px solid rgba(255,255,255,0.07)',
      color:      '#71717a',
    };
  };

  const lineColor = (correct?: boolean) =>
    correct === true  ? 'rgba(16,185,129,0.8)' :
    correct === false ? 'rgba(239,68,68,0.8)'  :
    'rgba(255,255,255,0.3)';

  return (
    <div
      className="w-full h-full flex flex-col items-stretch justify-center px-5 text-white overflow-hidden"
      style={{ background: '#0a0a0d' }}
    >
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.94); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>

      {/* Meta */}
      <div className="flex items-center justify-between mb-3">
        <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
          Match the Words
        </p>
        {!checked && <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700 }}>+{xpReward} XP</p>}
      </div>

      {/* Instruction card */}
      <div className="rounded-2xl px-4 py-4 mb-4"
        style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 32px rgba(0,0,0,0.5)' }}>
        <p style={{ color:'#fff', fontSize:15, fontWeight:800, marginBottom:6 }}>{data.instruction}</p>

        {/* Status hint */}
        {!checked ? (
          selectedWord ? (
            <p style={{ color:'#71717a', fontSize:11 }}>
              <span style={{ color:'#e4e4e7', fontWeight:700 }}>"{selectedWord}"</span> dipilih — tap artinya di kanan
            </p>
          ) : (
            <p style={{ color:'#3f3f46', fontSize:11 }}>Tap kata di kiri → tap artinya di kanan</p>
          )
        ) : (
          <p style={{ color: isCorrect ? '#34d399' : '#f87171', fontSize:11, fontWeight:700 }}>
            {isCorrect ? 'Semua benar!' : 'Ada yang salah'}
          </p>
        )}
      </div>

      {/* Matching area */}
      <div ref={containerRef} className="relative mb-3" style={{ minHeight: pairs.length * 58 }}>

        {/* SVG lines */}
        <svg className="absolute inset-0 pointer-events-none"
          style={{ width:'100%', height:'100%', overflow:'visible', zIndex:5 }}>
          {lineCoords.map((l, i) => (
            <g key={i}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={lineColor(l.correct)} strokeWidth={4}
                strokeLinecap="round" opacity={0.15} />
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={lineColor(l.correct)} strokeWidth={2}
                strokeLinecap="round" opacity={0.9} />
              <circle cx={l.x1} cy={l.y1} r={3} fill={lineColor(l.correct)} opacity={0.8} />
              <circle cx={l.x2} cy={l.y2} r={3} fill={lineColor(l.correct)} opacity={0.8} />
            </g>
          ))}
        </svg>

        {/* Two columns */}
        <div style={{ display:'flex', gap:0 }}>

          {/* Left — words */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            {pairs.map(p => (
              <button
                key={p.word}
                ref={el => { wordRefs.current[p.word] = el; }}
                onClick={() => handleWordTap(p.word)}
                disabled={checked}
                style={{
                  ...wordStyle(p.word),
                  borderRadius:12, padding:'0 14px', height:52,
                  fontSize:14, fontWeight:700, textAlign:'left',
                  display:'flex', alignItems:'center',
                  transition:'all 0.16s ease',
                  cursor: checked ? 'default' : 'pointer',
                  position:'relative', zIndex:10,
                }}
              >
                {p.word}
              </button>
            ))}
          </div>

          {/* Center gap for lines */}
          <div style={{ width:44, flexShrink:0 }} />

          {/* Right — meanings */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            {shuffledMeanings.map(meaning => {
              const matchedWord = Object.keys(matches).find(w => matches[w] === meaning);
              return (
                <button
                  key={meaning}
                  ref={el => { meaningRefs.current[meaning] = el; }}
                  onClick={() => handleMeaningTap(meaning)}
                  disabled={checked || (!selectedWord && !matchedWord)}
                  style={{
                    ...meaningStyle(meaning),
                    borderRadius:12, padding:'0 14px', height:52,
                    fontSize:12, fontWeight:600, textAlign:'left', lineHeight:1.3,
                    display:'flex', alignItems:'center',
                    transition:'all 0.16s ease',
                    cursor: (checked || (!selectedWord && !matchedWord)) ? 'default' : 'pointer',
                    position:'relative', zIndex:10,
                  }}
                >
                  {meaning}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {!checked && (
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12 }}>
          {pairs.map((p, i) => (
            <div key={i} style={{
              width: matches[p.word] ? 20 : 8,
              height: 8, borderRadius: 99,
              background: matches[p.word] ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          ))}
        </div>
      )}

      {/* Check / Result */}
      {!checked ? (
        <button
          onClick={checkAnswer}
          disabled={!allMatched}
          style={{
            width:'100%', height:50, borderRadius:14,
            background: allMatched ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1.5px solid ${allMatched ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
            color: allMatched ? '#e4e4e7' : '#3f3f46',
            fontSize:13, fontWeight:800, letterSpacing:'0.04em',
            transition:'all 0.2s',
            cursor: allMatched ? 'pointer' : 'default',
          }}
        >
          {allMatched ? 'Check Matches' : `${matchedCount} / ${pairs.length} matched`}
        </button>
      ) : (
        <div style={{
          borderTop:`1px solid ${isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          paddingTop:14,
          display:'flex', flexDirection:'column', gap:6,
          animation:'popIn 0.25s ease both',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ color: isCorrect ? '#34d399' : '#f87171', fontSize:14, fontWeight:800 }}>
              {isCorrect ? 'Perfect Match!' : 'Not quite right'}
            </p>
            {isCorrect && (
              <p style={{ color:'#71717a', fontSize:12, fontWeight:700 }}>+{earnedXp} XP</p>
            )}
          </div>
          <BilingualExplanation text={data.explanation} />
        </div>
      )}
    </div>
  );
}