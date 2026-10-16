// src/components/Adventure/PictureSteps.tsx
// Two picture questions of the adventure quiz:
// - "listen_picture": a word is heard (no text) and the learner picks its picture out of four.
// - "tap_picture": one scene, several words in a row; the learner touches each named thing in the picture.
// A word answered wrong goes to "Ulas kata", like the hard words of the speaking cards.
'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { playSound, speakText } from '@/lib/quiz-sound';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useReviewStore } from '@/store/useReviewStore';
import { Picture, SceneArt, SCENES } from './Pictures';

type Answer = (correct: boolean, answer: string) => void;
type ReviewWord = { word: string; meaning: string };

const card = { background: 'linear-gradient(160deg,#13131a,#0f0f14)', borderRadius: 22, padding: '20px', border: '1px solid rgba(255,255,255,0.07)' } as const;
const kicker = (c: string) => ({ color: c, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 } as const);

function remember(lang: string, words: ReviewWord[]) {
  if (words.length) useReviewStore.getState().addWords(lang, words.map((w) => ({ ...w, source: 'stage' as const })), { hard: true });
}

/* ── Dengar, pilih gambar ─────────────────────────────────────────────────── */

export interface ListenPictureData {
  audioText: string;
  question: string;
  /** Picture ids; the shown word of each is `labels[id]`, or the id itself */
  options: string[];
  labels?: Record<string, string>;
  correctAnswer: string;
  explanation?: string;
  review?: ReviewWord;
}

