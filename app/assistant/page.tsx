// src/app/assistant/page.tsx
"use client";

import BottomNav from "@/components/Layout/BottomNav";
// import router from "next/router";
import { useState, useRef, useEffect } from "react";
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
}

/* ─── Quick prompts ────────────────────────────────────── */
// const QUICK_PROMPTS = [
//   { icon: '⚙️', label: 'Cara pakai "I am"',  text: 'Jelaskan cara menggunakan "I am" dalam bahasa Inggris dengan contoh kalimat sederhana.' },
//   { icon: '✍️', label: 'Koreksi kalimatku',  text: 'Tolong koreksi kalimat ini dan jelaskan kesalahannya: "She don\'t likes coffee"' },
//   { icon: '🗣️', label: 'Latihan Speaking',   text: 'Berikan saya 5 kalimat pendek untuk latihan speaking sehari-hari dalam bahasa Inggris.' },
//   { icon: '📖', label: 'Tanya vocabulary',   text: 'Apa perbedaan antara "big", "large", dan "huge"? Berikan contoh penggunaannya.' },
// ];

/* ─── System prompt ────────────────────────────────────── */
const SYSTEM_INSTRUCTION = `Kamu adalah Lingo, asisten belajar bahasa Inggris yang ramah dan sabar dari aplikasi LINGORA. Tugasmu membantu pengguna belajar bahasa Inggris.

Panduan:
- Jawab dalam bahasa Indonesia kecuali diminta dalam bahasa lain
- Berikan contoh kalimat bahasa Inggris yang mudah dipahami
- Highlight kata atau frasa bahasa Inggris penting dengan tanda bintang seperti **kata ini**
- Jawab singkat, padat, dan jelas
- Jangan terlalu banyak menggunakan emoji — gunakan sesekali saja jika memang perlu
- Jika pengguna membuat kalimat bahasa Inggris, koreksi dengan sopan dan jelaskan alasannya
- Selalu semangati pengguna untuk terus belajar`;

