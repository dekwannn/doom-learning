// src/components/Adventure/Pictures.tsx
// The pictures of the picture questions, drawn in the style of the Lingo scenes. Every object is drawn in a 100 x 100
// box standing on its bottom edge, so a scene can place it with x, y, w, h and use the same box as its touch area.
//
// A picture id is an object ("book", "apple"), a colour balloon ("color:red") or a count of apples ("apples:3").

import type { ReactNode } from 'react';

const COLORS: Record<string, [string, string]> = {
  red: ['#ef4444', '#b91c1c'], blue: ['#3b82f6', '#1d4ed8'], green: ['#22c55e', '#15803d'], yellow: ['#facc15', '#ca8a04'],
  white: ['#f8fafc', '#94a3b8'], black: ['#27272a', '#09090b'], orange: ['#fb923c', '#c2410c'], purple: ['#a855f7', '#7e22ce'],
};

const shine = (x: number, y: number, rx: number, ry: number) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity=".3" />;

function Apple() {
  return (
    <g>
      <path d="M50 34 Q 24 20 18 52 Q 18 92 44 92 Q 50 88 56 92 Q 82 92 82 52 Q 76 20 50 34 Z" fill="#ef4444" />
      <path d="M50 34 Q 48 20 56 12" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M54 22 Q 70 10 78 22 Q 64 30 54 22 Z" fill="#22c55e" />
      {shine(33, 52, 6, 12)}
    </g>
  );
}

