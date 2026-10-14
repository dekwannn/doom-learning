'use client';

// src/app/skenario/page.tsx
// "Ngobrol skenario": spoken English role-plays with Lingo (barista, shop assistant, new classmate, ...).
// Each scenario has three small missions; Lingo ticks them off as the learner reaches them, corrects
// pronunciation along the way, and the end shows the missions, XP and the words to practise.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Lightbulb, RotateCcw, Volume2 } from 'lucide-react';
import { SCENARIO_SCENES } from '@/components/Home/LingoScenes';
import LingoVoiceMode from '@/components/lingo/LingoVoiceMode';
import LingoAvatar from '@/components/lingo/LingoAvatar';
import { askLingo } from '@/lib/lingo-ai';
import { type PronunciationResult, wordsToFix } from '@/lib/lingo-pronunciation';
import { speakSegments } from '@/lib/lingo-speech';
import { buildScenarioPrompt, readMissionReport, type Scenario, SCENARIOS } from '@/lib/scenarios';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useProgress } from '@/hooks/useProgress';

const FONT = 'system-ui, sans-serif';
const XP_PER_MISSION = 10;
const DONE_KEY = 'lingora_scenarios_done'; // scenarios finished on this phone (for a check mark on the list)
const ENGLISH = { flag: 'EN', name: 'Inggris', ttsLang: 'en-US' };

type Correction = { word: string; tip: string };
type Result = { scenario: Scenario; done: number[]; corrections: Correction[]; turns: number };

function readFinished(): string[] {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]'); } catch { return []; }
}

