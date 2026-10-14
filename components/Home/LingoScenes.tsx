'use client';

// src/components/Home/LingoScenes.tsx
// Small animated pictures of Lingo for the home cards: Lingo talking, holding speaking cards, serving at a
// cafe, holding a trophy, showing a medal and waving a flag. The mascot has no arms, so the props get
// little paws drawn on top of them.

import { useEffect, useState } from 'react';
import LingoAvatar from '@/components/lingo/LingoAvatar';

const INK = '#103B44';

const KEYFRAMES = `
@keyframes lgs-pop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes lgs-wave { 0%, 100% { opacity: 0.15 } 50% { opacity: 1 } }
@keyframes lgs-lift { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes lgs-steam { 0% { transform: translateY(4px); opacity: 0 } 40% { opacity: 0.8 } 100% { transform: translateY(-9px); opacity: 0 } }
@keyframes lgs-twinkle { 0%, 100% { transform: scale(0.4); opacity: 0.2 } 50% { transform: scale(1); opacity: 1 } }
@keyframes lgs-flag { 0%, 100% { transform: skewY(0deg) scaleX(1) } 50% { transform: skewY(-7deg) scaleX(0.9) } }
@keyframes lgs-bob { 0%, 100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
@media (prefers-reduced-motion: reduce) { .lgs-anim { animation: none !important } }
`;

/** The keyframes, added to the page once however many scenes are shown */
function SceneStyle() {
  return <style href="lingo-scenes" precedence="default">{KEYFRAMES}</style>;
}

const anim = (name: string, s: number, delay = 0, extra = ''): React.CSSProperties => ({
  animation: `${name} ${s}s ease-in-out ${delay}s infinite ${extra}`.trim(),
});

/** One of Lingo's little paws, holding whatever is under it */
function Paw({ x, y, w = 15, rot = 0 }: { x: number; y: number; w?: number; rot?: number }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: w * 0.82, borderRadius: '50%', transform: `rotate(${rot}deg)`,
      background: 'radial-gradient(circle at 35% 30%, #E4F9C9, #B9E792 60%, #9BD46A)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.35), inset 0 -1px 2px rgba(60,110,20,0.35)',
    }} />
  );
}

function Sparkle({ x, y, size = 10, color = '#fde047', delay = 0 }: { x: number; y: number; size?: number; color?: string; delay?: number }) {
  return (
    <svg className="lgs-anim" viewBox="0 0 10 10" width={size} height={size} style={{ position: 'absolute', left: x, top: y, ...anim('lgs-twinkle', 1.8, delay) }}>
      <path d="M5 0 Q5.8 4.2 10 5 Q5.8 5.8 5 10 Q4.2 5.8 0 5 Q4.2 4.2 5 0Z" fill={color} />
    </svg>
  );
}

/** A speech bubble with a tail pointing down-left, toward Lingo */
function Bubble({ text, x, y, maxW = 84 }: { text: string; x: number; y: number; maxW?: number }) {
  return (
    <div key={text} className="lgs-anim" style={{
      position: 'absolute', right: x, top: y, maxWidth: maxW, padding: '5px 8px', borderRadius: 11,
      background: '#fff', color: INK, fontSize: 10.5, fontWeight: 800, lineHeight: 1.2, textAlign: 'center',
      fontFamily: 'system-ui,sans-serif', boxShadow: '0 3px 10px rgba(0,0,0,0.35)', transformOrigin: '0% 100%',
      animation: 'lgs-pop 0.35s ease-out both',
    }}>
      {text}
      <span style={{ position: 'absolute', left: 8, bottom: -4, width: 9, height: 9, background: '#fff', transform: 'rotate(45deg)', borderRadius: 2 }} />
    </div>
  );
}

/** Lingo says the lines one after another, moving its mouth while each one is new */
function useLines(lines: string[], every = 2800, talk = 1500) {
  const [i, setI] = useState(0);
  const [speaking, setSpeaking] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let quiet: ReturnType<typeof setTimeout>;
    const start = () => { setSpeaking(true); quiet = setTimeout(() => setSpeaking(false), talk); };
    quiet = setTimeout(() => setSpeaking(false), talk);
    const id = setInterval(() => { setI((n) => (n + 1) % lines.length); start(); }, every);
    return () => { clearInterval(id); clearTimeout(quiet); };
  }, [lines.length, every, talk]);
  return { line: lines[i], speaking };
}

