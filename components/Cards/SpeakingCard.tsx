// src/components/Cards/SpeakingCard.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import BilingualExplanation from '@/components/Cards/BilingualExplanation';
import { getTtsLang } from '@/components/Cards/VocabularyCard';

/* ── Web Speech API types ────────────────────────────────────────────────────── */
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number; }
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string; maxAlternatives: number;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror:  ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend:    ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void; stop(): void; abort(): void;
}

/* ── Fuzzy match ─────────────────────────────────────────────────────────────── */
function normalize(text: string) {
  return text.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').replace(/\s+/g, ' ').trim();
}
function calcSimilarity(a: string, b: string): number {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1.0;
  const wa = new Set(na.split(' ')), wb = new Set(nb.split(' '));
  const intersection = [...wa].filter(w => wb.has(w)).length;
  return intersection / new Set([...wa, ...wb]).size;
}
const PASS_THRESHOLD = 0.65;

/* ── create recognition dengan lang dinamis ──────────────────────────────────── */
function createRecognition(ttsLang: string): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec: SpeechRecognition = new SR();
  rec.continuous     = false;
  rec.interimResults = true;
  rec.lang           = ttsLang;   // ← bahasa dinamis
  rec.maxAlternatives = 3;
  return rec;
}

/* ── Component ───────────────────────────────────────────────────────────────── */
export default function SpeakingCard({ data, xpReward }: { data: any; xpReward: number }) {
  // ── bahasa aktif ──────────────────────────────────────────────────────────
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage) ?? 'en';
  const ttsLang = getTtsLang(selectedLanguage);

  const [status,       setStatus]       = useState<'idle'|'listening'|'processing'|'done'>('idle');
  const [transcript,   setTranscript]   = useState('');
  const [isCorrect,    setIsCorrect]    = useState<boolean|null>(null);
  const [similarity,   setSimilarity]   = useState(0);
  const [attempts,     setAttempts]     = useState(0);
  const [earnedXp,     setEarnedXp]     = useState(0);
  const [micSupported, setMicSupported] = useState(true);
  const [micError,     setMicError]     = useState('');
  const recRef = useRef<SpeechRecognition | null>(null);
  const { combo, addXp, incrementCombo, resetCombo } = useUserStore();

  // ── init / re-init recognition saat bahasa berubah ───────────────────────
  useEffect(() => {
    const rec = createRecognition(ttsLang);
    if (!rec) { setMicSupported(false); return; }
    recRef.current = rec;
    return () => { rec.abort(); };
  }, [ttsLang]);   // ← depend on ttsLang, bukan []

  const startListening = () => {
    const rec = recRef.current;
    if (!rec || status === 'listening' || isCorrect !== null) return;
    setStatus('listening');
    setTranscript('');
    setMicError('');

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setTranscript(final || interim);
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setStatus('idle');
      if (e.error === 'not-allowed')  setMicError('Microphone access denied. Please allow microphone in your browser.');
      else if (e.error === 'no-speech') setMicError('No speech detected. Please try again.');
      else setMicError(`Error: ${e.error}. Please try again.`);
    };
    rec.onend = () => { setStatus('processing'); setTimeout(() => evaluateResult(), 200); };
    rec.start();
  };

  const stopListening = () => { recRef.current?.stop(); };

  const evaluateResult = () => {
    setTranscript(prev => {
      const sim    = calcSimilarity(prev, data.phrase);
      const passed = sim >= PASS_THRESHOLD;
      setSimilarity(sim);
      setIsCorrect(passed);
      setAttempts(a => a + 1);
      setStatus('done');
      if (passed) {
        const m  = combo >= 4 ? 2.0 : combo >= 2 ? 1.5 : 1;
        const xp = Math.floor(xpReward * m);
        setEarnedXp(xp); addXp(xp); incrementCombo();
      } else { resetCombo(); }
      return prev;
    });
  };

  const retry = () => {
    if (isCorrect) return;
    setStatus('idle'); setTranscript(''); setIsCorrect(null); setSimilarity(0); setMicError('');
    // re-create dengan ttsLang terbaru
    const rec = createRecognition(ttsLang);
    if (rec) recRef.current = rec;
  };

  const ringPct = Math.round(similarity * 100);

  return (
    <div className="w-full h-full flex flex-col items-stretch justify-center px-5 text-white overflow-hidden"
      style={{ background: '#0a0a0d' }}>
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)' }} />

      {/* meta */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <svg width="12" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" stroke="#a855f7" strokeWidth="2"/>
            <path d="M5 10a7 7 0 0 0 14 0" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="12" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={{ color:'#a855f7', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Speaking</p>
        </div>
        {isCorrect === null && <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700 }}>+{xpReward} XP</p>}
        {isCorrect           && <p style={{ color:'#facc15', fontSize:12, fontWeight:800 }}>+{earnedXp} XP</p>}
      </div>

      {/* phrase card */}
      <div className="rounded-2xl px-5 py-6 mb-4"
        style={{ background:'linear-gradient(160deg,#13131a 0%,#0f0f14 100%)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <p style={{ color:'#52525b', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Say this phrase:</p>
        <h2 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', lineHeight:1.3, marginBottom:8 }}>{data.phrase}</h2>
        <p style={{ color:'#52525b', fontSize:13, fontStyle:'italic' }}>{data.translation}</p>
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'14px 0' }} />
        <p style={{ color:'#71717a', fontSize:12, lineHeight:1.6 }}>{data.hint}</p>
      </div>

      {/* mic not supported */}
      {!micSupported && (
        <div style={{ padding:'14px 16px', borderRadius:14, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:14 }}>
          <p style={{ color:'#fca5a5', fontSize:13, fontWeight:700, marginBottom:4 }}>Speech recognition not available</p>
          <p style={{ color:'#71717a', fontSize:12, lineHeight:1.6 }}>Works best in Chrome or Edge. Try saying the phrase aloud then tap Mark as Done.</p>
          <button onClick={() => { setIsCorrect(true); setEarnedXp(xpReward); addXp(xpReward); incrementCombo(); }}
            style={{ marginTop:12, padding:'8px 18px', borderRadius:10, background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', color:'#d8b4fe', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Mark as Done
          </button>
        </div>
      )}

      {/* mic error */}
      {micError && (
        <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:12 }}>
          <p style={{ color:'#fca5a5', fontSize:12 }}>{micError}</p>
        </div>
      )}

      {/* transcript */}
      {(status==='listening'||status==='processing'||status==='done') && transcript && (
        <div style={{ padding:'12px 16px', borderRadius:14, marginBottom:12, background:'rgba(168,85,247,0.06)', border:'1px solid rgba(168,85,247,0.2)' }}>
          <p style={{ color:'#52525b', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>You said:</p>
          <p style={{ color:'#d8b4fe', fontSize:15, fontWeight:600, lineHeight:1.5 }}>"{transcript}"</p>
        </div>
      )}

      {/* result */}
      {status==='done' && isCorrect !== null && (
        <div style={{ padding:'14px 16px', borderRadius:14, marginBottom:12, background:isCorrect?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${isCorrect?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke={isCorrect?'#34d399':'#f87171'} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*22}`} strokeDashoffset={`${2*Math.PI*22*(1-ringPct/100)}`}
                style={{ transition:'stroke-dashoffset 0.8s ease' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:isCorrect?'#34d399':'#f87171', fontSize:11, fontWeight:900 }}>{ringPct}%</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ color:isCorrect?'#34d399':'#f87171', fontSize:14, fontWeight:800, marginBottom:3 }}>{isCorrect?'Great pronunciation!':'Not quite — try again!'}</p>
            <p style={{ color:'#52525b', fontSize:12, lineHeight:1.5 }}>{isCorrect?`You matched ${ringPct}%. Well done!`:`You matched ${ringPct}%. Need ${Math.round(PASS_THRESHOLD*100)}% to pass.`}</p>
          </div>
        </div>
      )}

      {/* main button */}
      {micSupported && isCorrect===null && (
        <button onClick={status==='listening'?stopListening:startListening} disabled={status==='processing'}
          style={{ width:'100%', height:56, borderRadius:16, background:status==='listening'?'rgba(239,68,68,0.12)':status==='processing'?'rgba(168,85,247,0.08)':'rgba(168,85,247,0.12)', border:status==='listening'?'1px solid rgba(239,68,68,0.4)':'1px solid rgba(168,85,247,0.3)', color:status==='listening'?'#fca5a5':status==='processing'?'#71717a':'#d8b4fe', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:10, cursor:status==='processing'?'default':'pointer', transition:'all 0.2s' }}>
          {status==='listening'?(
            <>
              <style>{`@keyframes ripple{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.8);opacity:0}}`}</style>
              <div style={{ position:'relative', width:20, height:20 }}>
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(239,68,68,0.4)', animation:'ripple 1s ease-out infinite' }}/>
                <div style={{ position:'absolute', inset:4, borderRadius:'50%', background:'#ef4444' }}/>
              </div>
              Tap to Stop
            </>
          ):status==='processing'?'Processing…':(
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" fill="#a855f7"/><path d="M5 10a7 7 0 0 0 14 0" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="22" x2="16" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/></svg>
              {attempts===0?'Tap to Speak':`Try Again (attempt ${attempts+1})`}
            </>
          )}
        </button>
      )}

      {/* retry */}
      {micSupported && status==='done' && isCorrect===false && (
        <button onClick={retry} style={{ width:'100%', height:50, borderRadius:14, marginTop:8, background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.25)', color:'#d8b4fe', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 1 0 .49-4" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/></svg>
          Try Again
        </button>
      )}
    </div>
  );
}