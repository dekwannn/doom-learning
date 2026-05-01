// src/app/learn/[stageId]/page.tsx
'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useProgress } from '@/hooks/useProgress';
import { StrokeOrderModal } from '@/components/StrokeOrderModal';

import enStudyData     from '@/data/studyData.json';
import enDummyData     from '@/data/dummyData.json';
import jaStudyData     from '@/data/jaStudyData.json';
import jaAdventureData from '@/data/jaData.json';
import zhStudyData     from '@/data/zhStudyData.json';
import zhAdventureData from '@/data/zhData.json';
import koStudyData     from '@/data/koStudyData.json';
import koAdventureData from '@/data/koData.json';

const STUDY_DATA_MAP: Record<string, any> = {
  en: enStudyData,
  ja: jaStudyData,
  zh: zhStudyData,
  ko: koStudyData, 
};

const CHAPTERS_DATA_MAP: Record<string, any> = {
  en: enDummyData,
  ja: jaAdventureData,
  zh: zhAdventureData,
  ko: koAdventureData,
};

interface Props { params: Promise<{ stageId: string }> }
interface Example  { en: string; id: string }
interface Section  { type: string; heading: string; body: string; examples: Example[]; tip?: string }
interface StudyEntry { title: string; intro: string; sections: Section[]; practice: any[] }

/* ══════════════════════════════════════════════════════════
   KANJIVG DATA — CC BY 3.0 Ulrich Apel / kanjivg.tagaini.net
   viewBox: 0 0 109 109
   Each entry: array of SVG path "d" strings, one per stroke.
   These are the actual calligraphic paths used by KanjiVG.
   ══════════════════════════════════════════════════════════ */
interface CharData { char: string; label: string; strokes: string[] }

/* ══════════════════════════════════════════════════════════
   Section meta, render modes — unchanged
   ══════════════════════════════════════════════════════════ */
const SECTION_META: Record<string, { label: string; color: string; accent: string; icon: string }> = {
  vocabulary:    { label: 'Kosakata',    color: '#10b981', accent: 'rgba(16,185,129,0.08)',  icon: '' },
  grammar:       { label: 'Tata Bahasa', color: '#3b82f6', accent: 'rgba(59,130,246,0.08)',  icon: ''  },
  conversation:  { label: 'Percakapan',  color: '#a855f7', accent: 'rgba(168,85,247,0.08)',  icon: '' },
  pronunciation: { label: 'Pengucapan',  color: '#f59e0b', accent: 'rgba(245,158,11,0.08)',  icon: '' },
  culture:       { label: 'Budaya',      color: '#ec4899', accent: 'rgba(236,72,153,0.08)',  icon: '' },
};
function getSectionMeta(t: string) {
  return SECTION_META[t] ?? { label: t, color: '#71717a', accent: 'rgba(113,113,122,0.08)', icon: '📝' };
}
const getRenderMode = (t: string) =>
  ['vocabulary','pronunciation','conversation'].includes(t) ? 'bilingual' : 'fullwidth';

const isStrokeSection = (s: Section) =>
  s.type === 'grammar' &&
  (s.heading.toLowerCase().includes('goresan') ||
   s.heading.toLowerCase().includes('stroke') ||
   s.heading.toLowerCase().includes('menulis'));

/* ── TTS ── */
function speak(text: string, lang = 'ja-JP') {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.85; window.speechSynthesis.speak(u);
}

const getTtsLang = (l: string) => {
  if (l === 'ja') return 'ja-JP';
  if (l === 'zh') return 'zh-CN';
  if (l === 'ko') return 'ko-KR';   
  return 'en-US';
};

const getColLabel = (lang: string) => {
  if (lang === 'ja') return 'Jepang';
  if (lang === 'zh') return 'Mandarin';  
  if (lang === 'ko') return 'Korea';
  return 'English';
};