const TALK_LINES = ['Hi! How are you?', "Let's talk!", 'Nice to meet you!'];

/** Lingo chatting, with sound waves and a speech bubble */
export function TalkScene() {
  const { line, speaking } = useLines(TALK_LINES);
  return (
    <div style={{ position: 'relative', width: 140, height: 104, flexShrink: 0 }}>
      <SceneStyle />
      <LingoAvatar size={80} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 2, bottom: 0 }} />
      <svg viewBox="0 0 20 32" width={16} height={26} style={{ position: 'absolute', left: 82, top: 56 }}>
        {[0, 1, 2].map((k) => (
          <path key={k} className="lgs-anim" d={`M${3 + k * 6} ${10 - k * 4} Q${9 + k * 6} 16 ${3 + k * 6} ${22 + k * 4}`}
            stroke="#5cfa2e" strokeWidth="2.6" fill="none" strokeLinecap="round"
            style={speaking ? anim('lgs-wave', 0.9, k * 0.18) : { opacity: 0.15 }} />
        ))}
      </svg>
      <Bubble text={line} x={0} y={4} maxW={78} />
    </div>
  );
}

const CARD_WORDS = ['Hi!', 'Thank you', 'Yes'];

/** Lingo holding up a fan of speaking cards */
export function CardsScene() {
  return (
    <div style={{ position: 'relative', width: 130, height: 104 }}>
      <SceneStyle />
      <LingoAvatar size={84} style={{ position: 'absolute', left: 23, top: 0 }} />
      {[-1, 1, 0].map((k) => (
        <div key={k} style={{ position: 'absolute', left: 65 - 19 + k * 30, bottom: 4, width: 38, height: 50, transformOrigin: '50% 100%', transform: `rotate(${k * 16}deg)` }}>
          <div className={k === 0 ? 'lgs-anim' : undefined} style={{
            width: '100%', height: '100%', borderRadius: 7, background: 'linear-gradient(180deg,#ffffff,#f3e8ff)', border: '2px solid #a78bfa',
            boxShadow: '0 3px 8px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: k === 0 ? 'center' : 'flex-start', paddingTop: k === 0 ? 0 : 8, gap: 4,
            ...(k === 0 ? anim('lgs-lift', 2.4) : {}),
          }}>
            <span style={{ color: '#6d28d9', fontSize: 8.5, fontWeight: 900, fontFamily: 'system-ui,sans-serif', textAlign: 'center', lineHeight: 1.05 }}>{CARD_WORDS[k + 1]}</span>
            <span style={{ width: 18, height: 3, borderRadius: 2, background: '#ddd6fe' }} />
          </div>
        </div>
      ))}
      <Paw x={10} y={80} rot={-30} />
      <Paw x={105} y={80} rot={30} />
    </div>
  );
}

const CAFE_LINES = ['Welcome!', 'What can I get you?', 'One iced tea?'];

/** Lingo the barista behind a counter, with a hot cup and a question for the customer */
export function CafeScene() {
  const { line, speaking } = useLines(CAFE_LINES, 3000, 1400);
  return (
    <div style={{ position: 'relative', width: 140, height: 104, overflow: 'hidden', borderRadius: 12 }}>
      <SceneStyle />
      <LingoAvatar size={82} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 6, top: 14 }} />
      {/* counter */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: 'linear-gradient(180deg,#8a5a3b,#5b3822)', borderTop: '3px solid #b07a52' }} />
      {/* cup with steam */}
      <div style={{ position: 'absolute', left: 74, bottom: 20, width: 26, height: 40 }}>
        {[0, 1].map((k) => (
          <svg key={k} className="lgs-anim" viewBox="0 0 6 14" width={6} height={13} style={{ position: 'absolute', left: 6 + k * 8, top: 0, ...anim('lgs-steam', 1.8, k * 0.7) }}>
            <path d="M3 13 Q0 9.5 3 7 Q6 4.5 3 1" stroke="#e4e4e7" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        ))}
        <svg viewBox="0 0 26 26" width={26} height={26} style={{ position: 'absolute', left: 0, bottom: 0 }}>
          <path d="M3 4 H21 L19 24 Q19 25 18 25 H6 Q5 25 5 24 Z" fill="#fafafa" />
          <rect x="3.6" y="11" width="16.8" height="7" fill="#fb923c" />
          <rect x="1.5" y="1.5" width="21" height="4" rx="2" fill="#e4e4e7" />
        </svg>
      </div>
      <Paw x={66} y={68} w={14} rot={-10} />
      <Bubble text={line} x={2} y={16} maxW={66} />
    </div>
  );
}

