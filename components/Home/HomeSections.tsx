'use client';

// src/components/Home/HomeSections.tsx
// The parts of the home page: Lingo's greeting with today's progress, "continue", quick practice,
// the current chapter, the learner's rank and their latest achievement.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Coffee, Layers, Lock, Mic, Play, Trophy } from 'lucide-react';
import LingoAvatar from '@/components/lingo/LingoAvatar';
import { supabase } from '@/lib/supabase';
import { ACHIEVEMENT_DEFS, useUserStore } from '@/store/useUserStore';

const FONT = 'system-ui,sans-serif';
const card: React.CSSProperties = { background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 14, fontFamily: FONT };
const muted: React.CSSProperties = { color: '#71717a', fontSize: 12 };

/** A chapter and a stage as the lesson data has them */
export type HomeChapter = { id: number | string; title: string; subtitle: string; color: string; xpRequired: number; stages: HomeStage[] };
export type HomeStage = { id: string; label: string };

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#52525b', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '22px 4px 9px', fontFamily: FONT }}>{children}</p>;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', borderRadius: 99, background: color, boxShadow: `0 0 8px ${color}70`, transition: 'width 0.8s ease' }} />
    </div>
  );
}

/** The streak still counts if the last learning day was today or yesterday */
export function activeStreak(streak: number, lastStreakDate: string | null): number {
  if (!lastStreakDate) return 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return lastStreakDate === new Date().toDateString() || lastStreakDate === yesterday.toDateString() ? streak : 0;
}

export function GreetingCard({ streak, done, total }: { streak: number; done: number; total: number }) {
  const line = streak > 0
    ? `Streak ${streak} hari. ${done >= total ? 'Target hari ini beres!' : 'Jangan putus hari ini!'}`
    : 'Mulai streak-mu hari ini!';
  return (
    <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg,rgba(92,250,46,0.10),rgba(16,185,129,0.03))', borderColor: 'rgba(92,250,46,0.22)' }}>
      <div style={{ flexShrink: 0 }}><LingoAvatar size={74} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#f4f4f5', fontSize: 16, fontWeight: 800, margin: 0 }}>Halo! Lanjut belajar, yuk</p>
        <p style={{ ...muted, margin: '3px 0 0' }}>{line}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <Bar pct={(done / total) * 100} color="#5cfa2e" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#bef264', whiteSpace: 'nowrap' }}>{done}/{total} target</span>
        </div>
      </div>
    </div>
  );
}

