'use client';

// src/components/Home/LingoScenes.tsx
// Small animated pictures of Lingo for the cards: Lingo talking, holding speaking cards, serving at a cafe,
// the six role-play places, holding a trophy, showing a medal and waving a flag. The mascot has no arms,
// so the props get little paws drawn on top of them. The bigger scenes are drawn at 140 x 104 and take a
// `scale`.

import { useEffect, useState } from 'react';
import LingoAvatar from '@/components/lingo/LingoAvatar';

const INK = '#103B44';
const FONT = 'system-ui,sans-serif';

const KEYFRAMES = `
@keyframes lgs-pop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes lgs-wave { 0%, 100% { opacity: 0.15 } 50% { opacity: 1 } }
@keyframes lgs-lift { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes lgs-steam { 0% { transform: translateY(4px); opacity: 0 } 40% { opacity: 0.8 } 100% { transform: translateY(-9px); opacity: 0 } }
@keyframes lgs-twinkle { 0%, 100% { transform: scale(0.4); opacity: 0.2 } 50% { transform: scale(1); opacity: 1 } }
@keyframes lgs-flag { 0%, 100% { transform: skewY(0deg) scaleX(1) } 50% { transform: skewY(-7deg) scaleX(0.9) } }
@keyframes lgs-bob { 0%, 100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
@keyframes lgs-hand { 0%, 100% { transform: rotate(-18deg) } 50% { transform: rotate(22deg) } }
@keyframes lgs-ding { 0%, 70%, 100% { transform: scale(1) } 80% { transform: scale(1.15, 0.88) } 90% { transform: scale(0.95, 1.06) } }
@keyframes lgs-ring { 0%, 70% { opacity: 0 } 80% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgs-fly { 0% { transform: translateX(-40px) translateY(6px) } 100% { transform: translateX(170px) translateY(-6px) } }
@media (prefers-reduced-motion: reduce) { .lgs-anim { animation: none !important } }
`;

/** The keyframes, added to the page once however many scenes are shown */
function SceneStyle() {
  return <style href="lingo-scenes" precedence="default">{KEYFRAMES}</style>;
}

const anim = (name: string, s: number, delay = 0, timing = 'ease-in-out'): React.CSSProperties => ({
  animation: `${name} ${s}s ${timing} ${delay}s infinite`,
});

