// src/components/lingo/LingoOutfits.tsx
// What Lingo wears in the role-plays: a hat on the head and something under the mouth (tie, bow tie, scarf,
// name tag). Drawn in the mascot picture's own space (739 x 696), so it moves with Lingo.

export type OutfitId = 'student' | 'barista' | 'shop' | 'local' | 'hotel' | 'airline';

/** The outfit for each role-play place */
export const SCENARIO_OUTFITS: Record<string, OutfitId> = {
  kenalan: 'student',
  kafe: 'barista',
  toko: 'shop',
  arah: 'local',
  hotel: 'hotel',
  bandara: 'airline',
};

const CHIN = { x: 368, y: 540 }; // just under the mouth, between the cheeks

function BowTie({ color, dark, y = CHIN.y }: { color: string; dark: string; y?: number }) {
  const { x } = CHIN;
  return (
    <g>
      <path d={`M ${x} ${y} L ${x - 78} ${y - 40} Q ${x - 92} ${y} ${x - 78} ${y + 40} Z`} fill={color} stroke={dark} strokeWidth="6" strokeLinejoin="round" />
      <path d={`M ${x} ${y} L ${x + 78} ${y - 40} Q ${x + 92} ${y} ${x + 78} ${y + 40} Z`} fill={color} stroke={dark} strokeWidth="6" strokeLinejoin="round" />
      <rect x={x - 20} y={y - 22} width="40" height="44" rx="12" fill={dark} />
    </g>
  );
}

