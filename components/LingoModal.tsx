'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface LingoContext {
  chapterTitle: string;   // e.g. "Salam & Perkenalan"
  stageLabel: string;     // e.g. "Salam Dasar"
  sectionHeading: string; // e.g. "Kosakata Salam"
  lang: string;           // e.g. "ja"
  clickedWord?: string;   // word user tapped (optional)
  examplePhrase?: string; // full phrase from example row
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: LingoContext;
  initialPrompt?: string; // auto-sent on open
}

/* ══════════════════════════════════════════════════════════
   LANG HELPERS
══════════════════════════════════════════════════════════ */
const LANG_NAMES: Record<string, string> = {
  en: 'bahasa Inggris', ja: 'bahasa Jepang',
  zh: 'bahasa Mandarin', ko: 'bahasa Korea',
};
const LANG_TTS: Record<string, string> = {
  en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR',
};

function buildSystemPrompt(ctx: LingoContext) {
  const langName = LANG_NAMES[ctx.lang] ?? 'bahasa asing';
  return `Kamu adalah Lingo, asisten belajar ${langName} dari aplikasi LINGORA. Pengguna sedang mempelajari materi:
- Chapter: "${ctx.chapterTitle}"
- Stage: "${ctx.stageLabel}"  
- Section: "${ctx.sectionHeading}"

Panduan:
- Jawab singkat dan fokus ke konteks materi di atas
- Gunakan bahasa Indonesia, sertakan contoh ${langName} jika relevan
- Highlight kata ${langName} penting dengan **tanda bintang**
- Jika ada tag [AUDIO:teks:kode], gunakan untuk frasa yang perlu didengar
- Jangan keluar dari topik materi kecuali diminta
- Maksimal 3-5 kalimat per jawaban agar ringkas`;
}

/* ══════════════════════════════════════════════════════════
   GROQ API
══════════════════════════════════════════════════════════ */
async function askGroq(
  history: { role: 'user' | 'assistant'; content: string }[],
  userText: string,
  ctx: LingoContext,
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY ?? '';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt(ctx) },
        ...history.slice(-8),
        { role: 'user', content: userText },
      ],
      temperature: 0.65,
      max_tokens: 400,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? 'Maaf, ada gangguan. Coba lagi ya.';
}

/* ══════════════════════════════════════════════════════════
   TTS
══════════════════════════════════════════════════════════ */
function speakText(text: string, lang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = LANG_TTS[lang] ?? 'en-US';
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

/* ══════════════════════════════════════════════════════════
   AUDIO BUTTON (inline in message)
══════════════════════════════════════════════════════════ */
function AudioChip({ text, lang }: { text: string; lang: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      margin: '6px 0 2px', padding: '7px 11px',
      borderRadius: 9, background: 'rgba(59,130,246,0.08)',
      border: '1px solid rgba(59,130,246,0.2)',
    }}>
      <button
        onClick={() => { setPlaying(true); speakText(text, lang); setTimeout(() => setPlaying(false), Math.max(1200, text.length * 110)); }}
        style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: playing ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {playing
          ? <svg width="11" height="11" viewBox="0 0 24 24"><rect x="2" y="4" width="3" height="16" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="16;10;16" dur="0.5s" repeatCount="indefinite"/><animate attributeName="y" values="4;7;4" dur="0.5s" repeatCount="indefinite"/></rect><rect x="7" y="2" width="3" height="20" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="20;12;20" dur="0.5s" repeatCount="indefinite" begin="0.1s"/><animate attributeName="y" values="2;6;2" dur="0.5s" repeatCount="indefinite" begin="0.1s"/></rect><rect x="12" y="5" width="3" height="14" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="14;8;14" dur="0.5s" repeatCount="indefinite" begin="0.2s"/><animate attributeName="y" values="5;8;5" dur="0.5s" repeatCount="indefinite" begin="0.2s"/></rect><rect x="17" y="3" width="3" height="18" rx="1.5" fill="#60a5fa"><animate attributeName="height" values="18;10;18" dur="0.5s" repeatCount="indefinite" begin="0.15s"/><animate attributeName="y" values="3;7;3" dur="0.5s" repeatCount="indefinite" begin="0.15s"/></rect></svg>
          : <svg width="9" height="9" viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21" fill="#60a5fa"/></svg>
        }
      </button>
      <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>{text}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MESSAGE RENDERER
══════════════════════════════════════════════════════════ */
function MsgText({ text, lang }: { text: string; lang: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[AUDIO:[^\]]+\])/g);
  return (
    <span style={{ display: 'block' }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: '#60a5fa', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('[AUDIO:') && part.endsWith(']')) {
          const inner = part.slice(7, -1);
          const ci = inner.lastIndexOf(':');
          return <AudioChip key={i} text={inner.slice(0, ci)} lang={inner.slice(ci + 1).split('-')[0]} />;
        }
        return <span key={i}>{part.split('\n').map((l, j, a) => <span key={j}>{l}{j < a.length - 1 && <br />}</span>)}</span>;
      })}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   TYPING DOTS
