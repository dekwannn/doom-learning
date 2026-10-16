'use client';

// src/app/ulas/page.tsx
// "Ulas kata": a short review of the words met in stages, lessons and speaking cards, on a Leitner schedule.
// Each word asks for its meaning (retrieval practice); Japanese also asks for the reading of a hiragana (see
// lib/review-questions). A right answer moves a word to a later review, a wrong one brings it back soon. With too
// few choices, the card is flipped and the learner says if they knew it.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Volume2, X } from 'lucide-react';
import LingoAvatar from '@/components/lingo/LingoAvatar';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUserStore } from '@/store/useUserStore';
import { dueCards, INTERVAL_DAYS, nextDue, type ReviewCard, useReviewStore } from '@/store/useReviewStore';
import { useProgress } from '@/hooks/useProgress';
import { TTS_LANG } from '@/lib/speaking-cards';
import { speakSegments } from '@/lib/lingo-speech';
import { buildQuestion, type ChoicePool, japanesePool, type ReviewQuestion } from '@/lib/review-questions';

const FONT = 'system-ui, sans-serif';
const PER_SESSION = 10;
const XP_PER_WORD = 2; // for a word known on the first try

const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

/** "besok", "3 hari lagi", "nanti hari ini" */
function whenText(ms: number | null) {
  if (ms === null) return '';
  const days = Math.round((ms - Date.now()) / (24 * 60 * 60 * 1000));
  if (ms <= Date.now()) return 'sekarang';
  if (days <= 0) return 'nanti hari ini';
  if (days === 1) return 'besok';
  return `${days} hari lagi`;
}

type Question = ReviewQuestion;

export default function UlasPage() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.selectedLanguage) ?? 'en';
  const cards = useReviewStore((s) => s.cards);
  const [session, setSession] = useState<Question[] | null>(null);
  const [result, setResult] = useState<{ right: string[]; wrong: ReviewCard[] } | null>(null);

  const mine = useMemo(() => Object.values(cards).filter((c) => c.lang === lang), [cards, lang]);
  const due = useMemo(() => dueCards(cards, lang), [cards, lang]);
  // Japanese: every hiragana and meaning of the course as extra choices (loaded only for Japanese)
  const [jaPool, setJaPool] = useState<ChoicePool | null>(null);
  useEffect(() => {
    if (lang !== 'ja' || jaPool) return;
    let alive = true;
    void import('@/data/jaData.json').then((m) => { if (alive) setJaPool(japanesePool(m.default as Parameters<typeof japanesePool>[0])); });
    return () => { alive = false; };
  }, [lang, jaPool]);
  const pool = lang === 'ja' ? jaPool : null;

  const start = () => {
    setSession(shuffle(due.slice(0, PER_SESSION)).map((card) => buildQuestion(card, mine, pool)));
    setResult(null);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', display: 'flex', justifyContent: 'center', fontFamily: FONT, color: '#f4f4f5' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '16px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => (session ? setSession(null) : router.back())} aria-label="Kembali"
            style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Ulas kata</p>
            <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>Ingat lagi kata yang sudah kamu pelajari</p>
          </div>
        </div>

        {session ? (
          <Session
            key={session.map((q) => q.card.id).join()}
            questions={session}
            lang={lang}
            remake={(card) => buildQuestion(card, mine, pool)}
            onEnd={(r) => { setSession(null); setResult(r); }}
          />
        ) : result ? (
          <Summary result={result} lang={lang} hasMore={due.length > 0} onAgain={start} onDone={() => router.push('/')} />
        ) : (
          <Overview mine={mine} due={due} lang={lang} onStart={start} />
        )}
      </div>
    </main>
  );
}

