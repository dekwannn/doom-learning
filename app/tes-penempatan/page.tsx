'use client';
// src/app/tes-penempatan/page.tsx
// Placement test: for learners who already know the basics. Questions come chapter by chapter (lib/placement.ts);
// the chapters passed in a row are opened, without XP (the leaderboard stays fair), and the learner starts at the
// first chapter that was not passed. The earlier stages stay playable for their XP and stars.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, CheckCircle2, X, XCircle } from 'lucide-react';
import LanguageGuard from '@/components/LanguageGuard';
import LingoAvatar from '@/components/lingo/LingoAvatar';
import { useProgress } from '@/hooks/useProgress';
import { useLanguageStore, LANGUAGES } from '@/store/useLanguageStore';
import { passMark, placedAt, placementChapters, type CourseData, type PlacementChapter } from '@/lib/placement';
import { playSound } from '@/lib/quiz-sound';
import dummyData from '@/data/dummyData.json';
import jaData from '@/data/jaData.json';
import zhData from '@/data/zhData.json';
import koData from '@/data/koData.json';

const DATA: Record<string, CourseData> = {
  en: dummyData as unknown as CourseData, ja: jaData as unknown as CourseData,
  zh: zhData as unknown as CourseData, ko: koData as unknown as CourseData,
};

const FONT = 'system-ui,sans-serif';
const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

export default function PlacementPage() {
  return <LanguageGuard><Placement /></LanguageGuard>;
}

function Placement() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.selectedLanguage) ?? 'en';
  const langName = LANGUAGES.find((l) => l.code === lang)?.name ?? lang;
  const data = DATA[lang] ?? DATA.en;
  const chapters = useMemo(() => placementChapters(data), [data]);
  const total = chapters.reduce((n, ch) => n + ch.questions.length, 0);
  const [phase, setPhase] = useState<'intro' | 'test' | 'result'>('intro');
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ passed: number; scores: number[] } | null>(null);

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#0c0c18 0%,#07070f 55%,#0a0710 100%)', color: '#f4f4f5', fontFamily: FONT }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 40px' }}>
        <button onClick={() => router.push('/adventure')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '8px 14px', color: '#a1a1aa', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <ArrowLeft size={15} /> Peta
        </button>

        {phase === 'intro' && (
          <Intro langName={langName} chapters={chapters.length} total={total} onStart={() => { setRound((r) => r + 1); setPhase('test'); }} />
        )}
        {phase === 'test' && (
          <Test key={round} chapters={chapters} onDone={(r) => { setResult(r); setPhase('result'); }} />
        )}
        {phase === 'result' && result && (
          <Result chapters={chapters} data={data} result={result} onRetry={() => { setRound((r) => r + 1); setPhase('test'); }} />
        )}
      </div>
    </main>
  );
}