export default function SkenarioPage() {
  const router = useRouter();
  const lang = useLanguageStore((s) => s.selectedLanguage) ?? 'en';
  const [playing, setPlaying] = useState<Scenario | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [finished, setFinished] = useState<string[]>([]);
  useEffect(() => { setFinished(readFinished()); }, [result]); // eslint-disable-line react-hooks/set-state-in-effect -- read once from this phone

  if (playing) return <RolePlay scenario={playing} onEnd={(r) => { setPlaying(null); setResult(r.turns > 0 ? r : null); }} />;
  if (result) return <Summary result={result} onAgain={() => { setResult(null); setPlaying(result.scenario); }} onList={() => setResult(null)} />;

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', display: 'flex', justifyContent: 'center', fontFamily: FONT, color: '#f4f4f5' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '16px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} aria-label="Kembali"
            style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Ngobrol skenario</p>
            <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>Lingo jadi lawan bicaramu</p>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center', background: 'linear-gradient(135deg,rgba(251,146,60,0.12),rgba(251,146,60,0.03))', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 18, padding: 14 }}>
          <div style={{ flexShrink: 0 }}><LingoAvatar size={64} /></div>
          <p style={{ margin: 0, fontSize: 13, color: '#d4d4d8', lineHeight: 1.55 }}>
            Pilih situasi, lalu ngobrol pakai suaramu. Selesaikan 3 misinya. Bingung mau bilang apa? Ketuk <b>Bantuan</b>.
            {lang !== 'en' && <span style={{ display: 'block', marginTop: 6, color: '#facc15' }}>Skenario saat ini dalam bahasa Inggris.</span>}
          </p>
        </div>

        <p style={{ color: '#52525b', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '22px 4px 9px' }}>Pilih situasi</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SCENARIOS.map((s) => {
            const Scene = SCENARIO_SCENES[s.id];
            const done = finished.includes(s.id);
            return (
              <button key={s.id} onClick={() => setPlaying(s)}
                style={{ position: 'relative', textAlign: 'left', padding: 0, overflow: 'hidden', borderRadius: 18, cursor: 'pointer', background: '#0e0e14', border: `1px solid ${s.color}40`, fontFamily: FONT }}>
                {done && <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 3, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px 2px 4px', borderRadius: 99, background: '#10b981', color: '#04342c', fontSize: 9.5, fontWeight: 800 }}><Check size={11} strokeWidth={3} /> Selesai</span>}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 4px 0', background: `radial-gradient(circle at 50% 75%, ${s.color}30, transparent 70%)` }}>
                  {Scene && <Scene />}
                </div>
                <div style={{ padding: '6px 12px 12px' }}>
                  <p style={{ margin: 0, color: '#f4f4f5', fontSize: 13.5, fontWeight: 800, lineHeight: 1.3 }}>{s.title}</p>
                  <p style={{ margin: '3px 0 0', color: '#71717a', fontSize: 11.5 }}>{s.place} · 3 misi</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function RolePlay({ scenario, onEnd }: { scenario: Scenario; onEnd: (r: Result) => void }) {
  const [done, setDone] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const corrections = useRef<Correction[]>([]);
  const turns = useRef(0);
  const doneRef = useRef<number[]>([]);
  const total = scenario.missions.length;
  const next = scenario.missions.findIndex((_, i) => !done.includes(i));

  const ask = useCallback(
    (history: { role: 'user' | 'assistant'; content: string }[], text: string) =>
      askLingo({ system: buildScenarioPrompt(scenario), history, userText: text, temperature: 0.7, maxTokens: 260 }),
    [scenario],
  );
  // Lingo's report of the missions done is taken out of what is shown and spoken
  const filterReply = useCallback((reply: string) => {
    const { text, done: report } = readMissionReport(reply, total);
    if (report) {
      const merged = [...new Set([...doneRef.current, ...report])].sort();
      doneRef.current = merged;
      setDone(merged);
      if (merged.length > 0) setShowHelp(false);
    }
    return text;
  }, [total]);
  const onCheck = useCallback((r: PronunciationResult) => {
    for (const w of wordsToFix(r, 3)) {
      if (!corrections.current.some((c) => c.word.toLowerCase() === w.word.toLowerCase())) corrections.current.push({ word: w.word, tip: w.issues[0].tip });
    }
  }, []);
  const end = () => onEnd({ scenario, done: doneRef.current, corrections: corrections.current, turns: turns.current });

  const panel = (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${scenario.color}35`, borderRadius: 16, padding: '10px 12px', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: scenario.color, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em' }}>MISI {done.length}/{total}</span>
        {done.length < total ? (
          <button onClick={() => setShowHelp((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#facc15', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Lightbulb size={14} /> Bantuan
          </button>
        ) : (
          <button onClick={end} style={{ background: '#10b981', border: 'none', color: '#04342c', fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 99, cursor: 'pointer' }}>Lihat hasil</button>
        )}
      </div>
      {scenario.missions.map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done.includes(i) ? '#10b981' : 'transparent', border: done.includes(i) ? 'none' : `1.5px solid ${i === next ? scenario.color : '#3f3f46'}` }}>
            {done.includes(i) && <Check size={11} color="#04342c" strokeWidth={3} />}
          </span>
          <span style={{ fontSize: 12.5, color: done.includes(i) ? '#71717a' : i === next ? '#f4f4f5' : '#a1a1aa', textDecoration: done.includes(i) ? 'line-through' : 'none', fontWeight: i === next ? 700 : 500 }}>{m.text}</span>
        </div>
      ))}
      {showHelp && next >= 0 && (
        <button onClick={() => speakSegments([{ text: scenario.missions[next].example, lang: 'en-US' }], undefined, { natural: true })}
          style={{ marginTop: 8, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', fontFamily: FONT }}>
          <Volume2 size={15} color="#facc15" style={{ flexShrink: 0 }} />
          <span style={{ color: '#fde68a', fontSize: 12.5 }}>Coba bilang: <b>&ldquo;{scenario.missions[next].example}&rdquo;</b></span>
        </button>
      )}
    </div>
  );

  return (
    <LingoVoiceMode
      target={ENGLISH}
      title={scenario.title}
      history={[{ role: 'assistant', content: scenario.opener }]}
      opener={scenario.opener}
      ask={ask}
      onTurn={() => { turns.current++; }}
      onClose={end}
      filterReply={filterReply}
      onCheck={onCheck}
      panel={panel}
    />
  );
}

function Summary({ result, onAgain, onList }: { result: Result; onAgain: () => void; onList: () => void }) {
  const { addXp } = useProgress();
  const { scenario, done, corrections } = result;
  const total = scenario.missions.length;
  const xp = done.length * XP_PER_MISSION;
  const awarded = useRef(false);

  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    if (xp > 0) addXp(xp);
    if (done.length === total) {
      try { localStorage.setItem(DONE_KEY, JSON.stringify([...new Set([...readFinished(), scenario.id])])); } catch { /* storage blocked */ }
    }
  }, [addXp, xp, done.length, total, scenario.id]);

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', display: 'flex', justifyContent: 'center', fontFamily: FONT, color: '#f4f4f5' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '36px 16px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><LingoAvatar size={110} /></div>
        <p style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 4px' }}>{done.length === total ? 'Misi selesai semua!' : done.length > 0 ? 'Bagus, sebagian misi beres!' : 'Ayo coba lagi!'}</p>
        <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>{scenario.title} · {done.length} dari {total} misi</p>
        {xp > 0 && <p style={{ color: '#facc15', fontSize: 13, fontWeight: 800, margin: '8px 0 0' }}>+{xp} XP</p>}

        <div style={{ marginTop: 18, textAlign: 'left', background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '10px 14px' }}>
          {scenario.missions.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done.includes(i) ? '#10b981' : 'rgba(255,255,255,0.06)' }}>
                {done.includes(i) && <Check size={12} color="#04342c" strokeWidth={3} />}
              </span>
              <span style={{ fontSize: 13.5, color: done.includes(i) ? '#e4e4e7' : '#71717a' }}>{m.text}</span>
            </div>
          ))}
        </div>

        {corrections.length > 0 && (
          <div style={{ marginTop: 12, textAlign: 'left', background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 16, padding: '10px 14px' }}>
            <p style={{ color: '#facc15', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', margin: '2px 0 8px' }}>LATIH PENGUCAPAN INI</p>
            {corrections.map((c) => (
              <div key={c.word} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0' }}>
                <button onClick={() => speakSegments([{ text: c.word, lang: 'en-US' }], undefined, { natural: true })}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 99, border: '1px solid rgba(92,250,46,0.4)', background: 'rgba(92,250,46,0.1)', color: '#bef264', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
                  <Volume2 size={13} /> {c.word}
                </button>
                <p style={{ margin: 0, color: '#d4d4d8', fontSize: 12.5, lineHeight: 1.5 }}>{c.tip}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onList} style={{ flex: 1, padding: 13, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#e4e4e7', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Skenario lain</button>
          <button onClick={onAgain} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${scenario.color},${scenario.color}cc)`, color: '#0a0a0d', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
            <RotateCcw size={16} /> Main lagi
          </button>
        </div>
      </div>
    </main>
  );
}
