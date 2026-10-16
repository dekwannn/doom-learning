// src/lib/quiz-sound.ts
// The sounds of the adventure quiz: the right/wrong/complete chimes and the browser voice reading English.
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  } catch(_){}
}

export function speakText(text: string, onStart?: ()=>void, onEnd?: ()=>void, rate = 0.85) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US'; utt.rate = rate; utt.pitch = 1.0; utt.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
  if (v) utt.voice = v;
  utt.onstart = () => onStart?.();
  utt.onend   = () => onEnd?.();
  utt.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utt);
}
