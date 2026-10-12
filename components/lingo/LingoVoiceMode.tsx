"use client";

// "Bicara dengan Lingo": a full-screen Lingo that listens and answers out loud (English for now).
// Listening uses the browser's speech recognition. Lingo answers in simple English with its own voice
// (voice-server/, falls back to the device voice), and the Indonesian translation is shown as a caption.
// One turn = listen → think → speak; after speaking Lingo listens again on its own until paused or closed.

import { useEffect, useRef, useState } from "react";
import LingoAvatar, { type LingoState } from "@/components/lingo/LingoAvatar";
import { checkLingoVoice, speakSegments, splitForSpeech, stopLingoSpeech } from "@/lib/lingo-speech";

type Turn = { role: "user" | "assistant"; content: string };
type Phase = "idle" | "listening" | "thinking" | "speaking";

// Minimal typing for the Web Speech API (not part of the TypeScript DOM lib)
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Lingo's size on screen. Voice mode is only ever opened by a tap, so window is available.
const fitSize = () => Math.round(Math.min(300, window.innerWidth * 0.62, window.innerHeight * 0.36));

/** Lingo's reply as a caption: markdown removed, [AUDIO:phrase:lang] shown as a highlighted phrase */
function Caption({ text }: { text: string }) {
  const parts = text.split(/(\[AUDIO:[^\]]+\])/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("[AUDIO:") && p.endsWith("]")) {
          const inner = p.slice(7, -1);
          const ci = inner.lastIndexOf(":");
          return <span key={i} style={{ color: "#a3e635", fontWeight: 700 }}>{ci > 0 ? inner.slice(0, ci) : inner}</span>;
        }
        return <span key={i}>{p.replace(/\*\*/g, "").replace(/[*_#`>]/g, "")}</span>;
      })}
    </>
  );
}

/** Lingo's voice-mode reply is "<English>\nID: <Indonesian translation>"; anything else (e.g. an error) is Indonesian */
function splitTranslation(reply: string): { spoken: string; translation: string } | null {
  const m = reply.match(/^([\s\S]*?)\n?\s*ID:\s*([\s\S]+)$/);
  if (!m || !m[1].trim()) return null;
  return { spoken: m[1].trim(), translation: m[2].trim() };
}