function PlayBtn({ text, color, ttsLang }: { text: string; color: string; ttsLang: string }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={() => { setP(true); speak(text, ttsLang); setTimeout(() => setP(false), 1600); }} title="Dengarkan"
      style={{ flexShrink:0, width:24, height:24, borderRadius:7, background:p?color:'rgba(255,255,255,0.06)', border:`1px solid ${p?color:'rgba(255,255,255,0.1)'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
      {p ? <div style={{ display:'flex', gap:'1.5px', alignItems:'end', height:10 }}>{[60,100,70].map((h,i)=><div key={i} style={{ width:2, background:'white', borderRadius:1, height:`${h}%` }}/>)}</div>
         : <svg width="8" height="9" viewBox="0 0 9 10" fill="none"><path d="M2 1.5l5 3-5 3V1.5z" fill={color}/></svg>}
    </button>
  );
}

function BilingualRow({ ex, color, ttsLang }: { ex: Example; color: string; ttsLang: string }) {
  const hasArrow = ex.en.includes('→');
  if (hasArrow) {
    const [left, ...rest] = ex.en.split('→').map(s => s.trim());
    const right = rest.join(' → ');
    return (
      <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${color}22`, background:`${color}07` }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr auto', alignItems:'stretch' }}>
          <div style={{ padding:'9px 12px', background:`${color}10` }}><span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#f4f4f5' }}>{left}</span></div>
          <div style={{ padding:'0 8px', color:'#facc15', fontSize:14, fontWeight:900, display:'flex', alignItems:'center' }}>→</div>
          <div style={{ padding:'9px 12px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color }}>{right}</span>
            {ex.id && <span style={{ fontSize:11, color:'#71717a', marginTop:2, fontStyle:'italic' }}>{ex.id}</span>}
          </div>
          <div style={{ display:'flex', alignItems:'center', padding:'0 8px' }}><PlayBtn text={left} color={color} ttsLang={ttsLang}/></div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:7 }}>
        <PlayBtn text={ex.en} color={color} ttsLang={ttsLang}/>
        <span style={{ color:'#f4f4f5', fontSize:13, fontWeight:500, lineHeight:1.45 }}>{ex.en}</span>
      </div>
      <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.015)', display:'flex', alignItems:'center' }}>
        <span style={{ color:'#a1a1aa', fontSize:12, lineHeight:1.5, fontStyle:'italic' }}>{ex.id}</span>
      </div>
    </div>
  );
}

