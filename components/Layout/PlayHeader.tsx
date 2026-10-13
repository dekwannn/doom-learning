'use client';
import Link from 'next/link';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState } from 'react';
import MusicPlayer from '@/components/MusicPlayer';

interface Props {
  onGuide: () => void;
  stageMeta?: {
    chapterTitle: string;
    stageLabel: string;
    color: string;
  };
}

export default function PlayHeader({ onGuide, stageMeta }: Props) {
  const { xp, combo } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const iconBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13, fontWeight: 700, flexShrink: 0, cursor: 'pointer',
  };

  return (
    <div
      className="absolute top-0 left-0 w-full z-50 pointer-events-none"
      style={{
        background: 'linear-gradient(to bottom, rgba(9,9,11,0.96) 0%, transparent 100%)',
        paddingTop: 14, paddingBottom: 22,
        paddingLeft: 16, paddingRight: 16,
      }}
    >
      {/* Row 1: close / xp / combo / music / guide */}
      <div className="flex items-center gap-2">

        {/* close */}
        <Link href="/adventure" className="pointer-events-auto active:scale-90 transition-transform" style={iconBtn}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </Link>

        {/* XP pill */}
        <div className="flex items-center gap-1.5 px-3 rounded-full" style={{
          height: 34,
          background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ color: '#facc15', fontSize: 11, fontWeight: 500 }}>XP</span>
          <span className="font-black text-sm" style={{ color: '#facc15' }}>{xp}</span>
        </div>

        {/* Combo pill */}
        {combo >= 2 && (
          <div className="flex items-center px-3 rounded-full animate-pulse" style={{
            height: 34,
            background: 'rgba(234,88,12,0.18)', border: '1px solid rgba(234,88,12,0.35)',
            backdropFilter: 'blur(12px)', boxShadow: '0 0 10px rgba(234,88,12,0.3)',
          }}>
            <span className="font-black text-sm" style={{ color: '#fb923c' }}>
              ×{combo >= 5 ? '2.0' : '1.5'}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Music player */}
        <div className="pointer-events-auto">
          <MusicPlayer />
        </div>

        {/* ? guide */}
        <button onClick={onGuide} className="pointer-events-auto active:scale-90 transition-transform" style={iconBtn}>
          ?
        </button>
      </div>

      {/* Row 2: stage context — only when stageMeta is provided */}
      {stageMeta && (
        <div className="flex items-center gap-2 mt-2 pl-1">
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: stageMeta.color,
            boxShadow: `0 0 6px ${stageMeta.color}`,
            flexShrink: 0,
          }} />
          <p style={{
            color: '#3f3f46', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em',
          }}>
            <span style={{ color: stageMeta.color + 'cc' }}>{stageMeta.chapterTitle}</span>
            {' · '}
            {stageMeta.stageLabel}
          </p>
        </div>
      )}
    </div>
  );
}