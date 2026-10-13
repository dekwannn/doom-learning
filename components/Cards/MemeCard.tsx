'use client';

export default function MemeCard({ data }: { data: any }) {
  return (
    <div className="w-full h-full flex flex-col justify-center text-white relative overflow-hidden"
      style={{ background: '#09090b' }}>

      {/* Header */}
      <div className="px-5 mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}>
          Istirahat Sejenak
        </span>
      </div>

      {/* Meme image */}
      <div className="relative w-full mx-0"
        style={{ aspectRatio: '1/1', maxHeight: '55vw' }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: `url(${data.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        {/* overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />

        {/* Top text */}
        <div className="absolute top-3 left-0 right-0 flex justify-center px-3 z-10">
          <p className="text-white font-black text-2xl text-center uppercase leading-tight"
            style={{
              fontFamily: 'Impact, "Arial Narrow", Arial, sans-serif',
              textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 12px rgba(0,0,0,0.9)',
              letterSpacing: '0.02em',
            }}>
            {data.topText}
          </p>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center px-3 z-10">
          <p className="text-white font-black text-2xl text-center uppercase leading-tight"
            style={{
              fontFamily: 'Impact, "Arial Narrow", Arial, sans-serif',
              textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 4px 12px rgba(0,0,0,0.9)',
              letterSpacing: '0.02em',
            }}>
            {data.bottomText}
          </p>
        </div>
      </div>

      {/* Translation */}
      <div className="px-5 mt-5">
        <div className="p-4 rounded-2xl"
          style={{
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-wider mb-2">Terjemahan Konteks</p>
          <p className="text-zinc-300 italic text-sm leading-relaxed">{data.translation}</p>
        </div>
      </div>

      <p className="text-center text-zinc-600 mt-6 text-xs animate-pulse">Swipe ke atas untuk lanjut</p>
    </div>
  );
}