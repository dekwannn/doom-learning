// src/lib/lingo-pronunciation.ts
// Pronunciation check (English) on Lingo's voice server: POST /assess with the learner's voice as a WAV.
// The server hears what was said (Whisper) and which sounds were made, and reports only well-known mistakes
// that matter (with a short tip in Indonesian), so Lingo does not scold pronunciation that is actually fine.

import { LINGO_VOICE_URL } from "@/lib/lingo-speech";

export type PronunciationIssue = { expected: string; heard: string | null; tip: string };
export type PronunciationWord = { word: string; ok: boolean; expected: string; heard: string; issues: PronunciationIssue[] };
export type PronunciationResult = { said: string; target: string | null; heard: string; score: number; words: PronunciationWord[] };

/** Checks how the learner said it; null when the server could not check (off, busy, unreachable) */
export async function assessPronunciation(wav: Blob, target?: string): Promise<PronunciationResult | null> {
  if (!LINGO_VOICE_URL) return null;
  const query = target ? `?target=${encodeURIComponent(target)}` : "";
  try {
    const res = await fetch(`${LINGO_VOICE_URL}/assess${query}`, {
      method: "POST",
      headers: { "Content-Type": "audio/wav", "ngrok-skip-browser-warning": "1" },
      body: wav,
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    return (await res.json()) as PronunciationResult;
  } catch {
    return null;
  }
}

/** Words that need a correction (at most `max`, in the order they were said) */
export function wordsToFix(result: PronunciationResult | null, max = 2): PronunciationWord[] {
  if (!result) return [];
  const seen = new Set<string>();
  return result.words.filter((w) => {
    const key = w.word.toLowerCase();
    if (w.ok || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, max);
}

// How a sound is written for the learner (and for Lingo), instead of IPA symbols
const SOUND: Record<string, string> = {
  θ: 'th (as in "think")', ð: 'th (as in "this")', v: "v", z: "z", ʃ: "sh", ʒ: 'zh (as in "vision")',
  "iː": 'long "ee"', i: '"ee"', ɪ: 'short "i"', æ: 'a (as in "cat")', ɛ: '"e"', "eɪ": '"ay"', ə: '"uh"', a: '"a"',
  t: "t", d: "d", s: "s", f: "f", b: "b", w: "w", p: "p", k: "k", ɡ: "g", g: "g", m: "m", n: "n", ŋ: "ng", l: "l", ɹ: "r",
  "tʃ": "ch", "dʒ": "j", h: "h", j: "y",
};
const sound = (ipa: string) => SOUND[ipa] ?? ipa;

/**
 * A note for Lingo (added after the learner's words, not shown to them), so Lingo kindly corrects the word out loud
 * before it answers. Empty when there is nothing to correct.
 */
export function pronunciationNote(result: PronunciationResult | null): string {
  const words = wordsToFix(result);
  if (words.length === 0) return "";
  const problems = words.map((w) => {
    const i = w.issues[0];
    return i.heard ? `"${w.word}": the ${sound(i.expected)} sound came out like ${sound(i.heard)}` : `"${w.word}": the last ${sound(i.expected)} sound was dropped`;
  });
  return `(Pronunciation check from the app, not words from the learner: ${problems.join("; ")}.)`;
}
