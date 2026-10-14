'use client';

// src/app/kartu/page.tsx
// "Kartu ucapan": say a word or sentence from your lessons out loud, and Lingo checks it.
// English with Lingo's voice server: the pronunciation check knows the card, so it marks each word and gives tips.
// Otherwise (other languages, or the server is off): the browser's speech recognition, compared with the card.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Mic, RotateCcw, Square, Volume2 } from 'lucide-react';
import LingoAvatar, { type LingoState } from '@/components/lingo/LingoAvatar';
import { CardsScene } from '@/components/Home/LingoScenes';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useUserStore } from '@/store/useUserStore';
import { useProgress } from '@/hooks/useProgress';
import { buildDecks, type CardDeck, compareHeard, type SpeakingCard, TTS_LANG } from '@/lib/speaking-cards';
import { assessPronunciation, wordsToFix } from '@/lib/lingo-pronunciation';
import { getLingoVoiceHealth, speakSegments, stopLingoSpeech } from '@/lib/lingo-speech';
import { MicRecorder } from '@/lib/mic-recorder';

const FONT = 'system-ui, sans-serif';
const CARDS_PER_SESSION = 8;
const PASS = 70; // score that counts as "said it right"
const XP_PER_CARD = 5;

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
const getRecognition = (): (new () => Recognition) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

type Verdict = { score: number; words: { word: string; ok: boolean }[]; heard: string; tips: { word: string; tip: string }[] };

export default function KartuPage() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.selectedLanguage) ?? 'en';
  const { xp } = useProgress();
  const decks = useMemo(() => buildDecks(lang).filter((d) => d.cards.length > 0), [lang]);
  const [deck, setDeck] = useState<CardDeck | null>(null);
  const [round, setRound] = useState(0); // a new set of cards each time a deck is (re)started

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', display: 'flex', justifyContent: 'center', fontFamily: FONT, color: '#f4f4f5' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '16px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => (deck ? setDeck(null) : router.back())} aria-label="Kembali"
            style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Kartu ucapan</p>
            <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>{deck ? `${deck.title} · ${deck.subtitle}` : 'Ucapkan kartunya, Lingo yang koreksi'}</p>
          </div>
        </div>

        {deck
          ? <CardSession key={`${deck.id}-${round}`} deck={deck} lang={lang} onDone={() => setDeck(null)} onAgain={() => setRound((r) => r + 1)} />
          : <DeckPicker decks={decks} xp={xp} onPick={(d) => { setDeck(d); setRound((r) => r + 1); }} />}
      </div>
    </main>
  );
}

/** Three short words of the deck for the cards Lingo holds */
function deckWords(d: CardDeck): string[] {
  const short = d.cards.filter((c) => c.kind === 'kata' && c.text.length <= 9).map((c) => c.text);
  return short.length >= 3 ? short.slice(0, 3) : ['Hi!', 'Thank you', 'Yes'];
}

