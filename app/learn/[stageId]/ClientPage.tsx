"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { askLingo } from "@/lib/lingo-ai";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProgress } from "@/hooks/useProgress";
import { useUserStore } from "@/store/useUserStore";
import { useStudyStore } from "@/store/useStudyStore";
import { useReviewStore } from "@/store/useReviewStore";
import { speakSegments } from "@/lib/lingo-speech";
import { useGuestLimit } from "@/lib/guest-limit";
import GuestLimitScreen from "@/components/GuestLimitScreen";
import { StrokeOrderModal } from "@/components/StrokeOrderModal";
import LingoAvatar from "@/components/lingo/LingoAvatar";

import enStudyData from "@/data/studyData.json";
import enDummyData from "@/data/dummyData.json";
import jaStudyData from "@/data/jaStudyData.json";
import jaAdventureData from "@/data/jaData.json";
import zhStudyData from "@/data/zhStudyData.json";
import zhAdventureData from "@/data/zhData.json";
import koStudyData from "@/data/koStudyData.json";
import koAdventureData from "@/data/koData.json";
import { MessageCircle, Volume2, BookOpen, Sparkles, Lightbulb, PartyPopper, Check } from "lucide-react";

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

interface Props {
  params: Promise<{ stageId: string }>;
}
interface Example {
  en: string;
  id: string;
  /** A sentence using the word, with its translation (vocabulary rows); from Tatoeba when `tatoeba` is set */
  example?: { en: string; id: string; tatoeba?: TatoebaRef };
}
/** A Tatoeba sentence pair: the English and Indonesian sentence ids and their authors */
interface TatoebaRef {
  en: number;
  id: number;
  by: [string, string];
}
/** Where a lesson's content comes from */
interface LessonSourceInfo {
  /** The CEFR descriptor the learning objectives refer to */
  framework?: { name: string; url: string; level: string; quotes: string[] };
  vocabulary?: { name: string; by: string; url: string; note: string };
  sentences?: TatoebaRef[];
  authored?: string;
}
interface Section {
  type: string;
  heading: string;
  body: string;
  examples: Example[];
  tip?: string;
}
interface StudyEntry {
  title: string;
  intro: string;
  sections: Section[];
  practice: any[];
  sources?: LessonSourceInfo;
  /** What the learner can do after the lesson (CEFR level and Indonesian "can do" lines) */
  objectives?: { level: string; items: string[] };
}

/* ══════════════════════════════════════════════════════════
   LINGO MODAL — inline AI chat, contextual
══════════════════════════════════════════════════════════ */
const LANG_NAMES: Record<string, string> = {
  en: "bahasa Inggris",
  ja: "bahasa Jepang",
  zh: "bahasa Mandarin",
  ko: "bahasa Korea",
};
const LANG_TTS: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
};

interface LingoContext {
  chapterTitle: string;
  stageLabel: string;
  sectionHeading: string;
  lang: string;
  clickedWord?: string;
  examplePhrase?: string;
}
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function buildLingoSystem(ctx: LingoContext) {
  const langName = LANG_NAMES[ctx.lang] ?? "bahasa asing";
  return `Kamu adalah Lingo, asisten belajar ${langName} dari LINGORA. Pengguna sedang mempelajari:
- Chapter: "${ctx.chapterTitle}"
- Stage: "${ctx.stageLabel}"
- Section: "${ctx.sectionHeading}"
Panduan: jawab singkat (maks 4 kalimat), bahasa Indonesia, highlight ${langName} dengan **tanda bintang**, gunakan [AUDIO:teks:${LANG_TTS[ctx.lang] ?? "en-US"}] untuk frasa yang perlu didengar, tetap relevan ke konteks materi, tanpa emoji.`;
}

async function askGroq(
  history: { role: "user" | "assistant"; content: string }[],
  userText: string,
  ctx: LingoContext,
): Promise<string> {
  // Goes through the lingo-chat Edge Function; the Groq key stays on the server
  return askLingo({
    system: buildLingoSystem(ctx),
    history: history.slice(-8),
    userText,
    temperature: 0.65,
    maxTokens: 400,
  });
}

function buildSuggestions(ctx: LingoContext): { icon: React.ReactNode; text: string }[] {
  const langName = LANG_NAMES[ctx.lang] ?? "bahasa ini";
  if (ctx.clickedWord)
    return [
      { icon: <MessageCircle size={14} />, text: `Apa arti "${ctx.clickedWord}" dalam ${langName}?` },
      { icon: <Volume2 size={14} />, text: `Bagaimana cara mengucapkan "${ctx.clickedWord}"?` },
      {
        icon: <BookOpen size={14} />,
        text: `Beri contoh kalimat lain dengan "${ctx.clickedWord}"`,
      },
    ];
  if (ctx.examplePhrase)
    return [
      { icon: <MessageCircle size={14} />, text: `Jelaskan kalimat: "${ctx.examplePhrase}"` },
      { icon: <Volume2 size={14} />, text: `Bagaimana cara mengucapkan frasa ini?` },
      { icon: <BookOpen size={14} />, text: `Apa pola grammar di kalimat ini?` },
    ];
  return [
    {
      icon: <MessageCircle size={14} />,
      text: `Jelaskan lebih lanjut tentang "${ctx.sectionHeading}"`,
    },
    {
      icon: <BookOpen size={14} />,
      text: `Beri contoh lain dari materi "${ctx.sectionHeading}"`,
    },
    { icon: <Sparkles size={14} />, text: `Apa yang paling penting di "${ctx.chapterTitle}"?` },
  ];
}

/* ── Lingo TTS ── */
// Lingo's own natural voice (English, from the voice server); other languages use the device voice
function lingoSpeak(text: string, lang: string) {
  speakSegments([{ text, lang: LANG_TTS[lang] ?? "en-US" }], undefined, { natural: true });
}

function LingoAudioChip({ text, lang }: { text: string; lang: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "6px 0 2px",
        padding: "7px 11px",
        borderRadius: 9,
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.2)",
      }}
    >
      <button
        onClick={() => {
          setPlaying(true);
          lingoSpeak(text, lang);
          setTimeout(
            () => setPlaying(false),
            Math.max(1200, text.length * 110),
          );
        }}
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          flexShrink: 0,
          background: playing
            ? "rgba(59,130,246,0.3)"
            : "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {playing ? (
          <svg width="11" height="11" viewBox="0 0 24 24">
            <rect x="2" y="4" width="3" height="16" rx="1.5" fill="#60a5fa">
              <animate
                attributeName="height"
                values="16;10;16"
                dur="0.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="y"
                values="4;7;4"
                dur="0.5s"
                repeatCount="indefinite"
              />
            </rect>
            <rect x="7" y="2" width="3" height="20" rx="1.5" fill="#60a5fa">
              <animate
                attributeName="height"
                values="20;12;20"
                dur="0.5s"
                repeatCount="indefinite"
                begin="0.1s"
              />
              <animate
                attributeName="y"
                values="2;6;2"
                dur="0.5s"
                repeatCount="indefinite"
                begin="0.1s"
              />
            </rect>
            <rect x="12" y="5" width="3" height="14" rx="1.5" fill="#60a5fa">
              <animate
                attributeName="height"
                values="14;8;14"
                dur="0.5s"
                repeatCount="indefinite"
                begin="0.2s"
              />
              <animate
                attributeName="y"
                values="5;8;5"
                dur="0.5s"
                repeatCount="indefinite"
                begin="0.2s"
              />
            </rect>
            <rect x="17" y="3" width="3" height="18" rx="1.5" fill="#60a5fa">
              <animate
                attributeName="height"
                values="18;10;18"
                dur="0.5s"
                repeatCount="indefinite"
                begin="0.15s"
              />
              <animate
                attributeName="y"
                values="3;7;3"
                dur="0.5s"
                repeatCount="indefinite"
                begin="0.15s"
              />
            </rect>
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 24 24">
            <polygon points="6,3 20,12 6,21" fill="#60a5fa" />
          </svg>
        )}
      </button>
      <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600 }}>
        {text}
      </span>
    </div>
  );
}