══════════════════════════════════════════════════════════ */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 12px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', animation: 'lingoTyping 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUGGESTED QUESTIONS — generated from context
══════════════════════════════════════════════════════════ */
function buildSuggestions(ctx: LingoContext): string[] {
  const langName = LANG_NAMES[ctx.lang] ?? 'bahasa ini';
  const suggestions: string[] = [];

  if (ctx.clickedWord) {
    suggestions.push(`Apa arti "${ctx.clickedWord}" dalam ${langName}?`);
    suggestions.push(`Bagaimana cara mengucapkan "${ctx.clickedWord}"?`);
    suggestions.push(`Beri contoh kalimat lain dengan "${ctx.clickedWord}"`);
  } else if (ctx.examplePhrase) {
    suggestions.push(`Jelaskan kalimat: "${ctx.examplePhrase}"`);
    suggestions.push(`Bagaimana cara mengucapkan frasa ini dengan benar?`);
  } else {
    suggestions.push(`Jelaskan lebih lanjut tentang "${ctx.sectionHeading}"`);
    suggestions.push(`Beri contoh lain dari materi "${ctx.sectionHeading}"`);
    suggestions.push(`Apa yang perlu diperhatikan di "${ctx.chapterTitle}"?`);
  }

  return suggestions.slice(0, 3);
}