/** A 140 x 104 drawing area shown at any size */
function Stage({ scale = 1, clip, gray, children }: { scale?: number; clip?: boolean; gray?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: 140 * scale, height: 104 * scale, flexShrink: 0, overflow: clip ? 'hidden' : undefined, borderRadius: clip ? 12 * scale : undefined, filter: gray ? 'grayscale(1) brightness(0.7)' : undefined }}>
      <SceneStyle />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 140, height: 104, transform: `scale(${scale})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  );
}

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
      position: 'absolute', right: x, top: y, maxWidth: maxW, padding: '5px 8px', borderRadius: 11, zIndex: 2,
      background: '#fff', color: INK, fontSize: 10.5, fontWeight: 800, lineHeight: 1.2, textAlign: 'center',
      fontFamily: FONT, boxShadow: '0 3px 10px rgba(0,0,0,0.35)', transformOrigin: '0% 100%',
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

/** The counter of a cafe or a hotel desk */
const Counter = ({ top = '#b07a52', from = '#8a5a3b', to = '#5b3822' }: { top?: string; from?: string; to?: string }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: `linear-gradient(180deg,${from},${to})`, borderTop: `3px solid ${top}` }} />
);

type SceneProps = { scale?: number };

const TALK_LINES = ['Hi! How are you?', "Let's talk!", 'Nice to meet you!'];

/** Lingo chatting, with sound waves and a speech bubble */
export function TalkScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(TALK_LINES);
  return (
    <Stage scale={scale}>
      <LingoAvatar size={80} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 2, bottom: 0 }} />
      <svg viewBox="0 0 20 32" width={16} height={26} style={{ position: 'absolute', left: 82, top: 56 }}>
        {[0, 1, 2].map((k) => (
          <path key={k} className="lgs-anim" d={`M${3 + k * 6} ${10 - k * 4} Q${9 + k * 6} 16 ${3 + k * 6} ${22 + k * 4}`}
            stroke="#5cfa2e" strokeWidth="2.6" fill="none" strokeLinecap="round"
            style={speaking ? anim('lgs-wave', 0.9, k * 0.18) : { opacity: 0.15 }} />
        ))}
      </svg>
      <Bubble text={line} x={0} y={4} maxW={78} />
    </Stage>
  );
}

const CARD_WORDS = ['Hi!', 'Thank you', 'Yes'];

/** Lingo holding up a fan of speaking cards (grey with a padlock while the deck is locked) */
export function CardsScene({ scale, color = '#a78bfa', words = CARD_WORDS, locked }: SceneProps & { color?: string; words?: string[]; locked?: boolean }) {
  return (
    <Stage scale={scale} gray={locked}>
      <LingoAvatar size={84} style={{ position: 'absolute', left: 28, top: 0 }} />
      {[-1, 1, 0].map((k) => (
        <div key={k} style={{ position: 'absolute', left: 70 - 19 + k * 30, bottom: 4, width: 38, height: 50, transformOrigin: '50% 100%', transform: `rotate(${k * 16}deg)` }}>
          <div className={k === 0 && !locked ? 'lgs-anim' : undefined} style={{
            width: '100%', height: '100%', borderRadius: 7, background: '#fff', border: `2px solid ${color}`,
            boxShadow: '0 3px 8px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: k === 0 ? 'center' : 'flex-start', paddingTop: k === 0 ? 0 : 8, gap: 4,
            ...(k === 0 && !locked ? anim('lgs-lift', 2.4) : {}),
          }}>
            <span style={{ color: '#27272a', fontSize: 8.5, fontWeight: 900, fontFamily: FONT, textAlign: 'center', lineHeight: 1.05, padding: '0 2px' }}>{locked ? '?' : words[k + 1]}</span>
            <span style={{ width: 18, height: 3, borderRadius: 2, background: color, opacity: 0.45 }} />
          </div>
        </div>
      ))}
      <Paw x={15} y={80} rot={-30} />
      <Paw x={110} y={80} rot={30} />
      {locked && (
        <svg viewBox="0 0 24 28" width={30} height={35} style={{ position: 'absolute', left: 55, top: 52, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))' }}>
          <path d="M6 12 V8 a6 6 0 0 1 12 0 V12" stroke="#d4d4d8" strokeWidth="3.2" fill="none" />
          <rect x="2" y="11" width="20" height="16" rx="4" fill="#fafafa" />
          <circle cx="12" cy="18" r="2.4" fill="#52525b" />
          <rect x="11" y="19" width="2" height="4.5" rx="1" fill="#52525b" />
        </svg>
      )}
    </Stage>
  );
}

const CAFE_LINES = ['Welcome!', 'What can I get you?', 'One iced tea?'];

/** Lingo the barista behind a counter, with a hot cup and a question for the customer */
export function CafeScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(CAFE_LINES, 3000, 1400);
  return (
    <Stage scale={scale} clip>
      <LingoAvatar outfit="barista" size={82} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 6, top: 14 }} />
      <Counter />
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
    </Stage>
  );
}

/** Lingo meets a new classmate: waving, with a hello in the bubble */
export function MeetScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(["Hi! I'm Sam.", "What's your name?"], 3000, 1400);
  return (
    <Stage scale={scale}>
      <LingoAvatar outfit="student" size={80} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 4, bottom: 2 }} />
      <div className="lgs-anim" style={{ position: 'absolute', left: 80, top: 46, width: 16, height: 14, transformOrigin: '10% 100%', ...anim('lgs-hand', 0.9) }}>
        <Paw x={0} y={0} w={16} />
      </div>
      <svg className="lgs-anim" viewBox="0 0 14 14" width={13} height={13} style={{ position: 'absolute', left: 96, top: 36, ...anim('lgs-wave', 0.9) }}>
        <path d="M2 10 Q6 6 4 1 M8 12 Q12 8 11 3" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
      {/* a little school bag */}
      <svg viewBox="0 0 26 28" width={26} height={28} style={{ position: 'absolute', left: 106, bottom: 2 }}>
        <path d="M8 6 Q13 0 18 6" stroke="#047857" strokeWidth="2.4" fill="none" />
        <rect x="3" y="6" width="20" height="21" rx="5" fill="#10b981" />
        <rect x="7" y="15" width="12" height="8" rx="2.5" fill="#047857" />
      </svg>
      <Bubble text={line} x={0} y={2} maxW={70} />
    </Stage>
  );
}

/** Lingo the shop assistant holding up a T-shirt on a hanger */
export function ShopScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(['Try this one!', 'Nice color, right?'], 3000, 1400);
  return (
    <Stage scale={scale}>
      <LingoAvatar outfit="shop" size={78} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 0, top: 24 }} />
      <div className="lgs-anim" style={{ position: 'absolute', left: 80, top: 40, width: 50, height: 60, transformOrigin: '50% 0%', ...anim('lgs-bob', 2.4) }}>
        <svg viewBox="0 0 50 60" width={50} height={60} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.45))' }}>
          <path d="M25 9 V4 Q25 1 28 1.5" stroke="#d4d4d8" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M25 9 L6 16 M25 9 L44 16" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 14 Q25 20 33 14 L46 21 L41 31 L36 28 V57 H14 V28 L9 31 L4 21 Z" fill="#ec4899" />
          <path d="M17 14 Q25 20 33 14" stroke="#be185d" strokeWidth="2" fill="none" />
          <rect x="14" y="38" width="22" height="4" fill="#f9a8d4" />
        </svg>
      </div>
      <Paw x={74} y={50} w={14} rot={-20} />
      <Bubble text={line} x={0} y={0} maxW={74} />
    </Stage>
  );
}

/** Lingo the helpful local, holding a map next to a signpost */
export function MapScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(['This way!', "It's not far."], 3000, 1300);
  const sign: React.CSSProperties = { position: 'absolute', height: 12, color: '#fff', fontSize: 6.5, fontWeight: 900, fontFamily: FONT, lineHeight: '12px' };
  return (
    <Stage scale={scale}>
      <div style={{ position: 'absolute', left: 117, top: 34, width: 4, height: 70, background: '#a1a1aa', borderRadius: 2 }} />
      <div style={{ ...sign, left: 102, top: 40, width: 36, background: '#3b82f6', clipPath: 'polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)', paddingLeft: 3 }}>STATION</div>
      <div style={{ ...sign, left: 100, top: 56, width: 30, background: '#60a5fa', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 18% 100%, 0 50%)', paddingLeft: 9 }}>PARK</div>
      <LingoAvatar outfit="local" size={76} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 4, top: 16 }} />
      <svg viewBox="0 0 54 36" width={54} height={36} style={{ position: 'absolute', left: 15, top: 64, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.45))' }}>
        <path d="M0 3 L18 0 L36 3 L54 0 V33 L36 36 L18 33 L0 36 Z" fill="#fef3c7" />
        <path d="M18 0 V33 M36 3 V36" stroke="#e7d7a6" strokeWidth="1" />
        <path d="M6 28 Q16 14 26 22 T46 9" stroke="#ef4444" strokeWidth="1.8" fill="none" strokeDasharray="3 2.5" strokeLinecap="round" />
        <path d="M46 4 a4 4 0 0 1 4 4 q0 3 -4 7 q-4 -4 -4 -7 a4 4 0 0 1 4 -4z" fill="#ef4444" />
        <circle cx="46" cy="8" r="1.5" fill="#fff" />
      </svg>
      <Paw x={9} y={74} w={14} rot={-25} />
      <Paw x={61} y={74} w={14} rot={25} />
      <Bubble text={line} x={30} y={0} maxW={64} />
    </Stage>
  );
}

/** Lingo the receptionist with a room key and a desk bell */
export function HotelScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(['Good evening!', "Here's your key!"], 3000, 1400);
  return (
    <Stage scale={scale} clip>
      <LingoAvatar outfit="hotel" size={82} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 4, top: 14 }} />
      <Counter top="#a78bfa" from="#5b3b8f" to="#3b2363" />
      <div style={{ position: 'absolute', left: 102, bottom: 22, width: 28, height: 22 }}>
        <svg className="lgs-anim" viewBox="0 0 28 18" width={28} height={18} style={{ position: 'absolute', bottom: 0, transformOrigin: '50% 100%', ...anim('lgs-ding', 2.4) }}>
          <circle cx="14" cy="3" r="2" fill="#fde047" />
          <path d="M3 15 Q3 4 14 4 Q25 4 25 15 Z" fill="#facc15" />
          <rect x="1" y="15" width="26" height="3" rx="1.5" fill="#a16207" />
        </svg>
        <svg className="lgs-anim" viewBox="0 0 36 12" width={36} height={12} style={{ position: 'absolute', left: -4, top: -10, ...anim('lgs-ring', 2.4) }}>
          <path d="M4 10 L1 4 M18 6 V0 M32 10 L35 4" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <svg viewBox="0 0 30 34" width={28} height={32} style={{ position: 'absolute', left: 70, top: 50, transform: 'rotate(-12deg)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
        <circle cx="10" cy="8" r="6" fill="none" stroke="#facc15" strokeWidth="3" />
        <path d="M10 14 V30 M10 22 H15 M10 27 H14" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
        <rect x="16" y="2" width="13" height="10" rx="2.5" fill="#a855f7" />
        <text x="22.5" y="9.6" textAnchor="middle" fontSize="6" fontWeight="900" fill="#fff" fontFamily={FONT}>101</text>
      </svg>
      <Paw x={64} y={56} w={14} rot={-15} />
      <Bubble text={line} x={2} y={2} maxW={62} />
    </Stage>
  );
}

/** Lingo the check-in staff with a ticket, a suitcase and a plane flying past */
export function AirportScene({ scale }: SceneProps) {
  const { line, speaking } = useLines(['Where to today?', 'Window seat?'], 3000, 1300);
  return (
    <Stage scale={scale} clip>
      <svg className="lgs-anim" viewBox="0 0 24 12" width={22} height={11} style={{ position: 'absolute', left: 0, top: 4, ...anim('lgs-fly', 5, 0, 'linear') }}>
        <path d="M1 7 L20 5 Q24 5 23 7 Q22 8.5 18 8.5 L3 9 Z" fill="#e4e4e7" />
        <path d="M9 7 L14 1 H16 L14 7 Z M9 8 L13 12 H15 L13 8 Z M2 7 L1 3 H3 L5 7 Z" fill="#22d3ee" />
      </svg>
      <LingoAvatar outfit="airline" size={76} state={speaking ? 'speaking' : 'idle'} style={{ position: 'absolute', left: 2, top: 26 }} />
      <svg viewBox="0 0 30 40" width={30} height={40} style={{ position: 'absolute', left: 104, bottom: 2, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
        <path d="M10 8 V3 H20 V8" stroke="#a1a1aa" strokeWidth="2.4" fill="none" />
        <rect x="2" y="8" width="26" height="27" rx="5" fill="#06b6d4" />
        <path d="M10 10 V33 M20 10 V33" stroke="#0e7490" strokeWidth="2" />
        <circle cx="8" cy="37.5" r="2.3" fill="#3f3f46" />
        <circle cx="22" cy="37.5" r="2.3" fill="#3f3f46" />
      </svg>
      <svg viewBox="0 0 36 18" width={34} height={17} style={{ position: 'absolute', left: 64, top: 78, transform: 'rotate(-14deg)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
        <rect x="0" y="0" width="36" height="18" rx="3" fill="#fff" />
        <rect x="26" y="0" width="10" height="18" fill="#22d3ee" />
        <path d="M26 0 V18" stroke="#fff" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="4" y="5" width="16" height="2.5" rx="1" fill="#a1a1aa" />
        <rect x="4" y="10" width="11" height="2.5" rx="1" fill="#d4d4d8" />
      </svg>
      <Paw x={58} y={80} w={14} rot={-20} />
      <Bubble text={line} x={36} y={6} maxW={66} />
    </Stage>
  );
}

/** The scene for each role-play place */
export const SCENARIO_SCENES: Record<string, (p: SceneProps) => React.ReactElement> = {
  kenalan: MeetScene,
  kafe: CafeScene,
  toko: ShopScene,
  arah: MapScene,
  hotel: HotelScene,
  bandara: AirportScene,
};

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
