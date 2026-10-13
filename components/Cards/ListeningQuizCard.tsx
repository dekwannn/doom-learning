// src/components/Cards/ListeningQuizCard.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import BilingualExplanation from '@/components/Cards/BilingualExplanation';
import { getTtsLang } from '@/components/Cards/VocabularyCard';

/* ── TTS fallback — dipakai jika tidak ada audioUrl ──────────────────────── */
function speakText(
  text: string,
  ttsLang: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void,
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onError?.(); return; }
  window.speechSynthesis.cancel();
  const utt    = new SpeechSynthesisUtterance(text);
  utt.lang     = ttsLang;
  utt.rate     = 0.9;
  utt.pitch    = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang === ttsLang && v.name.includes('Premium'))
         || voices.find(v => v.lang === ttsLang && v.name.includes('Google'))
         || voices.find(v => v.lang === ttsLang)
         || voices.find(v => v.lang.startsWith(ttsLang.split('-')[0]));
  if (v) utt.voice = v;
  utt.onstart = () => onStart?.();
  utt.onend   = () => onEnd?.();
  utt.onerror = () => onError?.();
  window.speechSynthesis.speak(utt);
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function ListeningQuizCard({ data, xpReward }: { data: any; xpReward: number }) {
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage) ?? 'en';
  const ttsLang          = getTtsLang(selectedLanguage);

  const [selected,     setSelected]     = useState<string|null>(null);
  const [isCorrect,    setIsCorrect]    = useState<boolean|null>(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [playCount,    setPlayCount]    = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [earnedXp,     setEarnedXp]     = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { combo, addXp, incrementCombo, resetCombo } = useUserStore();

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsSupported(false); return;
    }
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.cancel();
      // Stop audio jika sedang main saat unmount (pindah soal)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  /* ── playAudio ──────────────────────────────────────────────────────────
     Prioritas:
     1. data.audioUrl  → putar file MP3 statis (pre-recorded, kualitas terbaik)
     2. data.audioText → fallback browser TTS (jika tidak ada file)
  ────────────────────────────────────────────────────────────────────────── */
  const playAudio = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayCount(c => c + 1);

    const onEnd   = () => setIsPlaying(false);
    const onError = () => { setIsPlaying(false); };

    if (data.audioUrl) {
      // ── Putar file MP3 ──────────────────────────────────────────────────
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.onended = onEnd;
      audio.onerror = () => {
        // File gagal load → fallback ke TTS jika ada audioText
        if (data.audioText && ttsSupported) {
          speakText(data.audioText, ttsLang, undefined, onEnd, onError);
        } else {
          onError();
        }
      };
      audio.play().catch(() => {
        if (data.audioText && ttsSupported) {
          speakText(data.audioText, ttsLang, undefined, onEnd, onError);
        } else {
          onError();
        }
      });
    } else if (data.audioText && ttsSupported) {
      // ── Tidak ada file → pakai TTS ──────────────────────────────────────
      speakText(data.audioText, ttsLang, undefined, onEnd, onError);
    } else {
      // Tidak ada keduanya
      setIsPlaying(false);
      setTtsSupported(false);
    }
  };

  const handleSelect = (option: string) => {
    if (selected) return;
    const correct = option === data.correctAnswer;
    setSelected(option); setIsCorrect(correct);
    if (correct) {
      const m  = combo >= 4 ? 2.0 : combo >= 2 ? 1.5 : 1;
      const xp = Math.floor(xpReward * m);
      setEarnedXp(xp); addXp(xp); incrementCombo();
    } else { resetCombo(); }
  };

  /* ── Teks di tombol play ─────────────────────────────────────────────── */
  const playLabel = isPlaying
    ? 'Playing…'
    : playCount === 0
      ? 'Play Audio'
      : `Play Again (×${playCount})`;

  /* ── Tidak ada sumber audio sama sekali ─────────────────────────────── */
  const noAudio = !data.audioUrl && (!data.audioText || !ttsSupported);

  return (
    <div className="w-full h-full flex flex-col items-stretch justify-center px-5 text-white overflow-hidden"
      style={{ background:'#0a0a0d' }}>
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background:'linear-gradient(90deg,transparent,rgba(14,165,233,0.6),transparent)' }} />

      {/* meta */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" stroke="#0ea5e9" strokeWidth="2"/>
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" stroke="#0ea5e9" strokeWidth="2"/>
          </svg>
          <p style={{ color:'#0ea5e9', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Listening</p>
        </div>
        {!selected && <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700 }}>+{xpReward} XP</p>}
        {isCorrect  && <p style={{ color:'#facc15', fontSize:12, fontWeight:800 }}>+{earnedXp} XP</p>}
      </div>

      {/* question card */}
      <div className="rounded-2xl px-5 py-5 mb-4"
        style={{ background:'linear-gradient(160deg,#13131a 0%,#0f0f14 100%)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.04)' }}>

        <p style={{ color:'#52525b', fontSize:12, fontStyle:'italic', marginBottom:14 }}>
          {playCount === 0 ? 'Press play and listen carefully, then answer.' : 'Answer below. You can play again if needed.'}
        </p>

        {/* play button atau fallback text */}
        {noAudio ? (
          <div style={{ padding:'12px 16px', borderRadius:12, marginBottom:16, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color:'#fca5a5', fontSize:12, textAlign:'center' }}>Audio not supported on this device.</p>
          </div>
        ) : (
          <button
            onClick={playAudio}
            disabled={isPlaying}
            style={{ width:'100%', height:62, borderRadius:14, marginBottom:16, background:isPlaying?'rgba(14,165,233,0.06)':'linear-gradient(135deg,rgba(14,165,233,0.14),rgba(14,165,233,0.04))', border:`1px solid ${isPlaying?'rgba(14,165,233,0.4)':'rgba(14,165,233,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', gap:14, cursor:isPlaying?'default':'pointer', transition:'all 0.2s' }}>
            <style>{`@keyframes wvbar{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}`}</style>
            {isPlaying ? (
              <>
                {[0,0.12,0.24,0.36,0.48].map((delay, i) => (
                  <div key={i} style={{ width:4, height:26, borderRadius:99, background:'#0ea5e9', animation:'wvbar 0.7s ease-in-out infinite', animationDelay:`${delay}s`, transformOrigin:'center' }}/>
                ))}
                <span style={{ color:'#0ea5e9', fontSize:13, fontWeight:700 }}>Playing…</span>
              </>
            ) : (
              <>
                <div style={{ position:'relative' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(14,165,233,0.12)', border:`1px solid ${playCount > 0 ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.25)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="#0ea5e9"/></svg>
                  </div>
                  {/* Dot merah kecil di pojok kanan atas jika belum pernah diputar */}
                  {playCount === 0 && (
                    <div style={{ position:'absolute', top:-2, right:-2, width:8, height:8, borderRadius:'50%', background:'#ef4444', border:'1.5px solid #0f0f14', boxShadow:'0 0 4px rgba(239,68,68,0.8)' }}/>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2 }}>
                  <span style={{ color:'#7dd3fc', fontSize:13, fontWeight:700 }}>{playLabel}</span>
                  {playCount === 0 && (
                    <span style={{ color:'#52525b', fontSize:10 }}>Dengarkan dulu sebelum menjawab</span>
                  )}
                </div>
              </>
            )}
          </button>
        )}

        <h2 style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.01em', lineHeight:1.4 }}>
          {data.question}
        </h2>
      </div>

      {/* options */}
      <div className="flex flex-col" style={{ gap:8 }}>
        {data.options.map((option: string, i: number) => {
          let bg='rgba(255,255,255,0.03)', border='1px solid rgba(255,255,255,0.07)', color='#d4d4d8', opacity=1;
          if (selected) {
            if (option === data.correctAnswer)  { bg='rgba(16,185,129,0.08)'; border='1px solid rgba(16,185,129,0.35)'; color='#6ee7b7'; }
            else if (option === selected)       { bg='rgba(239,68,68,0.08)';  border='1px solid rgba(239,68,68,0.35)';  color='#fca5a5'; }
            else                                { opacity=0.3; }
          }
          return (
            <button key={i} onClick={() => handleSelect(option)} disabled={!!selected}
              style={{ background:bg, border, color, opacity, borderRadius:12, padding:'12px 16px', textAlign:'left', fontSize:14, fontWeight:500, lineHeight:1.45, transition:'all 0.15s', display:'flex', alignItems:'flex-start', gap:12 }}>
              <span style={{ color:'#3f3f46', fontWeight:800, fontSize:11, marginTop:2, flexShrink:0 }}>{String.fromCharCode(65+i)}</span>
              {option}
            </button>
          );
        })}
      </div>

      {selected && (
        <div style={{ borderTop:`1px solid ${isCorrect?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`, paddingTop:14, marginTop:14, display:'flex', flexDirection:'column', gap:5 }}>
          <p style={{ color:isCorrect?'#34d399':'#f87171', fontSize:13, fontWeight:800 }}>{isCorrect?'Correct':'Incorrect'}</p>
          <BilingualExplanation text={data.explanation}/>
        </div>
      )}
    </div>
  );
}