// src/components/Adventure/AdventureQuiz.tsx
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/useProgress';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUserStore } from '@/store/useUserStore';
import dummyData from '@/data/dummyData.json';

// ── Sound & TTS ──────────────────────────────────────────────────────────────
function playSound(type: 'correct' | 'wrong' | 'complete') {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'correct') {
      [[523.25,0,0.12],[659.25,0.1,0.12],[783.99,0.2,0.18]].forEach(([freq,delay,dur])=>{const o=ctx.createOscillator();const og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='sine';o.frequency.value=freq as number;og.gain.setValueAtTime(0,ctx.currentTime+(delay as number));og.gain.linearRampToValueAtTime(0.18,ctx.currentTime+(delay as number)+0.02);og.gain.linearRampToValueAtTime(0,ctx.currentTime+(delay as number)+(dur as number));o.start(ctx.currentTime+(delay as number));o.stop(ctx.currentTime+(delay as number)+(dur as number));});
    } else if (type === 'wrong') {
      [[220,0,0.08],[196,0.09,0.14]].forEach(([freq,delay,dur])=>{const o=ctx.createOscillator();const og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='sawtooth';o.frequency.value=freq as number;og.gain.setValueAtTime(0,ctx.currentTime+(delay as number));og.gain.linearRampToValueAtTime(0.12,ctx.currentTime+(delay as number)+0.02);og.gain.linearRampToValueAtTime(0,ctx.currentTime+(delay as number)+(dur as number));o.start(ctx.currentTime+(delay as number));o.stop(ctx.currentTime+(delay as number)+(dur as number));});
    } else {
      [[523.25,0,0.1],[659.25,0.1,0.1],[783.99,0.2,0.1],[1046.5,0.3,0.25]].forEach(([freq,delay,dur])=>{const o=ctx.createOscillator();const og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='sine';o.frequency.value=freq as number;og.gain.setValueAtTime(0,ctx.currentTime+(delay as number));og.gain.linearRampToValueAtTime(0.2,ctx.currentTime+(delay as number)+0.03);og.gain.linearRampToValueAtTime(0,ctx.currentTime+(delay as number)+(dur as number));o.start(ctx.currentTime+(delay as number));o.stop(ctx.currentTime+(delay as number)+(dur as number));});
    }
  } catch(_){}
}

function speakText(text: string, onStart?: ()=>void, onEnd?: ()=>void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US'; utt.rate = 0.85; utt.pitch = 1.0; utt.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
  if (v) utt.voice = v;
  utt.onstart = () => onStart?.();
  utt.onend   = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
}