/* ══════════════════════════════════════════════════════════
   MAIN MODAL
══════════════════════════════════════════════════════════ */
export function LingoModal({ isOpen, onClose, context, initialPrompt }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitialRef = useRef(false);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Auto-send initial prompt when modal opens (context changes)
  useEffect(() => {
    if (!isOpen || !initialPrompt) return;
    sentInitialRef.current = false;
  }, [initialPrompt]);

  useEffect(() => {
    if (!isOpen || !initialPrompt || sentInitialRef.current) return;
    sentInitialRef.current = true;
    sendMessage(initialPrompt);
  }, [isOpen, initialPrompt]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setStarted(true);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askGroq(history, text.trim(), context);
      setHistory(prev => [...prev, { role: 'user', content: text.trim() }, { role: 'assistant', content: reply }]);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Ada gangguan koneksi. Coba lagi ya.' }]);
    } finally {
      setLoading(false);
    }
  }, [history, loading, context]);

  // Reset on close
  const handleClose = () => {
    setMessages([]);
    setHistory([]);
    setInput('');
    setStarted(false);
    sentInitialRef.current = false;
    onClose();
  };

  const suggestions = buildSuggestions(context);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes lingoModalIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes lingoTyping  { 0%,80%,100%{transform:scale(0.55);opacity:0.35} 40%{transform:scale(1);opacity:1} }
        @keyframes lingoMsgIn   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .lingo-scroll::-webkit-scrollbar { display:none; }
        .lingo-scroll { scrollbar-width:none; }
        .lingo-textarea::placeholder { color:#52525b; }
        .lingo-suggestion:hover { background:rgba(59,130,246,0.12) !important; border-color:rgba(59,130,246,0.3) !important; color:#93c5fd !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        height: '72vh', maxHeight: 600,
        background: '#0e0e16',
        borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
        zIndex: 51,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'lingoModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: 'system-ui, sans-serif',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {/* Maskot */}
          <img src="/maskot.png" alt="Lingo" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />

          {/* Context info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#f4f4f5', fontSize: 13, fontWeight: 700 }}>Tanya Lingo</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
            </div>
            <p style={{
              margin: 0, fontSize: 10, color: '#52525b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {context.chapterTitle} · {context.sectionHeading}
              {context.clickedWord && <span style={{ color: '#3b82f6' }}> · "{context.clickedWord}"</span>}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="lingo-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Empty state — suggestions */}
          {!started && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <p style={{ color: '#52525b', fontSize: 11, margin: '0 0 4px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Pertanyaan disarankan
              </p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="lingo-suggestion"
                  onClick={() => sendMessage(s)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 11, padding: '10px 13px',
                    color: '#a1a1aa', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                    animation: `lingoMsgIn 0.2s ease ${i * 0.06}s both`,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>
                    {i === 0 ? '💬' : i === 1 ? '🔊' : '📖'}
                  </span>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end', gap: 7,
                  animation: 'lingoMsgIn 0.18s ease',
                }}
              >
                {!isUser && (
                  <img src="/maskot.png" alt="Lingo" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
                )}
                <div style={{
                  maxWidth: '82%', padding: '9px 12px',
                  borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: isUser ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'rgba(255,255,255,0.05)',
                  border: isUser ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isUser ? '0 3px 12px rgba(37,99,235,0.3)' : 'none',
                  fontSize: 12.5, lineHeight: 1.65,
                  color: isUser ? '#fff' : '#d4d4d8',
                }}>
                  <MsgText text={msg.content} lang={context.lang} />
                </div>
              </div>
            );
          })}

          {/* Typing */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <img src="/maskot.png" alt="Lingo" style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px 14px 14px 3px' }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 12px',
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'rgba(8,8,16,0.95)',
          flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            className="lingo-textarea"
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Tanya tentang materi ini..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${input.trim() ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 11, padding: '9px 12px',
              color: '#f4f4f5', fontSize: 12.5, lineHeight: 1.5,
              resize: 'none', outline: 'none',
              transition: 'border-color 0.2s', overflow: 'hidden',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: input.trim() && !loading ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.05)',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() && !loading ? '0 3px 12px rgba(37,99,235,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke={input.trim() ? '#fff' : '#52525b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={input.trim() ? '#fff' : '#52525b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   CLICKABLE WORD WRAPPER
   Wrap any word/phrase in examples to make it tappable
══════════════════════════════════════════════════════════ */
export function TappablePhrase({
  text,
  lang,
  sectionHeading,
  chapterTitle,
  stageLabel,
  onTap,
}: {
  text: string;
  lang: string;
  sectionHeading: string;
  chapterTitle: string;
  stageLabel: string;
  onTap: (ctx: LingoContext, prompt: string) => void;
}) {
  const langName = LANG_NAMES[lang] ?? 'bahasa ini';
  return (
    <span
      onClick={() => {
        const ctx: LingoContext = { chapterTitle, stageLabel, sectionHeading, lang, clickedWord: text };
        const prompt = `Saya mengetuk kata/frasa "${text}" di materi ${sectionHeading}. Tolong jelaskan artinya, cara bacanya, dan beri 1 contoh kalimat dalam ${langName}.`;
        onTap(ctx, prompt);
      }}
      title={`Tanya Lingo tentang "${text}"`}
      style={{
        cursor: 'pointer',
        borderBottom: '1px dashed rgba(59,130,246,0.45)',
        color: 'inherit',
        transition: 'color 0.15s, border-color 0.15s',
        borderRadius: 2,
        padding: '0 1px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.color = '#93c5fd';
        (e.currentTarget as HTMLElement).style.borderBottomColor = '#3b82f6';
        (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.color = '';
        (e.currentTarget as HTMLElement).style.borderBottomColor = 'rgba(59,130,246,0.45)';
        (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      {text}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   FLOATING BUTTON
   Add this once in the stage page layout
══════════════════════════════════════════════════════════ */
export function LingoFAB({
  onClick,
  hasUnread = false,
}: {
  onClick: () => void;
  hasUnread?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Tanya Lingo"
      style={{
        position: 'fixed', bottom: 24, right: 20,
        zIndex: 40,
        display: 'flex', alignItems: 'center', gap: hovered ? 8 : 0,
        height: 60,
        paddingLeft: hovered ? 14 : 0,
        paddingRight: hovered ? 14 : 0,
        width: hovered ? 'auto' : 60,
        borderRadius: 24,
        background: 'linear-gradient(135deg,#1e40af,#2563eb)',
        border: '1px solid rgba(96,165,250,0.3)',
        boxShadow: '0 4px 20px rgba(37,99,235,0.45)',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
        justifyContent: 'center',
      }}
    >
      <img src="/maskot.png" alt="Lingo" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
      {hovered && (
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'system-ui,sans-serif' }}>
          Tanya Lingo
        </span>
      )}
      {hasUnread && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: '#10b981', border: '1.5px solid #0e0e16', boxShadow: '0 0 6px #10b981' }} />
      )}
    </button>
  );
}

export type { LingoContext };