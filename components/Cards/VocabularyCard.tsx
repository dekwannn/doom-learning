// src/components/Cards/VocabularyCard.tsx
'use client';
import { useState } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';

/* ── TTS lang helper ─────────────────────────────────────────────────────── */
export function getTtsLang(code: string): string {
  if (code === 'ja') return 'ja-JP';
  if (code === 'zh') return 'zh-CN';
  if (code === 'ko') return 'ko-KR';
  return 'en-US';
}

export function playTts(
  text: string,
  ttsLang: string,
  onStart?: () => void,
  onEnd?: () => void,
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = ttsLang;
  utt.rate   = 0.85;
  utt.pitch  = 1.0;
  utt.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang === ttsLang)
         || voices.find(v => v.lang.startsWith(ttsLang.split('-')[0]));
  if (v) utt.voice = v;
  utt.onstart = () => onStart?.();
  utt.onend   = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
}

export default function VocabularyCard({ data }: { data: any }) {
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage) ?? 'en';
  const ttsLang = getTtsLang(selectedLanguage);

  // ── state: idle | playing | played ───────────────────────────────────────
  // idle   = belum pernah dipencet
  // playing = sedang diputar
  // played = sudah pernah diputar minimal sekali
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'played'>('idle');

  const playAudio = () => {
    if (audioState === 'playing') return; // cegah double-tap
    setAudioState('playing');

    const handleEnd = () => setAudioState('played');

    if (data.audioUrl && !data.audioUrl.startsWith('tts://')) {
      // File MP3 statis
      const audio = new Audio(data.audioUrl);
      audio.onended = handleEnd;
      audio.onerror = handleEnd;
      audio.play().catch(() => {
        // fallback ke TTS jika file gagal load
        playTts(data.word, ttsLang, undefined, handleEnd);
      });
    } else {
      // Browser TTS
      playTts(data.word, ttsLang, undefined, handleEnd);
    }
  };

  // ── tampilan tombol berdasarkan state ─────────────────────────────────────
  const btnStyle = {
    idle: {
      bg:     'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      color:  '#71717a',
      label:  'Play Pronunciation',
    },
    playing: {
      bg:     'rgba(59,130,246,0.10)',
      border: '1px solid rgba(59,130,246,0.35)',
      color:  '#60a5fa',
      label:  'Playing…',
    },
    played: {
      bg:     'rgba(16,185,129,0.08)',
      border: '1px solid rgba(16,185,129,0.30)',
      color:  '#34d399',
      label:  'Play Again',
    },
  }[audioState];

  return (
    <div
      className="w-full h-full flex flex-col items-stretch justify-center px-5 text-white relative overflow-hidden"
      style={{ background: '#0a0a0d' }}
    >
      <style>{`
        @keyframes wvb {
          0%,100% { transform: scaleY(0.35); }
          50%      { transform: scaleY(1); }
        }
      `}</style>

      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />

      {/* Meta */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          New Word
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Indikator sudah didengar */}
          {audioState === 'played' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 99, padding: '3px 10px',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ color: '#34d399', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
                LISTENED
              </span>
            </div>
          )}
          <p style={{ color: '#3f3f46', fontSize: 11, fontWeight: 700 }}>+10 XP</p>
        </div>
      </div>

      {/* Word card */}
      <div
        className="rounded-2xl px-6 py-7 mb-4"
        style={{
          background: 'linear-gradient(160deg, #13131a 0%, #0f0f14 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <h1 className="font-black leading-none mb-2"
          style={{ fontSize: 'clamp(38px, 12vw, 44px)', color: '#fff', letterSpacing: '-0.03em' }}>
          {data.word}
        </h1>
        <p style={{ color: '#52525b', fontSize: 14, fontFamily: 'monospace', marginBottom: 20 }}>
          {data.phonetic}
        </p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
        <p style={{ color: '#e4e4e7', fontSize: 15, fontWeight: 500, lineHeight: 1.6, marginBottom: 4 }}>
          {data.meaning}
        </p>
        {data.meaningId && (
          <p style={{ color: '#52525b', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
            {data.meaningId}
          </p>
        )}
        <div style={{ borderLeft: '2px solid rgba(59,130,246,0.3)', paddingLeft: 14 }}>
          <p style={{ color: '#3f3f46', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
            Example
          </p>
          <p style={{ color: '#71717a', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>
            "{data.exampleSentence}"
          </p>
        </div>
      </div>

      {/* Audio button */}
      <button
        onClick={playAudio}
        disabled={audioState === 'playing'}
        className="w-full transition-all active:scale-[0.97]"
        style={{
          height: 50, borderRadius: 14,
          background: btnStyle.bg,
          border: btnStyle.border,
          color: btnStyle.color,
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          cursor: audioState === 'playing' ? 'default' : 'pointer',
          transition: 'all 0.25s ease',
        }}>

        {/* Icon berubah sesuai state */}
        {audioState === 'playing' ? (
          // Waveform animasi saat playing
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 18 }}>
            {[0, 0.1, 0.2, 0.1].map((delay, i) => (
              <div key={i} style={{
                width: 3, height: 18, borderRadius: 99,
                background: '#60a5fa',
                animation: 'wvb 0.6s ease-in-out infinite',
                animationDelay: `${delay}s`,
                transformOrigin: 'center',
              }}/>
            ))}
          </div>
        ) : audioState === 'played' ? (
          // Centang saat sudah didengar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          // Play icon saat idle
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <polygon points="5,3 19,12 5,21" fill="currentColor" />
          </svg>
        )}

        {btnStyle.label}
      </button>
    </div>
  );
}