function similarity(a: string, b: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[.,!?;:'"()\-]/g,'').replace(/\s+/g,' ').trim();
  const wa = new Set(norm(a).split(' ')), wb = new Set(norm(b).split(' '));
  const inter = [...wa].filter(w => wb.has(w)).length;
  return inter / new Set([...wa,...wb]).size;
}
const PASS_SIM = 0.65;

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total, color }: { current:number; total:number; color:string }) {
  const pct = Math.min(100, Math.round((current/total)*100));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}99)`, borderRadius:99, transition:'width 0.5s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:`0 0 8px ${color}60` }} />
      </div>
      <span style={{ color:'#3f3f46', fontSize:11, fontWeight:700, minWidth:36, textAlign:'right' }}>{current}/{total}</span>
    </div>
  );
}

// ── VocabStep ─────────────────────────────────────────────────────────────────
function VocabStep({ data, color }: { data:any; color:string }) {
  // idle = belum pernah play | playing = sedang diputar | played = sudah pernah diputar
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'played'>('idle');
 
  const handlePlay = () => {
    if (audioState === 'playing') return;
    setAudioState('playing');
 
    const handleEnd = () => setAudioState('played');
 
    // Prioritas: file MP3 statis → browser TTS fallback
    if (data.audioUrl && !data.audioUrl.startsWith('tts://')) {
      const audio = new Audio(data.audioUrl);
      audio.onended = handleEnd;
      audio.onerror = () => speakText(data.word, undefined, handleEnd);
      audio.play().catch(() => speakText(data.word, undefined, handleEnd));
    } else {
      speakText(data.word, undefined, handleEnd);
    }
  };
 
  // Style tombol berdasarkan state
  const btnCfg = {
    idle: {
      bg:     'rgba(255,255,255,0.03)',
      border: `1px solid ${color}30`,
      clr:    '#71717a',
      label:  'Play Pronunciation',
    },
    playing: {
      bg:     `${color}10`,
      border: `1px solid ${color}50`,
      clr:    color,
      label:  'Playing…',
    },
    played: {
      bg:     'rgba(16,185,129,0.07)',
      border: '1px solid rgba(16,185,129,0.28)',
      clr:    '#34d399',
      label:  'Play Again',
    },
  }[audioState];
 
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius:22, padding:'24px 22px', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 40px rgba(0,0,0,0.5)' }}>
 
        {/* Badge "New Word" + badge "Listened" jika sudah diputar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ background:`${color}22`, color, fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', borderRadius:99, padding:'3px 11px' }}>
            New Word
          </span>
          {audioState === 'played' && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.22)', borderRadius:99, padding:'3px 10px' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ color:'#34d399', fontSize:9, fontWeight:800, letterSpacing:'0.08em' }}>LISTENED</span>
            </div>
          )}
        </div>
 
        <h1 style={{ fontSize:'clamp(40px,11vw,58px)', fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1, marginBottom:6 }}>{data.word}</h1>
        <p style={{ color:'#52525b', fontSize:13, fontFamily:'monospace', marginBottom:18 }}>{data.phonetic}</p>
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', marginBottom:16 }} />
        <p style={{ color:'#e4e4e7', fontSize:15, fontWeight:500, lineHeight:1.6, marginBottom:4 }}>{data.meaning}</p>
        {data.meaningId && <p style={{ color:'#52525b', fontSize:13, lineHeight:1.5, marginBottom:16 }}>{data.meaningId}</p>}
        <div style={{ borderLeft:`2px solid ${color}44`, paddingLeft:14 }}>
          <p style={{ color:'#3f3f46', fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Example</p>
          <p style={{ color:'#71717a', fontSize:13, fontStyle:'italic', lineHeight:1.6 }}>"{data.exampleSentence}"</p>
        </div>
      </div>
 
      {/* Tombol play dengan 3 state */}
      <button
        onClick={handlePlay}
        disabled={audioState === 'playing'}
        style={{
          height:50, borderRadius:14,
          background: btnCfg.bg,
          border: btnCfg.border,
          color: btnCfg.clr,
          fontSize:13, fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', gap:9,
          cursor: audioState === 'playing' ? 'default' : 'pointer',
          transition: 'all 0.25s ease',
        }}>
 
        {audioState === 'playing' ? (
          // Waveform animasi
          <>
            <style>{`@keyframes wvAdv{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}`}</style>
            <div style={{ display:'flex', gap:3, alignItems:'center', height:18 }}>
              {[0, 0.1, 0.2, 0.1].map((delay, i) => (
                <div key={i} style={{ width:3, height:18, borderRadius:99, background:color, animation:'wvAdv 0.6s ease-in-out infinite', animationDelay:`${delay}s`, transformOrigin:'center' }}/>
              ))}
            </div>
          </>
        ) : audioState === 'played' ? (
          // Ikon centang
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          // Ikon play
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <polygon points="5,3 19,12 5,21" fill="currentColor"/>
          </svg>
        )}
 
        {btnCfg.label}
      </button>
    </div>
  );
}

// ── ChoiceStep ────────────────────────────────────────────────────────────────
function ChoiceStep({ data, type, color, onAnswer }: { data:any; type:string; color:string; onAnswer:(c:boolean)=>void }) {
  const [sel, setSel] = useState<string|null>(null);
  const [checked, setChecked] = useState(false);
  const LABEL: Record<string,string> = { fill_in_blank:'Fill in the Blank', translation_quiz:'Translation', mini_conversation:'Conversation' };
  const handleCheck = () => {
    if (!sel || checked) return;
    setChecked(true);
    const correct = sel === data.correctAnswer;
    playSound(correct ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(correct), 50);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius:22, padding:'20px', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 40px rgba(0,0,0,0.5)' }}>
        <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{LABEL[type]??'Quiz'}</p>
        {data.context && <p style={{ color:'#52525b', fontSize:12, fontStyle:'italic', marginBottom:10, borderLeft:`2px solid ${color}30`, paddingLeft:10 }}>{data.context}</p>}
        {data.dialogue?.map((d:any,i:number) => (
          <div key={i} style={{ borderLeft:`2px solid ${color}40`, paddingLeft:12, marginBottom:10 }}>
            <p style={{ color, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:3 }}>{d.speaker}</p>
            <p style={{ color:'#d4d4d8', fontSize:14, lineHeight:1.55 }}>"{d.text}"</p>
          </div>
        ))}
        <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.01em', lineHeight:1.4 }}>{data.sentence||data.question}</h2>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {data.options.map((opt:string,i:number) => {
          let bg='rgba(255,255,255,0.03)', border='1px solid rgba(255,255,255,0.07)', c='#d4d4d8', op=1;
          if (!checked) { if (opt === sel) { bg=`${color}18`; border=`1px solid ${color}`; c='#fff'; } }
          else {
            if (opt === data.correctAnswer) { bg='rgba(16,185,129,0.08)'; border='1px solid rgba(16,185,129,0.35)'; c='#6ee7b7'; }
            else if (opt === sel) { bg='rgba(239,68,68,0.08)'; border='1px solid rgba(239,68,68,0.35)'; c='#fca5a5'; }
            else op=0.3;
          }
          return (
            <button key={i} onClick={() => !checked && setSel(opt)} style={{ background:bg, border, color:c, opacity:op, borderRadius:12, padding:'12px 16px', textAlign:'left', fontSize:14, fontWeight:500, lineHeight:1.45, transition:'all 0.15s', display:'flex', alignItems:'flex-start', gap:12, cursor:checked?'default':'pointer' }}>
              <span style={{ color:opt===sel&&!checked?color:'#3f3f46', fontWeight:800, fontSize:11, marginTop:2, flexShrink:0 }}>{String.fromCharCode(65+i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {checked && (
        <div style={{ borderTop:`1px solid ${sel===data.correctAnswer?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`, paddingTop:12, display:'flex', flexDirection:'column', gap:4 }}>
          <p style={{ color:sel===data.correctAnswer?'#34d399':'#f87171', fontSize:13, fontWeight:800 }}>{sel===data.correctAnswer?'✓ Correct':'✗ Incorrect'}</p>
          <p style={{ color:'#71717a', fontSize:13, lineHeight:1.6 }}>{data.explanation}</p>
        </div>
      )}
      {!checked && <button onClick={handleCheck} disabled={!sel} style={{ width:'100%', height:48, borderRadius:12, background:sel?`${color}1a`:'rgba(255,255,255,0.02)', border:`1px solid ${sel?`${color}44`:'rgba(255,255,255,0.05)'}`, color:sel?color:'#3f3f46', fontSize:13, fontWeight:700, cursor:sel?'pointer':'default', transition:'all 0.2s' }}>Check Answer</button>}
    </div>
  );
}

// ── SentenceStep ──────────────────────────────────────────────────────────────
function SentenceStep({ data, color, onAnswer }: { data:any; color:string; onAnswer:(c:boolean)=>void }) {
  const [avail,setAvail]=useState<string[]>([...data.jumbledWords]);
  const [sel,setSel]=useState<string[]>([]);
  const [done,setDone]=useState(false);
  const [ok,setOk]=useState(false);
  const add=(w:string,i:number)=>{ if(done)return; setSel(s=>[...s,w]); setAvail(a=>{const n=[...a];n.splice(i,1);return n;}); };
  const rem=(w:string,i:number)=>{ if(done)return; setSel(s=>{const n=[...s];n.splice(i,1);return n;}); setAvail(a=>[...a,w]); };
  const check=()=>{ const r=sel.join(' ')===data.correctSentence; setOk(r); setDone(true); playSound(r?'correct':'wrong'); setTimeout(()=>onAnswer(r),50); };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius:22, padding:'18px 20px', border:'1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Arrange the Sentence</p>
        <h2 style={{ fontSize:18, color:'#fff', fontWeight:900, lineHeight:1.4, marginBottom:16 }}>{data.instruction}</h2>
        <div style={{ minHeight:48, borderRadius:10, border:`1px solid ${sel.length>0?`${color}44`:'rgba(255,255,255,0.06)'}`, background:'rgba(0,0,0,0.3)', padding:'10px 12px', display:'flex', flexWrap:'wrap', gap:7, alignContent:'flex-start' }}>
          {sel.length===0&&!done&&<p style={{ color:'#3f3f46', fontSize:12, width:'100%', textAlign:'center', paddingTop:4 }}>Tap words below to build your answer</p>}
          {sel.map((w,i)=>(<button key={i} onClick={()=>rem(w,i)} style={{ padding:'6px 11px', borderRadius:7, fontSize:13, fontWeight:600, background:done?(ok?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.1)'):`${color}1a`, border:done?`1px solid ${ok?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`:`1px solid ${color}44`, color:done?(ok?'#6ee7b7':'#fca5a5'):color }}>{w}</button>))}
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
        {avail.map((w,i)=>(<button key={i} onClick={()=>add(w,i)} style={{ padding:'7px 13px', borderRadius:8, fontSize:13, fontWeight:500, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'#a1a1aa' }}>{w}</button>))}
      </div>
      {!done ? <button onClick={check} disabled={sel.length===0} style={{ width:'100%', height:48, borderRadius:12, background:sel.length===0?'rgba(255,255,255,0.02)':`${color}1a`, border:`1px solid ${sel.length===0?'rgba(255,255,255,0.05)':`${color}44`}`, color:sel.length===0?'#3f3f46':color, fontSize:13, fontWeight:700, cursor:sel.length===0?'default':'pointer' }}>Check Answer</button>
      : <div style={{ borderTop:`1px solid ${ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`, paddingTop:12 }}>
          <p style={{ color:ok?'#34d399':'#f87171', fontSize:13, fontWeight:800, marginBottom:4 }}>{ok?'✓ Correct!':'✗ Incorrect'}</p>
          {!ok&&<p style={{ color:'#71717a', fontSize:13 }}>Answer: <span style={{ color:'#e4e4e7', fontWeight:600 }}>{data.correctSentence}</span></p>}
          {ok&&<p style={{ color:'#71717a', fontSize:13, lineHeight:1.6 }}>{data.explanation}</p>}
        </div>}
    </div>
  );
}

// ── MatchingStep ──────────────────────────────────────────────────────────────
function MatchingStep({ data, color, onAnswer }: { data:any; color:string; onAnswer:(c:boolean)=>void }) {
  const pairs: {word:string; meaning:string}[] = data.pairs;
  const shuffled: string[] = data.shuffledMeanings;

  const [selWord,  setSelWord]  = useState<string|null>(null);
  const [matches,  setMatches]  = useState<Record<string,string>>({}); // word → meaning
  const [checked,  setChecked]  = useState(false);
  const [result,   setResult]   = useState<Record<string,boolean>>({}); // word → benar/salah

  // Warna per pasangan (untuk visual line-up sebelum di-check)
  const PAIR_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#0ea5e9'];

  // Indeks urutan pasangan yang sudah dibuat (untuk warna konsisten)
  const matchOrder = useRef<string[]>([]); // array of word, urutan pertama kali dipasangkan

  const allPaired = Object.keys(matches).length === pairs.length;

  const handleWord = (w: string) => {
    if (checked) return;
    setSelWord(prev => prev === w ? null : w);
  };

  const handleMeaning = (m: string) => {
    if (checked || !selWord) return;

    setMatches(prev => {
      const next = { ...prev };

      // Jika meaning ini sudah dipasang ke word lain → lepas dulu
      const existingWord = Object.keys(next).find(k => next[k] === m);
      if (existingWord) delete next[existingWord];

      // Jika word ini sudah punya pasangan → lepas dulu (replace)
      if (next[selWord]) {
        // tidak perlu hapus dari matchOrder karena akan di-replace
      }

      // Tambah ke matchOrder jika belum ada
      if (!matchOrder.current.includes(selWord)) {
        matchOrder.current = [...matchOrder.current, selWord];
      }

      next[selWord] = m;
      return next;
    });

    setSelWord(null);
  };

  // Lepas pasangan dengan tap ulang di word atau meaning yang sudah berpasangan
  const handleUnpairWord = (w: string) => {
    if (checked) return;
    setMatches(prev => {
      const next = { ...prev };
      delete next[w];
      return next;
    });
    setSelWord(null);
  };

  const handleCheck = () => {
    if (!allPaired || checked) return;
    const res: Record<string, boolean> = {};
    let allOk = true;
    pairs.forEach(p => {
      const ok = matches[p.word] === p.meaning;
      res[p.word] = ok;
      if (!ok) allOk = false;
    });
    setResult(res);
    setChecked(true);
    playSound(allOk ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(allOk), 50);
  };

  // Warna pasangan berdasarkan urutan match
  const getPairColor = (word: string) => {
    const idx = matchOrder.current.indexOf(word);
    return idx >= 0 ? PAIR_COLORS[idx % PAIR_COLORS.length] : null;
  };

  const matchedCount = Object.keys(matches).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius:20, padding:'16px 18px', border:'1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Match the Words</p>
        <p style={{ color:'#fff', fontSize:17, fontWeight:900, lineHeight:1.4, marginBottom:10 }}>{data.instruction}</p>
        {/* Progress dots */}
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          {pairs.map((_,i) => (
            <div key={i} style={{
              height: 4, flex:1, borderRadius:99,
              background: i < matchedCount
                ? (checked ? (Object.values(result)[i] ? '#10b981' : '#ef4444') : PAIR_COLORS[i % PAIR_COLORS.length])
                : 'rgba(255,255,255,0.08)',
              transition: 'background 0.3s',
            }}/>
          ))}
          <span style={{ color:'#3f3f46', fontSize:11, fontWeight:700, marginLeft:4, flexShrink:0 }}>{matchedCount}/{pairs.length}</span>
        </div>
      </div>

      {/* Hint saat ada yang dipilih */}
      {selWord && !checked && (
        <div style={{ padding:'8px 14px', borderRadius:10, background:`${color}10`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}`, flexShrink:0 }}/>
          <span style={{ color, fontSize:12, fontWeight:700 }}>
            "{selWord}" selected — tap a meaning to pair
          </span>
        </div>
      )}

      {/* Grid pasangan */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {/* Kolom kiri: words */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {pairs.map(p => {
            const isSel    = selWord === p.word;
            const isPaired = !!matches[p.word];
            const pairColor = getPairColor(p.word);
            const isOk     = checked ? result[p.word] : undefined;

            let bg     = 'rgba(255,255,255,0.03)';
            let border = '1px solid rgba(255,255,255,0.07)';
            let textC  = '#d4d4d8';

            if (checked) {
              bg     = isOk ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
              border = `1px solid ${isOk ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`;
              textC  = isOk ? '#6ee7b7' : '#fca5a5';
            } else if (isSel) {
              bg     = `${color}18`;
              border = `1px solid ${color}`;
              textC  = '#fff';
            } else if (isPaired && pairColor) {
              bg     = `${pairColor}12`;
              border = `1px solid ${pairColor}44`;
              textC  = pairColor;
            }

            return (
              <button key={p.word}
                onClick={() => isPaired && !isSel ? handleUnpairWord(p.word) : handleWord(p.word)}
                style={{ padding:'10px 12px', borderRadius:12, fontSize:13, fontWeight:700, textAlign:'left', background:bg, border, color:textC, cursor:checked?'default':'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <span>{p.word}</span>
                {/* Dot warna pasangan */}
                {isPaired && !checked && pairColor && (
                  <div style={{ width:7, height:7, borderRadius:'50%', background:pairColor, flexShrink:0, boxShadow:`0 0 5px ${pairColor}` }}/>
                )}
                {checked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    {isOk
                      ? <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      : <path d="M18 6L6 18M6 6l12 12" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/>
                    }
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Kolom kanan: meanings */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {shuffled.map(m => {
            const pairedWord  = Object.keys(matches).find(w => matches[w] === m);
            const isPaired    = !!pairedWord;
            const pairColor   = pairedWord ? getPairColor(pairedWord) : null;
            const isActive    = !!selWord && !checked;
            const isOk        = checked && pairedWord ? result[pairedWord] : undefined;

            let bg     = 'rgba(255,255,255,0.03)';
            let border = '1px solid rgba(255,255,255,0.07)';
            let textC  = '#d4d4d8';

            if (checked) {
              if (isPaired) {
                bg     = isOk ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
                border = `1px solid ${isOk ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`;
                textC  = isOk ? '#6ee7b7' : '#fca5a5';
              } else {
                textC = '#52525b';
              }
            } else if (isPaired && pairColor) {
              bg     = `${pairColor}12`;
              border = `1px solid ${pairColor}44`;
              textC  = pairColor;
            } else if (isActive && !isPaired) {
              // Highlight pilihan yang tersedia saat ada word dipilih
              border = `1px solid ${color}30`;
            }

            return (
              <button key={m}
                onClick={() => isPaired ? handleMeaning(m) : handleMeaning(m)}
                disabled={checked}
                style={{ padding:'10px 12px', borderRadius:12, fontSize:13, fontWeight:700, textAlign:'left', background:bg, border, color:textC, cursor:checked?'default':'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <span>{m}</span>
                {isPaired && !checked && pairColor && (
                  <div style={{ width:7, height:7, borderRadius:'50%', background:pairColor, flexShrink:0, boxShadow:`0 0 5px ${pairColor}` }}/>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hasil setelah check */}
      {checked && (
        <div style={{ borderTop:`1px solid ${Object.values(result).every(Boolean)?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`, paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
          <p style={{ color:Object.values(result).every(Boolean)?'#34d399':'#f87171', fontSize:13, fontWeight:800 }}>
            {Object.values(result).every(Boolean)
              ? `✓ Perfect! All ${pairs.length} pairs correct`
              : `✗ ${Object.values(result).filter(Boolean).length}/${pairs.length} correct`}
          </p>
          {/* Tunjukkan jawaban yang salah */}
          {!Object.values(result).every(Boolean) && (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {pairs.filter(p => !result[p.word]).map(p => (
                <p key={p.word} style={{ color:'#71717a', fontSize:12 }}>
                  <span style={{ color:'#fca5a5', fontWeight:700 }}>{p.word}</span>
                  {' → '}
                  <span style={{ color:'#e4e4e7', fontWeight:600 }}>{p.meaning}</span>
                </p>
              ))}
            </div>
          )}
          <p style={{ color:'#52525b', fontSize:12, lineHeight:1.6 }}>{data.explanation}</p>
        </div>
      )}

      {/* Tombol Check Answer */}
      {!checked && (
        <button
          onClick={handleCheck}
          disabled={!allPaired}
          style={{
            width:'100%', height:48, borderRadius:12,
            background: allPaired ? `${color}1a` : 'rgba(255,255,255,0.02)',
            border: `1px solid ${allPaired ? `${color}44` : 'rgba(255,255,255,0.05)'}`,
            color: allPaired ? color : '#3f3f46',
            fontSize:13, fontWeight:700,
            cursor: allPaired ? 'pointer' : 'default',
            transition:'all 0.2s',
          }}>
          {allPaired ? 'Check Answer' : `Pair all ${pairs.length} — ${matchedCount} done`}
        </button>
      )}
    </div>
  );
}

// ── ListeningStep ─────────────────────────────────────────────────────────────
function ListeningStep({ data, color, onAnswer }: { data:any; color:string; onAnswer:(c:boolean)=>void }) {
  const [sel,      setSel]      = useState<string|null>(null);
  const [checked,  setChecked]  = useState(false);
  const [isPlaying,setPlaying]  = useState(false);
  const [playCount,setCount]    = useState(0);
  const [ttsOk,    setTtsOk]    = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
 
  // Init TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsOk(false); return;
    }
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);
 
  /* ── playAudio ────────────────────────────────────────────────────────────
     Prioritas:
     1. data.audioUrl  → putar file MP3 statis (pre-recorded)
     2. data.audioText → fallback browser TTS
  ────────────────────────────────────────────────────────────────────────── */
  const playAudio = () => {
    if (isPlaying) return;
    setPlaying(true);
    setCount(c => c + 1);
 
    const onEnd   = () => setPlaying(false);
    const onError = () => setPlaying(false);
 
    if (data.audioUrl) {
      // ── File MP3 statis ────────────────────────────────────────────────
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.onended = onEnd;
      audio.onerror = () => {
        // MP3 gagal → coba TTS fallback
        if (data.audioText && ttsOk) {
          speakText(data.audioText, undefined, onEnd);
        } else {
          onError();
        }
      };
      audio.play().catch(() => {
        if (data.audioText && ttsOk) {
          speakText(data.audioText, undefined, onEnd);
        } else {
          onError();
        }
      });
    } else if (data.audioText && ttsOk) {
      // ── Tidak ada file → TTS ───────────────────────────────────────────
      speakText(data.audioText, () => setPlaying(true), onEnd);
    } else {
      setPlaying(false);
      setTtsOk(false);
    }
  };
 
  const handleCheck = () => {
    if (!sel || checked) return;
    setChecked(true);
    const correct = sel === data.correctAnswer;
    playSound(correct ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(correct), 50);
  };
 
  // Tidak ada sumber audio sama sekali
  const noAudio = !data.audioUrl && (!data.audioText || !ttsOk);
 
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius:22, padding:'20px', border:'1px solid rgba(255,255,255,0.07)' }}>
 
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={{ color:'#0ea5e9', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Listening</p>
        </div>
 
        <p style={{ color:'#52525b', fontSize:12, fontStyle:'italic', marginBottom:14 }}>
          {playCount === 0 ? 'Listen carefully, then answer.' : 'Play again if needed.'}
        </p>
 
        {/* Play button atau fallback text */}
        {noAudio ? (
          <div style={{ padding:'12px', borderRadius:10, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:14 }}>
            <p style={{ color:'#fca5a5', fontSize:12, textAlign:'center', marginBottom:6 }}>Audio not supported — read this:</p>
            <p style={{ color:'#d4d4d8', fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:1.6 }}>"{data.audioText}"</p>
          </div>
        ) : (
          <button
            onClick={playAudio}
            disabled={isPlaying}
            style={{ width:'100%', height:60, borderRadius:12, marginBottom:14, background:isPlaying?'rgba(14,165,233,0.06)':'rgba(14,165,233,0.1)', border:`1px solid ${isPlaying?'rgba(14,165,233,0.4)':'rgba(14,165,233,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', gap:12, cursor:isPlaying?'default':'pointer', transition:'all 0.2s' }}>
            <style>{`@keyframes wvb{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}`}</style>
            {isPlaying ? (
              <>
                {[0,0.12,0.24,0.36,0.48].map((d,i) => (
                  <div key={i} style={{ width:4, height:24, borderRadius:99, background:'#0ea5e9', animation:'wvb 0.7s ease-in-out infinite', animationDelay:`${d}s`, transformOrigin:'center' }}/>
                ))}
                <span style={{ color:'#0ea5e9', fontSize:13, fontWeight:700 }}>Playing…</span>
              </>
            ) : (
              <>
                <div style={{ position:'relative' }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(14,165,233,0.12)', border:`1px solid ${playCount > 0 ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.25)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <polygon points="5,3 19,12 5,21" fill="#0ea5e9"/>
                    </svg>
                  </div>
                  {/* Dot merah — belum pernah diputar */}
                  {playCount === 0 && (
                    <div style={{ position:'absolute', top:-2, right:-2, width:8, height:8, borderRadius:'50%', background:'#ef4444', border:'1.5px solid #0f0f14', boxShadow:'0 0 4px rgba(239,68,68,0.8)' }}/>
                  )}
                </div>
                <span style={{ color:'#7dd3fc', fontSize:13, fontWeight:700 }}>
                  {playCount === 0 ? 'Play Audio' : `Play Again (×${playCount})`}
                </span>
              </>
            )}
          </button>
        )}
 
        <h2 style={{ fontSize:18, fontWeight:900, color:'#fff', lineHeight:1.4 }}>{data.question}</h2>
      </div>
 
      {/* Options */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {data.options.map((opt:string, i:number) => {
          let bg='rgba(255,255,255,0.03)', border='1px solid rgba(255,255,255,0.07)', c='#d4d4d8', op=1;
          if (!checked) { if (opt === sel) { bg=`${color}18`; border=`1px solid ${color}`; c='#fff'; } }
          else {
            if (opt === data.correctAnswer) { bg='rgba(16,185,129,0.08)'; border='1px solid rgba(16,185,129,0.35)'; c='#6ee7b7'; }
            else if (opt === sel)           { bg='rgba(239,68,68,0.08)';  border='1px solid rgba(239,68,68,0.35)';  c='#fca5a5'; }
            else op=0.3;
          }
          return (
            <button key={i} onClick={() => !checked && setSel(opt)} disabled={checked}
              style={{ background:bg, border, color:c, opacity:op, borderRadius:12, padding:'12px 16px', textAlign:'left', fontSize:14, fontWeight:500, lineHeight:1.45, transition:'all 0.15s', display:'flex', alignItems:'flex-start', gap:12, cursor:checked?'default':'pointer' }}>
              <span style={{ color:opt===sel&&!checked?color:'#3f3f46', fontWeight:800, fontSize:11, marginTop:2, flexShrink:0 }}>{String.fromCharCode(65+i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
 
      {/* Feedback */}
      {checked && (
        <div style={{ borderTop:`1px solid ${sel===data.correctAnswer?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`, paddingTop:12 }}>
          <p style={{ color:sel===data.correctAnswer?'#34d399':'#f87171', fontSize:13, fontWeight:800, marginBottom:4 }}>
            {sel===data.correctAnswer ? '✓ Correct' : '✗ Incorrect'}
          </p>
          <p style={{ color:'#71717a', fontSize:13, lineHeight:1.6 }}>{data.explanation}</p>
        </div>
      )}
 
      {!checked && (
        <button onClick={handleCheck} disabled={!sel}
          style={{ width:'100%', height:48, borderRadius:12, background:sel?`${color}1a`:'rgba(255,255,255,0.02)', border:`1px solid ${sel?`${color}44`:'rgba(255,255,255,0.05)'}`, color:sel?color:'#3f3f46', fontSize:13, fontWeight:700, cursor:sel?'pointer':'default', transition:'all 0.2s' }}>
          Check Answer
        </button>
      )}
    </div>
  );
}

// ── SpeakingStep ──────────────────────────────────────────────────────────────
function SpeakingStep({ data, color, onAnswer }: { data:any; color:string; onAnswer:(c:boolean, skipped?:boolean)=>void }) {
  
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage) ?? 'en';
 
  const REC_LANG: Record<string, string> = {
    en: 'en-US',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ko: 'ko-KR',
  };
  const recLang = REC_LANG[selectedLanguage] ?? 'en-US';
 
  const [status,    setStatus]   = useState<'idle'|'listening'|'processing'|'done'>('idle');
  const [transcript,setTrans]    = useState('');
  const [sim,       setSim]      = useState(0);
  const [ok,        setOk]       = useState(false);
  const [micOk,     setMicOk]    = useState(true);
  const [micErr,    setMicErr]   = useState('');
  const [attempts,  setAttempts] = useState(0);
  const recRef = useRef<any>(null);
 
  // Re-create recognition setiap bahasa berubah
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicOk(false); return; }
    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = recLang;   // ← dinamis sesuai bahasa aktif
    rec.maxAlternatives = 3;
    recRef.current = rec;
    return () => { rec.abort(); };
  }, [recLang]); // ← re-run setiap bahasa berubah
 
  const start = () => {
    const rec = recRef.current;
    if (!rec || status === 'listening' || ok) return;
    setStatus('listening'); setTrans(''); setMicErr('');
    rec.onresult = (e: any) => {
      let f = '', int = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) f += r[0].transcript; else int += r[0].transcript;
      }
      setTrans(f || int);
    };
    rec.onerror = (e: any) => {
      setStatus('idle');
      if (e.error === 'not-allowed') setMicErr('Microphone blocked.');
      else if (e.error === 'no-speech') setMicErr('No speech detected. Try again.');
      else setMicErr(`Error: ${e.error}`);
    };
    rec.onend = () => { setStatus('processing'); setTimeout(evaluate, 200); };
    rec.start();
  };
 
  const stop = () => { recRef.current?.stop(); };
 
  const evaluate = () => {
  setTrans(prev => {
    const targetPhrase = data.phrase || "";
    const targetTranslation = data.translation || "";

    // 1. BERSIHKAN TRANSLATION: Potong teks sebelum tanda "—" atau "-"
    // "おはよう — Selamat pagi!" akan menjadi "おはよう "
    const cleanTranslation = targetTranslation.split(/[-—]/)[0];

    // 2. Normalisasi input dari user (lowercase & hapus spasi)
    const normalizedInput = prev.toLowerCase().replace(/\s+/g, '');
    
    // 3. Bandingkan dengan versi Alfabet
    const scoreAlpha = similarity(
      normalizedInput, 
      targetPhrase.toLowerCase().replace(/\s+/g, '')
    );

    // 4. Bandingkan dengan versi Jepang yang SUDAH DIBERSIHKAN
    const scoreNative = cleanTranslation 
      ? similarity(normalizedInput, cleanTranslation.replace(/\s+/g, ''))
      : 0;

    // 5. Ambil skor terbaik
    const finalSim = Math.max(scoreAlpha, scoreNative);

    console.log("Input User:", normalizedInput);
    console.log("Target Native (Cleaned):", cleanTranslation.replace(/\s+/g, ''));
    console.log("Skor Akhir:", finalSim);

    const passed = finalSim >= PASS_SIM;
    setSim(finalSim); 
    setOk(passed); 
    setAttempts(a => a + 1); 
    setStatus('done');
    
    playSound(passed ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(passed), 50);
    return prev;
  });
};
 
  const ringPct = Math.round(sim * 100);
 
  // Label bahasa untuk info user
  const LANG_LABEL: Record<string, string> = {
    en: 'English', ja: '日本語', zh: '中文', ko: '한국어',
  };
 
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ background:'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius:22, padding:'20px', border:'1px solid rgba(255,255,255,0.07)' }}>
 
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <svg width="12" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="11" rx="3" stroke="#a855f7" strokeWidth="2"/>
              <path d="M5 10a7 7 0 0 0 14 0" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ color:'#a855f7', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Speaking</p>
          </div>
          {/* Badge bahasa recognition */}
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:99, padding:'3px 10px' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'#a855f7' }}/>
            <span style={{ color:'#c084fc', fontSize:10, fontWeight:700 }}>{LANG_LABEL[selectedLanguage] ?? 'English'}</span>
          </div>
        </div>
 
        <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
          Say this phrase:
        </p>
        <h2 style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', lineHeight:1.3, marginBottom:6 }}>
          {data.phrase}
        </h2>
        <p style={{ color:'#52525b', fontSize:13, fontStyle:'italic' }}>{data.translation}</p>
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'12px 0' }} />
        <p style={{ color:'#3f3f46', fontSize:12, lineHeight:1.6 }}>{data.hint}</p>
      </div>
 
      {/* Mic tidak tersedia */}
      {!micOk && (
        <div style={{ padding:'14px', borderRadius:14, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color:'#fca5a5', fontSize:13, fontWeight:700, marginBottom:6 }}>Speech recognition not available</p>
          <p style={{ color:'#71717a', fontSize:12, lineHeight:1.5, marginBottom:10 }}>
            Works best in Chrome or Edge. Make sure microphone access is allowed.
          </p>
          <button onClick={() => onAnswer(true, true)}
            style={{ padding:'8px 18px', borderRadius:10, background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', color:'#d8b4fe', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Mark as Done
          </button>
        </div>
      )}
 
      {/* Error mic */}
      {micErr && (
        <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color:'#fca5a5', fontSize:12 }}>{micErr}</p>
        </div>
      )}
 
      {/* Transcript */}
      {transcript && (
        <div style={{ padding:'12px 14px', borderRadius:12, background:'rgba(168,85,247,0.06)', border:'1px solid rgba(168,85,247,0.2)' }}>
          <p style={{ color:'#52525b', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>You said:</p>
          <p style={{ color:'#d8b4fe', fontSize:15, fontWeight:600, lineHeight:1.5 }}>"{transcript}"</p>
        </div>
      )}
 
      {/* Hasil skor */}
      {status === 'done' && (
        <div style={{ padding:'14px', borderRadius:14, background:ok?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${ok?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`, display:'flex', alignItems:'center', gap:14 }}>
          {/* Ring progress */}
          <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke={ok?'#34d399':'#f87171'} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*22}`}
                strokeDashoffset={`${2*Math.PI*22*(1-ringPct/100)}`}
                style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:ok?'#34d399':'#f87171', fontSize:11, fontWeight:900 }}>{ringPct}%</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ color:ok?'#34d399':'#f87171', fontSize:14, fontWeight:800, marginBottom:3 }}>
              {ok ? 'Great pronunciation!' : 'Not quite — try again!'}
            </p>
            <p style={{ color:'#52525b', fontSize:12 }}>
              {ok ? `${ringPct}% match. Well done!` : `${ringPct}% — need ${Math.round(PASS_SIM*100)}%`}
            </p>
          </div>
        </div>
      )}
 
      {/* Tombol mic */}
      {micOk && !ok && (
        <button
          onClick={status === 'listening' ? stop : start}
          disabled={status === 'processing'}
          style={{ width:'100%', height:54, borderRadius:14, background:status==='listening'?'rgba(239,68,68,0.1)':'rgba(168,85,247,0.1)', border:status==='listening'?'1px solid rgba(239,68,68,0.4)':'1px solid rgba(168,85,247,0.3)', color:status==='listening'?'#fca5a5':status==='processing'?'#3f3f46':'#d8b4fe', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:status==='processing'?'default':'pointer', transition:'all 0.2s' }}>
          <style>{`@keyframes ripple{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.8);opacity:0}}`}</style>
          {status === 'listening' ? (
            <>
              <div style={{ position:'relative', width:20, height:20 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(239,68,68,0.4)', animation:'ripple 1s ease-out infinite' }}/>
                <div style={{ position:'absolute', inset:4, borderRadius:'50%', background:'#ef4444' }}/>
              </div>
              Tap to Stop
            </>
          ) : status === 'processing' ? 'Processing…' : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3" fill="#a855f7"/>
                <path d="M5 10a7 7 0 0 0 14 0" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="19" x2="12" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {attempts === 0 ? 'Tap to Speak' : `Try Again (attempt ${attempts + 1})`}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── ResultScreen ──────────────────────────────────────────────────────────────
const MIN_CORRECT = 8;

function ResultScreen({ score, total, xpEarned, color, stageLabel, chapterTitle, passed, isReplay, onRetry, onNext, onMap }:
  { score:number; total:number; xpEarned:number; color:string; stageLabel:string; chapterTitle:string; passed:boolean; isReplay:boolean; onRetry:()=>void; onNext:()=>void; onMap:()=>void }) {
  const pct=Math.round((score/total)*100);
  const stars=pct>=90?3:pct>=70?2:pct>=50?1:0;
  useEffect(()=>{playSound(passed?'complete':'wrong');},[]);
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px', textAlign:'center' }}>
      <div style={{ width:130, height:130, borderRadius:'50%', marginBottom:20, background:passed?`${color}12`:'rgba(239,68,68,0.08)', border:`3px solid ${passed?color:'#ef4444'}`, boxShadow:`0 8px 40px ${passed?color:'#ef4444'}22`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontSize:44, fontWeight:900, color:passed?color:'#ef4444', lineHeight:1 }}>{score}</p>
        <p style={{ color:'#52525b', fontSize:12 }}>/ {total}</p>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>{[1,2,3].map(s=>(<svg key={s} width="28" height="28" viewBox="0 0 24 24" fill={s<=stars?'#f59e0b':'rgba(255,255,255,0.08)'}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>))}</div>
      <h2 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', marginBottom:6 }}>{passed?(stars===3?'Perfect!':'Stage Clear!'):'Not quite…'}</h2>
      <p style={{ color:'#52525b', fontSize:13, marginBottom:12 }}>{chapterTitle} · {stageLabel}</p>
      {passed&&!isReplay&&<div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(250,204,21,0.08)', borderRadius:99, padding:'6px 16px', marginBottom:16, border:'1px solid rgba(250,204,21,0.2)' }}><span style={{ color:'#facc15', fontSize:13, fontWeight:800 }}>+{xpEarned} XP earned</span></div>}
      {passed&&isReplay&&<div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', borderRadius:99, padding:'6px 16px', marginBottom:16, border:'1px solid rgba(255,255,255,0.07)' }}><span style={{ color:'#71717a', fontSize:11, fontWeight:600 }}>Mode latihan — XP tidak dihitung ulang</span></div>}
      {!passed&&<p style={{ color:'#f87171', fontSize:13, lineHeight:1.7, marginBottom:16 }}>Butuh minimal {MIN_CORRECT}/{total} untuk lanjut.</p>}
      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%' }}>
        {passed?(<button onClick={onNext} style={{ height:52, borderRadius:14, background:`linear-gradient(135deg,${color},${color}99)`, border:'none', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer', boxShadow:`0 6px 22px ${color}40` }}>Continue →</button>)
        :(<button onClick={onRetry} style={{ height:52, borderRadius:14, background:'linear-gradient(135deg,#dc2626,#ef4444)', border:'none', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer' }}>Try Again</button>)}
        <button onClick={onMap} style={{ height:44, borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a', fontSize:13, fontWeight:700, cursor:'pointer' }}>Back to Map</button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
interface Props { feedData:any[]; chapter:any; stage:any; stageIndex:number; totalStages:number; }

export default function AdventureQuiz({ feedData, chapter, stage, stageIndex, totalStages }: Props) {
  const router = useRouter();

  const {
    combo, isEnglish,
    addXp, incrementCombo, resetCombo,
    setStageStars, markStageComplete, isStageCompleted, unlockStage,
  } = useProgress();

  const enStore  = useUserStore();
  const isReplay = isStageCompleted(stage.id);

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [answers,     setAnswers]     = useState<boolean[]>([]);
  const [pendingNext, setPendingNext] = useState(false);
  const [finished,    setFinished]    = useState(false);
  const [xpEarned,    setXpEarned]    = useState(0);
  const [key,         setKey]         = useState(0);

  const color = chapter.color;
  const total = feedData.length;

  const answersRef = useRef<boolean[]>([]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const finishQuiz = useCallback((finalAnswers: boolean[]) => {
    const score      = finalAnswers.filter(Boolean).length;
    const passed     = score >= MIN_CORRECT;
    const allCorrect = score === total;
    if (passed) {
      const stars = score >= Math.floor(total * .9) ? 3 : score >= Math.floor(total * .7) ? 2 : 1;
      setStageStars(stage.id, stars);
      const nextStage = chapter.stages[stageIndex + 1];
      if (nextStage) unlockStage(nextStage.id, chapter.stages);
      if (!isReplay) {
        markStageComplete(stage.id);
        if (isEnglish) {
          const allChapters = (dummyData as any).chapters ?? [];
          const completedChapterIds = allChapters
            .filter((ch: any) => ch.stages.some((s: any) => enStore.completedStages?.[s.id] || s.id === stage.id))
            .map((ch: any) => String(ch.id));
          enStore.checkAndUnlockAchievements?.({ justCompletedStageId: stage.id, justCompletedStars: stars, allCorrect, completedChapterIds, language: 'en' });
        }
      }
    }
    setFinished(true);
  }, [total, stage.id, stageIndex, chapter.stages, isReplay, isEnglish, setStageStars, unlockStage, markStageComplete, enStore]);

  const onAnswer = useCallback((correct: boolean) => {
    const xpR = feedData[currentIdx]?.xpReward ?? 10;
    if (correct && !isReplay) {
      const m = combo >= 4 ? 2.0 : combo >= 2 ? 1.5 : 1;
      addXp(Math.floor(xpR * m));
      setXpEarned(prev => prev + Math.floor(xpR * m));
    }
    if (correct) incrementCombo(); else resetCombo();
    setAnswers(prev => [...prev, correct]);
    setPendingNext(true);
  }, [currentIdx, feedData, combo, isReplay, addXp, incrementCombo, resetCombo]);

  const handleNext = useCallback(() => {
    setPendingNext(false);
    const next = currentIdx + 1;
    if (next >= total) finishQuiz(answersRef.current);
    else setCurrentIdx(next);
  }, [currentIdx, total, finishQuiz]);

  const handleVocabNext = useCallback(() => {
    const xpR = feedData[currentIdx]?.xpReward ?? 10;
    if (!isReplay) { addXp(xpR); setXpEarned(prev => prev + xpR); }
    const newAnswers = [...answersRef.current, true];
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    const next = currentIdx + 1;
    if (next >= total) finishQuiz(newAnswers);
    else setCurrentIdx(next);
  }, [currentIdx, feedData, isReplay, addXp, total, finishQuiz]);

  const handleRetry = useCallback(() => {
    setCurrentIdx(0); setAnswers([]); answersRef.current = [];
    setPendingNext(false); setFinished(false); setXpEarned(0);
    setKey(k => k + 1); resetCombo();
  }, [resetCombo]);

  const onSpeakingAnswer = useCallback((correct: boolean, _skipped?: boolean) => {
    const xpR = feedData[currentIdx]?.xpReward ?? 20;
    if (correct && !isReplay) {
      const m = combo >= 4 ? 2.0 : combo >= 2 ? 1.5 : 1;
      addXp(Math.floor(xpR * m));
      setXpEarned(prev => prev + Math.floor(xpR * m));
    }
    if (correct) incrementCombo();
    setAnswers(prev => [...prev, correct]);
    setPendingNext(true);
  }, [currentIdx, feedData, combo, isReplay, addXp, incrementCombo]);

  const item        = !finished && currentIdx < feedData.length ? feedData[currentIdx] : null;
  const isVocab     = item?.type === 'vocabulary';
  const isMatch     = item?.type === 'matching_word';
  const isSentence  = item?.type === 'sentence_building';
  const isListening = item?.type === 'listening_quiz';
  const isSpeaking  = item?.type === 'speaking_test';
  const isChoice    = !!item && !isVocab && !isMatch && !isSentence && !isListening && !isSpeaking;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#0a0a0d', overflow:'hidden' }}>
      <div style={{ height:3, flexShrink:0, background:`linear-gradient(90deg,${color},${color}99)`, boxShadow:`0 0 10px ${color}80` }} />
      {isReplay&&!finished&&(
        <div style={{ padding:'7px 18px', background:'rgba(255,255,255,0.025)', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#52525b" strokeWidth="2"/></svg>
          <span style={{ color:'#3f3f46', fontSize:11, fontWeight:600 }}>Mode latihan — XP tidak dihitung ulang</span>
        </div>
      )}
      <div style={{ padding:'12px 18px 8px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
        <ProgressBar current={finished?total:currentIdx} total={total} color={color} />
        {combo>=2&&!finished&&!isReplay&&(
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:8, background:'rgba(250,204,21,0.06)', borderRadius:99, padding:'3px 12px', border:'1px solid rgba(250,204,21,0.15)' }}>
            <span style={{ color:'#facc15', fontSize:11, fontWeight:800 }}>⚡ {combo}× Combo!</span>
          </div>
        )}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 18px 16px' }}>
        {finished ? (
          <ResultScreen
            score={answers.filter(Boolean).length} total={total} xpEarned={xpEarned} color={color}
            stageLabel={stage.label} chapterTitle={chapter.title}
            passed={answers.filter(Boolean).length >= MIN_CORRECT}
            isReplay={isReplay} onRetry={handleRetry}
            onNext={() => { const ni=stageIndex+1; if(ni<totalStages) router.push(`/adventure/${chapter.id}/${chapter.stages[ni].id}`); else router.push('/adventure'); }}
            onMap={() => router.push('/adventure')}
          />
        ) : item ? (
          <div key={`${key}-${currentIdx}`}>
            {isVocab     && <VocabStep    data={item.content} color={color}/>}
            {isChoice    && <ChoiceStep   data={item.content} type={item.type} color={color} onAnswer={onAnswer}/>}
            {isSentence  && <SentenceStep data={item.content} color={color} onAnswer={onAnswer}/>}
            {isMatch     && <MatchingStep data={item.content} color={color} onAnswer={onAnswer}/>}
            {isListening && <ListeningStep data={item.content} color={color} onAnswer={onAnswer}/>}
            {isSpeaking  && <SpeakingStep  data={item.content} color={color} onAnswer={onSpeakingAnswer}/>}
          </div>
        ) : null}
      </div>

      {!finished && (
        <div style={{ padding:'10px 18px 20px', flexShrink:0, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {isVocab ? (
            <button onClick={handleVocabNext} style={{ width:'100%', height:52, borderRadius:14, background:`linear-gradient(135deg,${color},${color}99)`, border:'none', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer', boxShadow:`0 4px 20px ${color}40` }}>Got it — Next →</button>
          ) : pendingNext ? (
            <button onClick={handleNext} style={{ width:'100%', height:52, borderRadius:14, background:`linear-gradient(135deg,${color},${color}99)`, border:'none', color:'#fff', fontSize:14, fontWeight:900, cursor:'pointer', boxShadow:`0 4px 20px ${color}40`, animation:'fadeUp 0.22s ease both' }}>
              {currentIdx+1>=total?'See Results':'Next Question →'}
            </button>
          ) : isSpeaking ? (
            // Speaking punya tombol sendiri di dalam komponen, tinggal placeholder
            <div style={{ height:52, borderRadius:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:'#3f3f46', fontSize:13, fontWeight:600 }}>Speak to continue</div>
          ) : null
          // Matching tidak butuh placeholder di sini karena tombol Check Answer ada di dalam MatchingStep
          }
        </div>
      )}
    </div>
  );
}