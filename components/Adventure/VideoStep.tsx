// src/components/Adventure/VideoStep.tsx
// "video_quiz": a short role-play of Lingo and a friend (made with Remotion and Lingo's voice, see the my-video
// project), then a question about it. No subtitles while watching: it is a listening question. Slow and replay
// help instead, and the whole conversation (with its translation) is shown once it is answered.
'use client';
import { useRef, useState } from 'react';
import { CheckCircle2, XCircle, Play, RotateCcw } from 'lucide-react';
import { playSound, stopSpeech } from '@/lib/quiz-sound';

type Answer = (correct: boolean, answer: string) => void;

export interface VideoQuizData {
  video: string;
  poster?: string;
  /** The conversation, shown after answering (start/end in seconds of the video) */
  lines: { who: string; en: string; id: string; start: number; end: number }[];
  question: string;
  options: string[];
  correctAnswer: string;
  explanations?: Record<string, string>;
}

const chip = (on: boolean, c = '#facc15') => ({
  fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 99, cursor: 'pointer',
  background: on ? `${c}1f` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? `${c}59` : 'rgba(255,255,255,0.08)'}`,
  color: on ? c : '#a1a1aa', display: 'inline-flex', alignItems: 'center', gap: 5,
} as const);

export function VideoStep({ data, color, onAnswer }: { data: VideoQuizData; color: string; onAnswer: Answer }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watched, setWatched] = useState(0);
  const [slow, setSlow] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const right = sel === data.correctAnswer;

  const play = () => {
    const v = video.current;
    if (!v) return;
    if (!v.paused) { v.pause(); return; }
    stopSpeech();
    if (v.ended) v.currentTime = 0;
    v.playbackRate = slow ? 0.75 : 1;
    void v.play().catch(() => setPlaying(false));
  };
  const replay = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    v.playbackRate = slow ? 0.75 : 1;
    void v.play().catch(() => setPlaying(false));
  };
  const toggleSlow = () => {
    const next = !slow;
    setSlow(next);
    if (video.current) video.current.playbackRate = next ? 0.75 : 1;
  };

  const check = () => {
    if (!sel || checked) return;
    setChecked(true);
    playSound(right ? 'correct' : 'wrong');
    video.current?.pause();
    setTimeout(() => onAnswer(right, sel), 50);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ color: '#facc15', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Video</p>

        <div onClick={play} role="button" aria-label={playing ? 'Jeda video' : 'Putar video'}
          style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '16 / 10', cursor: 'pointer' }}>
          <video ref={video} src={data.video} poster={data.poster} playsInline preload="metadata"
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); setWatched((n) => n + 1); }}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />

          {!playing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.28)' }}>
              <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}>
                <Play size={26} color="#111" fill="#111" style={{ marginLeft: 3 }} />
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: `${duration ? Math.min(100, (time / duration) * 100) : 0}%`, background: '#facc15', transition: 'width 0.25s linear' }} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          <button onClick={toggleSlow} style={chip(slow, '#7dd3fc')}>Pelan</button>
          <button onClick={replay} style={chip(false)}><RotateCcw size={12} /> Ulangi</button>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.4, marginTop: 14 }}>{data.question}</h2>
        {watched === 0 && !playing && <p style={{ color: '#52525b', fontSize: 12, marginTop: 4 }}>Tonton dan dengarkan dulu, lalu jawab.</p>}
        {watched > 0 && !checked && !playing && (
          <p style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>Belum yakin? Putar lagi, atau coba <b style={{ color: '#7dd3fc' }}>Pelan</b>.</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.03)', border = '1px solid rgba(255,255,255,0.07)', c = '#d4d4d8', op = 1;
          if (!checked) { if (opt === sel) { bg = `${color}18`; border = `1px solid ${color}`; c = '#fff'; } }
          else if (opt === data.correctAnswer) { bg = 'rgba(16,185,129,0.08)'; border = '1px solid rgba(16,185,129,0.35)'; c = '#6ee7b7'; }
          else if (opt === sel) { bg = 'rgba(239,68,68,0.08)'; border = '1px solid rgba(239,68,68,0.35)'; c = '#fca5a5'; }
          else op = 0.3;
          return (
            <button key={opt} onClick={() => !checked && setSel(opt)} disabled={checked}
              style={{ background: bg, border, color: c, opacity: op, borderRadius: 12, padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 500, display: 'flex', gap: 12, cursor: checked ? 'default' : 'pointer', transition: 'all 0.15s' }}>
              <span style={{ color: opt === sel && !checked ? color : '#3f3f46', fontWeight: 800, fontSize: 11, marginTop: 2 }}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {checked && (
        <div style={{ borderTop: `1px solid ${right ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, paddingTop: 12, animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {right ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
            <p style={{ color: right ? '#34d399' : '#f87171', fontSize: 14, fontWeight: 800 }}>{right ? 'Correct' : 'Incorrect'}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 12, border: `1px solid ${right ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{data.explanations?.[sel!] ?? ''}</p>
            {/* The whole conversation, to read again */}
            {data.lines.map((l, i) => (
              <p key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: '#a1a1aa', margin: '0 0 4px' }}>
                <b style={{ color: l.who === 'Lingo' ? '#a3e635' : '#7dd3fc' }}>{l.who}:</b> <span style={{ color: '#e4e4e7' }}>{l.en}</span> <span style={{ color: '#71717a' }}>({l.id})</span>
              </p>
            ))}
          </div>
        </div>
      )}
      {!checked && (
        <button onClick={check} disabled={!sel} style={{ width: '100%', height: 48, borderRadius: 12, background: sel ? `${color}1a` : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? `${color}44` : 'rgba(255,255,255,0.05)'}`, color: sel ? color : '#3f3f46', fontSize: 13, fontWeight: 700, cursor: sel ? 'pointer' : 'default', transition: 'all 0.2s' }}>Check Answer</button>
      )}
    </div>
  );
}