function Overview({ mine, due, lang, onStart }: { mine: ReviewCard[]; due: ReviewCard[]; lang: string; onStart: () => void }) {
  const router = useRouter();
  const cards = useReviewStore((s) => s.cards);
  const [why, setWhy] = useState(false);
  const fresh = mine.filter((c) => c.box === 0).length;
  const learning = mine.filter((c) => c.box >= 1 && c.box <= 3).length;
  const known = mine.filter((c) => c.box >= 4).length;
  const count = Math.min(due.length, PER_SESSION);
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg,rgba(92,250,46,0.10),rgba(92,250,46,0.02))', border: '1px solid rgba(92,250,46,0.22)', borderRadius: 18, padding: 14 }}>
        <div style={{ flexShrink: 0 }}><LingoAvatar size={64} /></div>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
            {mine.length === 0 ? 'Belum ada kata' : due.length > 0 ? `${due.length} kata siap diulas` : 'Semua sudah diulas'}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>
            {mine.length === 0
              ? 'Kata dari stage, materi, dan kartu ucapan akan terkumpul di sini.'
              : due.length > 0
                ? 'Jawab artinya. Kata yang kamu ingat akan muncul lagi beberapa hari kemudian.'
                : `Ulasan berikutnya ${whenText(nextDue(cards, lang))}.`}
          </p>
        </div>
      </div>

      {mine.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
          {[
            { n: fresh, label: 'Baru', color: '#a78bfa' },
            { n: learning, label: 'Sedang dipelajari', color: '#60a5fa' },
            { n: known, label: 'Sudah hafal', color: '#34d399' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.n}</div>
              <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {due.length > 0 ? (
        <button onClick={onStart}
          style={{ marginTop: 14, width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
          Mulai ulas ({count} kata)
        </button>
      ) : mine.length === 0 ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => router.push('/learn')} style={{ flex: 1, padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Buka materi</button>
          <button onClick={() => router.push('/adventure')} style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Main stage</button>
        </div>
      ) : null}

      {lang !== 'en' && mine.length > 0 && (
        <p style={{ margin: '10px 4px 0', fontSize: 11.5, color: '#71717a' }}>Kata dari {lang === 'ja' ? 'bahasa Jepang' : lang === 'zh' ? 'bahasa Mandarin' : 'bahasa Korea'} diambil dari kartu kosakata di stage.</p>
      )}

      <div style={{ marginTop: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <button onClick={() => setWhy((v) => !v)} aria-expanded={why}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'none', border: 'none', color: '#a1a1aa', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          Kenapa diulang seperti ini?
          <ChevronDown size={15} style={{ transform: why ? 'rotate(180deg)' : 'none' }} />
        </button>
        {why && (
          <div style={{ padding: '0 14px 14px', fontSize: 12, lineHeight: 1.6, color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0 }}>
              Ulasan memakai <b style={{ color: '#e4e4e7' }}>sistem kotak Leitner</b>. Kata yang kamu jawab benar pindah ke kotak berikutnya dan
              muncul lagi setelah {INTERVAL_DAYS.slice(1).join(', ')} hari. Kata yang salah kembali ke awal.
            </p>
            <p style={{ margin: 0 }}>
              Ini mengikuti dua temuan penelitian: <b style={{ color: '#e4e4e7' }}>mengulang dengan jeda</b> lebih awet daripada mengulang
              sekaligus (efek spasi), dan <b style={{ color: '#e4e4e7' }}>mencoba mengingat</b> lebih kuat daripada membaca ulang (efek pengujian).
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>
              Sumber: Cepeda dkk. (2006), <i>Distributed practice in verbal recall tasks</i>, Psychological Bulletin. Roediger &amp; Karpicke (2006),
              <i> Test-enhanced learning</i>, Psychological Science. Leitner (1972), <i>So lernt man lernen</i>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Session({ questions, lang, remake, onEnd }: {
  questions: Question[];
  lang: string;
  /** A fresh question for a word asked once more (Japanese may ask it the other way round) */
  remake: (card: ReviewCard) => Question;
  onEnd: (r: { right: string[]; wrong: ReviewCard[] }) => void;
}) {
  const grade = useReviewStore((s) => s.grade);
  const [queue, setQueue] = useState(questions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Whether each word was known on its first try in this session
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const q = queue[index];
  const tts = TTS_LANG[lang] ?? 'en-US';
  const total = questions.length;
  const doneCount = Object.keys(firstTry).length;

  const say = () => speakSegments([{ text: q.speak, lang: tts }], undefined, { natural: true });

  /** Grades the word on its first try; returns the answers so far and whether a missed word was queued once more */
  const answer = (right: boolean): { queued: boolean; answers: Record<string, boolean> } => {
    if (firstTry[q.card.id] !== undefined) return { queued: false, answers: firstTry };
    const answers = { ...firstTry, [q.card.id]: right };
    setFirstTry(answers);
    grade(q.card.id, right);
    useUserStore.getState().incrementDailyQuestion(); // counts toward "Kerjakan 5 soal"
    // A word missed comes once more at the end of this session
    if (right) return { queued: false, answers };
    setQueue((list) => [...list, remake(q.card)]);
    return { queued: true, answers };
  };
  const choose = (option: string) => {
    if (picked) return;
    setPicked(option);
    answer(option === q.answer);
  };
  const next = ({ queued, answers }: { queued: boolean; answers: Record<string, boolean> } = { queued: false, answers: firstTry }) => {
    setPicked(null);
    setRevealed(false);
    if (index + 1 >= queue.length + (queued ? 1 : 0)) {
      const right = Object.entries(answers).filter(([, ok]) => ok).map(([id]) => id);
      const wrong = questions.map((x) => x.card).filter((c) => answers[c.id] === false);
      onEnd({ right, wrong });
      return;
    }
    setIndex(index + 1);
  };

  const showResult = q.options ? picked !== null : revealed;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ width: `${(Math.min(doneCount, total) / total) * 100}%`, height: '100%', borderRadius: 99, background: '#10b981', transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ color: '#71717a', fontSize: 12, fontWeight: 700 }}>{Math.min(doneCount + (showResult ? 0 : 1), total)}/{total}</span>
      </div>

      <div style={{ marginTop: 18, background: '#0e0e14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '22px 18px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: '#52525b' }}>
          {index >= total ? `SEKALI LAGI · ${q.ask}` : q.ask}
        </p>
        <p lang={lang} style={{ margin: '10px 0 0', fontSize: q.prompt.length <= 2 ? 56 : 30, fontWeight: 900, lineHeight: 1.2 }}>{q.prompt}</p>
        {q.hint && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#71717a' }}>{q.hint}</p>}
        {(!q.listenAfter || showResult) && <button onClick={say}
          style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(92,250,46,0.35)', background: 'rgba(92,250,46,0.08)', color: '#bef264', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          <Volume2 size={15} /> Dengar
        </button>}
      </div>

      {q.options ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {q.options.map((o) => {
            const isRight = o === q.answer;
            const state = !picked ? 'idle' : isRight ? 'right' : o === picked ? 'wrong' : 'idle';
            return (
              <button key={o} onClick={() => choose(o)} disabled={!!picked}
                style={{
                  textAlign: q.bigOptions ? 'center' : 'left', padding: '12px 14px', borderRadius: 14, fontSize: q.bigOptions ? 28 : 14, lineHeight: 1.45, cursor: picked ? 'default' : 'pointer', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: state === 'right' ? 'rgba(16,185,129,0.12)' : state === 'wrong' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${state === 'right' ? 'rgba(16,185,129,0.5)' : state === 'wrong' ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  color: state === 'idle' && picked ? '#71717a' : '#e4e4e7',
                }}>
                <span lang={q.bigOptions ? lang : undefined} style={{ flex: 1 }}>{o}</span>
                {state === 'right' && <Check size={17} color="#34d399" />}
                {state === 'wrong' && <X size={17} color="#f87171" />}
              </button>
            );
          })}
        </div>
      ) : !revealed ? (
        <button onClick={() => setRevealed(true)}
          style={{ marginTop: 14, width: '100%', padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          Lihat jawaban
        </button>
      ) : (
        <div style={{ marginTop: 14 }}>
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, lineHeight: 1.5 }}>
            <div lang={q.bigOptions ? lang : undefined} style={{ fontSize: q.bigOptions ? 28 : 14, fontWeight: 700 }}>{q.answer}</div>
            {q.after.map((a) => <div key={a} style={{ color: '#a1a1aa', fontSize: 12.5, marginTop: 4 }}>{a}</div>)}
          </div>
          {firstTry[q.card.id] === undefined && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => next(answer(false))} style={{ flex: 1, padding: 13, borderRadius: 14, border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)', color: '#fca5a5', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Belum ingat</button>
              <button onClick={() => next(answer(true))} style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Sudah ingat</button>
            </div>
          )}
        </div>
      )}

      {showResult && q.options && (
        <>
          {q.after.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', fontSize: 13, color: '#bfdbfe', lineHeight: 1.5 }}>
              {q.after.map((a) => <div key={a} style={{ marginTop: 2 }}>{a}</div>)}
            </div>
          )}
          <button onClick={() => next()}
            style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
            {index + 1 >= queue.length ? <><Check size={16} /> Selesai</> : <>Lanjut <ArrowRight size={16} /></>}
          </button>
        </>
      )}
    </div>
  );
}

function Summary({ result, lang, hasMore, onAgain, onDone }: { result: { right: string[]; wrong: ReviewCard[] }; lang: string; hasMore: boolean; onAgain: () => void; onDone: () => void }) {
  const { addXp } = useProgress();
  const cards = useReviewStore((s) => s.cards);
  const total = result.right.length + result.wrong.length;
  const xp = result.right.length * XP_PER_WORD;
  const awarded = useRef(false);
  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    if (xp > 0) addXp(xp);
  }, [addXp, xp]);
  return (
    <div style={{ marginTop: 24, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><LingoAvatar size={110} /></div>
      <p style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 4px' }}>
        {result.wrong.length === 0 ? 'Semua kata kamu ingat!' : result.right.length >= result.wrong.length ? 'Bagus, sebagian besar kamu ingat!' : 'Tidak apa-apa, kita ulang lagi nanti'}
      </p>
      <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>{result.right.length} dari {total} kata kamu ingat</p>
      {xp > 0 && <p style={{ color: '#facc15', fontSize: 13, fontWeight: 800, margin: '8px 0 0' }}>+{xp} XP</p>}
      {result.wrong.length > 0 && (
        <div style={{ marginTop: 18, textAlign: 'left', background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '6px 14px' }}>
          <p style={{ color: '#52525b', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', margin: '8px 0 4px' }}>MUNCUL LAGI SEBENTAR LAGI</p>
          {result.wrong.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 13.5 }}>
              <span style={{ fontWeight: 700 }}>{c.word}</span>
              <span style={{ color: '#a1a1aa', textAlign: 'right' }}>{c.meaning}</span>
            </div>
          ))}
        </div>
      )}
      <p style={{ color: '#71717a', fontSize: 12.5, margin: '14px 0 0' }}>Ulasan berikutnya {whenText(nextDue(cards, lang))}.</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={onDone} style={{ flex: 1, padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Ke Beranda</button>
        {hasMore && (
          <button onClick={onAgain} style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Ulas lagi</button>
        )}
      </div>
    </div>
  );
}