/* ─── Gemini API call ──────────────────────────────────── */
async function callGemini(
  history: { role: "user" | "model"; parts: { text: string }[] }[],
  userText: string,
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [...history, { role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Maaf, ada gangguan. Coba lagi ya."
  );
}

/* ─── Render bold **text** ─────────────────────────────── */
function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} style={{ color: "#60a5fa", fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

/* ─── Typing indicator ─────────────────────────────────── */
function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "12px 14px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#3b82f6",
            animation: "typingDot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Maskot avatar ────────────────────────────────────── */
function MaskotAvatar({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        overflow: "hidden",
        flexShrink: 0,
        // background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
        // boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
      }}
    >
      <img
        src="/maskot.png"
        alt="Lingo"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

/* ─── Chat bubble ──────────────────────────────────────── */
function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
        animation: "msgIn 0.2s ease",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {!isUser && <MaskotAvatar size={28} />}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
            : "rgba(255,255,255,0.06)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isUser ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
          fontSize: 13,
          lineHeight: 1.6,
          color: isUser ? "#fff" : "#d4d4d8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <MessageText text={msg.content} />
      </div>
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────── */
function EmptyState({
  onSend,
  wide = false,
}: {
  onSend: (t: string) => void;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        padding: wide ? "270px 24px" : "62px 20px",
        textAlign: "center",
      }}
    >
      {/* Maskot */}
      <div
        style={{
          width: wide ? 350 : 250,
          height: wide ? 100 : 86,
          borderRadius: wide ? 28 : 24,
          overflow: "hidden",
          marginBottom: 20,
          // background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
          // boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <img
          src="/maskot.png"
          alt="Lingo"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Online badge */}
      {/* <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 99, padding: '4px 12px', marginBottom: 14,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }} />
        <span style={{ color: '#60a5fa', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'system-ui, sans-serif' }}>LINGO · ONLINE</span>
      </div> */}

      <h2
        style={{
          fontSize: wide ? 22 : 20,
          fontWeight: 900,
          color: "#f4f4f5",
          letterSpacing: "-0.03em",
          margin: "0 0 8px",
        }}
      >
        Halo, saya Lingo
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "#71717a",
          lineHeight: 1.6,
          margin: "0 0 24px",
          maxWidth: 280,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Asisten belajar bahasa Inggrismu. Tanya apa saja — grammar, vocabulary,
        atau minta latihan percakapan.
      </p>

      {/* Quick prompts */}
      {/* <div style={{
        display: 'grid',
        gridTemplateColumns: wide ? '1fr 1fr' : '1fr',
        gap: 8, width: '100%',
        maxWidth: wide ? 420 : 320,
      }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button key={i} onClick={() => onSend(p.text)} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '10px 14px',
            color: '#a1a1aa', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', textAlign: 'left',
            fontFamily: 'system-ui, sans-serif',
            transition: 'all 0.15s',
            animation: `fadeUp 0.3s ease ${i * 0.07}s both`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.25)';
              (e.currentTarget as HTMLElement).style.color = '#93c5fd';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#a1a1aa';
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div> */}
    </div>
  );
}

/* ─── Input bar ────────────────────────────────────────── */
function InputBar({
  input,
  setInput,
  onSend,
  loading,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  return (
    <div
      style={{
        padding: "10px 14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,8,16,0.96)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      <textarea
        ref={ref}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        }}
        onKeyDown={handleKeyDown}
        placeholder="Tanya Lingo tentang bahasa Inggris..."
        rows={1}
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${input.trim() ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 13,
          padding: "10px 14px",
          color: "#f4f4f5",
          fontSize: 13,
          lineHeight: 1.5,
          resize: "none",
          outline: "none",
          fontFamily: "system-ui, sans-serif",
          transition: "border-color 0.2s",
          overflow: "hidden",
        }}
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || loading}
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          flexShrink: 0,
          background:
            input.trim() && !loading
              ? "linear-gradient(135deg, #1d4ed8, #3b82f6)"
              : "rgba(255,255,255,0.06)",
          border: "none",
          cursor: input.trim() && !loading ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          boxShadow:
            input.trim() && !loading
              ? "0 4px 14px rgba(37,99,235,0.4)"
              : "none",
        }}
      >
        {loading ? (
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function AssistantPage() {
  const bp = useBreakpoint();
  const isTablet = bp === "tablet";

  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [geminiHistory, setGeminiHistory] = useState<
    { role: "user" | "model"; parts: { text: string }[] }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendingRef = useRef(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sendingRef.current) return;

    sendingRef.current = true;
    setStarted(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(geminiHistory.slice(-10), text.trim());

      setGeminiHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: text.trim() }] },
        { role: "model", parts: [{ text: reply }] },
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Ada gangguan koneksi. Silakan coba lagi.",
          ts: Date.now(),
        },
      ]);
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setGeminiHistory([]);
    setStarted(false);
  };

  const GlobalStyles = () => (
    <style>{`
      @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes msgIn   { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
      @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      @keyframes spin    { to{transform:rotate(360deg)} }
      @keyframes typingDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      textarea::placeholder { color:#52525b }
      textarea:focus { outline:none; border-color:rgba(59,130,246,0.5) !important; box-shadow:0 0 0 3px rgba(59,130,246,0.08) }
    `}</style>
  );

  /* ── Shared message area ── */
  const MessageArea = () => (
    <>
      {messages.map((msg) => (
        <ChatBubble key={msg.id} msg={msg} />
      ))}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <MaskotAvatar size={68} />
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px 16px 16px 4px",
            }}
          >
            <TypingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </>
  );

  /* ════════════════════════════════════════
     TABLET
  ════════════════════════════════════════ */
  if (isTablet) {
    return (
      <main
        style={{
          background: "#080810",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <GlobalStyles />
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            minHeight: "100vh",
            background: "#0a0a0d",
            borderLeft: "1px solid rgba(255,255,255,0.04)",
            borderRight: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 28px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(16px)",
              flexShrink: 0,
              position: "relative", // Penting: agar logo absolute bisa berada persis di tengah container ini
            }}
          >
            {/* KIRI: Tombol Back */}
            <button
              onClick={() => router.back()}
              style={{
                background: "transparent",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "color 0.2s",
                zIndex: 10, // Memastikan tombol bisa diklik dan tidak tertimpa elemen lain
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f4f4f5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* TENGAH: Logo (Tanpa Teks) */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/logo-home.png" // Ganti dengan path logo Anda
                alt="Logo"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* KANAN: Tombol Chat Baru */}
            <div style={{ zIndex: 10 }}>
              {started && (
                <button
                  onClick={resetChat}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "7px 14px",
                    color: "#71717a",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Chat baru
                </button>
              )}
            </div>
          </div>

          {/* Two-column */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Chat area */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 24px",
                  scrollbarWidth: "none",
                }}
              >
                {!started ? (
                  <EmptyState onSend={sendMessage} wide />
                ) : (
                  <MessageArea />
                )}
              </div>

              <InputBar
                input={input}
                setInput={setInput}
                onSend={() => sendMessage(input)}
                loading={loading}
              />

              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>
        {/* <BottomNav /> */}
      </main>
    );
  }

  /* ════════════════════════════════════════
     MOBILE
  ════════════════════════════════════════ */
  return (
    <main
      style={{
        background: "#080810",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <GlobalStyles />
      <div
        style={{
          width: "100%",
          maxWidth: 448,
          height: "100vh",
          background: "#0a0a0d",
          borderLeft: "1px solid rgba(255,255,255,0.04)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            paddingTop: "calc(env(safe-area-inset-top) + 14px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            flexShrink: 0,
            position: "relative", // Diperlukan untuk absolute positioning logo
          }}
        >
          {/* KIRI: Tombol Back */}
          <button
            onClick={() => router.back()} // Pastikan Anda sudah import useRouter
            style={{
              background: "transparent",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "color 0.2s",
              zIndex: 10, // Memastikan bisa di-klik
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f4f4f5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* TENGAH: Logo Lingora */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/logo-home.png" // Sesuaikan dengan path file logo Anda
              alt="Lingora Logo"
              style={{
                width: 72, // Menyesuaikan ukuran asli yang ada di props MaskotAvatar sebelumnya (72)
                height: 72,
                borderRadius: "50%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* KANAN: Tombol Reset */}
          <div style={{ zIndex: 10 }}>
            {started && (
              <button
                onClick={resetChat}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 9,
                  padding: "6px 12px",
                  color: "#71717a",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "74px 14px 8px",
            scrollbarWidth: "none",
          }}
        >
          {!started ? <EmptyState onSend={sendMessage} /> : <MessageArea />}
        </div>

        <InputBar
          input={input}
          setInput={setInput}
          onSend={() => sendMessage(input)}
          loading={loading}
        />
        <div style={{ height: 40 }} />
      </div>
      {/* <BottomNav /> */}
    </main>
  );
}