const OBJECTS: Record<string, () => ReactNode> = {
  apple: Apple,
  book: () => (
    <g>
      <path d="M18 30 L 70 22 L 78 88 L 26 96 Z" fill="#f8fafc" />
      <path d="M14 28 L 66 20 L 74 86 L 22 94 Z" fill="#dc2626" />
      <path d="M14 28 L 22 94 L 28 93 L 20 27 Z" fill="#991b1b" />
      <rect x="34" y="38" width="28" height="8" rx="2" transform="rotate(-8 48 42)" fill="#fecaca" />
      <rect x="36" y="52" width="20" height="4" rx="2" transform="rotate(-8 46 54)" fill="#fecaca" opacity=".7" />
    </g>
  ),
  table: () => (
    <g>
      <rect x="4" y="20" width="92" height="12" rx="4" fill="#b45309" />
      <rect x="4" y="20" width="92" height="4" rx="2" fill="#d97706" />
      <rect x="12" y="32" width="9" height="64" rx="2" fill="#92400e" />
      <rect x="79" y="32" width="9" height="64" rx="2" fill="#92400e" />
      <rect x="21" y="38" width="58" height="5" fill="#92400e" opacity=".6" />
    </g>
  ),
  chair: () => (
    <g>
      <rect x="22" y="6" width="12" height="62" rx="5" fill="#0f766e" />
      <rect x="22" y="10" width="44" height="30" rx="8" fill="#14b8a6" />
      <rect x="18" y="56" width="62" height="12" rx="5" fill="#0d9488" />
      <rect x="24" y="68" width="8" height="28" rx="2" fill="#115e59" />
      <rect x="68" y="68" width="8" height="28" rx="2" fill="#115e59" />
    </g>
  ),
  pen: () => (
    <g transform="rotate(-40 50 54)">
      <rect x="18" y="46" width="62" height="14" rx="6" fill="#2563eb" />
      <rect x="18" y="46" width="62" height="5" rx="3" fill="#60a5fa" />
      <path d="M80 46 L 94 53 L 80 60 Z" fill="#fde68a" />
      <path d="M90 51 L 94 53 L 90 55 Z" fill="#1e293b" />
      <rect x="28" y="40" width="22" height="5" rx="2" fill="#1e3a8a" />
    </g>
  ),
  phone: () => (
    <g>
      <rect x="28" y="6" width="44" height="88" rx="10" fill="#18181b" />
      <rect x="32" y="14" width="36" height="66" rx="4" fill="#38bdf8" />
      <rect x="36" y="20" width="12" height="12" rx="3" fill="#fff" opacity=".85" />
      <rect x="52" y="20" width="12" height="12" rx="3" fill="#facc15" />
      <rect x="36" y="36" width="12" height="12" rx="3" fill="#22c55e" />
      <rect x="52" y="36" width="12" height="12" rx="3" fill="#f472b6" />
      <circle cx="50" cy="87" r="3.5" fill="#3f3f46" />
    </g>
  ),
  bag: () => (
    <g>
      <path d="M36 20 Q 36 6 50 6 Q 64 6 64 20" stroke="#9a3412" strokeWidth="6" fill="none" />
      <rect x="18" y="18" width="64" height="78" rx="18" fill="#f97316" />
      <rect x="28" y="54" width="44" height="30" rx="8" fill="#ea580c" />
      <rect x="44" y="60" width="12" height="5" rx="2" fill="#fed7aa" />
      {shine(30, 34, 5, 10)}
    </g>
  ),
  window: () => (
    <g>
      <rect x="6" y="8" width="88" height="84" rx="6" fill="#0c4a6e" stroke="#cbd5e1" strokeWidth="6" />
      <circle cx="70" cy="30" r="10" fill="#fde68a" />
      <path d="M16 70 Q 30 58 44 70 Q 58 60 84 72 V 86 H 16 Z" fill="#0f766e" opacity=".8" />
      <path d="M50 8 V 92 M 6 50 H 94" stroke="#cbd5e1" strokeWidth="5" />
    </g>
  ),
  door: () => (
    <g>
      <rect x="18" y="2" width="64" height="96" rx="4" fill="#92400e" />
      <rect x="26" y="10" width="48" height="36" rx="3" fill="#b45309" />
      <rect x="26" y="54" width="48" height="38" rx="3" fill="#b45309" />
      <circle cx="70" cy="52" r="4.5" fill="#facc15" />
    </g>
  ),
  rice: () => (
    <g>
      <path d="M14 52 Q 50 22 86 52 Z" fill="#f8fafc" />
      <circle cx="34" cy="44" r="3" fill="#e2e8f0" /><circle cx="52" cy="38" r="3" fill="#e2e8f0" /><circle cx="64" cy="46" r="3" fill="#e2e8f0" />
      <path d="M10 52 H 90 Q 88 84 50 88 Q 12 84 10 52 Z" fill="#3b82f6" />
      <path d="M22 62 H 78" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
      <rect x="36" y="88" width="28" height="7" rx="3" fill="#1d4ed8" />
    </g>
  ),
  bread: () => (
    <g>
      <path d="M10 50 Q 10 22 50 22 Q 90 22 90 50 Q 90 60 82 60 L 82 92 H 18 L 18 60 Q 10 60 10 50 Z" fill="#d97706" />
      <path d="M18 60 L 18 92 H 82 L 82 60 Q 70 62 50 62 Q 30 62 18 60 Z" fill="#fde68a" />
      <path d="M30 36 Q 36 30 42 36 M 46 32 Q 52 26 58 32 M 62 36 Q 68 30 74 36" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  milk: () => (
    <g>
      <path d="M32 16 H 68 V 28 L 76 42 V 94 H 24 V 42 L 32 28 Z" fill="#f8fafc" />
      <path d="M24 54 H 76 V 76 H 24 Z" fill="#3b82f6" />
      <path d="M50 57 Q 42 66 42 70 Q 42 75 50 75 Q 58 75 58 70 Q 58 66 50 57 Z" fill="#fff" />
      <rect x="32" y="10" width="36" height="9" rx="2" fill="#60a5fa" />
    </g>
  ),
  coffee: () => (
    <g>
      <path d="M38 30 Q 32 20 40 12 M 52 30 Q 46 20 54 12" stroke="#cbd5e1" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M16 36 H 74 L 68 84 Q 66 92 58 92 H 32 Q 24 92 22 84 Z" fill="#f8fafc" />
      <path d="M74 46 Q 92 48 88 64 Q 84 76 70 72" stroke="#f8fafc" strokeWidth="7" fill="none" />
      <ellipse cx="45" cy="38" rx="27" ry="6" fill="#78350f" />
      <rect x="22" y="56" width="46" height="8" fill="#a16207" opacity=".7" />
    </g>
  ),
  water: () => (
    <g>
      <path d="M24 10 H 76 L 70 92 H 30 Z" fill="#e0f2fe" opacity=".35" stroke="#bae6fd" strokeWidth="3" />
      <path d="M27 36 H 73 L 70 90 H 30 Z" fill="#38bdf8" opacity=".85" />
      <path d="M36 44 V 80" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".5" />
      <circle cx="58" cy="60" r="3" fill="#fff" opacity=".6" /><circle cx="52" cy="74" r="2" fill="#fff" opacity=".6" />
    </g>
  ),
  banana: () => (
    <g>
      <path d="M16 30 Q 30 88 86 74 Q 90 66 84 64 Q 40 68 30 26 Z" fill="#facc15" />
      <path d="M22 32 Q 36 74 82 70" stroke="#ca8a04" strokeWidth="3" fill="none" />
      <rect x="14" y="22" width="12" height="10" rx="3" fill="#78350f" />
    </g>
  ),
};

function Balloon({ color }: { color: string }) {
  const [fill, dark] = COLORS[color] ?? COLORS.red;
  return (
    <g>
      <path d="M50 72 Q 44 84 52 92 Q 58 98 50 100" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <ellipse cx="50" cy="38" rx="28" ry="34" fill={fill} stroke={dark} strokeWidth="3" />
      <path d="M45 71 L 55 71 L 50 77 Z" fill={dark} />
      {shine(38, 26, 6, 11)}
    </g>
  );
}

/** Up to 10 apples in rows */
function Apples({ n }: { n: number }) {
  const count = Math.max(1, Math.min(10, n));
  const cols = count <= 3 ? count : count <= 4 ? 2 : count <= 6 ? 3 : count <= 8 ? 4 : 5;
  const rows = Math.ceil(count / cols);
  const cell = Math.min(100 / cols, 100 / rows);
  const ox = (100 - cols * cell) / 2, oy = (100 - rows * cell) / 2;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} x={ox + (i % cols) * cell} y={oy + Math.floor(i / cols) * cell} width={cell} height={cell} viewBox="-6 -6 112 112">
          <Apple />
        </svg>
      ))}
    </g>
  );
}