export function ListenPictureStep({ data, color, onAnswer }: { data: ListenPictureData; color: string; onAnswer: Answer }) {
  const lang = useLanguageStore((s) => s.selectedLanguage) ?? 'en';
  const [sel, setSel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const label = (id: string) => data.labels?.[id] ?? id;
  const right = sel === data.correctAnswer;

  const play = (rate?: number) => {
    if (playing) return;
    setPlaying(true); setPlays((n) => n + 1);
    speakText(data.audioText, undefined, () => setPlaying(false), rate);
  };

  const check = () => {
    if (!sel || checked) return;
    setChecked(true);
    playSound(right ? 'correct' : 'wrong');
    if (!right && data.review) remember(lang, [data.review]);
    setTimeout(() => onAnswer(right, label(sel)), 50);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <p style={kicker('#0ea5e9')}>Listen &amp; Pick</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => play()} disabled={playing} style={{ flex: 1, height: 58, borderRadius: 12, background: playing ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.1)', border: `1px solid ${playing ? 'rgba(14,165,233,0.4)' : 'rgba(14,165,233,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: playing ? 'default' : 'pointer', color: '#7dd3fc', fontSize: 13, fontWeight: 700, position: 'relative' }}>
            <Volume2 size={20} color="#0ea5e9" />
            {playing ? 'Playing…' : plays === 0 ? 'Play Audio' : `Play Again (×${plays})`}
            {plays === 0 && <span style={{ position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 4px rgba(239,68,68,0.8)' }} />}
          </button>
          <button onClick={() => play(0.5)} disabled={playing} aria-label="Putar pelan" style={{ width: 74, height: 58, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa', fontSize: 12, fontWeight: 800, cursor: playing ? 'default' : 'pointer' }}>
            Pelan
          </button>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.4 }}>{data.question}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {data.options.map((id) => {
          let border = '1px solid rgba(255,255,255,0.07)', bg = 'rgba(255,255,255,0.03)', op = 1;
          if (!checked) { if (id === sel) { border = `2px solid ${color}`; bg = `${color}14`; } }
          else if (id === data.correctAnswer) { border = '2px solid rgba(16,185,129,0.6)'; bg = 'rgba(16,185,129,0.08)'; }
          else if (id === sel) { border = '2px solid rgba(239,68,68,0.55)'; bg = 'rgba(239,68,68,0.08)'; }
          else op = 0.35;
          return (
            <button key={id} onClick={() => !checked && setSel(id)} disabled={checked} aria-label={checked ? label(id) : 'pilihan gambar'}
              style={{ background: bg, border, opacity: op, borderRadius: 16, padding: 8, cursor: checked ? 'default' : 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: 150, aspectRatio: '1' }}><Picture id={id} /></div>
              {checked && <span style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: id === data.correctAnswer ? '#6ee7b7' : '#a1a1aa' }}>{label(id)}</span>}
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
            <p style={{ color: '#fff', fontSize: 13, lineHeight: 1.6 }}>
              Yang diucapkan: <b style={{ color: '#6ee7b7' }}>&quot;{data.audioText}&quot;</b>{data.explanation ? ` ${data.explanation}` : ''}
              {!right && data.review && <span style={{ color: '#a1a1aa' }}> Kata ini masuk Ulas kata.</span>}
            </p>
          </div>
        </div>
      )}
      {!checked && (
        <button onClick={check} disabled={!sel} style={{ width: '100%', height: 48, borderRadius: 12, background: sel ? `${color}1a` : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? `${color}44` : 'rgba(255,255,255,0.05)'}`, color: sel ? color : '#3f3f46', fontSize: 13, fontWeight: 700, cursor: sel ? 'pointer' : 'default', transition: 'all 0.2s' }}>Check Answer</button>
      )}
    </div>
  );
}

/* ── Sentuh di gambar ─────────────────────────────────────────────────────── */

export interface TapPictureData {
  scene: string;
  instruction: string;
  /** In the order they are asked; `key` is the object of the scene */
  targets: { key: string; word: string; meaning: string }[];
  /** Said after each word, e.g. "balloon" for colours: "the red balloon" */
  noun?: string;
  explanation?: string;
}

/** Wrong touches allowed for the whole picture while still counting it right */
const TAP_SLIPS = 1;
/** Smallest touch area, in scene units (about a fingertip on a phone); small things get a larger area around them */
const MIN_HIT = 40;

function hitBox(o: { x: number; y: number; w: number; h: number }) {
  const w = Math.max(o.w, MIN_HIT), h = Math.max(o.h, MIN_HIT);
  return { x: o.x - (w - o.w) / 2, y: o.y - (h - o.h) / 2, w, h };
}

export function TapPictureStep({ data, color, onAnswer }: { data: TapPictureData; color: string; onAnswer: Answer }) {
  const lang = useLanguageStore((s) => s.selectedLanguage) ?? 'en';
  const scene = SCENES[data.scene];
  const [step, setStep] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]); // words with at least one wrong touch
  const [slips, setSlips] = useState(0);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [tries, setTries] = useState(0); // wrong touches on the current word: after two the answer is shown
  const done = step >= data.targets.length;
  const target = data.targets[step];

  const phrase = (word: string) => `the ${word}${data.noun ? ` ${data.noun}` : ''}`;
  const say = (word: string) => speakText(phrase(word));

  const tap = (key: string) => {
    if (done || !target || found.includes(key)) return;
    if (key === target.key) {
      const nextStep = step + 1;
      setFound((f) => [...f, key]); setStep(nextStep); setTries(0); setWrongKey(null);
      if (nextStep < data.targets.length) {
        playSound('correct');
        // The next word is said right away, in the same touch
        setTimeout(() => say(data.targets[nextStep].word), 450);
      } else {
        const right = slips <= TAP_SLIPS;
        playSound(right ? 'correct' : 'wrong');
        remember(lang, data.targets.filter((t) => missed.includes(t.key)).map((t) => ({ word: t.word, meaning: t.meaning })));
        const answer = `${data.targets.length} ditemukan, ${slips} kali salah sentuh`;
        setTimeout(() => onAnswer(right, answer), 50);
      }
    } else {
      setSlips((n) => n + 1); setTries((n) => n + 1); setWrongKey(key);
      if (!missed.includes(target.key)) setMissed((m) => [...m, target.key]);
      playSound('wrong');
      setTimeout(() => setWrongKey((k) => (k === key ? null : k)), 600);
    }
  };

  if (!scene) return null;
  const right = slips <= TAP_SLIPS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes tapHint{0%,100%{box-shadow:0 0 0 3px rgba(250,204,21,.9)}50%{box-shadow:0 0 0 3px rgba(250,204,21,.2)}}`}</style>
      <div style={card}>
        <p style={kicker('#a78bfa')}>Tap the Picture</p>
        <p style={{ color: '#71717a', fontSize: 12, marginBottom: 8 }}>{data.instruction}</p>
        {done ? (
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Semua ketemu!</h2>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', flex: 1 }}>
              Sentuh: <span style={{ color: '#c4b5fd' }}>{phrase(target.word)}</span>
            </h2>
            <button onClick={() => say(target.word)} aria-label="Dengarkan" style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Volume2 size={18} color="#a78bfa" />
            </button>
          </div>
        )}
        <p style={{ color: '#52525b', fontSize: 11, fontWeight: 700, marginTop: 6 }}>{Math.min(step + (done ? 0 : 1), data.targets.length)} / {data.targets.length}</p>
      </div>

      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        <SceneArt scene={scene} />
        {/* The touch areas: the objects' own boxes, the last ones (small things on the table) on top */}
        {scene.objects.map((o) => {
          const isFound = found.includes(o.key);
          const hint = !done && tries >= 2 && o.key === target?.key;
          const b = hitBox(o);
          return (
            <button key={o.key} onClick={() => tap(o.key)} aria-label={isFound || done ? o.key : 'bagian gambar'}
              style={{
                position: 'absolute', left: `${(b.x / scene.width) * 100}%`, top: `${(b.y / scene.height) * 100}%`,
                width: `${(b.w / scene.width) * 100}%`, height: `${(b.h / scene.height) * 100}%`,
                background: 'transparent', border: 'none', borderRadius: 12, padding: 0, cursor: done ? 'default' : 'pointer',
                boxShadow: isFound ? '0 0 0 3px #10b981, 0 0 16px rgba(16,185,129,.55)' : wrongKey === o.key ? '0 0 0 3px #ef4444' : 'none',
                animation: hint ? 'tapHint 1s ease-in-out infinite' : undefined, transition: 'box-shadow 0.15s',
              }}
            />
          );
        })}
      </div>

      {found.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.targets.filter((t) => found.includes(t.key)).map((t) => (
            <span key={t.key} style={{ fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 99, background: missed.includes(t.key) ? 'rgba(250,204,21,0.08)' : `${color}14`, border: `1px solid ${missed.includes(t.key) ? 'rgba(250,204,21,0.3)' : `${color}35`}`, color: missed.includes(t.key) ? '#fde68a' : '#d4d4d8' }}>
              {t.word} = {t.meaning}
            </span>
          ))}
        </div>
      )}

      {done && (
        <div style={{ borderTop: `1px solid ${right ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, paddingTop: 12, animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {right ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
            <p style={{ color: right ? '#34d399' : '#f87171', fontSize: 14, fontWeight: 800 }}>{right ? (slips === 0 ? 'Perfect!' : 'Correct') : 'Coba lagi nanti'}</p>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.6 }}>
            {slips === 0 ? 'Semua benar tanpa salah sentuh.' : `${slips} kali salah sentuh.`}
            {missed.length > 0 && ' Kata yang tadi keliru (kuning) masuk Ulas kata.'}
            {data.explanation ? ` ${data.explanation}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
