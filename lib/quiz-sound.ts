// src/lib/quiz-sound.ts
// The sounds of the adventure quiz: the right/wrong/complete chimes, and the voice that reads the words and sentences.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { preloadLingoVoice, speakSegments, stopLingoSpeech } from '@/lib/lingo-speech';
import { useLanguageStore } from '@/store/useLanguageStore';

export function playSound(type: 'correct' | 'wrong' | 'complete') {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'correct') {
      [[523.25,0,0.12],[659.25,0.1,0.12],[783.99,0.2,0.18]].forEach(([freq,delay,dur])=>{const o=ctx.createOscillator();const og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='sine';o.frequency.value=freq as number;og.gain.setValueAtTime(0,ctx.currentTime+(delay as number));og.gain.linearRampToValueAtTime(0.18,ctx.currentTime+(delay as number)+0.02);og.gain.linearRampToValueAtTime(0,ctx.currentTime+(delay as number)+(dur as number));o.start(ctx.currentTime+(delay as number));o.stop(ctx.currentTime+(delay as number)+(dur as number));});
    } else if (type === 'wrong') {
      [[220,0,0.08],[196,0.09,0.14]].forEach(([freq,delay,dur])=>{const o=ctx.createOscillator();const og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='sawtooth';o.frequency.value=freq as number;og.gain.setValueAtTime(0,ctx.currentTime+(delay as number));og.gain.linearRampToValueAtTime(0.12,ctx.currentTime+(delay as number)+0.02);og.gain.linearRampToValueAtTime(0,ctx.currentTime+(delay as number)+(dur as number));o.start(ctx.currentTime+(delay as number));o.stop(ctx.currentTime+(delay as number)+(dur as number));});
    } else {
      [[523.25,0,0.1],[659.25,0.1,0.1],[783.99,0.2,0.1],[1046.5,0.3,0.25]].forEach(([freq,delay,dur])=>{const o=ctx.createOscillator();const og=ctx.createGain();o.connect(og);og.connect(ctx.destination);o.type='sine';o.frequency.value=freq as number;og.gain.setValueAtTime(0,ctx.currentTime+(delay as number));og.gain.linearRampToValueAtTime(0.2,ctx.currentTime+(delay as number)+0.03);og.gain.linearRampToValueAtTime(0,ctx.currentTime+(delay as number)+(dur as number));o.start(ctx.currentTime+(delay as number));o.stop(ctx.currentTime+(delay as number)+(dur as number));});
    }
  } catch { /* no sound on this device */ }
}

const LOCALE: Record<string, string> = { en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR' };
/** "Pelan" buttons: the device voice rate and Lingo's server speed for it */
export const SLOW_RATE = 0.5;
const SLOW_SPEED = 0.7;

const quizLang = () => useLanguageStore.getState().selectedLanguage ?? 'en';

/**
 * Reads a quiz text in the language being learned. English is read in Lingo's own voice (the voice server), and in
 * the device voice when that server is off; the other languages in the device voice of that language.
 * A `rate` under 0.7 (SLOW_RATE) asks for the slow voice.
 */
export function speakText(text: string, onStart?: ()=>void, onEnd?: ()=>void, rate = 0.85) {
  const lang = quizLang();
  const slow = rate < 0.7;
  onStart?.();
  speakSegments([{ text, lang: LOCALE[lang] ?? 'en-US' }], onEnd, { natural: lang === 'en', speed: slow ? SLOW_SPEED : undefined, rate });
}

/** Gets Lingo's voice ready for a text that will be played soon (English only), so it starts without waiting */
export function preloadSpeech(text?: string, slow = false) {
  if (text && quizLang() === 'en') preloadLingoVoice(text, slow ? SLOW_SPEED : undefined);
}

/** Stops any quiz voice (both Lingo's and the device's) */
export const stopSpeech = stopLingoSpeech;