export function LingoOutfit({ id }: { id: OutfitId }) {
  switch (id) {
    // New classmate: a cap and a red school tie
    case 'student':
      return (
        <g>
          <path d="M 168 176 Q 162 18 370 10 Q 578 18 572 176 Z" fill="#10b981" />
          <path d="M 250 60 Q 300 30 370 28" stroke="#6ee7b7" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.7" />
          <circle cx="370" cy="16" r="16" fill="#047857" />
          <circle cx="370" cy="108" r="34" fill="#fff" />
          <text x="370" y="124" textAnchor="middle" fontSize="46" fontWeight="900" fill="#047857" fontFamily="system-ui,sans-serif">L</text>
          <path d="M 120 186 Q 370 128 620 186 Q 600 228 370 214 Q 140 228 120 186 Z" fill="#047857" />
          <path d={`M ${CHIN.x - 26} ${CHIN.y - 30} H ${CHIN.x + 26} L ${CHIN.x + 16} ${CHIN.y + 2} H ${CHIN.x - 16} Z`} fill="#b91c1c" />
          <path d={`M ${CHIN.x - 16} ${CHIN.y + 2} H ${CHIN.x + 16} L ${CHIN.x + 30} ${CHIN.y + 84} L ${CHIN.x} ${CHIN.y + 108} L ${CHIN.x - 30} ${CHIN.y + 84} Z`} fill="#dc2626" />
        </g>
      );
    // Barista: a brown beret and an orange bow tie
    case 'barista':
      return (
        <g>
          <ellipse cx="350" cy="104" rx="250" ry="78" transform="rotate(-8 350 104)" fill="#7c4a2d" />
          <ellipse cx="330" cy="82" rx="170" ry="36" transform="rotate(-8 330 82)" fill="#9a6440" opacity="0.8" />
          <path d="M 330 30 Q 336 4 352 0" stroke="#5b3822" strokeWidth="14" fill="none" strokeLinecap="round" />
          <circle cx="508" cy="150" r="26" fill="#fb923c" />
          <path d="M 500 136 Q 516 150 500 164" stroke="#7c2d12" strokeWidth="5" fill="none" />
          <BowTie color="#fb923c" dark="#c2410c" />
        </g>
      );
    // Shop assistant: a pink headband with a bow and a name tag
    case 'shop':
      return (
        <g>
          <path d="M 120 214 Q 150 50 370 40 Q 590 50 620 214" stroke="#ec4899" strokeWidth="34" fill="none" strokeLinecap="round" />
          <path d="M 510 78 L 600 30 Q 620 80 590 120 Z M 510 78 L 600 140 Q 560 168 528 130 Z" fill="#f472b6" stroke="#be185d" strokeWidth="6" strokeLinejoin="round" />
          <circle cx="512" cy="80" r="22" fill="#be185d" />
          <g transform={`rotate(-6 ${CHIN.x + 150} ${CHIN.y + 20})`}>
            <rect x={CHIN.x + 84} y={CHIN.y - 18} width="132" height="76" rx="14" fill="#fff" stroke="#f9a8d4" strokeWidth="6" />
            <rect x={CHIN.x + 84} y={CHIN.y - 18} width="132" height="24" rx="10" fill="#ec4899" />
            <text x={CHIN.x + 150} y={CHIN.y + 44} textAnchor="middle" fontSize="30" fontWeight="900" fill="#831843" fontFamily="system-ui,sans-serif">LINGO</text>
          </g>
        </g>
      );
    // Local guide: a blue bucket hat and a red scarf
    case 'local':
      return (
        <g>
          <path d="M 205 160 Q 214 24 370 18 Q 526 24 535 160 Z" fill="#3b82f6" />
          <path d="M 205 140 H 535 V 168 H 205 Z" fill="#1d4ed8" />
          <path d="M 96 186 Q 370 118 644 186 Q 624 232 370 214 Q 116 232 96 186 Z" fill="#2563eb" />
          <path d="M 260 60 Q 310 40 370 38" stroke="#93c5fd" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d={`M ${CHIN.x - 110} ${CHIN.y - 8} Q ${CHIN.x} ${CHIN.y + 40} ${CHIN.x + 110} ${CHIN.y - 8} L ${CHIN.x + 96} ${CHIN.y + 30} Q ${CHIN.x} ${CHIN.y + 76} ${CHIN.x - 96} ${CHIN.y + 30} Z`} fill="#ef4444" />
          <path d={`M ${CHIN.x + 40} ${CHIN.y + 40} L ${CHIN.x + 86} ${CHIN.y + 120} L ${CHIN.x + 16} ${CHIN.y + 96} Z`} fill="#dc2626" />
        </g>
      );
    // Hotel receptionist: a purple bellhop hat with a gold band and a gold bow tie
    case 'hotel':
      return (
        <g transform="rotate(-6 370 120)">
          <path d="M 250 170 L 262 50 Q 370 22 478 50 L 490 170 Q 370 196 250 170 Z" fill="#7c3aed" />
          <ellipse cx="370" cy="50" rx="108" ry="28" fill="#8b5cf6" />
          <path d="M 254 134 Q 370 158 486 134 L 490 170 Q 370 196 250 170 Z" fill="#facc15" />
          <circle cx="370" cy="44" r="16" fill="#facc15" />
          <BowTie color="#facc15" dark="#a16207" />
        </g>
      );
    // Airline staff: a navy cap with gold wings and a cyan neck scarf
    case 'airline':
      return (
        <g>
          <path d="M 196 170 L 150 74 Q 370 2 590 74 L 544 170 Z" fill="#1e3a8a" />
          <path d="M 150 74 Q 370 2 590 74 Q 370 40 150 74 Z" fill="#2c4fa8" />
          <path d="M 196 150 H 544 V 172 H 196 Z" fill="#facc15" opacity="0.9" />
          <path d="M 206 172 Q 370 236 534 172 L 520 160 Q 370 200 220 160 Z" fill="#0f172a" />
          <path d="M 370 96 L 290 80 L 310 100 L 250 98 L 300 116 L 370 112 L 440 116 L 490 98 L 430 100 L 450 80 Z" fill="#facc15" />
          <circle cx="370" cy="104" r="16" fill="#fde047" stroke="#a16207" strokeWidth="4" />
          <path d={`M ${CHIN.x - 100} ${CHIN.y - 6} Q ${CHIN.x} ${CHIN.y + 36} ${CHIN.x + 100} ${CHIN.y - 6} L ${CHIN.x + 86} ${CHIN.y + 26} Q ${CHIN.x} ${CHIN.y + 66} ${CHIN.x - 86} ${CHIN.y + 26} Z`} fill="#22d3ee" />
          <path d={`M ${CHIN.x - 6} ${CHIN.y + 30} L ${CHIN.x - 50} ${CHIN.y + 110} L ${CHIN.x + 4} ${CHIN.y + 92} Z M ${CHIN.x + 6} ${CHIN.y + 30} L ${CHIN.x + 52} ${CHIN.y + 104} L ${CHIN.x + 2} ${CHIN.y + 92} Z`} fill="#06b6d4" />
          <circle cx={CHIN.x} cy={CHIN.y + 32} r="16" fill="#0891b2" />
        </g>
      );
  }
}