/** Lingo holding a gold trophy, with sparkles */
export function TrophyScene({ size = 64 }: { size?: number }) {
  const s = size / 64;
  return (
    <div style={{ position: 'relative', width: 70 * s, height: 64 * s, flexShrink: 0 }}>
      <SceneStyle />
      <LingoAvatar size={54 * s} style={{ position: 'absolute', left: 8 * s, top: 0 }} />
      <svg viewBox="0 0 30 30" width={28 * s} height={28 * s} style={{ position: 'absolute', left: 21 * s, bottom: 0, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
        <path d="M8 3 H22 V11 Q22 18 15 19 Q8 18 8 11 Z" fill="#facc15" />
        <path d="M8 6 H4 Q4 12 9 13 M22 6 H26 Q26 12 21 13" stroke="#eab308" strokeWidth="2.2" fill="none" />
        <rect x="13" y="19" width="4" height="4" fill="#eab308" />
        <rect x="9" y="23" width="12" height="4" rx="1.2" fill="#a16207" />
        <path d="M12 6 Q12 12 15 14" stroke="#fef9c3" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <Paw x={16 * s} y={44 * s} w={11 * s} rot={-15} />
      <Paw x={44 * s} y={44 * s} w={11 * s} rot={15} />
      <Sparkle x={2 * s} y={10 * s} size={9 * s} />
      <Sparkle x={58 * s} y={4 * s} size={11 * s} delay={0.6} />
      <Sparkle x={60 * s} y={36 * s} size={7 * s} delay={1.1} />
    </div>
  );
}

/** Lingo showing off a medal in the achievement's color */
export function MedalScene({ color, size = 64 }: { color: string; size?: number }) {
  const s = size / 64;
  return (
    <div style={{ position: 'relative', width: 70 * s, height: 64 * s, flexShrink: 0 }}>
      <SceneStyle />
      <LingoAvatar size={54 * s} style={{ position: 'absolute', left: 4 * s, top: 0 }} />
      <div className="lgs-anim" style={{ position: 'absolute', left: 36 * s, top: 22 * s, width: 30 * s, height: 42 * s, transformOrigin: '50% 0%', ...anim('lgs-bob', 2.6) }}>
        <svg viewBox="0 0 30 42" width={30 * s} height={42 * s} style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
          <path d="M9 0 L15 16 L21 0" stroke={color} strokeWidth="5" fill="none" />
          <circle cx="15" cy="27" r="12" fill={color} />
          <circle cx="15" cy="27" r="8.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          <path d="M15 21 L16.8 25 L21 25.3 L17.7 28 L18.8 32.2 L15 29.8 L11.2 32.2 L12.3 28 L9 25.3 L13.2 25 Z" fill="#fff" />
        </svg>
      </div>
      <Paw x={33 * s} y={46 * s} w={11 * s} rot={-25} />
      <Sparkle x={0} y={8 * s} size={8 * s} color={color} />
      <Sparkle x={60 * s} y={2 * s} size={10 * s} color="#fde047" delay={0.7} />
    </div>
  );
}

/** Lingo ready to go, waving a flag in the chapter's color */
export function GoScene({ color, size = 64 }: { color: string; size?: number }) {
  const s = size / 64;
  return (
    <div style={{ position: 'relative', width: 70 * s, height: 64 * s, flexShrink: 0 }}>
      <SceneStyle />
      <LingoAvatar size={54 * s} style={{ position: 'absolute', left: 0, top: 8 * s }} />
      <div style={{ position: 'absolute', left: 50 * s, top: 2 * s, width: 2.4 * s, height: 56 * s, borderRadius: 2, background: '#d4d4d8' }} />
      <div className="lgs-anim" style={{
        position: 'absolute', left: 52 * s, top: 3 * s, width: 18 * s, height: 13 * s, background: color, borderRadius: `0 ${3 * s}px ${3 * s}px 0`,
        transformOrigin: '0% 50%', boxShadow: `0 0 8px ${color}80`, ...anim('lgs-flag', 1.2),
      }} />
      <Paw x={44 * s} y={38 * s} w={12 * s} rot={10} />
    </div>
  );
}