function FullWidthRow({ ex, color }: { ex: Example; color: string }) {
  const hasArrow = ex.en.includes('→');
  if (hasArrow) {
    const [left, ...rest] = ex.en.split('→').map(s => s.trim());
    const right = rest.join(' → ');
    return (
      <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${color}20`, background:`${color}06` }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto auto 1fr', alignItems:'center' }}>
          <div style={{ padding:'10px 14px', background:`${color}12`, borderRight:`1px solid ${color}18` }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'#f4f4f5', whiteSpace:'nowrap' }}>{left}</span>
          </div>
          <div style={{ padding:'0 10px', color:'#facc15', fontSize:14, fontWeight:900 }}>→</div>
          <div style={{ padding:'10px 14px 10px 0' }}>
            <span style={{ fontSize:13, fontWeight:600, color, display:'block', lineHeight:1.5 }}>{right}</span>
            {ex.id && <span style={{ fontSize:12, color:'#71717a', fontStyle:'italic', marginTop:3, display:'block', lineHeight:1.5 }}>{ex.id}</span>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ borderRadius:10, border:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)', padding:'11px 14px', display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ fontSize:13, fontWeight:600, color:'#e4e4e7', lineHeight:1.5 }}>{ex.en}</span>
      {ex.id && <span style={{ fontSize:12, color:'#71717a', fontStyle:'italic', lineHeight:1.55 }}>{ex.id}</span>}
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({ section, id, lang }: { section: Section; id?: string; lang: string }) {
  const [showModal, setShowModal] = useState(false);
  const meta        = getSectionMeta(section.type);
  const isBilingual = getRenderMode(section.type) === 'bilingual';
  const ttsLang     = getTtsLang(lang);
  const colA        = getColLabel(lang);
  const showBtn     = isStrokeSection(section);

  return (
    <>
      <div id={id} style={{ background:'#0e0e14', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ padding:'13px 16px 11px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:10, background:meta.accent }}>
          <div style={{ width:4, height:32, borderRadius:2, background:meta.color, flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:meta.color }}>{meta.label}</span>
              <span style={{ fontSize:12 }}>{meta.icon}</span>
            </div>
            <h3 style={{ color:'#f4f4f5', fontSize:14, fontWeight:700, margin:0, lineHeight:1.2 }}>{section.heading}</h3>
          </div>
          {showBtn && (
            <button
              onClick={() => setShowModal(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:10, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, transition:'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(245,158,11,0.18)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(245,158,11,0.1)'; }}
            >
              <svg width="11" height="12" viewBox="0 0 11 12" fill="none"><polygon points="1,0.5 10.5,6 1,11.5" fill="#f59e0b"/></svg>
              Lihat Animasi
            </button>
          )}
        </div>
        <div style={{ padding:'14px 16px' }}>
          <p style={{ color:'#a1a1aa', fontSize:13, lineHeight:1.7, margin:section.examples.length>0?'0 0 14px':0 }}>{section.body}</p>
          {section.examples.length > 0 && (
            <>
              {isBilingual && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', padding:'0 12px 6px' }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', color:'#52525b', textTransform:'uppercase' }}>{colA}</span>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', color:'#52525b', textTransform:'uppercase' }}>Indonesia</span>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {section.examples.map((ex, i) =>
                  isBilingual ? <BilingualRow key={i} ex={ex} color={meta.color} ttsLang={ttsLang}/> : <FullWidthRow key={i} ex={ex} color={meta.color}/>
                )}
              </div>
            </>
          )}
          {section.tip && (
            <div style={{ marginTop:14, padding:'10px 14px', borderRadius:10, background:'rgba(250,204,21,0.05)', border:'1px solid rgba(250,204,21,0.12)', display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:13, flexShrink:0, marginTop:1 }}>💡</span>
              <p style={{ color:'#a08a30', fontSize:12, lineHeight:1.6, margin:0 }}>{section.tip}</p>
            </div>
          )}
        </div>
      </div>
      {showModal && <StrokeOrderModal onClose={() => setShowModal(false)}/>}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PRACTICE — unchanged
   ══════════════════════════════════════════════════════════ */
const PRACTICE_LABELS: Record<string,string> = {
  translation_quiz:'Terjemahan', fill_in_blank:'Isi Kosong', matching_word:'Cocokkan',
  listening_quiz:'Listening', speaking_test:'Speaking', mini_conversation:'Percakapan',
};

function ChoicePractice({ item, onDone, chColor }: { item:any; onDone:(c:boolean)=>void; chColor:string }) {
  const [sel,setSel]=useState<string|null>(null); const [chk,setChk]=useState(false);
  const c=item.content; const ok=sel===c.correctAnswer;
  const check=()=>{if(!sel||chk)return;setChk(true);setTimeout(()=>onDone(ok),1000);};
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <p style={{ color:'#f4f4f5', fontSize:14, fontWeight:600, lineHeight:1.65, margin:0 }}>{c.question||c.sentence}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {c.options.map((opt:string)=>{
          const isSel=sel===opt, isRight=chk&&opt===c.correctAnswer, isWrong=chk&&isSel&&!ok;
          return <button key={opt} onClick={()=>!chk&&setSel(opt)} style={{ background:isRight?'rgba(16,185,129,0.1)':isWrong?'rgba(239,68,68,0.1)':isSel?`${chColor}18`:'rgba(255,255,255,0.03)', border:`1px solid ${isRight?'rgba(16,185,129,0.35)':isWrong?'rgba(239,68,68,0.35)':isSel?chColor:'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'11px 14px', textAlign:'left', color:isRight?'#34d399':isWrong?'#f87171':isSel?'#fff':'#d4d4d8', fontSize:13, fontWeight:500, cursor:chk?'default':'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:8 }}>
            {chk&&isRight&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {chk&&isWrong&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/></svg>}
            {opt}
          </button>;
        })}
      </div>
      {chk&&<div style={{ padding:'10px 14px', borderRadius:10, background:ok?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}` }}><p style={{ color:ok?'#6ee7b7':'#fca5a5', fontSize:12, lineHeight:1.6, margin:0 }}>{c.explanation}</p></div>}
      {!chk&&<button onClick={check} disabled={!sel} style={{ width:'100%', height:46, borderRadius:10, background:sel?`${chColor}1a`:'rgba(255,255,255,0.02)', border:`1px solid ${sel?`${chColor}44`:'rgba(255,255,255,0.05)'}`, color:sel?chColor:'#3f3f46', fontSize:13, fontWeight:700, cursor:sel?'pointer':'default', transition:'all 0.2s' }}>Cek Jawaban</button>}
    </div>
  );
}

function MatchingPractice({ item, onDone, chColor }: { item:any; onDone:(c:boolean)=>void; chColor:string }) {
  const pairs:{word:string;meaning:string}[]=item.content.pairs; const shuffled:string[]=item.content.shuffledMeanings;
  const [selW,setSelW]=useState<string|null>(null); const [matches,setMatches]=useState<Record<string,string>>({});
  const [wrong,setWrong]=useState<string|null>(null); const [done,setDone]=useState(false);
  const C=['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6'];
  const hw=(w:string)=>{if(done)return;setSelW(p=>p===w?null:w);};
  const hm=(m:string)=>{
    if(!selW||done)return;
    const ex=Object.keys(matches).find(w=>matches[w]===m); const next={...matches}; if(ex)delete next[ex]; next[selW]=m;
    setMatches(next); setSelW(null);
    if(pairs.find(p=>p.word===selW)?.meaning!==m){setWrong(m);setTimeout(()=>setWrong(null),600);}
    if(Object.keys(next).length===pairs.length) setTimeout(()=>{setDone(true);onDone(pairs.every(p=>next[p.word]===p.meaning));},400);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <p style={{ color:'#f4f4f5', fontSize:14, fontWeight:600, lineHeight:1.5, margin:0 }}>{item.content.instruction}</p>
      {selW&&<p style={{ color:'#71717a', fontSize:11, margin:0, fontStyle:'italic' }}>Pilih arti untuk: <span style={{ color:chColor, fontWeight:700 }}>{selW}</span></p>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {pairs.map((p)=>{const isM=!!matches[p.word],isSel=selW===p.word,idx=Object.keys(matches).indexOf(p.word),isOk=done&&matches[p.word]===p.meaning;return <button key={p.word} onClick={()=>!isM&&hw(p.word)} style={{ padding:'9px 11px', borderRadius:10, fontSize:13, fontWeight:700, textAlign:'left', background:done?(isOk?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'):isSel?`${chColor}1a`:'rgba(255,255,255,0.03)', border:done?`1px solid ${isOk?'rgba(16,185,129,0.35)':'rgba(239,68,68,0.35)'}`:isSel?`1px solid ${chColor}`:`1px solid ${isM?C[idx%C.length]+'44':'rgba(255,255,255,0.07)'}`, color:done?(isOk?'#6ee7b7':'#fca5a5'):isSel?chColor:'#d4d4d8', cursor:isM?'default':'pointer', transition:'all 0.15s' }}>{p.word}</button>;})}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {shuffled.map((m)=>{const mW=Object.keys(matches).find(w=>matches[w]===m),isM=!!mW,isW=wrong===m,idx=mW?Object.keys(matches).indexOf(mW):-1;const isOk=done&&mW&&matches[mW]===pairs.find(p=>p.word===mW)?.meaning;return <button key={m} onClick={()=>!isM&&selW&&hm(m)} style={{ padding:'9px 11px', borderRadius:10, fontSize:12, fontWeight:600, textAlign:'left', background:done?(isOk?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'):isW?'rgba(239,68,68,0.08)':'rgba(255,255,255,0.03)', border:done?`1px solid ${isOk?'rgba(16,185,129,0.35)':'rgba(239,68,68,0.35)'}`:isW?'1px solid rgba(239,68,68,0.35)':`1px solid ${isM?C[idx%C.length]+'44':'rgba(255,255,255,0.07)'}`, color:done?(isOk?'#6ee7b7':'#fca5a5'):isW?'#fca5a5':'#a1a1aa', cursor:isM?'default':'pointer', transition:'all 0.15s' }}>{m}</button>;})}
        </div>
      </div>
      {done&&item.content.explanation&&<div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)' }}><p style={{ color:'#6ee7b7', fontSize:12, lineHeight:1.6, margin:0 }}>{item.content.explanation}</p></div>}
    </div>
  );
}

function ListeningPractice({ item, onDone, chColor, lang }: { item:any; onDone:(c:boolean)=>void; chColor:string; lang:string }) {
  const c=item.content; const tts=getTtsLang(lang);
  const [playing,setPlaying]=useState(false); const [pc,setPc]=useState(0);
  const [sel,setSel]=useState<string|null>(null); const [chk,setChk]=useState(false); const ok=sel===c.correctAnswer;
  const play=()=>{setPlaying(true);setPc(n=>n+1);speak(c.audioText,tts);setTimeout(()=>setPlaying(false),Math.max(c.audioText.length*70,2000));};
  const check=()=>{if(!sel||chk)return;setChk(true);setTimeout(()=>onDone(ok),1000);};
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ borderRadius:12, padding:'14px', background:`${chColor}10`, border:`1px solid ${chColor}25`, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={play} style={{ width:50, height:50, borderRadius:14, background:playing?`${chColor}40`:`${chColor}20`, border:`1.5px solid ${playing?chColor:`${chColor}40`}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:playing?`0 0 16px ${chColor}50`:'none', transition:'all 0.2s' }}>
          {playing?<div style={{ display:'flex', gap:'2px', alignItems:'end', height:18 }}>{[50,90,65,80].map((h,i)=><div key={i} style={{ width:3, background:chColor, borderRadius:2, height:`${h}%` }}/>)}</div>:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color:chColor, marginLeft:2 }}><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <div><p style={{ color:chColor, fontSize:11, fontWeight:700, margin:'0 0 2px' }}>🎧 Audio</p><p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:0 }}>{playing?'Sedang diputar...':pc>0?`Diputar ${pc}× — tap ulang`:'Tap untuk mendengarkan'}</p></div>
      </div>
      <p style={{ color:'#e4e4e7', fontSize:14, fontWeight:600, margin:0 }}>{c.question}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {c.options.map((opt:string)=>{const isSel=sel===opt,isRight=chk&&opt===c.correctAnswer,isWrong=chk&&isSel&&!ok;return <button key={opt} onClick={()=>!chk&&setSel(opt)} style={{ background:isRight?'rgba(16,185,129,0.1)':isWrong?'rgba(239,68,68,0.1)':isSel?`${chColor}18`:'rgba(255,255,255,0.03)', border:`1px solid ${isRight?'rgba(16,185,129,0.35)':isWrong?'rgba(239,68,68,0.35)':isSel?chColor:'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'11px 14px', textAlign:'left', color:isRight?'#34d399':isWrong?'#f87171':isSel?'#fff':'#d4d4d8', fontSize:13, fontWeight:500, cursor:chk?'default':'pointer', transition:'all 0.15s' }}>{isRight?'✓ ':isWrong?'✗ ':''}{opt}</button>;})}
      </div>
      {chk&&<div style={{ padding:'10px 14px', borderRadius:10, background:ok?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}` }}><p style={{ color:ok?'#6ee7b7':'#fca5a5', fontSize:12, lineHeight:1.6, margin:0 }}>{c.explanation}</p></div>}
      {!chk&&<button onClick={check} disabled={!sel} style={{ width:'100%', height:46, borderRadius:10, background:sel?`${chColor}1a`:'rgba(255,255,255,0.02)', border:`1px solid ${sel?`${chColor}44`:'rgba(255,255,255,0.05)'}`, color:sel?chColor:'#3f3f46', fontSize:13, fontWeight:700, cursor:sel?'pointer':'default', transition:'all 0.2s' }}>Cek Jawaban</button>}
    </div>
  );
}

