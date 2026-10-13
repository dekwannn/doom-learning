'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { ChevronLeft, Flame, Globe, Crown, Zap } from 'lucide-react'
import Link from 'next/link'

type LangFilter = 'all' | 'en' | 'ja' | 'zh' | 'ko'

interface Entry {
  id:               string
  username:         string
  avatar_url:       string | null
  streak:           number
  total_xp:         number
  stages_completed: number
  rank:             number
}

const LANGS: { code: LangFilter; label: string; flag: string }[] = [
  { code:'all', label:'Semua',   flag:'' },
  { code:'en',  label:'English', flag:'EN' },
  { code:'ja',  label:'日本語',   flag:'JA' },
  { code:'zh',  label:'中文',     flag:'ZH' },
  { code:'ko',  label:'한국어',   flag:'KO' },
]

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet'>('mobile')
  useEffect(() => {
    const update = () => setBp(window.innerWidth >= 640 ? 'tablet' : 'mobile')
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return bp
}

function Avatar({ name, url, size, color, rank }: {
  name: string; url: string | null; size: number; color: string; rank?: number
}) {
  const initials = name?.slice(0, 2).toUpperCase() ?? '??'
  const borderColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : color

  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      {rank && rank <= 3 && (
        <div style={{
          position:'absolute', inset:-3, borderRadius:'50%',
          background:`conic-gradient(${borderColor}80 0deg, transparent 200deg, ${borderColor}80 360deg)`,
          animation:'spin 8s linear infinite',
        }}/>
      )}
      <div style={{ position:'absolute', inset: rank && rank <= 3 ? -2 : 0, borderRadius:'50%', background:'#0c0c16' }}/>
      {url ? (
        <img src={url} alt={name} style={{
          width:size, height:size, borderRadius:'50%', objectFit:'cover',
          position:'relative', zIndex:1,
          border:`2px solid ${borderColor}50`,
        }}/>
      ) : (
        <div style={{
          width:size, height:size, borderRadius:'50%',
          background:`${borderColor}12`, border:`2px solid ${borderColor}40`,
          display:'flex', alignItems:'center', justifyContent:'center',
          position:'relative', zIndex:1,
        }}>
          <span style={{ color:borderColor, fontSize:size*0.33, fontWeight:700 }}>{initials}</span>
        </div>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [filter,  setFilter]  = useState<LangFilter>('all')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank,  setMyRank]  = useState<Entry | null>(null)

  const bp = useBreakpoint()
  const isTablet = bp === 'tablet'

  useEffect(() => { fetchLeaderboard() }, [filter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    let data: Entry[] = []
    try {
      if (filter === 'all') {
        const { data: rows, error } = await supabase.from('leaderboard_total').select('*').limit(50)
        if (error) throw error
        data = rows ?? []
      } else {
        const { data: rows, error } = await supabase.from('leaderboard_by_language').select('*').eq('language_code', filter).limit(50)
        if (error) throw error
        data = rows ?? []
      }
    } catch (err) { console.error('Error fetching leaderboard:', err) }
    setEntries(data)
    if (user) setMyRank(data.find(e => e.id === user.id) ?? null)
    setLoading(false)
  }

  const top3        = entries.slice(0, 3)
  const theRest     = entries.slice(3)
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3

  const rankColor = (r: number) =>
    r === 1 ? '#FFD700' : r === 2 ? '#C0C0C0' : '#CD7F32'

  return (
    <main style={{
      background:'#08080f',
      minHeight:'100vh',
      display:'flex',
      justifyContent:'center',
      fontFamily:"'Sora', system-ui, sans-serif",
    }}>

      {/* Ambient */}
      <div style={{ position:'fixed', top:-200, left:'50%', transform:'translateX(-50%)', width:700, height:500, background:'radial-gradient(ellipse,rgba(99,102,241,0.05) 0%,transparent 65%)', filter:'blur(60px)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-100, left:'20%', width:400, height:400, background:'radial-gradient(circle,rgba(250,204,21,0.04) 0%,transparent 65%)', filter:'blur(60px)', pointerEvents:'none', zIndex:0 }}/>
      {/* Dot grid */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize:'48px 48px', maskImage:'linear-gradient(to bottom,transparent 0%,black 6%,black 94%,transparent 100%)' }}/>

      <div style={{
        position:'relative', zIndex:1,
        width:'100%', maxWidth: isTablet ? 480 : 430,
        minHeight:'100vh',
        background:'linear-gradient(170deg,#0c0c16 0%,#08080f 50%,#0c0a14 100%)',
        borderLeft:'1px solid rgba(255,255,255,0.04)',
        borderRight:'1px solid rgba(255,255,255,0.04)',
        display:'flex', flexDirection:'column',
        overflowX:'hidden',
      }}>

        {/* ══════════════════════════════
            STICKY HEADER
        ══════════════════════════════ */}
        <div style={{
          position:'sticky', top:0, zIndex:30,
          background:'linear-gradient(to bottom,#0c0c16 82%,transparent)',
        }}>
          {/* Top bar */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding: isTablet ? '20px 28px 14px' : '52px 20px 14px',
          }}>
            <Link href="/home" style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              width:36, height:36, borderRadius:11,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.07)',
              color:'#a1a1aa', textDecoration:'none',
            }}>
              <ChevronLeft size={18}/>
            </Link>

            <div style={{ textAlign:'center' }}>
              <p style={{ color:'#3f3f46', fontSize:9, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', margin:'0 0 1px' }}>Lingora</p>
              <h1 style={{ color:'#f4f4f5', fontSize:15, fontWeight:900, letterSpacing:'0.06em', margin:0, textTransform:'uppercase' }}>
                Leaderboard
              </h1>
            </div>

            <div style={{ width:36 }}/>
          </div>

          {/* ── Language tab bar — TODAY / WEEK / ALL TIME style ── */}
          <div style={{
            display:'flex',
            borderBottom:'1px solid rgba(255,255,255,0.06)',
            paddingLeft: isTablet ? 28 : 20,
            paddingRight: isTablet ? 28 : 20,
            overflowX:'auto',
            scrollbarWidth:'none',
            gap:0,
          }} className="hide-scrollbar">
            {LANGS.map(l => {
              const active = filter === l.code
              return (
                <button key={l.code} onClick={() => setFilter(l.code)} style={{
                  flexShrink:0,
                  display:'flex', alignItems:'center', gap:6,
                  padding:'11px 14px 9px',
                  background:'transparent', border:'none',
                  borderBottom:`2px solid ${active ? '#818cf8' : 'transparent'}`,
                  cursor:'pointer',
                  color: active ? '#a5b4fc' : '#52525b',
                  fontSize:12, fontWeight: active ? 800 : 600,
                  letterSpacing:'0.01em',
                  transition:'all 0.18s',
                  marginBottom:-1,
                }}>
                  {l.flag ? <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.06em' }}>{l.flag}</span> : <Globe size={13} />}
                  {l.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ══════════════════════════════
            SCROLLABLE BODY
        ══════════════════════════════ */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none', paddingBottom:100 }}
          className="hide-scrollbar">

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'100px 0', gap:16 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:'2px solid rgba(99,102,241,0.2)', borderTopColor:'#818cf8', animation:'spin 0.8s linear infinite' }}/>
              <p style={{ color:'#3f3f46', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>Memuat...</p>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'100px 20px', color:'#27272a', fontSize:13 }}>
              Belum ada data untuk bahasa ini.
            </div>
          ) : (
            <>
              {/* ══ PODIUM — reference layout ══ */}
              {top3.length > 0 && (
                <div style={{ padding: isTablet ? '36px 32px 24px' : '28px 20px 20px', position:'relative' }}>
                  <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'80%', height:'100%', background:'radial-gradient(ellipse at 50% 20%, rgba(250,204,21,0.05) 0%, transparent 60%)', pointerEvents:'none' }}/>

                  <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap: isTablet ? 18 : 10, position:'relative' }}>
                    {podiumOrder.map((entry) => {
                      const isFirst  = entry.rank === 1
                      const avatarSz = isFirst ? (isTablet ? 82 : 70) : (isTablet ? 62 : 54)
                      const col      = rankColor(entry.rank)

                      return (
                        <div key={entry.id} style={{
                          display:'flex', flexDirection:'column', alignItems:'center',
                          flex: isFirst ? '0 0 36%' : '0 0 29%',
                          paddingBottom: isFirst ? 0 : 10,
                        }}>
                          {/* Rank badge / crown */}
                          <div style={{ height:28, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6 }}>
                            {isFirst ? (
                              <span style={{ fontSize: isTablet ? 24 : 20, animation:'float 3s ease-in-out infinite', filter:'drop-shadow(0 0 6px rgba(250,204,21,0.5))', display:'inline-flex' }}><Crown size={isTablet ? 24 : 20} color="#facc15" fill="#facc15" /></span>
                            ) : (
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                                <div style={{ width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderBottom:`6px solid ${col}`, marginBottom:1 }}/>
                                <span style={{ color:col, fontSize:13, fontWeight:900, lineHeight:1 }}>{entry.rank}</span>
                              </div>
                            )}
                          </div>

                          {/* Avatar with halo */}
                          <div style={{ position:'relative', marginBottom:10 }}>
                            {isFirst && (
                              <div style={{ position:'absolute', inset:-10, borderRadius:'50%', background:`radial-gradient(circle,${col}28 0%,transparent 70%)`, animation:'haloPulse 3s ease-in-out infinite', pointerEvents:'none' }}/>
                            )}
                            <Avatar name={entry.username} url={entry.avatar_url} size={avatarSz} color={col} rank={entry.rank}/>
                          </div>

                          <p style={{ color:'#e4e4e7', fontSize: isFirst ? 13 : 11, fontWeight:800, margin:'0 0 4px', textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:'0 4px', letterSpacing:'-0.01em' }}>
                            {entry.username}
                          </p>

                          {/* XP score */}
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <Zap size={isFirst ? 14 : 12} color="#facc15" fill="#facc15" />
                            <span style={{ color:col, fontSize: isFirst ? 16 : 13, fontWeight:900, letterSpacing:'-0.02em' }}>
                              {entry.total_xp.toLocaleString()}
                            </span>
                          </div>

                          {entry.streak > 0 && (
                            <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:4 }}>
                              <Flame size={9} color="#f59e0b" fill="#f59e0b"/>
                              <span style={{ color:'#a16207', fontSize:10, fontWeight:700 }}>{entry.streak}d</span>
                            </div>
                          )}

                          {/* Podium ground line */}
                          <div style={{
                            width:'80%', marginTop:12,
                            height: isFirst ? 4 : 3,
                            background:`linear-gradient(90deg,transparent,${col}70,transparent)`,
                            borderRadius:99,
                            boxShadow:`0 0 8px ${col}40`,
                          }}/>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div style={{ height:1, margin:'4px 20px 18px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }}/>

              {/* ══ LIST 4+ — card style matching reference ══ */}
              <div style={{ padding:`0 ${isTablet ? 24 : 16}px`, display:'flex', flexDirection:'column', gap: isTablet ? 10 : 8 }}>
                {theRest.map((entry, i) => {
                  const isMe = entry.id === user?.id
                  return (
                    <div key={entry.id} style={{
                      display:'flex', alignItems:'center',
                      gap: isTablet ? 14 : 12,
                      background: isMe
                        ? 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.04))'
                        : 'rgba(255,255,255,0.025)',
                      border: isMe
                        ? '1px solid rgba(99,102,241,0.28)'
                        : '1px solid rgba(255,255,255,0.055)',
                      borderRadius:18,
                      padding: isTablet ? '14px 18px' : '12px 14px',
                      animation:`fadeUp 0.3s ease ${i*0.04}s both`,
                      boxShadow: isMe ? '0 4px 20px rgba(99,102,241,0.08)' : '0 2px 10px rgba(0,0,0,0.2)',
                      position:'relative', overflow:'hidden',
                    }}>

                      {/* Rank */}
                      <div style={{ width:26, textAlign:'center', flexShrink:0 }}>
                        <span style={{ color:'#3f3f46', fontSize:14, fontWeight:900 }}>{entry.rank}</span>
                      </div>

                      <Avatar name={entry.username} url={entry.avatar_url} size={isTablet ? 44 : 40} color={isMe ? '#818cf8' : '#6366f1'}/>

                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color: isMe ? '#c7d2fe' : '#e4e4e7', fontSize:14, fontWeight:700, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                          {entry.username}
                          {isMe && <span style={{ marginLeft:6, color:'#818cf8', fontSize:9, fontWeight:800, background:'rgba(129,140,248,0.12)', padding:'1px 7px', borderRadius:99 }}>kamu</span>}
                        </p>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ color:'#3f3f46', fontSize:11, fontWeight:600 }}>{entry.stages_completed} stage</span>
                          {entry.streak > 0 && (
                            <span style={{ display:'flex', alignItems:'center', gap:3, color:'#92400e', fontSize:11, fontWeight:700, background:'rgba(245,158,11,0.08)', padding:'1px 7px', borderRadius:99 }}>
                              <Flame size={9} fill="#f59e0b" color="#f59e0b"/> {entry.streak}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* XP right */}
                      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                        <Zap size={13} color="#facc15" fill="#facc15" />
                        <span style={{ color: isMe ? '#a5b4fc' : '#facc15', fontSize:15, fontWeight:900, letterSpacing:'-0.02em' }}>
                          {entry.total_xp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Not in top 50 */}
              {user && !myRank && (
                <div style={{ margin:'20px 16px 0', padding:'14px 18px', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.18)', borderRadius:16, display:'flex', alignItems:'center', gap:12 }}>
                  <Globe size={15} color="#818cf8" style={{ flexShrink:0 }}/>
                  <p style={{ color:'#818cf8', fontSize:12, margin:0, lineHeight:1.5 }}>
                    Kamu belum masuk top 50 untuk <strong>{filter === 'all' ? 'semua bahasa' : LANGS.find(l=>l.code===filter)?.label}</strong>. Terus semangat!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        .hide-scrollbar::-webkit-scrollbar { display:none; }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes haloPulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.9;transform:scale(1.18)} }
      `}</style>
    </main>
  )
}