const MicIcon =({ c, s }: { c: string; s: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="12" rx="3" stroke={c} strokeWidth="2" />
    <path d="M5 10a7 7 0 0014 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function LingoVoiceMode({ target, history, ask, onTurn, onClose }: {
  /** The language being learned */
  target: { flag: string; name: string; ttsLang: string };
  /** The chat so far, so Lingo remembers the context */
  history: Turn[];
  ask: (history: Turn[], text: string) => Promise<string>;
  /** Called after every turn, so the chat page can keep the conversation */
  onTurn: (userText: string, reply: string) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [translation, setTranslation] = useState("");
  const [hint, setHint] = useState("");
  const [hearLang, setHearLang] = useState(target.ttsLang); // practising: speak in the language being learned
  const [size, setSize] = useState(fitSize);
  const [supported] = useState(() => !!getRecognition());
  const [naturalVoice, setNaturalVoice] = useState<boolean | null>(null); // Lingo's voice server reachable?

  // Wake Lingo's voice server and show which voice will be used
  useEffect(() => {
    let alive = true;
    void checkLingoVoice().then((ok) => { if (alive) setNaturalVoice(ok); });
    return () => { alive = false; };
  }, []);

  const recRef = useRef<Recognition | null>(null);
  const historyRef = useRef<Turn[]>(history);
  const openRef = useRef(true);
  const autoRef = useRef(false); // keep the conversation going hands-free
  const hearLangRef = useRef(hearLang); // updated together with hearLang in changeHearLang

  useEffect(() => {
    openRef.current = true; // set again on every mount (React may mount, clean up and mount again)
    const fit = () => setSize(fitSize());
    window.addEventListener("resize", fit);
    stopLingoSpeech();
    return () => {
      openRef.current = false;
      window.removeEventListener("resize", fit);
      recRef.current?.abort();
      recRef.current = null;
      stopLingoSpeech();
    };
  }, []);

  // The latest versions of listen/answer, so recognition and speech callbacks never use stale ones
  const actions = useRef<{ listen: () => void; answer: (text: string) => Promise<void> } | null>(null);

  function listen() {
    const SR = getRecognition();
    if (!SR || !openRef.current) return;
    stopLingoSpeech();
    const old = recRef.current;
    recRef.current = null;
    old?.abort();

    const rec = new SR();
    rec.lang = hearLangRef.current;
    rec.continuous = false; // ends by itself after a short pause
    rec.interimResults = true; // show the words while the user is still talking
    let text = "";
    let failed = "";
    rec.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      text = s.trim();
      setHeard(text);
    };
    rec.onerror = (e) => { failed = e.error; };
    rec.onend = () => {
      if (recRef.current !== rec) return; // replaced, paused or closed
      recRef.current = null;
      if (text) { void actions.current?.answer(text); return; }
      autoRef.current = false;
      setPhase("idle");
      setHint(failed === "not-allowed" || failed === "service-not-allowed"
        ? "Izinkan akses mikrofon dulu, lalu ketuk lagi."
        : "Saya belum mendengar suaramu. Ketuk mikrofon untuk bicara.");
    };
    recRef.current = rec;
    setHeard("");
    setHint("");
    setPhase("listening");
    try { rec.start(); } catch { recRef.current = null; setPhase("idle"); }
  }

  async function answer(text: string) {
    setPhase("thinking");
    setReply("");
    setTranslation("");
    let res: string;
    try { res = await ask(historyRef.current, text); } catch { res = "Maaf, ada gangguan. Coba lagi ya."; }
    if (!openRef.current) return;
    historyRef.current = [...historyRef.current, { role: "user", content: text }, { role: "assistant", content: res }];
    const parsed = splitTranslation(res);
    onTurn(text, parsed ? `${parsed.spoken}\n\n🇮🇩 ${parsed.translation}` : res);
    setReply(parsed?.spoken ?? res);
    setTranslation(parsed?.translation ?? "");
    setPhase("speaking");
    const afterSpeaking = () => {
      if (!openRef.current) return;
      if (autoRef.current) actions.current?.listen();
      else setPhase("idle");
    };
    if (parsed) speakSegments(splitForSpeech(parsed.spoken, target.ttsLang), afterSpeaking, { natural: true });
    else speakSegments(splitForSpeech(res), afterSpeaking); // Indonesian (e.g. an error message): device voice
  }
  useEffect(() => {
    actions.current = { listen, answer };
  });

  function pause() {
    autoRef.current = false;
    const rec = recRef.current;
    recRef.current = null;
    rec?.abort();
    stopLingoSpeech();
    setPhase("idle");
  }

  function onMic() {
    if (!supported) return;
    if (phase === "listening") { recRef.current?.stop(); return; } // done talking: send now
    if (phase === "thinking") return;
    autoRef.current = true;
    listen(); // from idle, or cutting in while Lingo is speaking
  }

  function changeHearLang(l: string) {
    setHearLang(l);
    hearLangRef.current = l;
    if (phase === "listening") listen(); // restart in the new language
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const avatarState: LingoState = phase === "listening" ? "listening" : phase === "thinking" ? "thinking" : "idle";
  const status = !supported
    ? "Browser ini belum bisa mendengar suara. Coba buka Lingora di Chrome."
    : phase === "listening" ? "Saya mendengarkan…"
    : phase === "thinking" ? "Sebentar, saya pikirkan dulu…"
    : phase === "speaking" ? "Ketuk mikrofon untuk menyela"
    : hint || "Ketuk mikrofon, lalu mulai bicara";
  const glow = phase === "thinking" ? "rgba(250,204,21,0.16)" : phase === "idle" ? "rgba(92,250,46,0.07)" : "rgba(92,250,46,0.2)";
  const chip = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: `1px solid ${active ? "rgba(92,250,46,0.45)" : "rgba(255,255,255,0.08)"}`,
    background: active ? "rgba(92,250,46,0.1)" : "rgba(255,255,255,0.03)",
    color: active ? "#bef264" : "#71717a", fontFamily: "system-ui, sans-serif",
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Bicara dengan Lingo"
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "#08080c", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes lvmGlow { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.12)} }
        @keyframes lvmRing { 0%{transform:scale(1);opacity:0.55} 100%{transform:scale(1.9);opacity:0} }
      `}</style>

      {/* Soft light behind Lingo, coloured by what it is doing */}
      <div style={{ position: "absolute", left: "50%", top: "40%", width: size * 2.2, height: size * 2.2, borderRadius: "50%", background: `radial-gradient(circle, ${glow} 0%, transparent 65%)`, transform: "translate(-50%,-50%)", animation: phase === "idle" ? "none" : "lvmGlow 2.4s ease-in-out infinite", transition: "background 0.4s", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 560, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", paddingTop: "calc(env(safe-area-inset-top) + 14px)", position: "relative" }}>
        <button onClick={onClose} aria-label="Tutup" style={{ width: 38, height: 38, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#a1a1aa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#f4f4f5", fontSize: 15, fontWeight: 700 }}>Bicara dengan Lingo</div>
          {naturalVoice !== null && (
            <div style={{ color: naturalVoice ? "#86efac" : "#71717a", fontSize: 10.5, fontWeight: 600, marginTop: 2 }}>
              {naturalVoice ? "● Suara Lingo" : "Suara browser"}
            </div>
          )}
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Which language the user speaks in */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
        <span style={{ color: "#52525b", fontSize: 12, marginRight: 2 }}>Aku bicara:</span>
        <button onClick={() => changeHearLang("id-ID")} style={chip(hearLang === "id-ID")}>🇮🇩 Indonesia</button>
        <button onClick={() => changeHearLang(target.ttsLang)} style={chip(hearLang === target.ttsLang)}>{target.flag} {target.name}</button>
      </div>

      {/* Lingo */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, position: "relative", width: "100%", maxWidth: 520, padding: "0 24px" }}>
        <LingoAvatar size={size} state={avatarState} />
        <div aria-live="polite" style={{ color: phase === "thinking" ? "#facc15" : phase === "idle" ? "#71717a" : "#86efac", fontSize: 14, fontWeight: 600, textAlign: "center", minHeight: 20 }}>{status}</div>

        {/* What was heard, and what Lingo answered */}
        <div style={{ minHeight: 96, maxHeight: "24vh", overflowY: "auto", textAlign: "center", scrollbarWidth: "none" }}>
          {heard && (
            <p style={{ color: phase === "listening" ? "#e4e4e7" : "#71717a", fontSize: phase === "listening" ? 17 : 13.5, lineHeight: 1.5, margin: "0 0 10px", transition: "all 0.2s" }}>“{heard}”</p>
          )}
          {reply && phase !== "listening" && (
            <p style={{ color: "#f4f4f5", fontSize: 16, lineHeight: 1.55, margin: 0 }}><Caption text={reply} /></p>
          )}
          {translation && phase !== "listening" && (
            <p style={{ color: "#71717a", fontSize: 13, lineHeight: 1.5, margin: "8px 0 0" }}>🇮🇩 {translation}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "8px 0", paddingBottom: "calc(env(safe-area-inset-bottom) + 36px)", position: "relative" }}>
        <div style={{ position: "relative", width: 84, height: 84 }}>
          {phase === "listening" && [0, 0.8].map(d => (
            <span key={d} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(92,250,46,0.6)", animation: `lvmRing 1.6s ease-out ${d}s infinite` }} />
          ))}
          <button onClick={onMic} disabled={!supported || phase === "thinking"}
            aria-label={phase === "listening" ? "Selesai bicara" : "Mulai bicara"}
            style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "none", cursor: !supported || phase === "thinking" ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              background: !supported || phase === "thinking" ? "#27272a" : "#5cfa2e",
              boxShadow: phase === "listening" ? "0 0 32px rgba(92,250,46,0.55)" : "0 8px 24px rgba(0,0,0,0.4)", transition: "background 0.2s, box-shadow 0.2s" }}>
            {phase === "listening"
              ? <span style={{ width: 22, height: 22, borderRadius: 6, background: "#0a0a0d" }} />
              : <MicIcon c={!supported || phase === "thinking" ? "#52525b" : "#0a0a0d"} s={32} />}
          </button>
        </div>
        <div style={{ height: 30, display: "flex", alignItems: "center" }}>
          {phase !== "idle" && (
            <button onClick={pause} style={{ padding: "6px 16px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#a1a1aa", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>Jeda</button>
          )}
        </div>
      </div>
    </div>
  );
}
