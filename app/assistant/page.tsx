"use client";

import React, { useState, useRef, useEffect, useCallback, JSX } from "react";
import { useRouter } from "next/navigation";

/* ─── Responsive Hook ──────────────────────────────────── */
function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet">("mobile");
  useEffect(() => {
    const update = () => setBp(window.innerWidth >= 640 ? "tablet" : "mobile");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return bp;
}

/* ─── Types ────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  isSpeak?: boolean;
}

/* ─── Language config ──────────────────────────────────── */
const LANGUAGES = [
  { code: "en", flag: "🇬🇧", name: "Inggris",  ttsLang: "en-US" },
  { code: "ko", flag: "🇰🇷", name: "Korea",    ttsLang: "ko-KR" },
  { code: "ja", flag: "🇯🇵", name: "Jepang",   ttsLang: "ja-JP" },
  { code: "zh", flag: "🇨🇳", name: "Mandarin", ttsLang: "zh-CN" },
];
type LangCode = "en" | "ko" | "ja" | "zh";

const TOPICS = [
  { id: "greetings",  label: "Salam & Perkenalan" },
  { id: "daily",      label: "Aktivitas Sehari-hari" },
  { id: "food",       label: "Makanan & Minuman" },
  { id: "travel",     label: "Perjalanan" },
  { id: "shopping",   label: "Belanja" },
  { id: "feelings",   label: "Perasaan & Emosi" },
];
const LEVELS = [
  { id: "beginner",     label: "Pemula",    desc: "Kalimat sederhana" },
  { id: "intermediate", label: "Menengah",  desc: "Kalimat lebih panjang" },
  { id: "advanced",     label: "Mahir",     desc: "Kalimat kompleks" },
];

/* ─── Lucide-style SVG Icons ───────────────────────────── */
const IC = {
  mic: (c = "currentColor", s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={c} strokeWidth="1.8"/>
      <path d="M5 10a7 7 0 0014 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="9" y1="22" x2="15" y2="22" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  play: (c = "currentColor", s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/>
      <polygon points="10,8 18,12 10,16" fill={c}/>
    </svg>
  ),
  send: (c = "currentColor", s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M22 2L11 13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  x: (c = "currentColor", s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  back: (c = "currentColor", s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  check: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  refresh: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M1 4v6h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  lightbulb: (c = "currentColor", s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8A6 6 0 0112 3z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  star: (c = "currentColor", s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  wrench: (c = "currentColor", s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  target: (c = "currentColor", s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="6" stroke={c} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="2" stroke={c} strokeWidth="1.8"/>
    </svg>
  ),
  pencil: (c = "currentColor", s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  volume: (c = "currentColor", s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

/* ─── System prompts ───────────────────────────────────── */
const LANG_NAMES: Record<LangCode, string> = {
  en: "bahasa Inggris", ko: "bahasa Korea",
  ja: "bahasa Jepang",  zh: "bahasa Mandarin",
};

function buildChatPrompt(lang: LangCode) {
  return `Kamu adalah Lingo, asisten belajar ${LANG_NAMES[lang]} dari LINGORA.
- Jawab dalam bahasa Indonesia kecuali diminta lain
- Highlight kata penting dengan **tanda bintang**
- Gunakan [AUDIO:teks:kode_bahasa] untuk frasa yang perlu didengar
- Jawab singkat dan jelas
- Hindari penggunaan emoji berlebihan`;
}

function buildSentencePrompt(lang: LangCode, topic: string, level: string) {
  const topicLabel = TOPICS.find(t => t.id === topic)?.label ?? topic;
  const levelLabel = LEVELS.find(l => l.id === level)?.label ?? level;
  return `Kamu adalah guru ${LANG_NAMES[lang]}. Buat 1 kalimat dalam ${LANG_NAMES[lang]} untuk latihan speaking.
Topik: ${topicLabel}, Level: ${levelLabel}

Format respons WAJIB (hanya ini, tanpa teks lain):
KALIMAT: [kalimat dalam ${LANG_NAMES[lang]}]
ARTI: [artinya dalam bahasa Indonesia]
TIPS: [1 tips singkat cara mengucapkannya]`;
}

function buildCustomWordPrompt(lang: LangCode, word: string) {
  return `Kamu adalah guru ${LANG_NAMES[lang]}. Pengguna ingin berlatih mengucapkan kata/frasa: "${word}"

Buat 1 kalimat latihan yang mengandung kata tersebut dalam ${LANG_NAMES[lang]}.

Format respons WAJIB (hanya ini, tanpa teks lain):
KALIMAT: [kalimat dalam ${LANG_NAMES[lang]} yang mengandung "${word}"]
ARTI: [artinya dalam bahasa Indonesia]
TIPS: [tips pengucapan khusus untuk kata "${word}"]`;
}

function buildFeedbackPrompt(lang: LangCode, target: string, transcript: string) {
  return `Kamu adalah guru ${LANG_NAMES[lang]} yang menilai latihan speaking.

Kalimat target: "${target}"
Ucapan pengguna: "${transcript}"

Beri feedback dalam format WAJIB ini (tanpa emoji kecuali yang ditentukan):

SKOR: [angka 0-100]

BAGUS:
[poin positif, singkat]

PERBAIKAN:
[koreksi spesifik — grammar, kosakata, kelengkapan. Tulis "Tidak ada" jika sudah benar]

SARAN:
[1 saran praktis + contoh kalimat yang benar jika diperlukan]

Kriteria: Kemiripan kalimat target (40), ketepatan grammar (35), kelancaran (25).
Jika transcript kosong, beri skor 0.`;
}

/* ─── Groq API ─────────────────────────────────────────── */
async function callGroq(
  history: { role: "user" | "assistant"; content: string }[],
  userText: string,
  lang: LangCode,
  systemOverride?: string,
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY ?? "";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemOverride ?? buildChatPrompt(lang) },
        ...history.slice(-10),
        { role: "user", content: userText },
      ],
      temperature: 0.7, max_tokens: 600,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "Maaf, ada gangguan. Coba lagi ya.";
}

/* ─── TTS ──────────────────────────────────────────────── */
function speakText(text: string, langCode: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = langCode; utt.rate = 0.82; utt.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang.startsWith(langCode.split("-")[0]));
  if (match) utt.voice = match;
  window.speechSynthesis.speak(utt);
}

/* ─── Spinner ──────────────────────────────────────────── */
const Spinner = ({ size = 14, color = "rgba(255,255,255,0.3)", top = "#fff" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, borderTopColor: top, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
);

/* ─── Audio button ─────────────────────────────────────── */
function AudioButton({ text, lang }: { text: string; lang: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px", padding: "8px 12px", borderRadius: 10, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.18)" }}>
      <button onClick={() => { setPlaying(true); speakText(text, lang); setTimeout(() => setPlaying(false), Math.max(1200, text.length * 120)); }}
        style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: playing ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {playing
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="3" height="12" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="12;18;12" dur="0.6s" repeatCount="indefinite"/><animate attributeName="y" values="6;3;6" dur="0.6s" repeatCount="indefinite"/></rect><rect x="7" y="4" width="3" height="16" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="16;10;16" dur="0.6s" repeatCount="indefinite" begin="0.15s"/><animate attributeName="y" values="4;7;4" dur="0.6s" repeatCount="indefinite" begin="0.15s"/></rect><rect x="12" y="2" width="3" height="20" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="20;12;20" dur="0.6s" repeatCount="indefinite" begin="0.3s"/><animate attributeName="y" values="2;6;2" dur="0.6s" repeatCount="indefinite" begin="0.3s"/></rect></svg>
          : IC.volume("#60a5fa", 13)}
      </button>
      <span style={{ color: "#93c5fd", fontSize: 13, fontWeight: 600, fontFamily: "system-ui, sans-serif" }}>{text}</span>
    </div>
  );
}

/* ─── Message text renderer ────────────────────────────── */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[AUDIO:[^\]]+\])/g);
  return (
    <span style={{ display: "block" }}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} style={{ color: "#60a5fa", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("[AUDIO:") && part.endsWith("]")) {
          const inner = part.slice(7, -1);
          const ci = inner.lastIndexOf(":");
          return <AudioButton key={i} text={inner.slice(0, ci)} lang={inner.slice(ci + 1)} />;
        }
        return <span key={i}>{part.split("\n").map((l, j, a) => <span key={j}>{l}{j < a.length - 1 && <br />}</span>)}</span>;
      })}
    </span>
  );
}

