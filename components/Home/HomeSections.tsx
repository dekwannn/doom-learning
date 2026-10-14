'use client';

// src/components/Home/HomeSections.tsx
// The parts of the home page: Lingo's greeting with today's progress, "continue", quick practice,
// the current chapter, the learner's rank and their latest achievement.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Lock } from 'lucide-react';
import LingoAvatar from '@/components/lingo/LingoAvatar';
import { CafeScene, CardsScene, GoScene, MedalScene, TalkScene, TrophyScene } from '@/components/Home/LingoScenes';
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
          <GoScene color={ch.color} size={60} />
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
      <div style={{ display: 'flex', justifyContent: 'center' }}><TrophyScene size={84} /></div>
      <p style={{ color: '#fff', fontSize: 15, fontWeight: 800, margin: '8px 0 2px' }}>Semua stage yang terbuka sudah selesai</p>
      <p style={{ ...muted, margin: 0 }}>Kumpulkan XP untuk membuka chapter berikutnya, atau ulangi stage untuk bintang 3.</p>
    </div>
  );
}

const Badge = ({ color }: { color: string }) => (
  <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 800, background: `${color}22`, color, padding: '2px 6px', borderRadius: 6, zIndex: 1 }}>BARU</span>
);

/** A practice card with a scene of Lingo on top */
function PracticeCard({ href, scene, label, sub, color, isNew }: { href: string; scene: React.ReactNode; label: string; sub: string; color: string; isNew?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ ...card, padding: 0, overflow: 'hidden', position: 'relative', height: '100%', borderColor: `${color}33` }}>
        {isNew && <Badge color={color} />}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 6px 2px', background: `radial-gradient(circle at 50% 70%, ${color}2e, transparent 70%)` }}>{scene}</div>
        <div style={{ padding: '6px 12px 12px' }}>
          <p style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.25 }}>{label}</p>
          <p style={{ color: '#71717a', fontSize: 11, margin: '2px 0 0', lineHeight: 1.35 }}>{sub}</p>
        </div>
      </div>
    </Link>
  );
}

export function QuickPractice({ voiceReady }: { voiceReady: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Link href={voiceReady ? '/assistant?buka=suara' : '/assistant'} style={{ textDecoration: 'none', gridColumn: '1 / -1' }}>
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px 10px 16px', borderColor: 'rgba(92,250,46,0.25)', background: 'linear-gradient(120deg,#0e0e14 35%,rgba(92,250,46,0.13))' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#f4f4f5', fontSize: 15, fontWeight: 800, margin: 0 }}>Bicara dengan Lingo</p>
            <p style={{ ...muted, margin: '3px 0 10px', lineHeight: 1.4 }}>
              {voiceReady ? 'Ngobrol pakai suara, Lingo bantu benerin ucapanmu' : 'Mode suara baru ada untuk bahasa Inggris. Ngobrol lewat chat dulu, yuk'}
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 99, background: '#5cfa2e', color: '#0a0a0a', fontSize: 12, fontWeight: 800 }}>
              {voiceReady ? 'Mulai ngobrol' : 'Buka chat'} <ArrowRight size={13} />
            </span>
          </div>
          <TalkScene />
        </div>
      </Link>
      <PracticeCard href="/kartu" scene={<CardsScene />} label="Kartu ucapan" sub="Ucapkan kartunya, Lingo cek tiap kata" color="#a78bfa" isNew />
      <PracticeCard href="/skenario" scene={<CafeScene />} label="Ngobrol skenario" sub="Main peran di kafe, toko, bandara" color="#fb923c" isNew />
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
        <TrophyScene size={56} />
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
        <MedalScene color={def.color} size={56} />
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