function Intro({ langName, chapters, total, onStart }: { langName: string; chapters: number; total: number; onStart: () => void }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><LingoAvatar size={110} /></div>
      <p style={{ margin: '20px 0 6px', textAlign: 'center', color: '#10b981', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Tes penempatan · {langName}</p>
      <h1 style={{ margin: 0, textAlign: 'center', fontSize: 26, fontWeight: 900, lineHeight: 1.25 }}>Sudah bisa dasarnya?</h1>
      <p style={{ margin: '10px auto 0', textAlign: 'center', color: '#a1a1aa', fontSize: 14.5, lineHeight: 1.65, maxWidth: 420 }}>
        Jawab beberapa soal dari tiap chapter. Chapter yang sudah kamu kuasai akan dibuka, jadi kamu tidak perlu mulai dari nol.
      </p>
      <div style={{ marginTop: 22, background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '14px 16px', display: 'grid', gap: 10 }}>
        {[
          `Paling banyak ${total} soal dari ${chapters} chapter, sekitar 3-5 menit.`,
          'Tes berhenti di chapter pertama yang belum lancar, dan kamu mulai dari situ.',
          'Tes ini tidak memberi XP. Stage yang dilewati tetap bisa dimainkan untuk XP dan bintang.',
          'Boleh diulang kapan saja; progresmu tidak akan berkurang.',
        ].map((t) => (
          <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#d4d4d8', lineHeight: 1.55 }}>
            <Check size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} /> {t}
          </div>
        ))}
      </div>
      <button onClick={onStart} style={{ marginTop: 22, width: '100%', height: 52, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 6px 22px rgba(16,185,129,0.3)' }}>
        Mulai tes
      </button>
    </div>
  );
}

function Test({ chapters, onDone }: { chapters: PlacementChapter[]; onDone: (r: { passed: number; scores: number[] }) => void }) {
  const [ci, setCi] = useState(0);
  const [qi, setQi] = useState(0);
  const [right, setRight] = useState(0); // in this chapter
  const [scores, setScores] = useState<number[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [options, setOptions] = useState(() => shuffle(chapters[0].questions[0].options));

  const ch = chapters[ci];
  const q = ch.questions[qi];
  const ok = sel === q.correctAnswer;
  const asked = chapters.slice(0, ci).reduce((n, c) => n + c.questions.length, 0) + qi;
  const all = chapters.reduce((n, c) => n + c.questions.length, 0);

  const check = () => {
    if (!sel || checked) return;
    setChecked(true);
    playSound(ok ? 'correct' : 'wrong');
  };

  const next = () => {
    const nowRight = right + (ok ? 1 : 0);
    const lastOfChapter = qi + 1 >= ch.questions.length;
    // A chapter can no longer be passed: stop early, without the remaining questions of this chapter
    const cannotPass = nowRight + (ch.questions.length - qi - 1) < passMark(ch.questions.length);
    if (lastOfChapter || cannotPass) {
      const passedHere = nowRight >= passMark(ch.questions.length);
      const newScores = [...scores, nowRight];
      if (!passedHere || ci + 1 >= chapters.length) {
        onDone({ passed: passedHere ? ci + 1 : ci, scores: newScores });
        return;
      }
      setScores(newScores);
      setCi(ci + 1); setQi(0); setRight(0);
      setOptions(shuffle(chapters[ci + 1].questions[0].options));
    } else {
      setRight(nowRight); setQi(qi + 1);
      setOptions(shuffle(ch.questions[qi + 1].options));
    }
    setSel(null); setChecked(false);
  };

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(asked / all) * 100}%`, background: `linear-gradient(90deg,${ch.color},${ch.color}aa)`, borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        <span style={{ color: '#52525b', fontSize: 11, fontWeight: 700 }}>{asked + 1}/{all}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {chapters.map((c, i) => (
          <span key={c.id} style={{ flex: 1, height: 4, borderRadius: 99, background: i < ci ? '#10b981' : i === ci ? c.color : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>

      <div style={{ marginTop: 18, background: 'linear-gradient(160deg,#13131a,#0f0f14)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: 20 }}>
        <p style={{ margin: 0, color: ch.color, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{ch.title} · {ch.subtitle}</p>
        {q.context && <p style={{ margin: '10px 0 0', color: '#71717a', fontSize: 12.5, fontStyle: 'italic' }}>{q.context}</p>}
        <h2 style={{ margin: '10px 0 0', fontSize: 20, fontWeight: 900, lineHeight: 1.4 }}>{q.question}</h2>
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.03)', border = '1px solid rgba(255,255,255,0.07)', c = '#d4d4d8', op = 1;
          if (!checked) { if (opt === sel) { bg = `${ch.color}18`; border = `1px solid ${ch.color}`; c = '#fff'; } }
          else if (opt === q.correctAnswer) { bg = 'rgba(16,185,129,0.08)'; border = '1px solid rgba(16,185,129,0.35)'; c = '#6ee7b7'; }
          else if (opt === sel) { bg = 'rgba(239,68,68,0.08)'; border = '1px solid rgba(239,68,68,0.35)'; c = '#fca5a5'; }
          else op = 0.3;
          return (
            <button key={opt} onClick={() => !checked && setSel(opt)} disabled={checked}
              style={{ background: bg, border, color: c, opacity: op, borderRadius: 12, padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 500, display: 'flex', gap: 12, cursor: checked ? 'default' : 'pointer', fontFamily: FONT }}>
              <span style={{ color: opt === sel && !checked ? ch.color : '#3f3f46', fontWeight: 800, fontSize: 11, marginTop: 2 }}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {checked && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', background: ok ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 12, padding: '10px 12px' }}>
          {ok ? <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} /> : <XCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />}
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#e4e4e7' }}>
            <b style={{ color: ok ? '#34d399' : '#f87171' }}>{ok ? 'Benar' : 'Belum tepat'}.</b>{' '}
            {ok ? '' : <>Jawabannya: <b>{q.correctAnswer}</b>. </>}{q.explanation && !ok ? q.explanation : ''}
          </p>
        </div>
      )}

      <button onClick={checked ? next : check} disabled={!sel}
        style={{ marginTop: 14, width: '100%', height: 50, borderRadius: 14, border: 'none', cursor: sel ? 'pointer' : 'default', fontSize: 14, fontWeight: 900, fontFamily: FONT,
          background: !sel ? 'rgba(255,255,255,0.04)' : checked ? `linear-gradient(135deg,${ch.color},${ch.color}aa)` : `${ch.color}22`,
          color: !sel ? '#3f3f46' : checked ? '#fff' : ch.color }}>
        {checked ? 'Lanjut →' : 'Periksa'}
      </button>
    </div>
  );
}

function Result({ chapters, data, result, onRetry }: { chapters: PlacementChapter[]; data: CourseData; result: { passed: number; scores: number[] }; onRetry: () => void }) {
  const router = useRouter();
  const { placedChapter, setPlacedChapter, unlockStage } = useProgress();
  const target = placedAt(chapters, result.passed);
  const skips = result.passed > 0;

  const start = () => {
    // Open the chapters before the start chapter, stage by stage (each unlock also opens the next stage, and the
    // last stage of a chapter opens the next chapter's first). Never lowers what is already open.
    const allStages = data.chapters.flatMap((c) => c.stages);
    for (const c of data.chapters) {
      if (Number(c.id) >= target.id) break;
      for (const st of c.stages) unlockStage(st.id, allStages);
    }
    setPlacedChapter(Math.max(placedChapter, target.id));
    router.push('/adventure');
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><LingoAvatar size={100} /></div>
      <p style={{ margin: '18px 0 6px', textAlign: 'center', color: '#10b981', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Hasil tes</p>
      <h1 style={{ margin: 0, textAlign: 'center', fontSize: 24, fontWeight: 900, lineHeight: 1.3 }}>
        {skips ? <>Kamu mulai dari {target.title}!</> : <>Kita mulai dari awal, ya!</>}
      </h1>
      <p style={{ margin: '8px auto 0', textAlign: 'center', color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>
        {skips
          ? `${target.subtitle}. Chapter sebelumnya sudah terbuka kalau mau diulang.`
          : 'Chapter 1 cocok untukmu. Pelan-pelan saja, nanti kamu bisa ikut tes ini lagi.'}
      </p>

      <div style={{ marginTop: 20, background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 6 }}>
        {chapters.map((c, i) => {
          const tested = i < result.scores.length;
          const passed = i < result.passed;
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: c.id === target.id ? `${c.color}12` : 'transparent' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: passed ? 'rgba(16,185,129,0.15)' : tested ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)' }}>
                {passed ? <Check size={14} color="#34d399" /> : tested ? <X size={14} color="#f87171" /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3f3f46' }} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: tested ? '#f4f4f5' : '#71717a' }}>{c.title}</p>
                <p style={{ margin: '1px 0 0', fontSize: 11.5, color: '#71717a' }}>{c.subtitle}</p>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: c.id === target.id ? c.color : '#52525b' }}>
                {c.id === target.id ? 'Mulai di sini' : tested ? `${result.scores[i]}/${c.questions.length}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      <button onClick={start} style={{ marginTop: 20, width: '100%', height: 52, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${target.color},${target.color}aa)`, color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: FONT }}>
        {skips ? `Mulai ${target.title}` : 'Mulai belajar'}
      </button>
      <button onClick={onRetry} style={{ marginTop: 10, width: '100%', height: 46, borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
        Ulangi tes
      </button>
      <p style={{ margin: '14px 0 0', textAlign: 'center', color: '#52525b', fontSize: 12 }}>Tes ini tidak menambah XP.</p>
    </div>
  );
}