/* ─── Feedback renderer ────────────────────────────────── */
function FeedbackBlock({ raw }: { raw: string }) {
  const score   = raw.match(/SKOR:\s*(\d+)/)?.[1] ?? null;
  const bagus   = raw.match(/BAGUS:\s*([\s\S]*?)(?=PERBAIKAN:|$)/)?.[1]?.trim() ?? "";
  const perbaik = raw.match(/PERBAIKAN:\s*([\s\S]*?)(?=SARAN:|$)/)?.[1]?.trim() ?? "";
  const saran   = raw.match(/SARAN:\s*([\s\S]*?)$/)?.[1]?.trim() ?? "";

  // Fallback: render raw if parsing failed
  if (!score) return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: "#d4d4d8" }}><MessageText text={raw} /></div>
  );

  const sc = parseInt(score);
  const scoreColor = sc >= 80 ? "#10b981" : sc >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11, background: `${scoreColor}10`, border: `1px solid ${scoreColor}30` }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: scoreColor, fontSize: 15, fontWeight: 800 }}>{sc}</span>
        </div>
        <div>
          <p style={{ color: scoreColor, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>
            {sc >= 80 ? "Bagus sekali!" : sc >= 55 ? "Cukup baik" : "Perlu latihan lagi"}
          </p>
          <p style={{ color: "#71717a", fontSize: 11, margin: 0 }}>Skor speaking kamu</p>
        </div>
      </div>

      {/* Sections */}
      {bagus && (
        <div style={{ padding: "10px 13px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", gap: 9, alignItems: "flex-start" }}>
          <span style={{ marginTop: 2, flexShrink: 0 }}>{IC.check("#10b981", 13)}</span>
          <div>
            <p style={{ color: "#10b981", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 3px" }}>Yang sudah bagus</p>
            <p style={{ color: "#a1a1aa", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>{bagus}</p>
          </div>
        </div>
      )}

      {perbaik && perbaik.toLowerCase() !== "tidak ada" && (
        <div style={{ padding: "10px 13px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", display: "flex", gap: 9, alignItems: "flex-start" }}>
          <span style={{ marginTop: 2, flexShrink: 0 }}>{IC.wrench("#ef4444", 13)}</span>
          <div>
            <p style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 3px" }}>Yang perlu diperbaiki</p>
            <p style={{ color: "#a1a1aa", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>{perbaik}</p>
          </div>
        </div>
      )}

      {saran && (
        <div style={{ padding: "10px 13px", borderRadius: 10, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", display: "flex", gap: 9, alignItems: "flex-start" }}>
          <span style={{ marginTop: 2, flexShrink: 0 }}>{IC.lightbulb("#f59e0b", 13)}</span>
          <div>
            <p style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 3px" }}>Saran Lingo</p>
            <p style={{ color: "#a1a1aa", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>{saran}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Typing dots ──────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "12px 14px", alignItems: "center" }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
    </div>
  );
}

/* ─── Chat bubble ──────────────────────────────────────── */
function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  if (msg.isSpeak) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg,#5b21b6,#7c3aed)", boxShadow: "0 4px 14px rgba(124,58,237,0.3)", fontSize: 13, lineHeight: 1.6, color: "#fff", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, opacity: 0.7 }}>
            {IC.mic("#fff", 11)}
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Ucapan kamu</span>
          </div>
          <span style={{ fontStyle: "italic", opacity: 0.9 }}>"{msg.content}"</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10, alignItems: "flex-end", gap: 8 }}>
      {!isUser && <img src="/maskot.png" alt="Lingo" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}
      <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isUser ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "rgba(255,255,255,0.06)", border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)", boxShadow: isUser ? "0 4px 14px rgba(37,99,235,0.3)" : "none", fontSize: 13, lineHeight: 1.6, color: isUser ? "#fff" : "#d4d4d8", fontFamily: "system-ui, sans-serif" }}>
        <MessageText text={msg.content} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SPEAKING PRACTICE MODAL
══════════════════════════════════════════════════════════ */
type SpeakStep = "pick" | "ready" | "listening" | "processing" | "feedback";
type SpeakMode = "topic" | "custom";

interface SpeakState {
  mode: SpeakMode;
  topic: string; level: string;
  customWord: string;
  targetSentence: string; targetMeaning: string; targetTips: string;
  transcript: string; feedback: string;
}

function SpeakingModal({ lang, onClose, onAddMessages }: {
  lang: LangCode; onClose: () => void;
  onAddMessages: (msgs: Message[]) => void;
}) {
  const [step, setStep]   = useState<SpeakStep>("pick");
  const [state, setState] = useState<SpeakState>({
    mode: "topic", topic: "", level: "", customWord: "",
    targetSentence: "", targetMeaning: "", targetTips: "",
    transcript: "", feedback: "",
  });
  const [genLoading, setGenLoading] = useState(false);
  const recRef = useRef<any>(null);
  const ttsLang = LANGUAGES.find(l => l.code === lang)?.ttsLang ?? "en-US";

  function parseSentence(raw: string) {
    const sentence = raw.match(/KALIMAT:\s*(.+)/)?.[1]?.trim() ?? raw.trim();
    const meaning  = raw.match(/ARTI:\s*(.+)/)?.[1]?.trim() ?? "";
    const tips     = raw.match(/TIPS:\s*(.+)/)?.[1]?.trim() ?? "";
    return { sentence, meaning, tips };
  }

  async function handleStart() {
    const isCustom = state.mode === "custom";
    if (isCustom ? !state.customWord.trim() : (!state.topic || !state.level)) return;
    setGenLoading(true);
    try {
      const prompt = isCustom
        ? buildCustomWordPrompt(lang, state.customWord.trim())
        : buildSentencePrompt(lang, state.topic, state.level);
      const raw = await callGroq([], "Buat kalimat sekarang.", lang, prompt);
      const { sentence, meaning, tips } = parseSentence(raw);
      setState(s => ({ ...s, targetSentence: sentence, targetMeaning: meaning, targetTips: tips }));
      setStep("ready");
    } catch { /* ignore */ }
    finally { setGenLoading(false); }
  }

  function startRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = ttsLang; rec.continuous = false; rec.interimResults = false;
    recRef.current = rec;
    setStep("listening");
    rec.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      setState(s => ({ ...s, transcript }));
      setStep("processing");
      recRef.current = null;
      try {
        const fb = await callGroq([], "Nilai ucapan ini.", lang, buildFeedbackPrompt(lang, state.targetSentence, transcript));
        setState(s => ({ ...s, feedback: fb }));
        setStep("feedback");
      } catch {
        setState(s => ({ ...s, feedback: "Gagal menilai. Coba lagi." }));
        setStep("feedback");
      }
    };
    rec.onerror = () => { recRef.current = null; setStep("ready"); };
    rec.start();
  }

  function cancelRecording() {
    if (recRef.current) { recRef.current.abort(); recRef.current = null; }
    setStep("ready");
  }

  function finishAndClose() {
    const msgs: Message[] = [];
    if (state.transcript) msgs.push({ id: crypto.randomUUID(), role: "user", content: state.transcript, ts: Date.now(), isSpeak: true });
    if (state.feedback)   msgs.push({ id: crypto.randomUUID(), role: "assistant", content: state.feedback, ts: Date.now() });
    onAddMessages(msgs); onClose();
  }
  function tryAgain()    { setState(s => ({ ...s, transcript: "", feedback: "" })); setStep("ready"); }
  function newSentence() { setState(s => ({ ...s, targetSentence: "", targetMeaning: "", targetTips: "", transcript: "", feedback: "" })); setStep("pick"); }

  const canStart = state.mode === "custom" ? !!state.customWord.trim() : (!!state.topic && !!state.level);
  const sel = LANGUAGES.find(l => l.code === lang)!;

  return (
    <>
      <div onClick={step === "listening" || step === "processing" ? undefined : onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 60 }} />

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#0e0e18", borderRadius: "22px 22px 0 0", border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none", boxShadow: "0 -12px 60px rgba(0,0,0,0.7)", zIndex: 61, display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif", animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "90vh", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {IC.mic("#c084fc", 14)}
            </div>
            <div>
              <p style={{ color: "#f4f4f5", fontSize: 13, fontWeight: 700, margin: 0 }}>Latihan Speaking</p>
              <p style={{ color: "#52525b", fontSize: 10, margin: 0 }}>{sel.flag} {sel.name}</p>
            </div>
          </div>
          {step !== "listening" && step !== "processing" && (
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#71717a" }}>
              {IC.x()}
            </button>
          )}
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 18px 24px" }}>

          {/* ── PICK ── */}
          {step === "pick" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Mode toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 4, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {([["topic", IC.target("#c084fc", 13), "Pilih Topik"], ["custom", IC.pencil("#c084fc", 13), "Kata Sendiri"]] as [SpeakMode, JSX.Element, string][]).map(([m, icon, lbl]) => (
                  <button key={m} onClick={() => setState(s => ({ ...s, mode: m }))}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, border: "none", background: state.mode === m ? "rgba(168,85,247,0.18)" : "transparent", color: state.mode === m ? "#c084fc" : "#52525b", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                    {icon}<span>{lbl}</span>
                  </button>
                ))}
              </div>

              {/* Topic mode */}
              {state.mode === "topic" && (
                <>
                  <div>
                    <p style={{ color: "#71717a", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 9px" }}>Pilih Topik</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      {TOPICS.map(t => (
                        <button key={t.id} onClick={() => setState(s => ({ ...s, topic: t.id }))}
                          style={{ padding: "10px 12px", borderRadius: 11, border: `1px solid ${state.topic === t.id ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.07)"}`, background: state.topic === t.id ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.025)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                          <p style={{ color: state.topic === t.id ? "#c084fc" : "#a1a1aa", fontSize: 12, fontWeight: 600, margin: 0 }}>{t.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: "#71717a", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 9px" }}>Level</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {LEVELS.map(l => (
                        <button key={l.id} onClick={() => setState(s => ({ ...s, level: l.id }))}
                          style={{ padding: "10px 13px", borderRadius: 10, border: `1px solid ${state.level === l.id ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.07)"}`, background: state.level === l.id ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.025)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s" }}>
                          <span style={{ color: state.level === l.id ? "#c084fc" : "#e4e4e7", fontSize: 13, fontWeight: 600 }}>{l.label}</span>
                          <span style={{ color: "#52525b", fontSize: 11 }}>{l.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Custom word mode */}
              {state.mode === "custom" && (
                <div>
                  <p style={{ color: "#71717a", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 9px" }}>Kata atau Frasa yang Ingin Dilatih</p>
                  <textarea
                    value={state.customWord}
                    onChange={e => setState(s => ({ ...s, customWord: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && canStart) { e.preventDefault(); handleStart(); } }}
                    placeholder={`Contoh: こんにちは, 감사합니다, "How are you", 你好...`}
                    rows={3}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 11, padding: "12px 14px", color: "#f4f4f5", fontSize: 14, lineHeight: 1.6, resize: "none", outline: "none", fontFamily: "system-ui, sans-serif", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(168,85,247,0.45)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
                  />
                  <p style={{ color: "#3f3f46", fontSize: 11, margin: "6px 0 0", lineHeight: 1.5 }}>
                    AI akan membuat kalimat latihan yang mengandung kata tersebut dalam {LANG_NAMES[lang]}.
                  </p>
                </div>
              )}

              {/* CTA */}
              <button onClick={handleStart} disabled={!canStart || genLoading}
                style={{ width: "100%", height: 48, borderRadius: 13, background: canStart && !genLoading ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(255,255,255,0.04)", border: "none", color: canStart && !genLoading ? "#fff" : "#3f3f46", fontSize: 13.5, fontWeight: 700, cursor: canStart && !genLoading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canStart && !genLoading ? "0 4px 18px rgba(124,58,237,0.38)" : "none", transition: "all 0.2s" }}>
                {genLoading ? <><Spinner/>Menyiapkan kalimat...</> : "Mulai Latihan"}
              </button>
            </div>
          )}

          {/* ── READY ── */}
          {step === "ready" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Maskot + speech bubble */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 4, marginLeft: 12, animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ position: "relative", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.28)", borderRadius: 14, padding: "9px 14px", maxWidth: 220, textAlign: "center", animation: "slideUp 0.3s ease 0.1s both" }}>
                  <p style={{ color: "#e2d4ff", fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>Ayo ucapkan kalimat ini!</p>
                  <p style={{ color: "#71717a", fontSize: 11, margin: 0 }}>Bicara pelan dan jelas ya 😊</p>
                  <div style={{ position: "absolute", bottom: -7, left: "90%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid rgba(168,85,247,0.28)" }} />
                  <div style={{ position: "absolute", bottom: -6, left: "90%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0e0e18" }} />
                </div>
                <div style={{ width: 100, height: 100, animation: "float 2.8s ease-in-out infinite" }}>
                  <img src="/maskot.png" alt="Lingo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              </div>

              <div style={{ padding: "16px", borderRadius: 14, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.18)" }}>
                <p style={{ color: "#71717a", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Ucapkan kalimat ini</p>
                <p style={{ color: "#f0e6ff", fontSize: 20, fontWeight: 800, margin: "0 0 5px", lineHeight: 1.4 }}>{state.targetSentence}</p>
                <p style={{ color: "#71717a", fontSize: 13, fontStyle: "italic", margin: "0 0 11px" }}>{state.targetMeaning}</p>
                <button onClick={() => speakText(state.targetSentence, ttsLang)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.22)", color: "#c084fc", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {IC.play("#c084fc", 12)} Dengarkan contoh
                </button>
              </div>

              {state.targetTips && (
                <div style={{ padding: "9px 13px", borderRadius: 10, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  {IC.lightbulb("#f59e0b", 13)}
                  <p style={{ color: "#a08a30", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{state.targetTips}</p>
                </div>
              )}

              <button onClick={startRecording}
                style={{ width: "100%", height: 52, borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 4px 20px rgba(124,58,237,0.4)", transition: "all 0.2s" }}>
                {IC.mic("#fff", 16)} Tap untuk Berbicara
              </button>

              <button onClick={newSentence}
                style={{ background: "none", border: "none", color: "#3f3f46", fontSize: 12, cursor: "pointer", textAlign: "center", textDecoration: "underline", padding: "4px 0" }}>
                Ganti kalimat
              </button>
            </div>
          )}

          {/* ── LISTENING ── */}
          {step === "listening" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 8 }}>

              {/* Maskot excited + bubble */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: 14, padding: "9px 14px", textAlign: "center" }}>
                  <p style={{ color: "#e2d4ff", fontSize: 13, fontWeight: 700, margin: 0 }}>Lingo mendengarkan... 👂</p>
                  <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid rgba(168,85,247,0.35)" }} />
                  <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0e0e18" }} />
                </div>

                {/* Maskot dengan ring pulse */}
                <div style={{ position: "relative", width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", border: "2px solid rgba(168,85,247,0.25)", animation: "pingRing 1.4s ease-out infinite" }} />
                  <div style={{ position: "absolute", width: 88, height: 88, borderRadius: "50%", border: "2px solid rgba(168,85,247,0.15)", animation: "pingRing 1.4s ease-out infinite", animationDelay: "0.5s" }} />
                  <div style={{ width: 74, height: 74, borderRadius: "50%", background: "rgba(168,85,247,0.12)", border: "2px solid rgba(168,85,247,0.45)", display: "flex", alignItems: "center", justifyContent: "center", animation: "speakPulse 1s ease-in-out infinite", overflow: "hidden" }}>
                    <img src="/maskot.png" alt="Lingo" style={{ width: 62, height: 62, objectFit: "contain" }} />
                  </div>
                </div>
              </div>

              {/* Kalimat target */}
              <div style={{ padding: "11px 16px", borderRadius: 12, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.14)", width: "100%", textAlign: "center" }}>
                <p style={{ color: "#71717a", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Ucapkan</p>
                <p style={{ color: "#f0e6ff", fontSize: 15, fontWeight: 700, margin: 0 }}>{state.targetSentence}</p>
              </div>

              {/* Voice bars */}
              <div style={{ display: "flex", gap: 4, alignItems: "center", height: 32 }}>
                {[14, 22, 28, 20, 16].map((h, i) => (
                  <div key={i} style={{ width: 5, borderRadius: 3, background: "#a855f7", animation: "voiceBar 0.6s ease-in-out infinite alternate", animationDelay: `${i * 0.1}s`, height: h, transformOrigin: "bottom" }} />
                ))}
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#c084fc", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Mendengarkan...</p>
                <p style={{ color: "#3f3f46", fontSize: 12, margin: 0 }}>Bicara dengan jelas dan pelan</p>
              </div>

              <button onClick={cancelRecording}
                style={{ padding: "9px 22px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#71717a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Batalkan
              </button>
            </div>
          )}

         {/* ── PROCESSING ── */}
          {step === "processing" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 16 }}>

              {/* Maskot thinking + bubble */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 14, padding: "9px 14px", textAlign: "center" }}>
                  <p style={{ color: "#93c5fd", fontSize: 13, fontWeight: 700, margin: 0 }}>Hmm, Lingo lagi mikir... 🤔</p>
                  <div style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid rgba(59,130,246,0.25)" }} />
                  <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0e0e18" }} />
                </div>

                <div style={{ width: 74, height: 74, borderRadius: "50%", background: "rgba(59,130,246,0.08)", border: "2px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", animation: "float 2s ease-in-out infinite" }}>
                  <img src="/maskot.png" alt="Lingo" style={{ width: 60, height: 60, objectFit: "contain" }} />
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#f4f4f5", fontSize: 15, fontWeight: 700, margin: "0 0 5px" }}>Menilai ucapanmu...</p>
                {state.transcript && <p style={{ color: "#3f3f46", fontSize: 12, fontStyle: "italic", margin: 0 }}>"{state.transcript}"</p>}
              </div>
            </div>
          )}

          {/* ── FEEDBACK ── */}
          {step === "feedback" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {state.transcript && (
                <div style={{ padding: "9px 13px", borderRadius: 10, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.13)" }}>
                  <p style={{ color: "#52525b", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 3px" }}>Ucapan kamu</p>
                  <p style={{ color: "#d4d4d8", fontSize: 13, fontStyle: "italic", margin: 0 }}>"{state.transcript}"</p>
                </div>
              )}
              <div style={{ padding: "9px 13px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ color: "#52525b", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 3px" }}>Kalimat target</p>
                <p style={{ color: "#a1a1aa", fontSize: 13, margin: 0 }}>{state.targetSentence}</p>
              </div>

              <FeedbackBlock raw={state.feedback} />

              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <button onClick={tryAgain}
                  style={{ flex: 1, height: 44, borderRadius: 11, background: "rgba(168,85,247,0.09)", border: "1px solid rgba(168,85,247,0.22)", color: "#c084fc", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {IC.refresh("#c084fc", 13)} Coba Lagi
                </button>
                <button onClick={newSentence}
                  style={{ flex: 1, height: 44, borderRadius: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#71717a", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {IC.pencil("#71717a", 13)} Kalimat Baru
                </button>
              </div>
              <button onClick={finishAndClose}
                style={{ width: "100%", height: 44, borderRadius: 11, background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {IC.check("#fff", 14)} Simpan ke Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Language Selector ────────────────────────────────── */
function LangSelector({ selected, onChange }: { selected: LangCode; onChange: (l: LangCode) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
      {LANGUAGES.map(l => (
        <button key={l.code} onClick={() => onChange(l.code as LangCode)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, border: selected === l.code ? "1px solid rgba(59,130,246,0.55)" : "1px solid rgba(255,255,255,0.08)", background: selected === l.code ? "rgba(59,130,246,0.13)" : "rgba(255,255,255,0.04)", color: selected === l.code ? "#93c5fd" : "#71717a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui, sans-serif", transition: "all 0.2s" }}>
          <span>{l.flag}</span><span>{l.name}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────── */
// Ganti seluruh fungsi EmptyState di page.tsx dengan ini:

function EmptyState({ lang, onLangChange, onOpenSpeak, wide = false }: {
  lang: LangCode;
  onLangChange: (l: LangCode) => void;
  onOpenSpeak: () => void;
  wide?: boolean;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      flex: 1, padding: wide ? "0 24px" : "0 20px",
      textAlign: "center", fontFamily: "system-ui, sans-serif",
      minHeight: wide ? 500 : 420,
    }}>

      {/* Maskot */}
      <div style={{
        width: 82, height: 82, borderRadius: 20, marginBottom: 18, marginTop: 52,
        background: "rgba(168,85,247,0.1)",
        border: "1px solid rgba(168,85,247,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "float 3s ease-in-out infinite",
      }}>
        <img src="/maskot.png" alt="Lingo" style={{ width: 62, height: 62, objectFit: "contain" }} />
      </div>

      {/* Greeting */}
      <h2 style={{
        color: "#f4f4f5", fontSize: wide ? 20 : 18,
        fontWeight: 700, margin: "0 0 7px", letterSpacing: "-0.02em",
      }}>
        Halo, saya Lingo
      </h2>
      <p style={{
        color: "#52525b", fontSize: 13, lineHeight: 1.6,
        margin: "0 0 28px", maxWidth: 220,
      }}>
        Pilih bahasa, lalu mulai ngobrol atau latihan speaking.
      </p>

      {/* Language pills — 2x2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 18, width: "100%", maxWidth: 260 }}>
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => onLangChange(l.code as LangCode)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 10,
              border: `1px solid ${lang === l.code ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.07)"}`,
              background: lang === l.code ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              color: lang === l.code ? "#93c5fd" : "#71717a",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "system-ui, sans-serif", transition: "all 0.18s",
            }}
          >
            <span>{l.flag}</span>
            <span>{l.name}</span>
          </button>
        ))}
      </div>

      {/* Speaking button */}
      <button
        onClick={onOpenSpeak}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "11px 66px", borderRadius: 12,
          background: "rgba(124,58,237,0.1)",
          border: "1px solid rgba(168,85,247,0.25)",
          color: "#c084fc", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "system-ui, sans-serif",
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.18)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.4)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.1)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.25)";
        }}
      >
        {IC.mic("#c084fc", 14)}
        Latihan Speaking
      </button>

      {/* Hint */}
      <p style={{ color: "#3f3f46", fontSize: 11.5, margin: "18px 0 0" }}>
        atau ketik pertanyaan di bawah
      </p>

    </div>
  );
}

/* ─── Input bar ────────────────────────────────────────── */
function InputBar({ input, setInput, onSend, loading, lang, onLangChange, onOpenSpeak, micSupported }: {
  input: string; setInput: (v: string) => void; onSend: () => void; loading: boolean;
  lang: LangCode; onLangChange: (l: LangCode) => void; onOpenSpeak: () => void; micSupported: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,8,16,0.96)", backdropFilter: "blur(16px)" }}>
      <div style={{ padding: "7px 14px 0", display: "flex", gap: 5, flexWrap: "wrap" }}>
        {LANGUAGES.map(l => (
          <button key={l.code} onClick={() => onLangChange(l.code as LangCode)}
            style={{ padding: "3px 9px", borderRadius: 99, border: lang === l.code ? "1px solid rgba(59,130,246,0.45)" : "1px solid rgba(255,255,255,0.07)", background: lang === l.code ? "rgba(59,130,246,0.1)" : "transparent", color: lang === l.code ? "#93c5fd" : "#52525b", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui, sans-serif", transition: "all 0.15s" }}>
            {l.flag} {l.name}
          </button>
        ))}
      </div>
      <div style={{ padding: "7px 14px 10px", display: "flex", alignItems: "flex-end", gap: 8 }}>
        {micSupported && (
          <button onClick={onOpenSpeak} disabled={loading} title="Latihan Speaking"
            style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: "rgba(168,85,247,0.09)", border: "1px solid rgba(168,85,247,0.24)", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.09)"; }}>
            {IC.mic("#c084fc", 16)}
          </button>
        )}
        <textarea ref={ref} value={input}
          onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={`Tanya Lingo tentang ${LANGUAGES.find(l => l.code === lang)?.name}...`}
          rows={1}
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${input.trim() ? "rgba(59,130,246,0.38)" : "rgba(255,255,255,0.07)"}`, borderRadius: 13, padding: "10px 14px", color: "#f4f4f5", fontSize: 13, lineHeight: 1.5, resize: "none", outline: "none", fontFamily: "system-ui, sans-serif", transition: "border-color 0.2s", overflow: "hidden" }}
        />
        <button onClick={onSend} disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: input.trim() && !loading ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "rgba(255,255,255,0.05)", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: input.trim() && !loading ? "0 4px 14px rgba(37,99,235,0.38)" : "none" }}>
          {loading ? <Spinner/> : IC.send(input.trim() ? "#fff" : "#3f3f46", 16)}
        </button>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function AssistantPage() {
  const bp = useBreakpoint();
  const isTablet = bp === "tablet";
  const router = useRouter();

  const [messages, setMessages]         = useState<Message[]>([]);
  const [chatHistory, setChatHistory]   = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [started, setStarted]           = useState(false);
  const [lang, setLang]                 = useState<LangCode>("en");
  const [speakOpen, setSpeakOpen]       = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setMicSupported(!!SR);
    }
  }, []);

  const prevLengthRef = useRef(0);
  useEffect(() => {
    const cur = messages.length + (loading ? 1 : 0);
    if (cur !== prevLengthRef.current) { prevLengthRef.current = cur; bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }
  }, [messages.length, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sendingRef.current) return;
    sendingRef.current = true; setStarted(true);
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text.trim(), ts: Date.now() }]);
    setInput(""); setLoading(true);
    try {
      const reply = await callGroq(chatHistory, text.trim(), lang);
      setChatHistory(prev => [...prev, { role: "user", content: text.trim() }, { role: "assistant", content: reply }]);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Ada gangguan koneksi. Silakan coba lagi.", ts: Date.now() }]);
    } finally { sendingRef.current = false; setLoading(false); }
  }, [chatHistory, lang]);

  const handleAddSpeakMessages = useCallback((msgs: Message[]) => {
    setStarted(true);
    setMessages(prev => [...prev, ...msgs]);
    msgs.forEach(m => setChatHistory(prev => [...prev, { role: m.role, content: m.isSpeak ? `[Speaking] "${m.content}"` : m.content }]));
  }, []);

  const resetChat = () => { setMessages([]); setChatHistory([]); setStarted(false); };
  const handleLangChange = (newLang: LangCode) => {
    setLang(newLang);
    if (started) setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `Bahasa diganti ke **${LANGUAGES.find(l => l.code === newLang)?.name}** ${LANGUAGES.find(l => l.code === newLang)?.flag}. Ayo lanjut belajar!`, ts: Date.now() }]);
  };

  const messageAreaJSX = (
    <>
      {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
      {loading && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
          <img src="/maskot.png" alt="Lingo" style={{ width: 28, height: 28, objectFit: "contain" }} />
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px" }}>
            <TypingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </>
  );

  const headerJSX = (wide: boolean) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: wide ? "18px 28px" : "13px 16px", paddingTop: wide ? "18px" : "calc(env(safe-area-inset-top) + 13px)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", flexShrink: 0, position: "relative" }}>
      <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, transition: "color 0.2s", zIndex: 10 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f4f4f5")}
        onMouseLeave={e => (e.currentTarget.style.color = "#a1a1aa")}>
        {IC.back()}
      </button>
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        <img src="/logo-home.png" alt="Lingora" style={{ width: wide ? 76 : 68, height: wide ? 76 : 68, borderRadius: "50%", objectFit: "contain" }} />
      </div>
      <div style={{ zIndex: 10 }}>
        {started && (
          <button onClick={resetChat} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: wide ? "7px 14px" : "6px 12px", color: "#71717a", fontSize: wide ? 12 : 11, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
            {wide ? "Chat baru" : "Reset"}
          </button>
        )}
      </div>
    </div>
  );

  const inputProps = { input, setInput, onSend: () => sendMessage(input), loading, lang, onLangChange: handleLangChange, onOpenSpeak: () => setSpeakOpen(true), micSupported };

  return (
    <>
      <style>{`
        @keyframes popIn { 0%{opacity:0;transform:scale(0.5) translateY(20px)} 70%{transform:scale(1.08) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes speakPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes typingDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes pingRing  { 0%{transform:scale(0.85);opacity:0.8} 100%{transform:scale(1.7);opacity:0} }
        @keyframes voiceBar  { from{transform:scaleY(0.4)} to{transform:scaleY(1)} }
        @keyframes slideUp   { from{opacity:0;transform:translateX(-50%) translateY(22px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        textarea::placeholder { color:#3f3f46 }
        textarea:focus { outline:none }
        * { box-sizing:border-box }
      `}</style>

      {speakOpen && <SpeakingModal lang={lang} onClose={() => setSpeakOpen(false)} onAddMessages={handleAddSpeakMessages} />}

      {isTablet ? (
        <main style={{ background: "#080810", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 900, minHeight: "100vh", background: "#0a0a0d", borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column" }}>
            {headerJSX(true)}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", scrollbarWidth: "none" }}>
                {!started ? <EmptyState lang={lang} onLangChange={handleLangChange} onOpenSpeak={() => setSpeakOpen(true)} wide /> : messageAreaJSX}
              </div>
              <InputBar {...inputProps} /><div style={{ height: 40 }} />
            </div>
          </div>
        </main>
      ) : (
        <main style={{ background: "#080810", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 448, height: "100vh", background: "#0a0a0d", borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {headerJSX(false)}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px", scrollbarWidth: "none" }}>
              {!started ? <EmptyState lang={lang} onLangChange={handleLangChange} onOpenSpeak={() => setSpeakOpen(true)} /> : messageAreaJSX}
            </div>
            <InputBar {...inputProps} /><div style={{ height: 40 }} />
          </div>
        </main>
      )}
    </>
  );
}