function LingoMsgText({ text, lang }: { text: string; lang: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[AUDIO:[^\]]+\])/g);
  return (
    <span style={{ display: "block" }}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} style={{ color: "#60a5fa", fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        if (part.startsWith("[AUDIO:") && part.endsWith("]")) {
          const inner = part.slice(7, -1);
          const ci = inner.lastIndexOf(":");
          return (
            <LingoAudioChip
              key={i}
              text={inner.slice(0, ci)}
              lang={inner.slice(ci + 1).split("-")[0]}
            />
          );
        }
        return (
          <span key={i}>
            {part.split("\n").map((l, j, a) => (
              <span key={j}>
                {l}
                {j < a.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

function LingoTypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "10px 12px",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#3b82f6",
            animation: "lingoTyping 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function LingoModal({
  isOpen,
  onClose,
  context,
  initialPrompt,
}: {
  isOpen: boolean;
  onClose: () => void;
  context: LingoContext;
  initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || !initialPrompt) return;
    sentRef.current = false;
  }, [initialPrompt, isOpen]);
  useEffect(() => {
    if (!isOpen || !initialPrompt || sentRef.current) return;
    sentRef.current = true;
    sendMsg(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPrompt]);

  const sendMsg = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setStarted(true);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };
      setMessages((p) => [...p, userMsg]);
      setInput("");
      setLoading(true);
      try {
        const reply = await askGroq(history, text.trim(), context);
        setHistory((p) => [
          ...p,
          { role: "user", content: text.trim() },
          { role: "assistant", content: reply },
        ]);
        setMessages((p) => [
          ...p,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ]);
      } catch {
        setMessages((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Ada gangguan koneksi. Coba lagi ya.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [history, loading, context],
  );

  const handleClose = () => {
    setMessages([]);
    setHistory([]);
    setInput("");
    setStarted(false);
    sentRef.current = false;
    onClose();
  };

  const suggestions = buildSuggestions(context);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes lingoIn     { from{opacity:0;transform:translateY(18px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes lingoTyping { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
        @keyframes lingoMsg    { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { to{transform:rotate(360deg)} }
        .lingo-scroll::-webkit-scrollbar{display:none} .lingo-scroll{scrollbar-width:none}
        .lingo-ta::placeholder{color:#52525b}
        .lingo-sug:hover{background:rgba(59,130,246,0.12)!important;border-color:rgba(59,130,246,0.3)!important;color:#93c5fd!important}
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          height: "72vh",
          maxHeight: 600,
          background: "#0e0e16",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.6)",
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "lingoIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 14px 11px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <img
            src="/maskot.png"
            alt="Lingo"
            style={{
              width: 32,
              height: 32,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#f4f4f5", fontSize: 13, fontWeight: 700 }}>
                Tanya Lingo
              </span>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 5px #10b981",
                }}
              />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: "#8b8b94",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {context.chapterTitle} · {context.sectionHeading}
              {context.clickedWord && (
                <span style={{ color: "#3b82f6" }}>
                  {" "}
                  · "{context.clickedWord}"
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#71717a",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          className="lingo-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {!started && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                paddingTop: 2,
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: 10,
                  margin: "0 0 2px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Pertanyaan disarankan
              </p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="lingo-sug"
                  onClick={() => sendMsg(s.text)}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 11,
                    padding: "10px 12px",
                    color: "#a1a1aa",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    animation: `lingoMsg 0.2s ease ${i * 0.06}s both`,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: 6,
                  animation: "lingoMsg 0.18s ease",
                }}
              >
                {!isUser && (
                  <img
                    src="/maskot.png"
                    alt="Lingo"
                    style={{
                      width: 22,
                      height: 22,
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    maxWidth: "83%",
                    padding: "9px 12px",
                    borderRadius: isUser
                      ? "13px 13px 3px 13px"
                      : "13px 13px 13px 3px",
                    background: isUser
                      ? "linear-gradient(135deg,#1d4ed8,#2563eb)"
                      : "rgba(255,255,255,0.05)",
                    border: isUser
                      ? "none"
                      : "1px solid rgba(255,255,255,0.07)",
                    boxShadow: isUser
                      ? "0 3px 12px rgba(37,99,235,0.28)"
                      : "none",
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    color: isUser ? "#fff" : "#d4d4d8",
                  }}
                >
                  <LingoMsgText text={msg.content} lang={context.lang} />
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <img
                src="/maskot.png"
                alt="Lingo"
                style={{
                  width: 22,
                  height: 22,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "13px 13px 13px 3px",
                }}
              >
                <LingoTypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "9px 12px",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: "rgba(8,8,16,0.95)",
            flexShrink: 0,
          }}
        >
          <textarea
            ref={inputRef}
            className="lingo-ta"
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 100) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMsg(input);
              }
            }}
            placeholder="Tanya tentang materi ini..."
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${input.trim() ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 11,
              padding: "9px 12px",
              color: "#f4f4f5",
              fontSize: 12.5,
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
              transition: "border-color 0.2s",
              overflow: "hidden",
            }}
          />
          <button
            onClick={() => sendMsg(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              flexShrink: 0,
              background:
                input.trim() && !loading
                  ? "linear-gradient(135deg,#1d4ed8,#3b82f6)"
                  : "rgba(255,255,255,0.05)",
              border: "none",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                input.trim() && !loading
                  ? "0 3px 12px rgba(37,99,235,0.35)"
                  : "none",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13"
                  stroke={input.trim() ? "#fff" : "#52525b"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22l-4-9-9-4 20-7z"
                  stroke={input.trim() ? "#fff" : "#52525b"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Floating Action Button ── */
function LingoFAB({ onClick, bottom = 24 }: { onClick: () => void; bottom?: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Tanya Lingo"
      style={{
        position: "fixed",
        bottom,
        right: 20,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: hovered ? 7 : 0,
        height: 48,
        width: hovered ? "auto" : 48,
        paddingLeft: hovered ? 14 : 0,
        paddingRight: hovered ? 14 : 0,
        borderRadius: 24,
        background: "linear-gradient(135deg,#1e40af,#2563eb)",
        border: "1px solid rgba(96,165,250,0.3)",
        boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden",
      }}
    >
      <img
        src="/maskot.png"
        alt="Lingo"
        style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
      />
      {hovered && (
        <span
          style={{
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Tanya Lingo
        </span>
      )}
    </button>
  );
}

/* ── Tappable phrase in examples ── */
function TappablePhrase({
  text,
  onTap,
  style,
}: {
  text: string;
  onTap: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <span
      onClick={onTap}
      title="Tap untuk tanya Lingo"
      style={{
        cursor: "pointer",
        borderRadius: 3,
        padding: "1px 3px",
        transition: "all 0.15s",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12.5,
        fontWeight: 500,
        color: "#f4f4f5",
        lineHeight: 1.45,
        ...style,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "#93c5fd";
        el.style.background = "rgba(59,130,246,0.1)";
        el.style.borderBottomColor = "#3b82f6";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = "";
        el.style.background = "";
        el.style.borderBottomColor = "rgba(59,130,246,0.4)";
      }}
    >
      {text}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION META & RENDER MODES
══════════════════════════════════════════════════════════ */
const SECTION_META: Record<
  string,
  { label: string; color: string; accent: string; icon: string }
> = {
  vocabulary: {
    label: "Kosakata",
    color: "#10b981",
    accent: "rgba(16,185,129,0.08)",
    icon: "",
  },
  grammar: {
    label: "Tata Bahasa",
    color: "#3b82f6",
    accent: "rgba(59,130,246,0.08)",
    icon: "",
  },
  conversation: {
    label: "Percakapan",
    color: "#a855f7",
    accent: "rgba(168,85,247,0.08)",
    icon: "",
  },
  pronunciation: {
    label: "Pengucapan",
    color: "#f59e0b",
    accent: "rgba(245,158,11,0.08)",
    icon: "",
  },
  culture: {
    label: "Budaya",
    color: "#ec4899",
    accent: "rgba(236,72,153,0.08)",
    icon: "",
  },
};
function getSectionMeta(t: string) {
  return (
    SECTION_META[t] ?? {
      label: t,
      color: "#71717a",
      accent: "rgba(113,113,122,0.08)",
      icon: "",
    }
  );
}
const getRenderMode = (t: string) =>
  ["vocabulary", "pronunciation", "conversation"].includes(t)
    ? "bilingual"
    : "fullwidth";

const isStrokeSection = (s: Section) =>
  s.type === "grammar" &&
  (s.heading.toLowerCase().includes("goresan") ||
    s.heading.toLowerCase().includes("stroke") ||
    s.heading.toLowerCase().includes("menulis"));

/* ── TTS ── */
function speak(text: string, lang = "ja-JP") {
  speakSegments([{ text, lang }], undefined, { natural: true });
}
const getTtsLang = (l: string) =>
  ({ ja: "ja-JP", zh: "zh-CN", ko: "ko-KR" })[l] ?? "en-US";
const getColLabel = (lang: string) =>
  ({ ja: "Jepang", zh: "Mandarin", ko: "Korea" })[lang] ?? "English";

function PlayBtn({
  text,
  color,
  ttsLang,
  size = 28,
}: {
  text: string;
  color: string;
  ttsLang: string;
  size?: number;
}) {
  const [p, setP] = useState(false);
  const icon = Math.round(size * 0.36);
  return (
    <button
      onClick={() => {
        setP(true);
        speak(text, ttsLang);
        setTimeout(() => setP(false), 1600);
      }}
      title="Dengarkan"
      aria-label={`Dengarkan: ${text}`}
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: p ? color : `${color}1a`,
        border: `1px solid ${p ? color : `${color}40`}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      {p ? (
        <div
          style={{
            display: "flex",
            gap: "1.5px",
            alignItems: "end",
            height: 10,
          }}
        >
          {[60, 100, 70].map((h, i) => (
            <div
              key={i}
              style={{
                width: 2,
                background: "white",
                borderRadius: 1,
                height: `${h}%`,
              }}
            />
          ))}
        </div>
      ) : (
        <svg width={icon} height={icon} viewBox="0 0 9 10" fill="none">
          <path d="M2 1.5l5 3-5 3V1.5z" fill={color} />
        </svg>
      )}
    </button>
  );
}

/* ── Bilingual Row ── */
function BilingualRow({
  ex,
  color,
  ttsLang,
  onTapPhrase,
}: {
  ex: Example;
  color: string;
  ttsLang: string;
  onTapPhrase?: (text: string) => void;
}) {
  const hasArrow = ex.en.includes("→");
  if (hasArrow) {
    const [left, ...rest] = ex.en.split("→").map((s) => s.trim());
    const right = rest.join(" → ");
    return (
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${color}22`,
          background: `${color}07`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto",
            alignItems: "stretch",
          }}
        >
          <div style={{ padding: "9px 12px", background: `${color}10` }}>
            {onTapPhrase ? (
              <TappablePhrase text={left} onTap={() => onTapPhrase(left)} />
            ) : (
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#f4f4f5",
                }}
              >
                {left}
              </span>
            )}
          </div>
          <div
            style={{
              padding: "0 8px",
              color: "#facc15",
              fontSize: 14,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
            }}
          >
            →
          </div>
          <div
            style={{
              padding: "9px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: 700,
                color,
              }}
            >
              {right}
            </span>
            {ex.id && (
              <span
                style={{
                  fontSize: 11,
                  color: "#71717a",
                  marginTop: 2,
                  fontStyle: "italic",
                }}
              >
                {ex.id}
              </span>
            )}
          </div>
          <div
            style={{ display: "flex", alignItems: "center", padding: "0 8px" }}
          >
            <PlayBtn text={left} color={color} ttsLang={ttsLang} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          background: "rgba(255,255,255,0.03)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <PlayBtn text={ex.en} color={color} ttsLang={ttsLang} />
        {onTapPhrase ? (
          <TappablePhrase text={ex.en} onTap={() => onTapPhrase(ex.en)} />
        ) : (
          <span
            style={{
              color: "#f4f4f5",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {ex.en}
          </span>
        )}
      </div>
      <div
        style={{
          padding: "10px 12px",
          background: "rgba(255,255,255,0.015)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#a1a1aa",
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {ex.id}
        </span>
      </div>
      {ex.example && (
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "flex-start",
            gap: 7,
            padding: "8px 12px 10px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <PlayBtn text={ex.example.en} color={color} ttsLang={ttsLang} />
          <div style={{ minWidth: 0 }}>
            {onTapPhrase ? (
              <TappablePhrase text={ex.example.en} onTap={() => onTapPhrase(ex.example!.en)} />
            ) : (
              <span style={{ color: "#d4d4d8", fontSize: 12, lineHeight: 1.45 }}>{ex.example.en}</span>
            )}
            <span style={{ display: "block", color: "#71717a", fontSize: 11.5, lineHeight: 1.45, fontStyle: "italic", marginTop: 2 }}>
              {ex.example.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Word Card (vocabulary) ── */
// One word per card: the word large with a big play button, its meaning, and the example sentence when there is one
function WordCard({
  ex,
  color,
  ttsLang,
  onTapPhrase,
}: {
  ex: Example;
  color: string;
  ttsLang: string;
  onTapPhrase?: (text: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${ex.example ? `${color}38` : "rgba(255,255,255,0.07)"}`,
        background: ex.example
          ? `linear-gradient(180deg, ${color}10, rgba(255,255,255,0.02))`
          : "rgba(255,255,255,0.025)",
        padding: "12px 12px 12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <PlayBtn text={ex.en} color={color} ttsLang={ttsLang} size={38} />
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {onTapPhrase ? (
            <TappablePhrase
              text={ex.en}
              onTap={() => onTapPhrase(ex.en)}
              style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, padding: "0 2px" }}
            />
          ) : (
            <span style={{ color: "#f4f4f5", fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{ex.en}</span>
          )}
          <span style={{ color: "#a1a1aa", fontSize: 12.5, lineHeight: 1.45, paddingLeft: 2 }}>{ex.id}</span>
        </div>
      </div>
      {ex.example && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            borderTop: "1px dashed rgba(255,255,255,0.08)",
            paddingTop: 10,
            paddingLeft: 4,
          }}
        >
          <PlayBtn text={ex.example.en} color={color} ttsLang={ttsLang} size={28} />
          <div style={{ minWidth: 0 }}>
            {onTapPhrase ? (
              <TappablePhrase
                text={ex.example.en}
                onTap={() => onTapPhrase(ex.example!.en)}
                style={{ fontSize: 13, color: "#e4e4e7" }}
              />
            ) : (
              <span style={{ color: "#e4e4e7", fontSize: 13, lineHeight: 1.45 }}>{ex.example.en}</span>
            )}
            <span style={{ display: "block", color: "#a1a1aa", fontSize: 12, lineHeight: 1.45, fontStyle: "italic", marginTop: 2, paddingLeft: 3 }}>
              {ex.example.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Lingo tip ── */
// The section's tip, said by Lingo in a speech bubble
/** "Sumber materi": the word list the vocabulary was checked against, the Tatoeba sentences with their authors (CC BY), and what Lingora wrote */
function LessonSources({ sources, sections }: { sources: LessonSourceInfo; sections: Section[] }) {
  const [open, setOpen] = useState(false);
  const sentence = (id: number) => sections.flatMap((s) => s.examples).find((e) => e.example?.tatoeba?.en === id)?.example;
  const link = { color: "#93c5fd", textDecoration: "none" } as const;
  return (
    <div style={{ marginTop: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", background: "none", border: "none", color: "#a1a1aa", fontSize: 12.5, fontWeight: 700, cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <BookOpen size={14} /> Sumber materi
        </span>
        <span style={{ color: "#52525b" }}>{open ? "Tutup" : "Lihat"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12, fontSize: 12, lineHeight: 1.55, color: "#a1a1aa" }}>
          {sources.framework && (
            <div>
              <div style={{ color: "#e4e4e7", fontWeight: 700 }}>Tujuan belajar</div>
              Mengacu ke deskriptor level {sources.framework.level} di{" "}
              <a href={sources.framework.url} target="_blank" rel="noreferrer" style={link}>{sources.framework.name}</a>:
              {sources.framework.quotes.map((q) => (
                <div key={q} style={{ marginTop: 4, paddingLeft: 10, borderLeft: "2px solid rgba(255,255,255,0.1)", fontStyle: "italic" }}>&ldquo;{q}&rdquo;</div>
              ))}
            </div>
          )}
          {sources.vocabulary && (
            <div>
              <div style={{ color: "#e4e4e7", fontWeight: 700 }}>Kosakata</div>
              Dicek dengan{" "}
              <a href={sources.vocabulary.url} target="_blank" rel="noreferrer" style={link}>{sources.vocabulary.name}</a>{" "}
              ({sources.vocabulary.by}). {sources.vocabulary.note}
            </div>
          )}
          {sources.sentences && sources.sentences.length > 0 && (
            <div>
              <div style={{ color: "#e4e4e7", fontWeight: 700 }}>Contoh kalimat</div>
              Dari{" "}
              <a href="https://tatoeba.org" target="_blank" rel="noreferrer" style={link}>Tatoeba</a>, lisensi{" "}
              <a href="https://creativecommons.org/licenses/by/2.0/fr/" target="_blank" rel="noreferrer" style={link}>CC BY 2.0 FR</a>:
              <ul style={{ margin: "6px 0 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                {sources.sentences.map((t) => (
                  <li key={t.en}>
                    &ldquo;{sentence(t.en)?.en ?? ""}&rdquo;{" "}
                    <a href={`https://tatoeba.org/id/sentences/show/${t.en}`} target="_blank" rel="noreferrer" style={link}>#{t.en}</a> oleh {t.by[0]}, terjemahan{" "}
                    <a href={`https://tatoeba.org/id/sentences/show/${t.id}`} target="_blank" rel="noreferrer" style={link}>#{t.id}</a> oleh {t.by[1]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sources.authored && (
            <div>
              <div style={{ color: "#e4e4e7", fontWeight: 700 }}>Lainnya</div>
              {sources.authored}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LingoTip({ tip }: { tip: string }) {
  return (
    <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <LingoAvatar size={44} style={{ flexShrink: 0 }} />
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          padding: "10px 13px",
          borderRadius: "4px 14px 14px 14px",
          background: "rgba(250,204,21,0.07)",
          border: "1px solid rgba(250,204,21,0.2)",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "#facc15",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          <Lightbulb size={11} color="#facc15" /> Tips dari Lingo
        </span>
        <p style={{ color: "#fde68a", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>{tip}</p>
      </div>
    </div>
  );
}

/* ── Full Width Row ── */
function FullWidthRow({
  ex,
  color,
  onTapPhrase,
}: {
  ex: Example;
  color: string;
  onTapPhrase?: (text: string) => void;
}) {
  const hasArrow = ex.en.includes("→");
  if (hasArrow) {
    const [left, ...rest] = ex.en.split("→").map((s) => s.trim());
    const right = rest.join(" → ");
    return (
      <div
        style={{
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${color}20`,
          background: `${color}06`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto 1fr",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: `${color}12`,
              borderRight: `1px solid ${color}18`,
            }}
          >
            {onTapPhrase ? (
              <TappablePhrase text={left} onTap={() => onTapPhrase(left)} />
            ) : (
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#f4f4f5",
                  whiteSpace: "nowrap",
                }}
              >
                {left}
              </span>
            )}
          </div>
          <div
            style={{
              padding: "0 10px",
              color: "#facc15",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            →
          </div>
          <div style={{ padding: "10px 14px 10px 0" }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color,
                display: "block",
                lineHeight: 1.5,
              }}
            >
              {right}
            </span>
            {ex.id && (
              <span
                style={{
                  fontSize: 12,
                  color: "#71717a",
                  fontStyle: "italic",
                  marginTop: 3,
                  display: "block",
                  lineHeight: 1.5,
                }}
              >
                {ex.id}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
        padding: "11px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {onTapPhrase ? (
        <TappablePhrase text={ex.en} onTap={() => onTapPhrase(ex.en)} />
      ) : (
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e4e4e7",
            lineHeight: 1.5,
          }}
        >
          {ex.en}
        </span>
      )}
      {ex.id && (
        <span
          style={{
            fontSize: 12,
            color: "#71717a",
            fontStyle: "italic",
            lineHeight: 1.55,
          }}
        >
          {ex.id}
        </span>
      )}
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({
  section,
  id,
  lang,
  chapterTitle,
  stageLabel,
  onOpenLingo,
}: {
  section: Section;
  id?: string;
  lang: string;
  chapterTitle: string;
  stageLabel: string;
  onOpenLingo: (ctx: LingoContext, prompt?: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const meta = getSectionMeta(section.type);
  const isBilingual = getRenderMode(section.type) === "bilingual";
  const isWordCards = section.type === "vocabulary";
  const ttsLang = getTtsLang(lang);
  const colA = getColLabel(lang);
  const showBtn = isStrokeSection(section);
  const langName = LANG_NAMES[lang] ?? "bahasa ini";

  const handleTapPhrase = (phrase: string) => {
    const ctx: LingoContext = {
      chapterTitle,
      stageLabel,
      sectionHeading: section.heading,
      lang,
      examplePhrase: phrase,
    };
    const prompt = `Saya mengetuk frasa "${phrase}" di materi "${section.heading}". Tolong jelaskan artinya, cara bacanya, dan beri 1 contoh kalimat lain dalam ${langName}.`;
    onOpenLingo(ctx, prompt);
  };

  return (
    <>
      <div
        id={id}
        style={{
          background: "#0e0e14",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Section header */}
        <div
          style={{
            padding: "13px 16px 11px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: meta.accent,
          }}
        >
          <div
            style={{
              width: 4,
              height: 32,
              borderRadius: 2,
              background: meta.color,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: meta.color,
                }}
              >
                {meta.label}
              </span>
              <span style={{ fontSize: 12 }}>{meta.icon}</span>
            </div>
            <h3
              style={{
                color: "#f4f4f5",
                fontSize: 14,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {section.heading}
            </h3>
          </div>

          {/* Tanya Lingo button per section */}
          <button
            onClick={() => {
              const ctx: LingoContext = {
                chapterTitle,
                stageLabel,
                sectionHeading: section.heading,
                lang,
              };
              const prompt = `Jelaskan lebih lanjut tentang "${section.heading}" di materi "${stageLabel}". Berikan contoh tambahan yang mudah dipahami.`;
              onOpenLingo(ctx, prompt);
            }}
            title="Tanya Lingo tentang section ini"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              borderRadius: 8,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              color: "#60a5fa",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(59,130,246,0.16)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(59,130,246,0.08)";
            }}
          >
            <img
              src="/maskot.png"
              alt=""
              style={{ width: 14, height: 14, objectFit: "contain" }}
            />
            Tanya
          </button>

          {showBtn && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 10,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(245,158,11,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(245,158,11,0.1)";
              }}
            >
              <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
                <polygon points="1,0.5 10.5,6 1,11.5" fill="#f59e0b" />
              </svg>
              Lihat Animasi
            </button>
          )}
        </div>

        {/* Section body */}
        <div style={{ padding: "14px 16px" }}>
          <p
            style={{
              color: "#a1a1aa",
              fontSize: 13,
              lineHeight: 1.7,
              margin: section.examples.length > 0 ? "0 0 14px" : 0,
            }}
          >
            {section.body}
          </p>
          {section.examples.length > 0 && isWordCards && (
            <>
              <p
                style={{
                  fontSize: 10,
                  color: "#8b8b94",
                  margin: "0 0 8px",
                  fontWeight: 600,
                }}
              >
                Ketuk tombol putar untuk mendengar, ketuk kata untuk tanya Lingo
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
                  gap: 8,
                }}
              >
                {section.examples.map((ex, i) =>
                  ex.en.includes("→") ? (
                    <div key={i} style={{ gridColumn: "1 / -1" }}>
                      <BilingualRow ex={ex} color={meta.color} ttsLang={ttsLang} onTapPhrase={handleTapPhrase} />
                    </div>
                  ) : (
                    <div key={i} style={{ gridColumn: ex.example ? "1 / -1" : undefined }}>
                      <WordCard ex={ex} color={meta.color} ttsLang={ttsLang} onTapPhrase={handleTapPhrase} />
                    </div>
                  ),
                )}
              </div>
            </>
          )}
          {section.examples.length > 0 && !isWordCards && (
            <>
              {isBilingual && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    padding: "0 12px 6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#8b8b94",
                      textTransform: "uppercase",
                    }}
                  >
                    {colA}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#8b8b94",
                      textTransform: "uppercase",
                    }}
                  >
                    Indonesia
                  </span>
                </div>
              )}
              {/* Tap hint */}
              <p
                style={{
                  fontSize: 10,
                  color: "#8b8b94",
                  margin: "0 0 6px",
                  fontWeight: 600,
                }}
              >
                Ketuk kata untuk tanya Lingo
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {section.examples.map((ex, i) =>
                  isBilingual ? (
                    <BilingualRow
                      key={i}
                      ex={ex}
                      color={meta.color}
                      ttsLang={ttsLang}
                      onTapPhrase={handleTapPhrase}
                    />
                  ) : (
                    <FullWidthRow
                      key={i}
                      ex={ex}
                      color={meta.color}
                      onTapPhrase={handleTapPhrase}
                    />
                  ),
                )}
              </div>
            </>
          )}
          {section.tip && <LingoTip tip={section.tip} />}
        </div>
      </div>
      {showModal && <StrokeOrderModal onClose={() => setShowModal(false)} />}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PRACTICE COMPONENTS — unchanged from original
══════════════════════════════════════════════════════════ */
const PRACTICE_LABELS: Record<string, string> = {
  translation_quiz: "Terjemahan",
  fill_in_blank: "Isi Kosong",
  matching_word: "Cocokkan",
  listening_quiz: "Listening",
  speaking_test: "Speaking",
  mini_conversation: "Percakapan",
};

function ChoicePractice({
  item,
  onDone,
  chColor,
}: {
  item: any;
  onDone: (c: boolean) => void;
  chColor: string;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [chk, setChk] = useState(false);
  const c = item.content;
  const ok = sel === c.correctAnswer;
  const check = () => {
    if (!sel || chk) return;
    setChk(true);
    setTimeout(() => onDone(ok), 500);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p
        style={{
          color: "#f4f4f5",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {c.question || c.sentence}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {c.options.map((opt: string) => {
          const isSel = sel === opt,
            isRight = chk && opt === c.correctAnswer,
            isWrong = chk && isSel && !ok;
          return (
            <button
              key={opt}
              onClick={() => !chk && setSel(opt)}
              style={{
                background: isRight
                  ? "rgba(16,185,129,0.1)"
                  : isWrong
                    ? "rgba(239,68,68,0.1)"
                    : isSel
                      ? `${chColor}18`
                      : "rgba(255,255,255,0.03)",
                border: `1px solid ${isRight ? "rgba(16,185,129,0.35)" : isWrong ? "rgba(239,68,68,0.35)" : isSel ? chColor : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                padding: "11px 14px",
                textAlign: "left",
                color: isRight
                  ? "#34d399"
                  : isWrong
                    ? "#f87171"
                    : isSel
                      ? "#fff"
                      : "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
                cursor: chk ? "default" : "pointer",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {chk && isRight && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {chk && isWrong && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#f87171"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {opt}
            </button>
          );
        })}
      </div>
      {chk && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: ok ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <p
            style={{
              color: ok ? "#6ee7b7" : "#fca5a5",
              fontSize: 12,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {c.explanation}
          </p>
        </div>
      )}
      {!chk && (
        <button
          onClick={check}
          disabled={!sel}
          style={{
            width: "100%",
            height: 46,
            borderRadius: 10,
            background: sel ? `${chColor}1a` : "rgba(255,255,255,0.02)",
            border: `1px solid ${sel ? `${chColor}44` : "rgba(255,255,255,0.05)"}`,
            color: sel ? chColor : "#71717a",
            fontSize: 13,
            fontWeight: 700,
            cursor: sel ? "pointer" : "default",
            transition: "all 0.2s",
          }}
        >
          Cek Jawaban
        </button>
      )}
    </div>
  );
}

function MatchingPractice({
  item,
  onDone,
  chColor,
}: {
  item: any;
  onDone: (c: boolean) => void;
  chColor: string;
}) {
  const pairs: { word: string; meaning: string }[] = item.content.pairs;
  const shuffled: string[] = item.content.shuffledMeanings;
  const [selW, setSelW] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const C = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
  const hw = (w: string) => {
    if (done) return;
    setSelW((p) => (p === w ? null : w));
  };
  const hm = (m: string) => {
    if (!selW || done) return;
    const ex = Object.keys(matches).find((w) => matches[w] === m);
    const next = { ...matches };
    if (ex) delete next[ex];
    next[selW] = m;
    setMatches(next);
    setSelW(null);
    if (pairs.find((p) => p.word === selW)?.meaning !== m) {
      setWrong(m);
      setTimeout(() => setWrong(null), 600);
    }
    if (Object.keys(next).length === pairs.length)
      setTimeout(() => {
        setDone(true);
        onDone(pairs.every((p) => next[p.word] === p.meaning));
      }, 400);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p
        style={{
          color: "#f4f4f5",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {item.content.instruction}
      </p>
      {selW && (
        <p
          style={{
            color: "#71717a",
            fontSize: 11,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Pilih arti untuk:{" "}
          <span style={{ color: chColor, fontWeight: 700 }}>{selW}</span>
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pairs.map((p) => {
            const isM = !!matches[p.word],
              isSel = selW === p.word,
              idx = Object.keys(matches).indexOf(p.word),
              isOk = done && matches[p.word] === p.meaning;
            return (
              <button
                key={p.word}
                onClick={() => !isM && hw(p.word)}
                style={{
                  padding: "9px 11px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: "left",
                  background: done
                    ? isOk
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(239,68,68,0.08)"
                    : isSel
                      ? `${chColor}1a`
                      : "rgba(255,255,255,0.03)",
                  border: done
                    ? `1px solid ${isOk ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`
                    : isSel
                      ? `1px solid ${chColor}`
                      : `1px solid ${isM ? C[idx % C.length] + "44" : "rgba(255,255,255,0.07)"}`,
                  color: done
                    ? isOk
                      ? "#6ee7b7"
                      : "#fca5a5"
                    : isSel
                      ? chColor
                      : "#d4d4d8",
                  cursor: isM ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p.word}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shuffled.map((m) => {
            const mW = Object.keys(matches).find((w) => matches[w] === m),
              isM = !!mW,
              isW = wrong === m,
              idx = mW ? Object.keys(matches).indexOf(mW) : -1;
            const isOk =
              done &&
              mW &&
              matches[mW] === pairs.find((p) => p.word === mW)?.meaning;
            return (
              <button
                key={m}
                onClick={() => !isM && selW && hm(m)}
                style={{
                  padding: "9px 11px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: "left",
                  background: done
                    ? isOk
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(239,68,68,0.08)"
                    : isW
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(255,255,255,0.03)",
                  border: done
                    ? `1px solid ${isOk ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`
                    : isW
                      ? "1px solid rgba(239,68,68,0.35)"
                      : `1px solid ${isM ? C[idx % C.length] + "44" : "rgba(255,255,255,0.07)"}`,
                  color: done
                    ? isOk
                      ? "#6ee7b7"
                      : "#fca5a5"
                    : isW
                      ? "#fca5a5"
                      : "#a1a1aa",
                  cursor: isM ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      {done && item.content.explanation && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <p
            style={{
              color: "#6ee7b7",
              fontSize: 12,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {item.content.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

function ListeningPractice({
  item,
  onDone,
  chColor,
  lang,
}: {
  item: any;
  onDone: (c: boolean) => void;
  chColor: string;
  lang: string;
}) {
  const c = item.content;
  const tts = getTtsLang(lang);
  const [playing, setPlaying] = useState(false);
  const [pc, setPc] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [chk, setChk] = useState(false);
  const ok = sel === c.correctAnswer;
  const play = () => {
    setPlaying(true);
    setPc((n) => n + 1);
    speak(c.audioText, tts);
    setTimeout(
      () => setPlaying(false),
      Math.max(c.audioText.length * 70, 2000),
    );
  };
  const check = () => {
    if (!sel || chk) return;
    setChk(true);
    setTimeout(() => onDone(ok), 500);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          borderRadius: 12,
          padding: "14px",
          background: `${chColor}10`,
          border: `1px solid ${chColor}25`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={play}
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: playing ? `${chColor}40` : `${chColor}20`,
            border: `1.5px solid ${playing ? chColor : `${chColor}40`}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: playing ? `0 0 16px ${chColor}50` : "none",
            transition: "all 0.2s",
          }}
        >
          {playing ? (
            <div
              style={{
                display: "flex",
                gap: "2px",
                alignItems: "end",
                height: 18,
              }}
            >
              {[50, 90, 65, 80].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    background: chColor,
                    borderRadius: 2,
                    height: `${h}%`,
                  }}
                />
              ))}
            </div>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: chColor, marginLeft: 2 }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div>
          <p
            style={{
              color: chColor,
              fontSize: 11,
              fontWeight: 700,
              margin: "0 0 2px",
            }}
          >
            Audio
          </p>
          <p
            style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}
          >
            {playing
              ? "Sedang diputar..."
              : pc > 0
                ? `Diputar ${pc}× — tap ulang`
                : "Tap untuk mendengarkan"}
          </p>
        </div>
      </div>
      <p style={{ color: "#e4e4e7", fontSize: 14, fontWeight: 600, margin: 0 }}>
        {c.question}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {c.options.map((opt: string) => {
          const isSel = sel === opt,
            isRight = chk && opt === c.correctAnswer,
            isWrong = chk && isSel && !ok;
          return (
            <button
              key={opt}
              onClick={() => !chk && setSel(opt)}
              style={{
                background: isRight
                  ? "rgba(16,185,129,0.1)"
                  : isWrong
                    ? "rgba(239,68,68,0.1)"
                    : isSel
                      ? `${chColor}18`
                      : "rgba(255,255,255,0.03)",
                border: `1px solid ${isRight ? "rgba(16,185,129,0.35)" : isWrong ? "rgba(239,68,68,0.35)" : isSel ? chColor : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                padding: "11px 14px",
                textAlign: "left",
                color: isRight
                  ? "#34d399"
                  : isWrong
                    ? "#f87171"
                    : isSel
                      ? "#fff"
                      : "#d4d4d8",
                fontSize: 13,
                fontWeight: 500,
                cursor: chk ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {chk && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: ok ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <p
            style={{
              color: ok ? "#6ee7b7" : "#fca5a5",
              fontSize: 12,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {c.explanation}
          </p>
        </div>
      )}
      {!chk && (
        <button
          onClick={check}
          disabled={!sel}
          style={{
            width: "100%",
            height: 46,
            borderRadius: 10,
            background: sel ? `${chColor}1a` : "rgba(255,255,255,0.02)",
            border: `1px solid ${sel ? `${chColor}44` : "rgba(255,255,255,0.05)"}`,
            color: sel ? chColor : "#71717a",
            fontSize: 13,
            fontWeight: 700,
            cursor: sel ? "pointer" : "default",
            transition: "all 0.2s",
          }}
        >
          Cek Jawaban
        </button>
      )}
    </div>
  );
}

function SpeakingPractice({
  item,
  onDone,
  chColor,
  lang,
}: {
  item: any;
  onDone: (c: boolean) => void;
  chColor: string;
  lang: string;
}) {
  const c = item.content;
  const tts = getTtsLang(lang);
  const [status, setStatus] = useState<"idle" | "listening" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState(0);
  const [micOk, setMicOk] = useState(true);
  const recRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicOk(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = tts;
    recRef.current = rec;
    return () => {
      rec.abort();
    };
  }, [tts]);
  const start = () => {
    const rec = recRef.current;
    if (!rec || status !== "idle") return;
    setStatus("listening");
    setTranscript("");
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      const norm = (s: string) =>
        s
          .toLowerCase()
          .replace(/[^a-z\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\s]/g, "")
          .trim();
      const wa = norm(t).split(/\s+/),
        wb = norm(c.phrase).split(/\s+/);
      const s = Math.round(
        (wa.filter((w: string) => wb.includes(w)).length /
          Math.max(wb.length, 1)) *
          100,
      );
      setTranscript(t);
      setScore(s);
      setStatus("done");
      setTimeout(() => onDone(s >= 60), 600);
    };
    rec.onerror = () => {
      setStatus("done");
      setScore(0);
      onDone(true);
    };
    rec.start();
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: 12,
          padding: "16px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#71717a",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Ucapkan
        </p>
        <p
          style={{
            color: "#e4d9fb",
            fontSize: 18,
            fontWeight: 800,
            margin: "0 0 4px",
          }}
        >
          {c.phrase}
        </p>
        <p
          style={{
            color: "#71717a",
            fontSize: 12,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {c.translation}
        </p>
        {c.hint && (
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 11,
              margin: "6px 0 0",
            }}
          >
            {c.hint}
          </p>
        )}
      </div>
      {!micOk && (
        <div
          style={{
            padding: "12px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#fca5a5", fontSize: 12, margin: "0 0 8px" }}>
            Mic tidak tersedia.
          </p>
          <button
            onClick={() => onDone(true)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              color: "#d8b4fe",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Lanjut
          </button>
        </div>
      )}
      {micOk && status === "idle" && (
        <button
          onClick={start}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 12,
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.3)",
            color: "#c084fc",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect
              x="9"
              y="2"
              width="6"
              height="12"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M5 10a7 7 0 0014 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="20"
              x2="12"
              y2="22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Tap untuk Bicara
        </button>
      )}
      {micOk && status === "listening" && (
        <div
          style={{
            width: "100%",
            height: 50,
            borderRadius: 12,
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 16,
                borderRadius: 3,
                background: "#a855f7",
                animation: "wave 1s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
          <style>{`@keyframes wave{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}`}</style>
          <span
            style={{
              color: "#c084fc",
              fontSize: 12,
              fontWeight: 700,
              marginLeft: 4,
            }}
          >
            Mendengarkan...
          </span>
        </div>
      )}
      {status === "done" && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background:
              score >= 60 ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${score >= 60 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          {transcript && (
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                margin: "0 0 3px",
              }}
            >
              Kamu bilang: "{transcript}"
            </p>
          )}
          <p
            style={{
              color: score >= 60 ? "#6ee7b7" : "#fca5a5",
              fontSize: 13,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {score >= 60
              ? `Bagus! ${score}% cocok`
              : `Belum tepat (${score}%). Coba lagi!`}
          </p>
        </div>
      )}
    </div>
  );
}

function PracticeSection({
  items,
  chColor,
  lang,
  onAllDone,
}: {
  items: any[];
  chColor: string;
  lang: string;
  onAllDone: () => void;
}) {
  const [cur, setCur] = useState(0);
  const [res, setRes] = useState<boolean[]>([]);
  // The question is answered; it stays on screen with its explanation until the learner moves on
  const answered = res.length > cur;
  const isLast = cur + 1 >= items.length;
  const done = (ok: boolean) => {
    setRes((r) => (r.length > cur ? r : [...r, ok]));
  };
  const next = () => {
    if (isLast) onAllDone();
    else setCur(cur + 1);
  };
  const item = items[cur];
  if (!item) return null;
  return (
    <div
      style={{
        background: "#0e0e14",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          padding: "12px 16px 11px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 4,
              height: 30,
              borderRadius: 2,
              background: chColor,
              flexShrink: 0,
            }}
          />
          <div>
            <span
              style={{
                display: "block",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: chColor,
                marginBottom: 2,
              }}
            >
              Latihan
            </span>
            <span style={{ color: "#f4f4f5", fontSize: 13, fontWeight: 700 }}>
              {PRACTICE_LABELS[item.type] ?? item.type}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {items.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === cur ? 20 : 12,
                  height: 6,
                  borderRadius: 99,
                  background:
                    i < res.length
                      ? res[i]
                        ? "#10b981"
                        : "#ef4444"
                      : i === cur
                        ? chColor
                        : "rgba(255,255,255,0.12)",
                  transition: "background 0.3s, width 0.3s",
                }}
              />
            ))}
          </div>
          <span style={{ color: "#a1a1aa", fontSize: 11, fontWeight: 700 }}>
            Soal {cur + 1}/{items.length}
          </span>
        </div>
      </div>
      <div key={cur} style={{ padding: "14px 16px" }}>
        {(item.type === "translation_quiz" ||
          item.type === "fill_in_blank" ||
          item.type === "mini_conversation") && (
          <ChoicePractice item={item} onDone={done} chColor={chColor} />
        )}
        {item.type === "matching_word" && (
          <MatchingPractice item={item} onDone={done} chColor={chColor} />
        )}
        {item.type === "listening_quiz" && (
          <ListeningPractice
            item={item}
            onDone={done}
            chColor={chColor}
            lang={lang}
          />
        )}
        {item.type === "speaking_test" && (
          <SpeakingPractice
            item={item}
            onDone={done}
            chColor={chColor}
            lang={lang}
          />
        )}
        {![
          "translation_quiz",
          "fill_in_blank",
          "mini_conversation",
          "matching_word",
          "listening_quiz",
          "speaking_test",
        ].includes(item.type) && (
          <ChoicePractice item={item} onDone={done} chColor={chColor} />
        )}
        {answered && (
          <button
            onClick={next}
            autoFocus
            style={{
              width: "100%",
              height: 48,
              marginTop: 12,
              borderRadius: 12,
              background: `linear-gradient(135deg,${chColor},${chColor}cc)`,
              border: "none",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: `0 4px 18px ${chColor}40`,
            }}
          >
            {isLast ? "Selesai" : "Soal berikutnya →"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Lesson steps: one per topic, then the practice ── */
function LessonSteps({
  labels,
  step,
  reached,
  allDone,
  color,
  onGo,
}: {
  labels: string[];
  step: number;
  /** The furthest step opened so far; steps up to it can be revisited */
  reached: number;
  allDone: boolean;
  color: string;
  onGo: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "10px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
      {labels.map((label, i) => {
        const done = allDone || i < reached;
        const on = i === step;
        const open = i <= reached;
        return (
          <button
            key={i}
            onClick={() => open && onGo(i)}
            disabled={!open}
            aria-current={on ? "step" : undefined}
            aria-label={`Langkah ${i + 1}: ${label}`}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              background: "none",
              border: "none",
              padding: 0,
              cursor: open ? "pointer" : "default",
              textAlign: "left",
            }}
          >
            <span
              style={{
                display: "block",
                width: "100%",
                height: 4,
                borderRadius: 99,
                background: on ? color : done ? "#10b981" : "rgba(255,255,255,0.08)",
                transition: "background 0.3s",
              }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: on ? 800 : 600,
                color: on ? "#f4f4f5" : done ? "#a1a1aa" : "#71717a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */

export default function LearnStagePage({ params }: Props) {
  const router = useRouter();
  const { stageId } = use(params);
  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage) ?? "en";
  const { xp, addXp } = useProgress();
  const guestLimited = useGuestLimit(stageId);

  // One topic per step; the step after the last topic is the practice
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  // The scrolling content; it appears only after the lesson has loaded, so it is tracked with a ref callback
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [practiceComplete, setPracticeComplete] = useState(false);
  // A lesson gives its XP only the first time it is finished
  const wasDone = useStudyStore((s) => !!s.done[selectedLanguage]?.[stageId]);
  const [earnedXp, setEarnedXp] = useState(0);

  /* ── Lingo state ── */
  const [lingoOpen, setLingoOpen] = useState(false);
  const [lingoCtx, setLingoCtx] = useState<LingoContext | null>(null);
  const [lingoPrompt, setLingoPrompt] = useState<string | undefined>();

  const studyData = STUDY_DATA_MAP[selectedLanguage] ?? STUDY_DATA_MAP["en"];
  const adventureData =
    CHAPTERS_DATA_MAP[selectedLanguage] ?? CHAPTERS_DATA_MAP["en"];
  const chapters = (adventureData as any).chapters ?? [];

  let chapter: any = null,
    stage: any = null;
  for (const ch of chapters) {
    const s = ch.stages?.find((s: any) => s.id === stageId);
    if (s) {
      chapter = ch;
      stage = s;
      break;
    }
  }
  const entry: StudyEntry | null = stage?.feedKey
    ? ((studyData as any)[stage.feedKey] ?? null)
    : null;

  // Each step starts at its top
  useEffect(() => {
    scrollEl?.scrollTo({ top: 0 });
  }, [scrollEl, step]);

  const goToStep = (i: number) => {
    setStep(i);
    setReached((r) => Math.max(r, i));
  };

  /* ── Open Lingo helper ── */
  const openLingo = useCallback(
    (ctx?: Partial<LingoContext>, prompt?: string) => {
      setLingoCtx({
        chapterTitle: chapter?.title ?? "",
        stageLabel: stage?.label ?? "",
        sectionHeading: entry?.title ?? "",
        lang: selectedLanguage,
        ...ctx,
      });
      setLingoPrompt(prompt);
      setLingoOpen(true);
    },
    [chapter, stage, entry, selectedLanguage],
  );

  if (!chapter || !stage || !entry)
    return (
      <main
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a0d",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#8b8b94", fontSize: 14 }}>
            Materi tidak ditemukan.
          </p>
          <button
            onClick={() => router.push("/learn")}
            style={{
              color: "#3b82f6",
              fontSize: 13,
              fontWeight: 700,
              marginTop: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Kembali
          </button>
        </div>
      </main>
    );

  const cc = {
    color: chapter.color ?? "#3b82f6",
    ring: chapter.ring ?? "#60a5fa",
  };
  const wc = entry.sections.reduce(
    (n: number, s: Section) =>
      n + s.body.split(" ").length + s.examples.length * 5,
    0,
  );
  const readMins = Math.max(1, Math.round(wc / 120));
  const totalXp = entry.practice.reduce(
    (s: number, p: any) => s + (p.xpReward ?? 0),
    0,
  );
  const nTopics = entry.sections.length;
  const stepLabels = [
    ...entry.sections.map((s) => getSectionMeta(s.type).label),
    "Latihan",
  ];
  const onPractice = step >= nTopics;
  const nextLabel = onPractice ? "" : stepLabels[step + 1];
  // The practice has no forward button (it moves on by itself); once finished there is nothing to step through
  const showFooter = !onPractice || (!practiceComplete && step > 0);

  // Guests who used their free stages sign in before a new lesson
  if (guestLimited) return <GuestLimitScreen backTo="/learn" backLabel="Kembali ke daftar materi" />;

  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#050507",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 835,
          height: "100vh",
          background: "#0a0a0d",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(0,0,0,0.8)",
          position: "relative",
        }}
      >
        {/* Nav */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <button
            onClick={() => router.push("/learn")}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#71717a",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: cc.color,
                boxShadow: `0 0 8px ${cc.color}`,
              }}
            />
            <span style={{ color: "#71717a", fontSize: 12, fontWeight: 700 }}>
              {chapter.title} · {stage.label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Tanya Lingo shortcut di nav */}
            {/* <button
              onClick={() => openLingo()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 11px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.16)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'; }}
            >
              <img src="/maskot.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              Tanya
            </button> */}
            <div
              style={{
                background: "rgba(250,204,21,0.06)",
                border: "1px solid rgba(250,204,21,0.15)",
                borderRadius: 99,
                padding: "4px 10px",
              }}
            >
              <span style={{ color: "#facc15", fontSize: 11, fontWeight: 800 }}>
                {xp} XP
              </span>
            </div>
          </div>
        </div>
        <LessonSteps
          labels={stepLabels}
          step={step}
          reached={reached}
          allDone={practiceComplete}
          color={cc.color}
          onGo={goToStep}
        />

        {/* Scroll area */}
        <div
          id="study-scroll"
          ref={setScrollEl}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
          }}
        >
          {/* Hero (on the first step only) */}
          {step === 0 && (
          <div
            style={{
              padding: "22px 16px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: `radial-gradient(circle,${cc.color}18 0%,transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <span style={{ color: "#8b8b94", fontSize: 11, fontWeight: 600 }}>
                {chapter.subtitle}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="#3f3f46"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ color: cc.color, fontSize: 11, fontWeight: 700 }}>
                {stage.label}
              </span>
            </div>
            <h1
              style={{
                color: "#f4f4f5",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                margin: "0 0 8px",
              }}
            >
              {entry.title}
            </h1>
            <p
              style={{
                color: "#a1a1aa",
                fontSize: 13,
                lineHeight: 1.75,
                margin: "0 0 14px",
              }}
            >
              {entry.intro}
            </p>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {[
                {
                  label: `${readMins} menit`,
                  color: cc.color,
                  bg: `${cc.color}14`,
                  bd: `1px solid ${cc.color}30`,
                },
                {
                  label: `${entry.sections.length} topik`,
                  color: "#71717a",
                  bg: "rgba(255,255,255,0.04)",
                  bd: "1px solid rgba(255,255,255,0.08)",
                },
                {
                  label: wasDone && !practiceComplete ? "XP sudah didapat" : `+${totalXp} XP`,
                  color: "#facc15",
                  bg: "rgba(250,204,21,0.06)",
                  bd: "1px solid rgba(250,204,21,0.15)",
                },
                {
                  label: `${entry.practice.length} soal`,
                  color: "#a855f7",
                  bg: "rgba(168,85,247,0.06)",
                  bd: "1px solid rgba(168,85,247,0.2)",
                },
              ].map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: p.bg,
                    border: p.bd,
                    borderRadius: 99,
                    padding: "4px 11px",
                  }}
                >
                  <span
                    style={{ color: p.color, fontSize: 11, fontWeight: 700 }}
                  >
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
            {entry.objectives && (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, background: `${cc.color}0d`, border: `1px solid ${cc.color}30` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#e4e4e7", fontSize: 12.5, fontWeight: 800 }}>Setelah materi ini kamu bisa</span>
                  <span style={{ color: cc.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 6, background: `${cc.color}18` }}>
                    CEFR {entry.objectives.level}
                  </span>
                </div>
                {entry.objectives.items.map((o) => (
                  <div key={o} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#d4d4d8", fontSize: 12.5, lineHeight: 1.5, marginTop: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 3, background: cc.color, flexShrink: 0, marginTop: 8 }} />
                    {o}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          <div style={{ padding: "14px 12px 0" }}>
            {!onPractice && (
              <>
                <p
                  style={{
                    color: cc.color,
                    fontSize: 11,
                    fontWeight: 700,
                    margin: "0 4px 8px",
                  }}
                >
                  Langkah {step + 1} dari {nTopics}
                </p>
                <SectionCard
                  key={step}
                  section={entry.sections[step]}
                  id={`section-${step}`}
                  lang={selectedLanguage}
                  chapterTitle={chapter.title}
                  stageLabel={stage.label}
                  onOpenLingo={(ctx, prompt) => openLingo(ctx, prompt)}
                />
              </>
            )}
            {/* Stays mounted while the learner looks back at a topic, so answers already given are kept */}
            {reached >= nTopics && !practiceComplete && (
              <div hidden={!onPractice}>
              <PracticeSection
                items={entry.practice}
                chColor={cc.color}
                lang={selectedLanguage}
                onAllDone={() => {
                  setPracticeComplete(true);
                  // Belajar materi juga menjaga streak harian dan dihitung untuk target "Baca materi"
                  useUserStore.getState().updateStreak();
                  useUserStore.getState().incrementDailyMaterial();
                  // XP only the first time; reading it again is practice
                  const first = useStudyStore.getState().markDone(selectedLanguage, stageId);
                  if (first && totalXp > 0) addXp(totalXp);
                  setEarnedXp(first ? totalXp : 0);
                  // The lesson's words go into "Ulas kata", to be reviewed later
                  const words = entry.sections
                    .filter((s) => s.type === "vocabulary")
                    .flatMap((s) => s.examples)
                    .filter((e) => e.example)
                    .map((e) => ({ word: e.en, meaning: e.id, example: e.example!.en, source: "materi" as const }));
                  if (words.length) useReviewStore.getState().addWords(selectedLanguage, words);
                }}
              />
              </div>
            )}
            {onPractice && practiceComplete && (
              <div
                style={{
                  background: "#0e0e14",
                  borderRadius: 16,
                  border: `1px solid ${cc.color}30`,
                  padding: "24px 20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${cc.color}14`,
                    border: `1px solid ${cc.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    fontSize: 22,
                  }}
                >
                  <PartyPopper size={22} color={cc.color} />
                </div>
                <p
                  style={{
                    color: "#f4f4f5",
                    fontSize: 15,
                    fontWeight: 800,
                    margin: "0 0 4px",
                  }}
                >
                  Materi selesai!
                </p>
                <p
                  style={{ color: "#71717a", fontSize: 12, margin: "0 0 18px" }}
                >
                  {earnedXp > 0
                    ? `+${earnedXp} XP berhasil diperoleh`
                    : "Latihan ulang selesai. XP materi ini sudah kamu dapat sebelumnya."}
                </p>
                {entry.objectives && (
                  <div style={{ textAlign: "left", margin: "0 0 18px", padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.22)" }}>
                    <p style={{ color: "#34d399", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 6px" }}>SEKARANG KAMU BISA</p>
                    {entry.objectives.items.map((o) => (
                      <div key={o} style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#e4e4e7", fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>
                        <Check size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 3 }} />
                        {o}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => router.push("/learn")}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#71717a",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ← Kembali
                  </button>
                  <button
                    onClick={() => router.push("/adventure")}
                    style={{
                      flex: 2,
                      height: 46,
                      borderRadius: 12,
                      background: `linear-gradient(135deg,${cc.color},${cc.ring})`,
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: `0 4px 18px ${cc.color}40`,
                    }}
                  >
                    Ke Adventure →
                  </button>
                </div>
              </div>
            )}
            {onPractice && entry.sources && <LessonSources sources={entry.sources} sections={entry.sections} />}
          </div>
          <div style={{ height: 32 }} />
        </div>

        {/* Step buttons */}
        {showFooter && (
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              gap: 10,
              padding: "12px 16px calc(14px + env(safe-area-inset-bottom, 0px))",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "#0a0a0d",
            }}
          >
            {step > 0 && (
              <button
                onClick={() => goToStep(step - 1)}
                style={{
                  flex: onPractice ? 1 : "0 0 auto",
                  height: 48,
                  padding: "0 18px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#d4d4d8",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {onPractice ? "← Kembali ke materi" : "← Sebelumnya"}
              </button>
            )}
            {!onPractice && (
              <button
                onClick={() => goToStep(step + 1)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg,${cc.color},${cc.ring})`,
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: `0 4px 18px ${cc.color}40`,
                }}
              >
                {step + 1 >= nTopics ? "Mulai latihan →" : `Lanjut ke ${nextLabel} →`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Lingo Button ── */}
      <LingoFAB onClick={() => openLingo()} bottom={showFooter ? 96 : 24} />

      {/* ── Lingo Modal ── */}
      {lingoCtx && (
        <LingoModal
          isOpen={lingoOpen}
          onClose={() => setLingoOpen(false)}
          context={lingoCtx}
          initialPrompt={lingoPrompt}
        />
      )}
    </main>
  );
}
