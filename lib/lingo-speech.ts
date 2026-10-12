// Lingo's voice.
// Default: the device's built-in speech synthesis (no setup, works offline, sounds more robotic).
// Natural voice (opt-in, used by "Bicara dengan Lingo", English): Lingo's own voice server (voice-server/, Kokoro),
// address in NEXT_PUBLIC_LINGO_VOICE_URL. Played through Web Audio so Lingo's mouth follows the real loudness of
// the sound, sentence by sentence so the first words come quickly. Falls back to the device voice when unreachable.
// Indonesian text is read in Indonesian; [AUDIO:text:lang] phrases in their own language.
// Components can subscribe to know when Lingo is speaking (used by LingoAvatar for the mouth).

export type SpeechSegment = { text: string; lang: string };
type SpeechState = { speaking: boolean; lastWordAt: number };
type Listener = (s: SpeechState) => void;

const listeners = new Set<Listener>();
let state: SpeechState = { speaking: false, lastWordAt: 0 };
let run = 0; // increases on every new speak/stop, so callbacks from an older queue are ignored

function emit(next: Partial<SpeechState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

export function onLingoSpeech(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

const hasDeviceVoice = () => typeof window !== "undefined" && "speechSynthesis" in window;

/* ─── Natural voice (Lingo's voice server) ────────────────── */

const VOICE_URL = (process.env.NEXT_PUBLIC_LINGO_VOICE_URL ?? "").replace(/\/+$/, "");
const VOICE_HEADERS = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" };

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let playing: AudioBufferSourceNode | null = null;
let level: number | null = null; // loudness of the natural voice right now (0..1); null while it is not playing
let naturalOffUntil = 0; // after the server did not answer, use the device voice for a while
const clipCache = new Map<string, ArrayBuffer>(); // sentence → WAV, so repeated sentences are instant

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.connect(ctx.destination);
  }
  return ctx;
}

// Browsers only allow sound after the user has touched the page, so wake the audio on every tap or key
if (typeof window !== "undefined") {
  const unlock = () => {
    const c = audioContext();
    if (c && c.state === "suspended") void c.resume();
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}

/** How wide Lingo's mouth should be (0..1) while the natural voice plays; null when it is not playing */
export function getLingoVoiceLevel(): number | null {
  return level;
}

/** Whether Lingo's voice server answers (also wakes it up); false when none is configured */
export async function checkLingoVoice(): Promise<boolean> {
  if (!VOICE_URL) return false;
  try {
    const res = await fetch(`${VOICE_URL}/health`, { headers: VOICE_HEADERS, signal: AbortSignal.timeout(4000) });
    const ok = res.ok;
    if (ok) naturalOffUntil = 0;
    return ok;
  } catch {
    return false;
  }
}

/** Splits text into sentences (short first sentence = Lingo starts talking sooner) */
function sentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text];
  return parts.map((s) => s.trim()).filter(Boolean).flatMap((s) => (s.length > 380 ? s.match(/.{1,380}(\s|$)/g)!.map((p) => p.trim()) : [s]));
}

async function fetchClip(text: string): Promise<ArrayBuffer | null> {
  const hit = clipCache.get(text);
  if (hit) return hit.slice(0);
  try {
    const res = await fetch(`${VOICE_URL}/tts`, {
      method: "POST",
      headers: VOICE_HEADERS,
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (res.status === 429) naturalOffUntil = Date.now() + 60_000;
      return null;
    }
    const wav = await res.arrayBuffer();
    if (clipCache.size >= 40) clipCache.delete(clipCache.keys().next().value!);
    clipCache.set(text, wav.slice(0)); // decodeAudioData takes ownership of the buffer it gets
    return wav;
  } catch {
    naturalOffUntil = Date.now() + 30_000; // server off or unreachable: don't wait for it again right away
    return null;
  }
}

/** Plays one clip; resolves when it ends or is stopped */
function playClip(c: AudioContext, buffer: AudioBuffer): Promise<void> {
  return new Promise((resolve) => {
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser!);
    src.onended = () => resolve();
    playing = src;
    src.start();
  });
}