export function ContinueCard({ ch, stage, index, count }: { ch: HomeChapter; stage: HomeStage; index: number; count: number }) {
  return (
    <Link href={`/adventure/${ch.id}/${stage.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ ...card, borderColor: `${ch.color}45`, boxShadow: `0 0 26px ${ch.color}14` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${ch.color}18`, border: `1px solid ${ch.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Play size={22} color={ch.color} fill={ch.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...muted, margin: 0 }}>{ch.title} · {ch.subtitle}</p>
            <p style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: '2px 0 0' }}>{stage.label}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Bar pct={(index / count) * 100} color={ch.color} />
          <span style={{ ...muted, whiteSpace: 'nowrap' }}>Stage {index + 1} dari {count}</span>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800 }}>
          Mulai stage <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}

export function AllDoneCard() {
  return (
    <div style={{ ...card, textAlign: 'center', borderColor: 'rgba(250,204,21,0.25)' }}>
      <Trophy size={28} color="#facc15" style={{ margin: '0 auto' }} />
      <p style={{ color: '#fff', fontSize: 15, fontWeight: 800, margin: '8px 0 2px' }}>Semua stage yang terbuka sudah selesai</p>
      <p style={{ ...muted, margin: 0 }}>Kumpulkan XP untuk membuka chapter berikutnya, atau ulangi stage untuk bintang 3.</p>
    </div>
  );
}

function Tile({ href, icon, label, sub, badge }: { href?: string; icon: React.ReactNode; label: string; sub?: string; badge?: { text: string; color: string } }) {
  const body = (
    <div style={{ ...card, padding: '12px 8px', textAlign: 'center', position: 'relative', height: '100%', opacity: href ? 1 : 0.75 }}>
      {badge && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, fontWeight: 800, background: `${badge.color}22`, color: badge.color, padding: '2px 6px', borderRadius: 6 }}>{badge.text}</span>}
      <div style={{ display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <p style={{ color: '#e4e4e7', fontSize: 11.5, fontWeight: 700, margin: '7px 0 0', lineHeight: 1.3 }}>{label}</p>
      {sub && <p style={{ color: '#71717a', fontSize: 10.5, fontWeight: 600, margin: '2px 0 0' }}>{sub}</p>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{body}</Link> : body;
}

export function QuickPractice({ voiceReady }: { voiceReady: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      <Tile href={voiceReady ? '/assistant?buka=suara' : '/assistant'} icon={<Mic size={24} color="#5cfa2e" />} label="Bicara dengan Lingo" sub={voiceReady ? undefined : 'Inggris dulu'} />
      <Tile href="/kartu" icon={<Layers size={24} color="#a78bfa" />} label="Kartu ucapan" badge={{ text: 'BARU', color: '#c4b5fd' }} />
      <Tile href="/skenario" icon={<Coffee size={24} color="#fb923c" />} label="Ngobrol skenario" badge={{ text: 'BARU', color: '#fdba74' }} />
    </div>
  );
}

export function ChapterCard({ ch, done, count, nextChapter, xp }: { ch: HomeChapter; done: number; count: number; nextChapter?: HomeChapter; xp: number }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 800, margin: 0 }}>{ch.title}</p>
          <p style={{ ...muted, margin: '1px 0 0' }}>{ch.subtitle}</p>
        </div>
        <span style={{ ...muted, fontWeight: 800 }}>{done}/{count}</span>
      </div>
      <div style={{ display: 'flex', margin: '10px 0' }}><Bar pct={(done / count) * 100} color={ch.color} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, gap: 8 }}>
        <span style={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: 4 }}>
          {nextChapter ? (
            xp >= nextChapter.xpRequired
              ? <>{nextChapter.title} sudah terbuka</>
              : <><Lock size={11} /> {nextChapter.title} terbuka di {nextChapter.xpRequired} XP</>
          ) : 'Chapter terakhir'}
        </span>
        <Link href="/adventure" style={{ color: '#5cfa2e', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          Lihat peta <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

const LANG_NAME: Record<string, string> = { en: 'bahasa Inggris', ja: 'bahasa Jepang', zh: 'bahasa Mandarin', ko: 'bahasa Korea' };

/** The learner's place on the leaderboard for this language (guests are invited to sign in) */
export function RankCard({ lang }: { lang: string }) {
  const [rank, setRank] = useState<{ me: number; xp: number; aheadXp: number | null } | null>(null);
  const [guest, setGuest] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!alive) return;
      if (!session) { setGuest(true); return; }
      setGuest(false);
      const { data: mine } = await supabase.from('leaderboard_by_language').select('rank, total_xp').eq('id', session.user.id).eq('language_code', lang).maybeSingle();
      if (!alive || !mine) { setRank(null); return; }
      const { data: ahead } = await supabase.from('leaderboard_by_language').select('total_xp').eq('language_code', lang).lt('rank', mine.rank).order('rank', { ascending: false }).limit(1).maybeSingle();
      if (alive) setRank({ me: mine.rank, xp: mine.total_xp, aheadXp: ahead?.total_xp ?? null });
    })();
    return () => { alive = false; };
  }, [lang]);

  if (guest === null) return null;
  const title = guest ? 'Ikut bersaing di peringkat' : rank ? `#${rank.me} di ${LANG_NAME[lang] ?? lang}` : 'Belum ada peringkat';
  const sub = guest
    ? 'Masuk supaya XP-mu masuk Leaderboard'
    : rank
      ? (rank.aheadXp !== null ? `Butuh ${Math.max(1, rank.aheadXp - rank.xp + 1)} XP lagi untuk naik ke #${rank.me - 1}` : 'Kamu di puncak!')
      : 'Selesaikan stage untuk masuk Leaderboard';
  return (
    <>
    <SectionLabel>Peringkat kamu</SectionLabel>
    <Link href={guest ? '/login?redirectTo=%2F' : '/leaderboard'} style={{ textDecoration: 'none' }}>
      <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', borderColor: 'rgba(250,204,21,0.22)' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={21} color="#facc15" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 800, margin: 0 }}>{title}</p>
          <p style={{ ...muted, margin: '2px 0 0' }}>{sub}</p>
        </div>
        <span style={{ color: '#facc15', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          {guest ? 'Masuk' : 'Leaderboard'} <ChevronRight size={14} />
        </span>
      </div>
    </Link>
    </>
  );
}

export function LatestAchievement() {
  const unlocked = useUserStore((s) => s.unlockedAchievements);
  const latest = [...(unlocked ?? [])].sort((a, b) => b.unlockedAt - a.unlockedAt)[0];
  const def = latest ? ACHIEVEMENT_DEFS.find((d) => d.id === latest.id) : undefined;
  if (!def) return null;
  return (
    <>
    <SectionLabel>Pencapaian terbaru</SectionLabel>
    <Link href="/profile" style={{ textDecoration: 'none' }}>
      <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${def.color}1f`, border: `1px solid ${def.color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={21} color={def.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 800, margin: 0 }}>{def.label}</p>
          <p style={{ ...muted, margin: '2px 0 0' }}>{def.desc}</p>
        </div>
        <span style={{ color: '#5cfa2e', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>Semua <ChevronRight size={14} /></span>
      </div>
    </Link>
    </>
  );
}
