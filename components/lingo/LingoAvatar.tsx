"use client";

// Lingo's living face: the real mascot (public/maskot.png, 739 x 696) with eyelids and a mouth drawn on top.
// It blinks on its own, floats while idle, tilts while thinking, leans in while listening, and moves its
// mouth while Lingo speaks. Speech comes from lib/lingo-speech (or a `mouthOpen` value from real audio later).

import { useEffect, useId, useRef, useState } from "react";
import { onLingoSpeech } from "@/lib/lingo-speech";

export type LingoState = "idle" | "listening" | "thinking" | "speaking";

const EYES = [
  { cx: 236, cy: 333 },
  { cx: 498, cy: 333 },
];
const EYE_R = 86;

/** Mouth outline: fixed corners; the inner and lower curves move apart as it opens (0..1) */
const mouthPath = (o: number) => `M 322 421 Q 368 ${461 - 26 * o} 414 421 Q 368 ${493 + 66 * o} 322 421 Z`;

export default function LingoAvatar({
  size = 96,
  state = "idle",
  mouthOpen,
  style,
}: {
  size?: number;
  /** What Lingo is doing; "speaking" is also detected automatically from lib/lingo-speech */
  state?: LingoState;
  /** 0..1 from real audio volume; when omitted, the mouth follows a natural talking rhythm */
  mouthOpen?: number;
  style?: React.CSSProperties;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bodyRef = useRef<HTMLDivElement>(null);
  const lidRefs = [useRef<SVGRectElement>(null), useRef<SVGRectElement>(null)];
  const lashRefs = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)];
  const mouthRef = useRef<SVGPathElement>(null);
  const mouthClipRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGEllipseElement>(null);

  // Show Lingo only once the picture is ready, so the eyelids and mouth never float on their own
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setReady(true);
    img.src = "/maskot.png";
    if (img.complete) setReady(true);
  }, []);

  // Latest inputs, read by the animation loop without restarting it
  const input = useRef({ state, mouthOpen, speaking: false, lastWordAt: 0 });
  input.current.state = state;
  input.current.mouthOpen = mouthOpen;

  useEffect(
    () =>
      onLingoSpeech((s) => {
        input.current.speaking = s.speaking;
        input.current.lastWordAt = s.lastWordAt;
      }),
    [],
  );

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let open = 0;
    let nextBlink = performance.now() + 1200 + Math.random() * 2000;
    let blinkStart = -1;

    const tick = (now: number) => {
      const cur = input.current;
      const speaking = cur.speaking || cur.state === "speaking";
      const mode: LingoState = speaking ? "speaking" : cur.state;
      const t = now / 1000;

      // Mouth: real volume when given, otherwise ~3 syllables per second, with a small kick on every word
      let target = 0;
      if (speaking) {
        if (typeof cur.mouthOpen === "number") target = cur.mouthOpen;
        else {
          const sinceWord = (now - cur.lastWordAt) / 1000;
          const kick = Math.max(0, 1 - sinceWord / 0.25) * 0.35;
          target = Math.min(1, 0.15 + 0.7 * Math.abs(Math.sin(t * 9.5)) * (0.75 + 0.25 * Math.sin(t * 2.3)) + kick);
        }
      }
      open += (target - open) * (target > open ? 0.45 : 0.25);

      // Blink every 2–5 s; half-lowered eyes while thinking
      if (now > nextBlink && blinkStart < 0) blinkStart = now;
      let blink = 0;
      if (blinkStart >= 0) {
        const p = (now - blinkStart) / 260;
        blink = p < 0.4 ? p / 0.4 : p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.45);
        if (p >= 1) {
          blinkStart = -1;
          nextBlink = now + 2000 + Math.random() * 3000;
        }
      }
      if (mode === "thinking") blink = Math.max(blink, 0.28);

      lidRefs.forEach((r) => r.current?.setAttribute("height", (EYE_R * 2 * blink).toFixed(1)));
      lashRefs.forEach((r) => r.current?.setAttribute("opacity", blink > 0.85 ? "1" : "0"));
      const d = mouthPath(open);
      mouthRef.current?.setAttribute("d", d);
      mouthClipRef.current?.setAttribute("d", d);
      if (tongueRef.current) {
        tongueRef.current.setAttribute("cy", (461 + 33 * open).toFixed(1));
        tongueRef.current.setAttribute("rx", (34 * open).toFixed(1));
        tongueRef.current.setAttribute("ry", (18 * open).toFixed(1));
      }

      // Body
      const float = reduce ? 0 : Math.sin(t * 2) * size * 0.03;
      let lift = float;
      let rot = 0;
      let sx = 1;
      let sy = 1;
      if (mode === "thinking" && !reduce) rot = -6 + Math.sin(t * 1.6) * 2;
      if (mode === "listening") {
        sx = sy = 1.03;
        lift -= size * 0.03;
      }
      if (mode === "speaking") {
        sx = 1 + 0.05 * open;
        sy = 1 - 0.04 * open;
        lift -= size * 0.05 * open;
      }
      if (bodyRef.current) bodyRef.current.style.transform = `translateY(${lift.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // lidRefs/lashRefs are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const h = Math.round((size * 696) / 739);
  return (
    <div style={{ width: size, height: h, position: "relative", ...style }} aria-label="Lingo" role="img">
      <div ref={bodyRef} style={{ position: "absolute", inset: 0, transformOrigin: "50% 100%", willChange: "transform" }}>
        <svg viewBox="0 0 739 696" width={size} height={h} style={{ display: "block", overflow: "visible", opacity: ready ? 1 : 0, transition: "opacity 0.25s" }}>
          <defs>
            <linearGradient id={`${uid}lid`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#A2FB04" />
              <stop offset="0.55" stopColor="#A9F523" />
              <stop offset="0.9" stopColor="#C4EE9F" />
            </linearGradient>
            <linearGradient id={`${uid}cheek`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#CAF1A3" />
              <stop offset="1" stopColor="#B9E792" />
            </linearGradient>
            <filter id={`${uid}soft`} x="-20%" y="-30%" width="140%" height="160%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <filter id={`${uid}lidsoft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            {EYES.map((e, i) => (
              <clipPath key={i} id={`${uid}eye${i}`}>
                <circle cx={e.cx} cy={e.cy} r={EYE_R} />
              </clipPath>
            ))}
            <clipPath id={`${uid}mouth`}>
              <path ref={mouthClipRef} d={mouthPath(0)} />
            </clipPath>
          </defs>
          <image href="/maskot.png" x="0" y="0" width="739" height="696" />
          <g filter={`url(#${uid}lidsoft)`}>
            {EYES.map((e, i) => (
              <g key={i} clipPath={`url(#${uid}eye${i})`}>
                <rect ref={lidRefs[i]} x={e.cx - EYE_R} y={e.cy - EYE_R} width={EYE_R * 2} height="0" fill={`url(#${uid}lid)`} />
              </g>
            ))}
          </g>
          {EYES.map((e, i) => (
            <path key={i} ref={lashRefs[i]} d={`M ${e.cx - 52} ${e.cy + 4} Q ${e.cx} ${e.cy + 38} ${e.cx + 52} ${e.cy + 4}`} stroke="#103B44" strokeWidth="13" fill="none" strokeLinecap="round" opacity="0" />
          ))}
          {/* Cover the printed smile, then draw the animated mouth */}
          <ellipse cx="368" cy="437" rx="64" ry="33" fill={`url(#${uid}cheek)`} filter={`url(#${uid}soft)`} />
          <path ref={mouthRef} d={mouthPath(0)} fill="#103B44" stroke="#103B44" strokeWidth="10" strokeLinejoin="round" />
          <g clipPath={`url(#${uid}mouth)`}>
            <ellipse ref={tongueRef} cx="368" cy="461" rx="0" ry="0" fill="#F0808F" />
          </g>
        </svg>
      </div>
    </div>
  );
}
