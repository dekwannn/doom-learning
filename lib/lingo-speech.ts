// Lingo's voice (free version): the device's built-in speech synthesis.
// Indonesian text is read in an Indonesian voice; [AUDIO:text:lang] phrases in their own language.
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

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ?? voices.find((v) => v.lang.toLowerCase().startsWith(base));
}

/**
 * Speaks the segments one after another; Lingo counts as speaking from the first start to the last end.
 * `onDone` runs once everything has been said (not when it is cut off by stopLingoSpeech or a new speak).
 */
export function speakSegments(segments: SpeechSegment[], onDone?: () => void): void {
  if (!isSpeechSupported()) {
    onDone?.();
    return;
  }
  const synth = window.speechSynthesis;
  const myRun = ++run;
  synth.cancel();
  const parts = segments.filter((s) => s.text.trim().length > 0);
  if (parts.length === 0) {
    emit({ speaking: false });
    onDone?.();
    return;
  }
  parts.forEach((seg, i) => {
    const utt = new SpeechSynthesisUtterance(seg.text.replace(/_{2,}/g, ", ")); // blanks like "___" become a short pause
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

/** Speaks one text in one language (used by the [AUDIO] buttons and the speaking practice). */
export function speakText(text: string, lang: string): void {
  speakSegments([{ text, lang }]);
}

export function stopLingoSpeech(): void {
  if (!isSpeechSupported()) return;
  run++;
  window.speechSynthesis.cancel();
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