/** The drawing of a picture id, inside a 100 x 100 box */
export function PictureArt({ id }: { id: string }) {
  const [kind, arg] = id.split(':');
  if (kind === 'color') return <Balloon color={arg} />;
  if (kind === 'apples') return <Apples n={Number(arg)} />;
  const Obj = OBJECTS[kind];
  return Obj ? <>{Obj()}</> : <text x="50" y="56" textAnchor="middle" fontSize="14" fill="#a1a1aa">{id}</text>;
}

export const hasPicture = (id: string) => {
  const [kind, arg] = id.split(':');
  return kind === 'color' ? arg in COLORS : kind === 'apples' ? Number(arg) > 0 : kind in OBJECTS;
};

/** One picture on its own, e.g. above a question or in an answer tile */
export function Picture({ id, size = '100%', background = true }: { id: string; size?: number | string; background?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="gambar" style={{ display: 'block', ...(background ? { background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.07), transparent 70%)' } : {}) }}>
      <g transform="translate(8 8) scale(0.84)"><PictureArt id={id} /></g>
    </svg>
  );
}

/* ── Scenes for "sentuh di gambar" ─────────────────────────────────────────── */

export type SceneObject = { key: string; picture: string; x: number; y: number; w: number; h: number };
export type SceneDef = { width: number; height: number; background: ReactNode; objects: SceneObject[] };

const balloonRow = (colors: string[], y: number, offset: number): SceneObject[] =>
  colors.map((c, i) => ({ key: c, picture: `color:${c}`, x: offset + i * 74, y: y + (i % 2 ? 14 : 0), w: 64, h: 86 }));

export const SCENES: Record<string, SceneDef> = {
  // A study room: window, door, chair, bag, a table with a book, a phone and a pen
  room: {
    width: 320, height: 240,
    background: (
      <g>
        <rect width="320" height="240" fill="#1e293b" />
        <rect y="176" width="320" height="64" fill="#334155" />
        <rect y="172" width="320" height="6" fill="#475569" />
        <rect x="120" y="14" width="60" height="6" rx="3" fill="#475569" />
      </g>
    ),
    objects: [
      { key: 'window', picture: 'window', x: 16, y: 18, w: 82, h: 74 },
      { key: 'door', picture: 'door', x: 240, y: 36, w: 74, h: 184 },
      { key: 'chair', picture: 'chair', x: 4, y: 116, w: 72, h: 100 },
      { key: 'table', picture: 'table', x: 112, y: 132, w: 126, h: 92 },
      { key: 'bag', picture: 'bag', x: 70, y: 168, w: 44, h: 52 },
      { key: 'book', picture: 'book', x: 120, y: 114, w: 40, h: 40 },
      { key: 'phone', picture: 'phone', x: 166, y: 124, w: 26, h: 30 },
      { key: 'pen', picture: 'pen', x: 196, y: 126, w: 32, h: 28 },
    ],
  },
  // A kitchen: a shelf with milk and water, a table with rice, bread, coffee and an apple
  kitchen: {
    width: 320, height: 240,
    background: (
      <g>
        <rect width="320" height="240" fill="#3f2a1e" />
        <rect y="0" width="320" height="150" fill="#5b3a29" />
        <rect x="20" y="96" width="180" height="8" rx="3" fill="#a16207" />
        <rect x="236" y="20" width="64" height="56" rx="6" fill="#0c4a6e" stroke="#d6d3d1" strokeWidth="4" />
        <path d="M268 20 V 76" stroke="#d6d3d1" strokeWidth="3" />
        <rect x="0" y="184" width="320" height="10" fill="#a16207" />
        <rect x="0" y="194" width="320" height="46" fill="#7c4a2d" />
      </g>
    ),
    objects: [
      { key: 'milk', picture: 'milk', x: 40, y: 34, w: 60, h: 64 },
      { key: 'water', picture: 'water', x: 120, y: 40, w: 54, h: 58 },
      { key: 'rice', picture: 'rice', x: 12, y: 126, w: 70, h: 62 },
      { key: 'bread', picture: 'bread', x: 88, y: 124, w: 68, h: 62 },
      { key: 'coffee', picture: 'coffee', x: 164, y: 126, w: 62, h: 60 },
      { key: 'apple', picture: 'apple', x: 238, y: 132, w: 56, h: 54 },
    ],
  },
  // Eight balloons in the sky, one of each colour
  balloons: {
    width: 320, height: 240,
    background: (
      <g>
        <rect width="320" height="240" fill="#0c4a6e" />
        <circle cx="282" cy="210" r="60" fill="#0e7490" opacity=".5" />
        <ellipse cx="60" cy="30" rx="34" ry="10" fill="#e0f2fe" opacity=".15" />
      </g>
    ),
    objects: [...balloonRow(['red', 'blue', 'green', 'yellow'], 16, 14), ...balloonRow(['white', 'black', 'orange', 'purple'], 122, 14)],
  },
};

/** A scene as an SVG; the objects are drawn from back to front in their list order, each stretched to fill its box
 *  (so a door is tall and a table wide), which is also its touch area */
export function SceneArt({ scene }: { scene: SceneDef }) {
  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} width="100%" style={{ display: 'block' }} role="img" aria-label="gambar">
      {scene.background}
      {scene.objects.map((o) => (
        <svg key={o.key} x={o.x} y={o.y} width={o.w} height={o.h} viewBox="0 0 100 100" preserveAspectRatio="none">
          <PictureArt id={o.picture} />
        </svg>
      ))}
    </svg>
  );
}