function DeckPicker({ decks, xp, onPick }: { decks: CardDeck[]; xp: number; onPick: (d: CardDeck) => void }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg,rgba(167,139,250,0.12),rgba(167,139,250,0.03))', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 18, padding: 14 }}>
        <div style={{ flexShrink: 0 }}><LingoAvatar size={64} /></div>
        <p style={{ margin: 0, fontSize: 13, color: '#d4d4d8', lineHeight: 1.55 }}>Pilih chapter. Dengarkan tiap kartu, lalu ucapkan. Saya tandai kata yang sudah benar dan kasih tips untuk yang belum.</p>
      </div>
      <p style={{ color: '#52525b', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '22px 4px 9px' }}>Pilih chapter</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {decks.map((d) => {
          const open = xp >= d.xpRequired;
          return (
            <button key={d.id} onClick={() => open && onPick(d)} disabled={!open}
              style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '8px 14px 8px 8px', borderRadius: 16, cursor: open ? 'pointer' : 'default', background: '#0e0e14', border: `1px solid ${open ? `${d.color}40` : 'rgba(255,255,255,0.06)'}`, opacity: open ? 1 : 0.7, fontFamily: FONT }}>
              <div style={{ borderRadius: 12, background: open ? `radial-gradient(circle at 50% 70%, ${d.color}30, transparent 72%)` : undefined, flexShrink: 0 }}>
                <CardsScene scale={0.56} color={open ? d.color : '#71717a'} words={deckWords(d)} locked={!open} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: '#f4f4f5', fontSize: 14, fontWeight: 800 }}>{d.title}</p>
                <p style={{ margin: '2px 0 0', color: '#71717a', fontSize: 12 }}>{d.subtitle}</p>
              </div>
              <span style={{ color: open ? d.color : '#71717a', fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                {open ? <>{d.cards.length} kartu <ChevronRight size={14} /></> : `${d.xpRequired} XP`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Up to 8 cards, words first then sentences, mixed a little so each round feels different */
function pickCards(deck: CardDeck): SpeakingCard[] {
  const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  const words = shuffle(deck.cards.filter((c) => c.kind === 'kata'));
  const sentences = shuffle(deck.cards.filter((c) => c.kind === 'kalimat'));
  const half = Math.ceil(CARDS_PER_SESSION / 2);
  const pick = [...words.slice(0, half), ...sentences.slice(0, CARDS_PER_SESSION - Math.min(half, words.length))];
  return pick.slice(0, CARDS_PER_SESSION);
}

type Phase = 'ready' | 'listening' | 'checking' | 'result';

function CardSession({ deck, lang, onDone, onAgain }: { deck: CardDeck; lang: string; onDone: () => void; onAgain: () => void }) {
  const [cards] = useState(() => pickCards(deck));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  const [hint, setHint] = useState('');
  const [serverCheck, setServerCheck] = useState(false); // Lingo's pronunciation check is usable for this card
  const [level, setLevel] = useState(0);
  const [finished, setFinished] = useState(false);
  const recorder = useRef<MicRecorder | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const awarded = useRef(false);
  const { addXp } = useProgress();
  const ttsLang = TTS_LANG[lang] ?? 'en-US';
  const card = cards[index];

  useEffect(() => {
    let alive = true;
    const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    if (lang === 'en' && canRecord) void getLingoVoiceHealth().then((h) => { if (alive) setServerCheck(h?.pronunciation === 'ready'); });
    return () => {
      alive = false;
      recorder.current?.close();
      recognition.current?.abort();
      stopLingoSpeech();
    };
  }, [lang]);

  const listen = () => speakSegments([{ text: card.text, lang: ttsLang }], undefined, { natural: lang === 'en' });

  const grade = (v: Verdict) => {
    setVerdict(v);
    setPhase('result');
    if (best[card.id] === undefined) useUserStore.getState().incrementDailyQuestion(); // counts toward "Kerjakan 5 soal"
    setBest((b) => ({ ...b, [card.id]: Math.max(b[card.id] ?? 0, v.score) }));
  };

  async function start() {
    stopLingoSpeech();
    setHint('');
    setVerdict(null);
    if (serverCheck) {
      const rec = recorder.current ?? new MicRecorder();
      recorder.current = rec;
      try { await rec.open(); } catch { setHint('Izinkan akses mikrofon dulu, lalu ketuk lagi.'); return; }
      setPhase('listening');
      rec.start({ onLevel: setLevel, onEnd: () => void finishRecording(), noSpeechMs: 6000, silenceMs: 1100, maxMs: 8000 });
      return;
    }
    const SR = getRecognition();
    if (!SR) { setHint('Browser ini belum bisa mendengar suara. Coba buka Lingora di Chrome.'); return; }
    const r = new SR();
    r.lang = ttsLang;
    r.continuous = false;
    r.interimResults = false;
    let text = '';
    let failed = '';
    r.onresult = (e) => { text = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(' ').trim(); };
    r.onerror = (e) => { failed = e.error; };
    r.onend = () => {
      recognition.current = null;
      if (!text) {
        setPhase('ready');
        setHint(failed === 'not-allowed' ? 'Izinkan akses mikrofon dulu, lalu ketuk lagi.' : 'Saya belum mendengar suaramu. Coba lagi, ya.');
        return;
      }
      const c = compareHeard(card.text, text, lang);
      grade({ ...c, heard: text, tips: [] });
    };
    recognition.current = r;
    setPhase('listening');
    try { r.start(); } catch { setPhase('ready'); }
  }

  async function finishRecording() {
    const rec = recorder.current;
    if (!rec) return;
    const wav = rec.stop();
    setLevel(0);
    if (!wav) { setPhase('ready'); setHint('Saya belum mendengar suaramu. Coba lagi, ya.'); return; }
    setPhase('checking');
    const result = await assessPronunciation(wav, card.text);
    if (!result) {
      // The check is not available right now: use the browser's recognition from now on
      setServerCheck(false);
      setPhase('ready');
      setHint('Pemeriksa pengucapan sedang tidak tersedia. Ketuk mikrofon dan ulangi, ya.');
      return;
    }
    // The card is known, so a word counts as right only when its sounds were mostly heard (not just free of known mistakes)
    const words = result.words.map((w) => ({ word: w.word, ok: w.ok && (w.match ?? 1) >= 0.6 }));
    const avgMatch = result.words.length ? result.words.reduce((s, w) => s + (w.match ?? 1), 0) / result.words.length : 0;
    const tips = wordsToFix(result, 3).map((w) => ({ word: w.word, tip: w.issues[0].tip }));
    for (const w of result.words) {
      if (tips.length >= 3) break;
      if (!tips.some((t) => t.word === w.word) && (w.match ?? 1) < 0.6) tips.push({ word: w.word, tip: 'Dengarkan cara Lingo mengucapkan kata ini, lalu tirukan pelan-pelan.' });
    }
    grade({ score: Math.round(Math.min(result.score, avgMatch * 100)), heard: result.said, words, tips });
  }

  function stopListening() {
    if (recorder.current && phase === 'listening' && serverCheck) void finishRecording();
    else recognition.current?.stop();
  }

  function next() {
    stopLingoSpeech();
    if (index + 1 >= cards.length) { setFinished(true); return; }
    setIndex(index + 1);
    setPhase('ready');
    setVerdict(null);
    setHint('');
  }

  // XP once, when the round ends: for every card said right
  const passed = cards.filter((c) => (best[c.id] ?? 0) >= PASS).length;
  useEffect(() => {
    if (!finished || awarded.current) return;
    awarded.current = true;
    if (passed > 0) addXp(passed * XP_PER_CARD);
  }, [finished, passed, addXp]);

  if (finished) {
    // Average of the cards tried (skipped cards are listed to practise, but do not count as 0)
    const tried = cards.filter((c) => best[c.id] !== undefined);
    const avg = tried.length ? Math.round(tried.reduce((s, c) => s + best[c.id], 0) / tried.length) : 0;
    const practice = cards.filter((c) => (best[c.id] ?? 0) < PASS);
    return (
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><LingoAvatar size={110} /></div>
        <p style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 4px' }}>{tried.length === 0 ? 'Yuk, coba ucapkan kartunya!' : avg >= 85 ? 'Mantap, ucapanmu jelas!' : avg >= 60 ? 'Bagus, tinggal sedikit lagi!' : 'Terus latihan, ya!'}</p>
        <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>{passed} dari {cards.length} kartu benar{tried.length > 0 && ` · rata-rata ${avg}%`}</p>
        {passed > 0 && <p style={{ color: '#facc15', fontSize: 13, fontWeight: 800, margin: '8px 0 0' }}>+{passed * XP_PER_CARD} XP</p>}
        {practice.length > 0 && (
          <div style={{ marginTop: 18, textAlign: 'left', background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '6px 14px' }}>
            <p style={{ color: '#52525b', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '8px 0 4px' }}>Latih lagi</p>
            {practice.map((c) => (
              <button key={c.id} onClick={() => speakSegments([{ text: c.text, lang: ttsLang }], undefined, { natural: lang === 'en' })}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#e4e4e7', fontSize: 13.5, textAlign: 'left', cursor: 'pointer', fontFamily: FONT }}>
                <Volume2 size={16} color="#a78bfa" /> <span style={{ flex: 1 }}>{c.text}</span>
                <span style={{ color: '#71717a', fontSize: 11.5 }}>{best[c.id] === undefined ? 'dilewati' : `${best[c.id]}%`}</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onDone} style={{ flex: 1, padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Pilih chapter</button>
          <button onClick={onAgain} style={{ flex: 1, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Kartu lain</button>
        </div>
      </div>
    );
  }

  const avatar: LingoState = phase === 'listening' ? 'listening' : phase === 'checking' ? 'thinking' : 'idle';
  const good = verdict && verdict.score >= PASS;
  return (
    <div style={{ marginTop: 16 }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ width: `${(index / cards.length) * 100}%`, height: '100%', borderRadius: 99, background: deck.color, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ color: '#71717a', fontSize: 12, fontWeight: 700 }}>{index + 1}/{cards.length}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}><LingoAvatar size={92} state={avatar} /></div>

      {/* The card */}
      <div style={{ marginTop: 10, background: '#0e0e14', border: `1px solid ${verdict ? (good ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.4)') : `${deck.color}40`}`, borderRadius: 22, padding: '18px 18px 16px', textAlign: 'center', boxShadow: `0 0 30px ${deck.color}12` }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: deck.color, background: `${deck.color}18`, padding: '3px 9px', borderRadius: 99, textTransform: 'uppercase' }}>{card.kind}</span>
        <p style={{ margin: '12px 0 0', fontSize: card.kind === 'kata' ? 30 : 22, fontWeight: 800, lineHeight: 1.3 }}>
          {verdict
            ? verdict.words.map((w, i) => (
                <span key={i}><span style={{ color: w.ok ? '#34d399' : '#f87171' }}>{w.word}</span>{i < verdict.words.length - 1 ? ' ' : ''}</span>
              ))
            : card.text}
        </p>
        {card.phonetic && <p style={{ margin: '6px 0 0', color: '#a1a1aa', fontSize: 13 }}>{card.phonetic}</p>}
        {card.meaning && <p style={{ margin: '8px 0 0', color: '#71717a', fontSize: 13, lineHeight: 1.5 }}>{card.meaning}</p>}
        <button onClick={listen} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(92,250,46,0.35)', background: 'rgba(92,250,46,0.08)', color: '#bef264', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          <Volume2 size={15} /> Dengar Lingo
        </button>
      </div>

      {/* What happened */}
      {verdict && (
        <div style={{ marginTop: 12, background: good ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${good ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 16, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: good ? '#34d399' : '#f87171' }}>{verdict.score >= 85 ? 'Mantap!' : good ? 'Sudah benar!' : verdict.score >= 40 ? 'Hampir, coba lagi' : 'Belum tepat, coba lagi'}</p>
            <span style={{ fontSize: 18, fontWeight: 900, color: good ? '#34d399' : '#f87171' }}>{verdict.score}%</span>
          </div>
          {verdict.heard && <p style={{ margin: '6px 0 0', color: '#a1a1aa', fontSize: 12.5 }}>Saya dengar: &ldquo;{verdict.heard}&rdquo;</p>}
          {verdict.tips.map((t) => (
            <div key={t.word} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
              <button onClick={() => speakSegments([{ text: t.word, lang: ttsLang }], undefined, { natural: lang === 'en' })}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 99, border: '1px solid rgba(92,250,46,0.4)', background: 'rgba(92,250,46,0.1)', color: '#bef264', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                <Volume2 size={13} /> {t.word}
              </button>
              <p style={{ margin: 0, color: '#d4d4d8', fontSize: 12.5, lineHeight: 1.5 }}>{t.tip}</p>
            </div>
          ))}
        </div>
      )}

      {hint && <p style={{ textAlign: 'center', color: '#facc15', fontSize: 13, margin: '12px 0 0' }}>{hint}</p>}

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 18 }}>
        {phase === 'result' ? (
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={start} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
              <RotateCcw size={16} /> Coba lagi
            </button>
            <button onClick={next} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
              {index + 1 >= cards.length ? <><Check size={16} /> Selesai</> : <>Lanjut <ArrowRight size={16} /></>}
            </button>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              {phase === 'listening' && <span style={{ position: 'absolute', inset: -8, borderRadius: '50%', background: 'rgba(167,139,250,0.18)', transform: `scale(${1 + level * 0.45})`, transition: 'transform 0.08s linear' }} />}
              <button onClick={phase === 'listening' ? stopListening : start} disabled={phase === 'checking'}
                aria-label={phase === 'listening' ? 'Selesai bicara' : 'Mulai bicara'}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: 'none', cursor: phase === 'checking' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: phase === 'checking' ? '#27272a' : '#a78bfa', boxShadow: phase === 'listening' ? '0 0 30px rgba(167,139,250,0.55)' : '0 8px 24px rgba(0,0,0,0.4)' }}>
                {phase === 'listening' ? <Square size={24} color="#1e1b4b" fill="#1e1b4b" /> : <Mic size={30} color={phase === 'checking' ? '#52525b' : '#1e1b4b'} />}
              </button>
            </div>
            <p style={{ margin: 0, color: phase === 'checking' ? '#facc15' : '#a1a1aa', fontSize: 13, fontWeight: 600 }}>
              {phase === 'listening' ? 'Saya mendengarkan… ketuk untuk selesai' : phase === 'checking' ? 'Lingo memeriksa ucapanmu…' : 'Ketuk mikrofon, lalu ucapkan kartunya'}
            </p>
            <button onClick={next} style={{ background: 'none', border: 'none', color: '#52525b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Lewati kartu</button>
          </>
        )}
      </div>
    </div>
  );
}