/** Returns false when the natural voice is not available, so the caller can use the device voice instead */
async function speakNatural(parts: SpeechSegment[], myRun: number, onDone?: () => void): Promise<boolean> {
  const c = audioContext();
  if (!VOICE_URL || !c || !analyser || Date.now() < naturalOffUntil) return false;
  if (!parts.every((p) => p.lang.toLowerCase().startsWith("en"))) return false; // the server speaks English only

  // Ask for every sentence at once (the server answers them in turn) and play each as soon as it is ready
  const list = parts.flatMap((p) => sentences(p.text));
  const clips = list.map((s) => fetchClip(s));
  const decode = async (i: number) => {
    const wav = await clips[i];
    return wav ? c.decodeAudioData(wav).catch(() => null) : null;
  };

  const first = await decode(0);
  if (myRun !== run) return true; // stopped while loading
  if (!first) return false;
  if (c.state !== "running") await c.resume().catch(() => {});
  if (c.state !== "running") return false; // the browser still blocks sound

  // Follow the loudness of what is playing, every frame
  const samples = new Uint8Array(analyser.fftSize);
  const follow = () => {
    if (myRun !== run || !analyser) return;
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const v of samples) sum += ((v - 128) / 128) ** 2;
    const rms = Math.sqrt(sum / samples.length);
    level = Math.min(1, Math.sqrt(Math.max(0, rms - 0.01)) * 2.2);
    requestAnimationFrame(follow);
  };
  level = 0;
  emit({ speaking: true, lastWordAt: performance.now() });
  requestAnimationFrame(follow);

  let buffer: AudioBuffer | null = first;
  for (let i = 0; i < list.length; i++) {
    if (!buffer) {
      // This sentence failed: say the rest with the device voice
      playing = null;
      level = null;
      speakDevice(list.slice(i).map((text) => ({ text, lang: "en-US" })), myRun, onDone);
      return true;
    }
    const next = i + 1 < list.length ? decode(i + 1) : null;
    await playClip(c, buffer);
    if (myRun !== run) return true;
    buffer = next ? await next : null;
    if (myRun !== run) return true;
    if (!next) break;
  }
  playing = null;
  level = null;
  emit({ speaking: false });
  onDone?.();
  return true;
}


/* ─── Device voice (fallback) ─────────────────────────────── */

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ?? voices.find((v) => v.lang.toLowerCase().startsWith(base));
}

function speakDevice(parts: SpeechSegment[], myRun: number, onDone?: () => void) {
  if (!hasDeviceVoice()) {
    emit({ speaking: false });
    onDone?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  parts.forEach((seg, i) => {
    const utt = new SpeechSynthesisUtterance(seg.text);
    utt.lang = seg.lang;
    utt.rate = seg.lang.startsWith("id") ? 0.95 : 0.82;
    const voice = pickVoice(seg.lang);
    if (voice) utt.voice = voice;
    utt.onstart = () => {
      if (myRun === run) emit({ speaking: true, lastWordAt: performance.now() });
    };
    utt.onboundary = () => {
      if (myRun === run) emit({ lastWordAt: performance.now() });
    };
    const done = () => {
      if (myRun === run && i === parts.length - 1) {
        emit({ speaking: false });
        onDone?.();
      }
    };
    utt.onend = done;
    utt.onerror = done;
    synth.speak(utt);
  });
}

/* ─── Public API ──────────────────────────────────────────── */

export function isSpeechSupported(): boolean {
  return hasDeviceVoice() || (typeof window !== "undefined" && "AudioContext" in window);
}

function stopPlayback() {
  if (playing) {
    try { playing.stop(); } catch { /* already stopped */ }
    playing = null;
  }
  level = null;
  if (hasDeviceVoice()) window.speechSynthesis.cancel();
}

/**
 * Speaks the segments one after another; Lingo counts as speaking from the first start to the last end.
 * `onDone` runs once everything has been said (not when it is cut off by stopLingoSpeech or a new speak).
 * `natural: true` asks for the natural server voice first (only English is available there for now).
 */
export function speakSegments(segments: SpeechSegment[], onDone?: () => void, opts: { natural?: boolean } = {}): void {
  const myRun = ++run;
  stopPlayback();
  const parts = segments
    .map((s) => ({ ...s, text: s.text.replace(/_{2,}/g, ", ").trim() })) // blanks like "___" become a short pause
    .filter((s) => s.text.length > 0);
  if (parts.length === 0) {
    emit({ speaking: false });
    onDone?.();
    return;
  }
  if (!opts.natural) {
    speakDevice(parts, myRun, onDone);
    return;
  }
  void speakNatural(parts, myRun, onDone).then((ok) => {
    if (!ok && myRun === run) speakDevice(parts, myRun, onDone);
  });
}

/** Speaks one text in one language (used by the [AUDIO] buttons and the speaking practice). */
export function speakText(text: string, lang: string): void {
  speakSegments([{ text, lang }]);
}

export function stopLingoSpeech(): void {
  run++;
  stopPlayback();
  emit({ speaking: false });
}

/** Turns a chat reply into speakable segments: plain text in Indonesian, [AUDIO:text:lang] in its language. */
export function splitForSpeech(reply: string, baseLang = "id-ID"): SpeechSegment[] {
  const segments: SpeechSegment[] = [];
  for (const part of reply.split(/(\[AUDIO:[^\]]+\])/g)) {
    if (part.startsWith("[AUDIO:") && part.endsWith("]")) {
      const inner = part.slice(7, -1);
      const ci = inner.lastIndexOf(":");
      if (ci > 0) segments.push({ text: inner.slice(0, ci), lang: inner.slice(ci + 1) });
      continue;
    }
    const plain = part
      .replace(/\*\*/g, "")
      .replace(/[*_#`>]/g, "")
      .replace(/^\s*[-•]\s+/gm, "")
      .replace(/\s+/g, " ")
      .replace(/^[\s.,;:!?]+/, "") // punctuation left over right after an [AUDIO] phrase
      .trim();
    if (plain) segments.push({ text: plain, lang: baseLang });
  }
  return segments;
}
