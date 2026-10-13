// src/lib/mic-recorder.ts
// Records the learner's voice as a 16 kHz mono WAV (what the pronunciation check on Lingo's voice server reads)
// and notices by itself when they stop talking: after speech, a short silence ends the recording.

const TARGET_RATE = 16000;

type StartOptions = {
  /** Loudness of the microphone right now (0..1), for the listening animation */
  onLevel?: (level: number) => void;
  /** The learner stopped talking (or never started, or talked too long): call stop() to get the audio */
  onEnd: () => void;
  silenceMs?: number;
  noSpeechMs?: number;
  maxMs?: number;
};

export class MicRecorder {
  private stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private recording = false;
  private speechStart = -1; // index of the chunk where speech began (-1: not yet)

  /** Asks for the microphone once; throws when it is not allowed or not available */
  async open(): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessor is old but works everywhere (an AudioWorklet would need a separate module file)
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    const mute = this.ctx.createGain();
    mute.gain.value = 0; // the node only runs while connected to the output; keep it silent
    this.source.connect(this.node);
    this.node.connect(mute);
    mute.connect(this.ctx.destination);
  }

  start({ onLevel, onEnd, silenceMs = 1300, noSpeechMs = 8000, maxMs = 15000 }: StartOptions): void {
    if (!this.ctx || !this.node) throw new Error("Microphone is not open");
    void this.ctx.resume();
    this.chunks = [];
    this.speechStart = -1;
    this.recording = true;
    const chunkMs = (4096 / this.ctx.sampleRate) * 1000;
    let elapsed = 0;
    let silent = 0;
    let loud = 0;
    let floor = 0.004; // background noise level, learned while recording
    this.node.onaudioprocess = (e) => {
      if (!this.recording) return;
      const data = new Float32Array(e.inputBuffer.getChannelData(0));
      this.chunks.push(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      onLevel?.(Math.min(1, Math.sqrt(Math.max(0, rms - floor)) * 3));
      elapsed += chunkMs;

      const threshold = Math.max(0.015, floor * 3);
      if (this.speechStart < 0) {
        floor = Math.min(0.03, floor * 0.9 + rms * 0.1);
        loud = rms > threshold ? loud + 1 : 0;
        if (loud >= 2) this.speechStart = Math.max(0, this.chunks.length - 5); // keep ~0.3 s before the first word
        else if (elapsed > noSpeechMs) return this.end(onEnd);
      } else {
        silent = rms < threshold * 0.7 ? silent + chunkMs : 0;
        if (silent > silenceMs) return this.end(onEnd);
      }
      if (elapsed > maxMs) this.end(onEnd);
    };
  }

  private end(onEnd: () => void) {
    if (!this.recording) return;
    this.recording = false;
    onEnd();
  }

  /** Ends the recording; returns the speech as a WAV, or null when nothing was said */
  stop(): Blob | null {
    this.recording = false;
    if (this.node) this.node.onaudioprocess = null;
    if (this.speechStart < 0 || !this.ctx) return null;
    const speech = this.chunks.slice(this.speechStart);
    this.chunks = [];
    const length = speech.reduce((n, c) => n + c.length, 0);
    const all = new Float32Array(length);
    let at = 0;
    for (const c of speech) { all.set(c, at); at += c.length; }
    return encodeWav(downsample(all, this.ctx.sampleRate, TARGET_RATE), TARGET_RATE);
  }

  /** Stops listening without keeping anything */
  cancel(): void {
    this.recording = false;
    this.speechStart = -1;
    this.chunks = [];
    if (this.node) this.node.onaudioprocess = null;
  }

  /** Releases the microphone (the browser's recording indicator turns off) */
  close(): void {
    this.cancel();
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => {});
    this.stream = null;
    this.ctx = null;
    this.source = null;
    this.node = null;
  }
}

/** Averages each group of input samples into one output sample (also removes most of what 16 kHz cannot hold) */
function downsample(input: Float32Array, from: number, to: number): Float32Array {
  if (from <= to) return input;
  const ratio = from / to;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const a = Math.floor(i * ratio);
    const b = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = a; j < b; j++) sum += input[j];
    out[i] = sum / Math.max(1, b - a);
  }
  return out;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const text = (at: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i)); };
  text(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
