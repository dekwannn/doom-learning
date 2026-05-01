'use client'

import { useEffect, useState } from 'react'
import { Trophy, X, Flame } from 'lucide-react'
import { useRankStore } from '@/store/useRankStore'
import { supabase } from '@/lib/supabase'

// ── Komponen Avatar ──
function Avatar({ name, url, size, color, rank }: { name: string; url: string | null; size: number; color: string; rank?: number }) {
  const initials = name?.slice(0, 2).toUpperCase() ?? '??'
  const borderColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : color
  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      <div style={{ position:'absolute', inset: rank && rank <= 3 ? -2 : 0, borderRadius:'50%', background:'#0c0c16' }}/>
      {url ? (
        <img src={url} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', position:'relative', zIndex:1, border:`2px solid ${borderColor}50` }}/>
      ) : (
        <div style={{ width:size, height:size, borderRadius:'50%', background:`${borderColor}12`, border:`2px solid ${borderColor}40`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
          <span style={{ color:borderColor, fontSize:size*0.33, fontWeight:700 }}>{initials}</span>
        </div>
      )}
    </div>
  )
}

export default function RankUpPopup() {
  const { rankData, hideRankUp } = useRankStore()
  const [entries, setEntries] = useState<any[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (rankData) {
      setLoading(true)
      
      const fetchSurroundingRanks = async () => {
        // 1. Ambil ID kita sendiri
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setMyId(user.id)

        // 2. Ambil data asli dari Leaderboard di sekitar Rank baru kita
        // Ambil 3 orang: (1 orang di atas kita) + (Kita) + (1 orang di bawah kita / yang disalip)
        const startRank = Math.max(1, rankData.newRank - 1)
        const endRank = startRank + 2 

        const table = rankData.languageCode === 'all' ? 'leaderboard_total' : 'leaderboard_by_language'
        let query = supabase.from(table).select('*').gte('rank', startRank).lte('rank', endRank).order('rank', { ascending: true })
        
        if (rankData.languageCode !== 'all') {
          query = query.eq('language_code', rankData.languageCode)
        }

        const { data } = await query
        setEntries(data || [])
        setLoading(false)
      }

      fetchSurroundingRanks()

      // Tutup otomatis setelah 8 detik
      const timer = setTimeout(() => hideRankUp(), 8000)
      return () => clearTimeout(timer)
    }
  }, [rankData, hideRankUp])

  if (!rankData) return null

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Sora', system-ui, sans-serif" }}>
      {/* Background Overlay */}
      <div style={{ position:'absolute', inset:0, background:'rgba(5,5,10,0.9)', backdropFilter:'blur(10px)' }} onClick={hideRankUp}/>

      {/* Pop-up Container */}
      <div style={{
        position:'relative', width:'100%', maxWidth:400,
        background:'linear-gradient(170deg,#0c0c16 0%,#08080f 100%)',
        border:'1px solid rgba(99,102,241,0.3)', borderRadius:28, padding:'36px 24px',
        boxShadow:'0 32px 64px rgba(0,0,0,0.8), 0 0 80px rgba(99,102,241,0.15)',
        overflow:'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', height:'60%', background:'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents:'none' }}/>

        <button onClick={hideRankUp} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'none', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#a1a1aa', cursor:'pointer', zIndex:10 }}>
          <X size={16}/>
        </button>

        {/* ── HEADER ── */}
        <div style={{ textAlign:'center', marginBottom:28, animation:'fadeDown 0.5s ease both' }}>
          <div style={{ width:72, height:72, margin:'0 auto 12px', borderRadius:'50%', background:'rgba(250,204,21,0.1)', border:'2px solid rgba(250,204,21,0.4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 30px rgba(250,204,21,0.2)' }}>
            <Trophy size={36} color="#facc15"/>
          </div>
          <h2 style={{ fontSize:24, fontWeight:900, color:'#f4f4f5', margin:'0 0 4px', letterSpacing:'-0.02em', textTransform:'uppercase' }}>Naik Peringkat!</h2>
          <p style={{ color:'#a1a1aa', fontSize:13, margin:0 }}>Kamu menyalip lawan di <strong style={{ color:'#818cf8' }}>{rankData.category}</strong></p>
        </div>

        {/* ── MINI LEADERBOARD (SWAP ANIMATION) ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, minHeight: 228, position: 'relative' }}>
          {loading ? (
             <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
               <div style={{ width:30, height:30, borderRadius:'50%', border:'2px solid rgba(99,102,241,0.2)', borderTopColor:'#818cf8', animation:'spin 0.8s linear infinite' }}/>
             </div>
          ) : (
            entries.map((entry) => {
              const isMe = entry.id === myId
              const isOvertaken = entry.rank === rankData.newRank + 1 // Orang yang baru saja kita salip
              
              // Tentukan animasi berdasarkan posisinya
              let animationClass = 'fadeIn 0.5s ease 0.6s both'
              let zIndex = 1

              if (isMe) {
                // Kita: Muncul dari bawah menyalip ke atas
                animationClass = 'swapUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both'
                zIndex = 10
              } else if (isOvertaken) {
                // Orang yang disalip: Jatuh dari atas ke bawah
                animationClass = 'swapDown 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both'
                zIndex = 5
              }

              return (
                <div key={entry.id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  background: isMe ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(99,102,241,0.05))' : 'rgba(255,255,255,0.03)',
                  border: isMe ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius:18, padding:'14px 16px',
                  boxShadow: isMe ? '0 8px 32px rgba(99,102,241,0.2)' : 'none',
                  height: 68, boxSizing: 'border-box', 
                  animation: animationClass,
                  position: 'relative',
                  zIndex: zIndex
                }}>
                  {isMe && <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation:'shimmer 2s infinite' }}/>}

                  {/* Rank Number */}
                  <div style={{ width:24, textAlign:'center', flexShrink:0 }}>
                    <span style={{ color: isMe ? '#facc15' : '#71717a', fontSize:16, fontWeight:900 }}>{entry.rank}</span>
                  </div>

                  <Avatar name={entry.username} url={entry.avatar_url} size={40} color={isMe ? '#818cf8' : '#52525b'} rank={entry.rank} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color: isMe ? '#fff' : '#e4e4e7', fontSize:14, fontWeight:800, margin:'0 0 2px', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>
                      {entry.username} {isMe && <span style={{ color:'#818cf8', fontSize:10 }}>(Kamu)</span>}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {entry.streak > 0 && <span style={{ display:'flex', alignItems:'center', gap:2, color:'#f59e0b', fontSize:11, fontWeight:700 }}><Flame size={10} fill="#f59e0b"/> {entry.streak}</span>}
                    </div>
                  </div>

                  {/* XP */}
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <span style={{ color: isMe ? '#a5b4fc' : '#a1a1aa', fontSize:15, fontWeight:900 }}>{entry.total_xp}</span>
                    <span style={{ color:'#52525b', fontSize:10, fontWeight:700, marginLeft:2 }}>XP</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`
        /* Tinggi card = 68px. Gap = 12px. Jarak tempuh swap = 68 + 12 = 80px */
        @keyframes swapUp { 
          0% { transform: translateY(80px); opacity: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.5); } 
          10% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; box-shadow: 0 8px 32px rgba(99,102,241,0.2); } 
        }
        @keyframes swapDown { 
          0% { transform: translateY(-80px); opacity: 0.5; } 
          10% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; } 
        }
        @keyframes fadeDown { 
          from { opacity: 0; transform: translateY(-20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeIn { 
          from { opacity: 0; transform: scale(0.95); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes shimmer { 
          0% { transform: translateX(-150%); } 
          100% { transform: translateX(150%); } 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}