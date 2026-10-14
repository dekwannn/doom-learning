'use client';

// src/components/DailyTargets.tsx
// Today's targets (shown on the home page): finish a stage, answer questions, read lessons; claim XP when done.

import { CheckCircle2 } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useProgress } from '@/hooks/useProgress';

export const DAILY_MISSIONS = [
  { id: 'stage', label: 'Selesaikan 1 stage', key: 'stagesCompleted', target: 1, xp: 50 },
  { id: 'quest', label: 'Kerjakan 5 soal', key: 'questionsAnswered', target: 5, xp: 30 },
  { id: 'vocab', label: 'Baca 2 materi', key: 'materialsRead', target: 2, xp: 20 },
] as const;

/** Today's progress per mission (0 when the saved stats are from another day) */
export function useDailyProgress() {
  const dailyStats = useUserStore((s) => s.dailyStats);
  const isToday = dailyStats?.date === new Date().toDateString();
  const missions = DAILY_MISSIONS.map((m) => {
    const current = isToday ? dailyStats[m.key] : 0;
    return { ...m, current, done: current >= m.target, claimed: isToday && dailyStats.claimed[m.id] === true };
  });
  return { missions, doneCount: missions.filter((m) => m.done).length };
}

export default function DailyTargets() {
  const claimReward = useUserStore((s) => s.claimDailyReward);
  const { addXp } = useProgress();
  const { missions } = useDailyProgress();

  return (
    <div style={{ background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '4px 14px', fontFamily: 'system-ui,sans-serif' }}>
      {missions.map((m, i) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          {m.done ? (
            <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
          ) : (
            <span style={{ width: 20, color: '#71717a', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{Math.min(m.current, m.target)}/{m.target}</span>
          )}
          <span style={{ flex: 1, fontSize: 13, color: m.claimed ? '#71717a' : '#e4e4e7', textDecoration: m.claimed ? 'line-through' : 'none' }}>{m.label}</span>
          {m.claimed ? (
            <span style={{ color: '#52525b', fontSize: 11, fontWeight: 700 }}>Diambil</span>
          ) : m.done ? (
            <button
              onClick={() => { if (claimReward(m.id)) addXp(m.xp); }}
              style={{ background: '#10b981', border: 'none', color: '#04342c', fontSize: 11.5, fontWeight: 800, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', boxShadow: '0 0 10px rgba(16,185,129,0.45)' }}
            >
              Klaim +{m.xp}
            </button>
          ) : (
            <span style={{ color: '#facc15', fontSize: 11.5, fontWeight: 800 }}>+{m.xp} XP</span>
          )}
        </div>
      ))}
    </div>
  );
}
