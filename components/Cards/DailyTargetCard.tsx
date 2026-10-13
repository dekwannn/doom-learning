'use client';
import { Trophy, Flame } from "lucide-react";

export default function DailyTargetCard({ data }: { data: any }) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-6 text-white relative text-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0a1628 0%, #09090b 65%)' }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />

      {/* Trophy */}
      <div className="text-7xl mb-5 relative z-10"
        style={{ filter: 'drop-shadow(0 0 24px rgba(16,185,129,0.6))' }}>
        <Trophy size={72} color="#34d399" />
      </div>

      <div className="relative z-10 px-4 py-2 rounded-2xl mb-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34d399' }}>
          Target Harian
        </span>
      </div>

      <h2 className="text-3xl font-black mb-3 leading-tight relative z-10"
        style={{ background: 'linear-gradient(135deg, #34d399, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {data.title}
      </h2>

      <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed relative z-10">
        {data.message}
      </p>

      {/* Streak display */}
      <div className="relative z-10 flex items-center gap-4 px-8 py-4 rounded-2xl mb-10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}>
        <Flame size={36} color="#f59e0b" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }} />
        <div className="text-left">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Streak Aktif</p>
          <p className="text-white text-3xl font-black">{data.streakCount} <span className="text-base text-zinc-400 font-bold">Hari</span></p>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3 relative z-10">
        <button className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            boxShadow: '0 0 24px rgba(16,185,129,0.35)',
            color: 'white',
          }}>
          Selesai & Keluar
        </button>
        <button className="w-full py-4 rounded-2xl font-medium text-sm transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a1a1aa',
          }}>
          Lanjut Scroll (Extra XP)
        </button>
      </div>
    </div>
  );
}