function SpeakingPractice({ item, onDone, chColor, lang }: { item:any; onDone:(c:boolean)=>void; chColor:string; lang:string }) {
  const c=item.content; const tts=getTtsLang(lang);
  const [status,setStatus]=useState<'idle'|'listening'|'done'>('idle');
  const [transcript,setTranscript]=useState(''); const [score,setScore]=useState(0); const [micOk,setMicOk]=useState(true);
  const recRef=useRef<any>(null);
  useEffect(()=>{
    if(typeof window==='undefined')return;
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){setMicOk(false);return;}
    const rec=new SR(); rec.continuous=false; rec.interimResults=false; rec.lang=tts;
    recRef.current=rec; return ()=>{rec.abort();};
  },[tts]);
  const start=()=>{
    const rec=recRef.current; if(!rec||status!=='idle')return; setStatus('listening'); setTranscript('');
    rec.onresult=(e:any)=>{
      const t=e.results[0][0].transcript;
      const norm=(s:string)=>s.toLowerCase().replace(/[^a-z\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\s]/g,'').trim();
      const wa=norm(t).split(/\s+/),wb=norm(c.phrase).split(/\s+/);
      const s=Math.round((wa.filter((w:string)=>wb.includes(w)).length/Math.max(wb.length,1))*100);
      setTranscript(t); setScore(s); setStatus('done'); setTimeout(()=>onDone(s>=60),1200);
    };
    rec.onerror=()=>{setStatus('done');setScore(0);onDone(true);}; rec.start();
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:12, padding:'16px', textAlign:'center' }}>
        <p style={{ color:'#71717a', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', margin:'0 0 8px' }}>Ucapkan</p>
        <p style={{ color:'#e4d9fb', fontSize:18, fontWeight:800, margin:'0 0 4px' }}>{c.phrase}</p>
        <p style={{ color:'#71717a', fontSize:12, fontStyle:'italic', margin:0 }}>{c.translation}</p>
        {c.hint&&<p style={{ color:'rgba(255,255,255,0.25)', fontSize:11, margin:'6px 0 0' }}>{c.hint}</p>}
      </div>
      {!micOk&&<div style={{ padding:'12px', borderRadius:10, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', textAlign:'center' }}><p style={{ color:'#fca5a5', fontSize:12, margin:'0 0 8px' }}>Mic tidak tersedia.</p><button onClick={()=>onDone(true)} style={{ padding:'7px 16px', borderRadius:8, background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.3)', color:'#d8b4fe', fontSize:12, fontWeight:700, cursor:'pointer' }}>Lanjut</button></div>}
      {micOk&&status==='idle'&&<button onClick={start} style={{ width:'100%', height:50, borderRadius:12, background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', color:'#c084fc', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Tap untuk Bicara</button>}
      {micOk&&status==='listening'&&<div style={{ width:'100%', height:50, borderRadius:12, background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>{[0,1,2,3,4].map(i=><div key={i} style={{ width:3, height:16, borderRadius:3, background:'#a855f7', animation:'wave 1s ease-in-out infinite', animationDelay:`${i*0.12}s` }}/>)}<style>{`@keyframes wave{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}`}</style><span style={{ color:'#c084fc', fontSize:12, fontWeight:700, marginLeft:4 }}>Mendengarkan...</span></div>}
      {status==='done'&&<div style={{ padding:'12px 14px', borderRadius:10, background:score>=60?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)', border:`1px solid ${score>=60?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}` }}>{transcript&&<p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, margin:'0 0 3px' }}>Kamu bilang: "{transcript}"</p>}<p style={{ color:score>=60?'#6ee7b7':'#fca5a5', fontSize:13, fontWeight:700, margin:0 }}>{score>=60?`✓ Bagus! ${score}% cocok`:`✗ Belum tepat (${score}%). Coba lagi!`}</p></div>}
    </div>
  );
}

function PracticeSection({ items, chColor, lang, onAllDone }: { items:any[]; chColor:string; lang:string; onAllDone:()=>void }) {
  const [cur,setCur]=useState(0); const [res,setRes]=useState<boolean[]>([]);
  const done=(ok:boolean)=>{const n=[...res,ok];setRes(n);if(cur+1<items.length)setTimeout(()=>setCur(cur+1),1200);else setTimeout(onAllDone,1200);};
  const item=items[cur]; if(!item)return null;
  return (
    <div style={{ background:'#0e0e14', borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ padding:'12px 16px 11px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:4, height:30, borderRadius:2, background:chColor, flexShrink:0 }}/>
          <div><span style={{ display:'block', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:chColor, marginBottom:2 }}>Latihan</span><span style={{ color:'#f4f4f5', fontSize:13, fontWeight:700 }}>{PRACTICE_LABELS[item.type]??item.type}</span></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', gap:5 }}>{items.map((_,i)=><div key={i} style={{ width:7, height:7, borderRadius:'50%', background:i<res.length?(res[i]?'#10b981':'#ef4444'):i===cur?chColor:'rgba(255,255,255,0.12)', transition:'background 0.3s' }}/>)}</div>
          <span style={{ color:'#3f3f46', fontSize:11, fontWeight:600 }}>{cur+1}/{items.length}</span>
        </div>
      </div>
      <div style={{ padding:'14px 16px' }}>
        {(item.type==='translation_quiz'||item.type==='fill_in_blank'||item.type==='mini_conversation')&&<ChoicePractice item={item} onDone={done} chColor={chColor}/>}
        {item.type==='matching_word'&&<MatchingPractice item={item} onDone={done} chColor={chColor}/>}
        {item.type==='listening_quiz'&&<ListeningPractice item={item} onDone={done} chColor={chColor} lang={lang}/>}
        {item.type==='speaking_test'&&<SpeakingPractice item={item} onDone={done} chColor={chColor} lang={lang}/>}
        {!['translation_quiz','fill_in_blank','mini_conversation','matching_word','listening_quiz','speaking_test'].includes(item.type)&&<ChoicePractice item={item} onDone={done} chColor={chColor}/>}
      </div>
    </div>
  );
}

function ReadingProgress({ scrollY, total }: { scrollY:number; total:number }) {
  const pct=Math.min(100,(scrollY/Math.max(total-1,1))*100);
  return <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'rgba(255,255,255,0.04)' }}><div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#3b82f6,#10b981)', transition:'width 0.1s linear' }}/></div>;
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
export default function LearnStagePage({ params }: Props) {
  const router=useRouter(); const {stageId}=use(params);
  const selectedLanguage=useLanguageStore(s=>s.selectedLanguage)?? 'en';
  const {xp,addXp}=useProgress();
  const [scrollY,setScrollY]=useState(0); const [scrollMax,setScrollMax]=useState(1);
  const [practiceUnlocked,setPracticeUnlocked]=useState(false);
  const [practiceComplete,setPracticeComplete]=useState(false);

  const studyData=STUDY_DATA_MAP[selectedLanguage]??STUDY_DATA_MAP['en'];
  const adventureData=CHAPTERS_DATA_MAP[selectedLanguage]??CHAPTERS_DATA_MAP['en'];
  const chapters=(adventureData as any).chapters??[];
  let chapter:any=null, stage:any=null;
  for(const ch of chapters){const s=ch.stages?.find((s:any)=>s.id===stageId);if(s){chapter=ch;stage=s;break;}}
  const entry:StudyEntry|null=stage?.feedKey?(studyData as any)[stage.feedKey]??null:null;

  useEffect(()=>{
    const el=document.getElementById('study-scroll'); if(!el)return;
    const upd=()=>{
      const sy=el.scrollTop,sm=el.scrollHeight-el.clientHeight;
      setScrollY(sy); setScrollMax(sm);
      if(!practiceUnlocked&&sy/Math.max(sm,1)>0.6)setPracticeUnlocked(true);
    };
    el.addEventListener('scroll',upd); return ()=>el.removeEventListener('scroll',upd);
  },[practiceUnlocked]);

  if(!chapter||!stage||!entry)return(
    <main style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0a0a0d' }}>
      <div style={{ textAlign:'center' }}><p style={{ color:'#52525b', fontSize:14 }}>Materi tidak ditemukan.</p><button onClick={()=>router.push('/learn')} style={{ color:'#3b82f6', fontSize:13, fontWeight:700, marginTop:12, background:'none', border:'none', cursor:'pointer' }}>← Kembali</button></div>
    </main>
  );

  const cc={color:chapter.color??'#3b82f6',ring:chapter.ring??'#60a5fa'};
  const wc=entry.sections.reduce((n:number,s:Section)=>n+s.body.split(' ').length+s.examples.length*5,0);
  const readMins=Math.max(1,Math.round(wc/120));
  const totalXp=entry.practice.reduce((s:number,p:any)=>s+(p.xpReward??0),0);

  return (
    <main style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#050507' }}>
      <div style={{ width:'100%', maxWidth:835, height:'100vh', background:'#0a0a0d', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 0 60px rgba(0,0,0,0.8)', position:'relative' }}>
        {/* Nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, position:'relative' }}>
          <button onClick={()=>router.push('/learn')} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#71717a' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:cc.color, boxShadow:`0 0 8px ${cc.color}` }}/>
            <span style={{ color:'#71717a', fontSize:12, fontWeight:700 }}>{chapter.title} · {stage.label}</span>
          </div>
          <div style={{ background:'rgba(250,204,21,0.06)', border:'1px solid rgba(250,204,21,0.15)', borderRadius:99, padding:'4px 10px' }}>
            <span style={{ color:'#facc15', fontSize:11, fontWeight:800 }}>{xp} XP</span>
          </div>
          <ReadingProgress scrollY={scrollY} total={scrollMax}/>
        </div>

        {/* Scroll */}
        <div id="study-scroll" style={{ flex:1, overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none' }}>
          {/* Hero */}
          <div style={{ padding:'22px 16px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:`radial-gradient(circle,${cc.color}18 0%,transparent 70%)`, pointerEvents:'none' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
              <span style={{ color:'#52525b', fontSize:11, fontWeight:600 }}>{chapter.subtitle}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ color:cc.color, fontSize:11, fontWeight:700 }}>{stage.label}</span>
            </div>
            <h1 style={{ color:'#f4f4f5', fontSize:24, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.15, margin:'0 0 8px' }}>{entry.title}</h1>
            <p style={{ color:'#a1a1aa', fontSize:13, lineHeight:1.75, margin:'0 0 14px' }}>{entry.intro}</p>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {[
                {label:`${readMins} menit`,color:cc.color,bg:`${cc.color}14`,bd:`1px solid ${cc.color}30`},
                {label:`${entry.sections.length} topik`,color:'#71717a',bg:'rgba(255,255,255,0.04)',bd:'1px solid rgba(255,255,255,0.08)'},
                {label:`+${totalXp} XP`,color:'#facc15',bg:'rgba(250,204,21,0.06)',bd:'1px solid rgba(250,204,21,0.15)'},
                {label:`${entry.practice.length} soal`,color:'#a855f7',bg:'rgba(168,85,247,0.06)',bd:'1px solid rgba(168,85,247,0.2)'},
              ].map((p,i)=><div key={i} style={{ background:p.bg, border:p.bd, borderRadius:99, padding:'4px 11px' }}><span style={{ color:p.color, fontSize:11, fontWeight:700 }}>{p.label}</span></div>)}
            </div>
          </div>

          {/* Divider */}
          <div style={{ padding:'18px 16px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
              <span style={{ color:'#3f3f46', fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Materi Pembelajaran</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
            </div>
          </div>

          {/* Sections */}
          <div style={{ padding:'0 12px', display:'flex', flexDirection:'column', gap:10 }}>
            {entry.sections.map((section,i)=><SectionCard key={i} section={section} id={`section-${i}`} lang={selectedLanguage}/>)}
          </div>

          {/* Practice divider */}
          <div style={{ padding:'18px 16px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
              <span style={{ color:'#3f3f46', fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Latihan Soal</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }}/>
            </div>
          </div>

          {/* Practice */}
          <div style={{ padding:'0 12px' }}>
            {!practiceUnlocked?(
              <div style={{ background:'#0e0e14', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', padding:'28px 20px', textAlign:'center' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#52525b" strokeWidth="2"/><path d="M8 11V7a4 4 0 018 0v4" stroke="#52525b" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <p style={{ color:'#71717a', fontSize:13, fontWeight:700, margin:'0 0 6px' }}>Baca dulu materinya</p>
                <p style={{ color:'#3f3f46', fontSize:12, margin:'0 0 14px' }}>Latihan akan muncul setelah kamu selesai membaca</p>
                <div style={{ height:3, background:'rgba(255,255,255,0.04)', borderRadius:99, overflow:'hidden', maxWidth:160, margin:'0 auto' }}>
                  <div style={{ height:'100%', width:`${Math.min(100,(scrollY/Math.max(scrollMax,1))*(100/0.6))}%`, background:`linear-gradient(90deg,${cc.color},${cc.ring})`, borderRadius:99, transition:'width 0.2s ease' }}/>
                </div>
                <p style={{ color:'#3f3f46', fontSize:10, marginTop:6 }}>{Math.round(Math.min(100,(scrollY/Math.max(scrollMax,1))*(100/0.6)))}% terbaca</p>
              </div>
            ):!practiceComplete?(
              <PracticeSection items={entry.practice} chColor={cc.color} lang={selectedLanguage} onAllDone={()=>{setPracticeComplete(true);addXp(totalXp);}}/>
            ):(
              <div style={{ background:'#0e0e14', borderRadius:16, border:`1px solid ${cc.color}30`, padding:'24px 20px', textAlign:'center' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:`${cc.color}14`, border:`1px solid ${cc.color}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:22 }}>🎉</div>
                <p style={{ color:'#f4f4f5', fontSize:15, fontWeight:800, margin:'0 0 4px' }}>Materi selesai!</p>
                <p style={{ color:'#71717a', fontSize:12, margin:'0 0 18px' }}>+{totalXp} XP berhasil diperoleh</p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>router.push('/learn')} style={{ flex:1, height:46, borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a', fontSize:13, fontWeight:700, cursor:'pointer' }}>← Kembali</button>
                  <button onClick={()=>router.push('/adventure')} style={{ flex:2, height:46, borderRadius:12, background:`linear-gradient(135deg,${cc.color},${cc.ring})`, border:'none', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:`0 4px 18px ${cc.color}40` }}>Ke Adventure →</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ height:48 }}/>
        </div>
      </div>
    </main>
  );
}
