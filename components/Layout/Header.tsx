// Header.tsx
'use client';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState } from 'react';

export default function Header() {
  const { xp, streak, combo } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="absolute top-0 left-0 w-full z-50 px-4 pt-4 pb-2 flex justify-between items-center pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.9) 0%, transparent 100%)' }}>

      <div className="flex gap-2 pointer-events-auto flex-wrap">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}>
          <span className="text-base" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.6))' }}>🔥</span>
          <span className="text-white font-black text-sm">{streak}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}>
          <span className="text-base">⚡</span>
          <span className="font-black text-sm" style={{ color: '#facc15' }}>{xp}</span>
        </div>

        {/* Combo */}
        {combo >= 2 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-pulse"
            style={{
              background: 'rgba(234,88,12,0.2)',
              border: '1px solid rgba(234,88,12,0.5)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 12px rgba(234,88,12,0.4)',
            }}>
            <span className="text-base">🎯</span>
            <span className="text-white font-black text-sm">x{combo >= 5 ? '2.0' : '1.5'}</span>
          </div>
        )}
      </div>

      <div className="pointer-events-auto">
        <button className="w-9 h-9 rounded-full border-2 transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #10b981)',
            borderColor: 'rgba(0,0,0,0.5)',
            boxShadow: '0 0 12px rgba(59,130,246,0.3)',
          }} />
      </div>
    </div>
  );
}