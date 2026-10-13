// RewardCard.tsx
'use client';
import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { Star, Sparkles, PartyPopper, Gift } from "lucide-react";

export default function RewardCard({ data, xpReward }: { data: any, xpReward: number }) {
  const [claimed, setClaimed] = useState(false);
  const addXp = useUserStore((state) => state.addXp);

  const handleClaim = () => {
    setClaimed(true);
    addXp(xpReward);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-6 text-white relative text-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1c1000 0%, #09090b 65%)' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(245,158,11,0.15) 0%, transparent 70%)' }} />

      {/* Stars */}
      {claimed && [...Array(8)].map((_, i) => (
        <div key={i} className="absolute text-2xl animate-bounce pointer-events-none"
          style={{
            top: `${15 + Math.random() * 60}%`,
            left: `${5 + Math.random() * 90}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${0.8 + Math.random() * 0.6}s`,
            opacity: 0.8,
          }}>
          {i % 2 ? <Star size={22} color="#fbbf24" fill="#fbbf24" /> : <Sparkles size={22} color="#fde68a" />}
        </div>
      ))}

      <div className="text-8xl mb-6 relative z-10"
        style={{
          filter: claimed ? 'drop-shadow(0 0 24px rgba(245,158,11,0.8))' : 'drop-shadow(0 0 12px rgba(245,158,11,0.4))',
          animation: claimed ? 'none' : 'bounce 2s infinite',
          transform: claimed ? 'scale(1.2) rotate(12deg)' : 'scale(1)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
        {claimed ? <PartyPopper size={88} color="#fbbf24" /> : <Gift size={88} color="#fbbf24" />}
      </div>

      <div className="relative z-10 px-4 py-3 rounded-2xl mb-2"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#fbbf24' }}>
          Bonus Reward
        </span>
      </div>

      <h2 className="text-2xl font-black mb-3 mt-4 leading-tight relative z-10 text-white">
        {claimed ? 'Bonus Diklaim!' : data.title}
      </h2>
      <p className="text-zinc-400 text-sm mb-10 max-w-xs mx-auto leading-relaxed relative z-10">
        {claimed ? `Kamu mendapatkan +${xpReward} XP. Lanjutkan perjalananmu!` : data.message}
      </p>

      <button onClick={handleClaim} disabled={claimed}
        className="w-full max-w-xs py-4 rounded-2xl font-black text-base transition-all active:scale-95 relative z-10"
        style={{
          background: claimed ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #d97706, #f59e0b)',
          color: claimed ? '#52525b' : '#000',
          border: claimed ? '1px solid rgba(255,255,255,0.07)' : 'none',
          boxShadow: claimed ? 'none' : '0 0 30px rgba(245,158,11,0.4)',
        }}>
        {claimed ? 'Teruskan Scroll' : `Klaim +${xpReward} XP`}
      </button>
    </div>
  );
}