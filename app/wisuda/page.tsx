"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Download,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid,
  Instagram,
} from "lucide-react";

// ─── FONT: VOGUE / HIGH-END EDITORIAL ───────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Italianno&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400&family=Jost:wght@300;400;500&display=swap');`;

// ─── TOKENS (WARM ALABASTER THEME) ───────────────────────────────────────────
const C = {
  bg: "#FAFAF7", // Alabaster / Putih Hangat
  ink: "#23211E", // Deep Charcoal Brown
  accent: "#B89F7D", // Soft Champagne Gold
  muted: "#938A82", // Taupe Gray
  surface: "#EFECE7", // Off-white untuk placeholder
  line: "rgba(35, 33, 30, 0.15)",
};

const serif = "'Bodoni Moda', serif";
const sans = "'Jost', sans-serif";
const script = "'Italianno', cursive";

const SLIDE_W = 1080;
const SLIDE_H = 1350;
const N = 9; // TOTAL 9 SLIDE
const CANVAS_W = SLIDE_W * N;

// ─── PHOTO COLOR GRADING ─────────────────────────────────────────────────────
const PHOTO_FILTER = "contrast(1.05) brightness(1.02) saturate(0.9)";

// ─── DEFAULT PLACEHOLDER IMAGES ──────────────────────────────────────────────
const PLACEHOLDERS = Array(11).fill(
  `linear-gradient(160deg, ${C.surface} 0%, #E5E0D8 100%)`,
);

// ─── NOISE TEXTURE ────────────────────────────────────────────────────────────
const Grain = ({ opacity = 0.3 }) => (
  <svg
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      opacity,
      mixBlendMode: "multiply",
      zIndex: 1,
    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="grain">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.8"
        numOctaves="3"
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" opacity="0.3" />
  </svg>
);

// ─── CAROUSEL CANVAS (9720 × 1350) ───────────────────────────────────────────
const CarouselCanvas = ({ photos, texts }: any) => {
  const { gradName, year } = texts;

  return (
    <div
      style={{
        width: CANVAS_W,
        height: SLIDE_H,
        background: C.bg,
        position: "relative",
        overflow: "hidden",
        fontFamily: sans,
        color: C.ink,
      }}
    >
      <Grain />

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 1 — HERO: OVERLAPPING TYPOGRAPHY
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: 0, width: SLIDE_W, height: SLIDE_H, overflow: "hidden" }}>
        {/* Foto Background */}
        {photos[0] ? (
          <img src={photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER, transform: "scale(1.01)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[0] }} />
        )}

        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 20%, rgba(35,33,30,0.6) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(35,33,30,0.95) 0%, transparent 50%)" }} />

        {/* Watermark Pojok Kiri Atas */}
        <div style={{ position: "absolute", top: 110, left: 80, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 32, height: 1, background: C.bg }} />
          <p style={{ fontFamily: script, color: C.bg, fontSize: 32, fontWeight: 400, margin: 0, transform: "translateY(-4px)" }}>
            wangrphy
          </p>
          <div style={{ width: 32, height: 1, background: C.bg }} />
        </div>

        {/* ── AREA JUDUL BERTUMPUK (TENGAH BAWAH) ── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 80px 140px 80px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", zIndex: 10 }}>
          {/* Tahun Wisuda */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 15 }}>
            <p style={{ fontFamily: sans, fontSize: 12, color: C.accent, margin: 0, letterSpacing: "0.3em", fontWeight: 500, textTransform: "uppercase" }}>
              CLASS OF {year || "2026"}
            </p>
          </div>

          {/* Layer 1 (Belakang): Teks GRADUATION */}
          <h1 style={{ fontFamily: serif, fontSize: 85, fontWeight: 400, color: "#fff", margin: "0 0 -50px 0", letterSpacing: "0.15em", lineHeight: 1, textTransform: "uppercase", opacity: 0.95, zIndex: 1 }}>
            Graduation
          </h1>

          {/* Layer 2 (Depan): Nama Wisudawan (Handwriting) */}
          <h2 style={{ fontFamily: script, color: C.accent, fontSize: 160, fontWeight: 400, margin: "0", lineHeight: 1, textShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 2, whiteSpace: "nowrap" }}>
            {gradName || "Nila"}
          </h2>

          {/* Subtitle Divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 15 }}>
            <div style={{ width: 60, height: 1, background: C.accent, opacity: 0.8 }} />
            <div style={{ width: 6, height: 6, background: "transparent", border: `1px solid ${C.accent}`, borderRadius: "50%" }} />
            <div style={{ width: 60, height: 1, background: C.accent, opacity: 0.8 }} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 2 — ASYMMETRIC CUT (SQUARE & STRIP)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W, width: SLIDE_W, height: SLIDE_H }}>
        {/* Kotak Kiri Atas */}
        <div style={{ position: "absolute", top: 150, left: 100, width: 550, height: 550, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
          {photos[1] ? <img src={photos[1]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[1] }} />}
        </div>

        {/* Strip Vertikal Kanan Bawah */}
        <div style={{ position: "absolute", bottom: 150, right: 120, width: 320, height: 600, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
          {photos[2] ? <img src={photos[2]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[2] }} />}
        </div>
        
        <p style={{ position: "absolute", bottom: 80, left: 100, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>02 / 09</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 3 — CINEMATIC LETTERBOX (EXTREME CROP)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W * 2, width: SLIDE_W, height: SLIDE_H }}>
        {/* Potongan horizontal tajam di tengah layar */}
        <div style={{ position: "absolute", top: 380, left: 0, width: "100%", height: 500, overflow: "hidden" }}>
          {photos[3] ? <img src={photos[3]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[3] }} />}
        </div>
        <p style={{ position: "absolute", bottom: 80, right: 80, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>03 / 09</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 4 & 5 — SEAMLESS LANDSCAPE (WITH MARGINS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W * 3, width: SLIDE_W * 2, height: SLIDE_H }}>
        <div style={{ position: "absolute", top: 150, bottom: 150, left: 0, right: 0, overflow: "hidden" }}>
          {photos[4] ? (
            <img src={photos[4]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[4] }} />
          )}
        </div>
        <p style={{ position: "absolute", bottom: 80, left: SLIDE_W + 80, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>04</p>
        <p style={{ position: "absolute", bottom: 80, left: SLIDE_W * 2 - 120, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>05</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 6 — FRAMED OVERLAP
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W * 5, width: SLIDE_W, height: SLIDE_H }}>
        {/* Main Center Image */}
        <div style={{ position: "absolute", top: 180, left: 150, width: 550, height: 750, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          {photos[5] ? <img src={photos[5]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[5] }} />}
        </div>

        {/* Small Overlay Image dengan Border Tebal menabrak gambar utama */}
        <div style={{ position: "absolute", bottom: 180, right: 120, width: 380, height: 480, overflow: "hidden", outline: `12px solid ${C.bg}`, boxShadow: "0 20px 50px rgba(0,0,0,0.15)", zIndex: 5 }}>
          {photos[6] ? <img src={photos[6]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[6] }} />}
        </div>
        <p style={{ position: "absolute", bottom: 80, left: 80, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>06 / 09</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 7 — THE THIN DIPTYCH (2 STRIPS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W * 6, width: SLIDE_W, height: SLIDE_H }}>
        <div style={{ display: "flex", justifyContent: "space-between", position: "absolute", top: 180, bottom: 180, left: 150, right: 150 }}>
          {/* Strip 1 */}
          <div style={{ width: "47%", height: "100%", overflow: "hidden" }}>
            {photos[7] ? <img src={photos[7]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[7] }} />}
          </div>
          {/* Strip 2 */}
          <div style={{ width: "47%", height: "100%", overflow: "hidden" }}>
            {photos[8] ? <img src={photos[8]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[8] }} />}
          </div>
        </div>
        <p style={{ position: "absolute", bottom: 80, right: 80, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>07 / 09</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 8 — THE ARCH WINDOW (LENGKUNGAN FINE ART)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W * 7, width: SLIDE_W, height: SLIDE_H }}>
        {/* Arch Shape Container */}
        <div style={{ 
          position: "absolute", top: 150, left: "50%", transform: "translateX(-50%)", 
          width: 600, height: 950, borderRadius: "300px 300px 0 0", 
          overflow: "hidden", border: `1px solid ${C.line}`, padding: 12
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "288px 288px 0 0", overflow: "hidden" }}>
            {photos[9] ? <img src={photos[9]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER }} /> : <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[9] }} />}
          </div>
        </div>
        <p style={{ position: "absolute", bottom: 80, left: 80, fontFamily: sans, fontSize: 11, letterSpacing: "0.2em", color: C.muted }}>08 / 09</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE 9 — FINAL FULL BLEED & WATERMARK
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "absolute", top: 0, left: SLIDE_W * 8, width: SLIDE_W, height: SLIDE_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* Foto Full Screen */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {photos[10] ? (
            <img src={photos[10]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER, transform: "scale(1.01)" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: PLACEHOLDERS[10] }} />
          )}
          {/* Shadow Halus di Bawah Agar Watermark Terbaca */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(35,33,30,0.85) 0%, transparent 40%)" }} />
        </div>

        {/* Watermark Tengah Bawah */}
        <div style={{ position: "absolute", bottom: 120, textAlign: "center", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 15 }}>
            <div style={{ width: 40, height: 1, background: C.bg }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.bg }} />
            <div style={{ width: 40, height: 1, background: C.bg }} />
          </div>
          <h3 style={{ fontFamily: script, fontSize: 80, color: C.bg, margin: "0 0 10px 0", fontWeight: 400, lineHeight: 1, paddingRight: 5 }}>
            wangrphy
          </h3>
          <p style={{ fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3em", margin: 0, fontWeight: 300, textTransform: "uppercase" }}>
            https://wangrphy.vercel.app/
          </p>
        </div>
      </div>

      {/* ── SLIDE DIVIDERS ── */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: i * SLIDE_W, width: 1, height: SLIDE_H, background: "rgba(35, 33, 30, 0.1)", zIndex: 99 }} />
      ))}
    </div>
  );
};

// ─── SLIDE VIEW ──────────────────────────────────────────────────────────────
const SlideView = ({ index, children }: any) => (
  <div style={{ width: SLIDE_W, height: SLIDE_H, overflow: "hidden", position: "relative", flexShrink: 0 }}>
    <div style={{ width: CANVAS_W, height: SLIDE_H, transform: `translateX(${-index * SLIDE_W}px)` }}>
      {children}
    </div>
  </div>
);

// ─── PHOTO UPLOADER ───────────────────────────────────────────────────────────
const PhotoSlot = ({ index, photo, onUpload, onRemove }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);

  if (index > 10) return null;

  const labels = [
    "1: Cover (Text)",
    "2: S2-Kiri Square",
    "3: S2-Kanan Vertikal",
    "4: S3-Cinematic Wide",
    "5: S4/5-Seamless Lndscp",
    "6: S6-Main Portrait",
    "7: S6-Detail Overlap",
    "8: S7-Kiri Ramping",
    "9: S7-Kanan Ramping",
    "10: S8-Arch (Lengkung)",
    "11: S9-Penutup Full",
  ];

  return (
    <div style={{ position: "relative", gridColumn: index === 4 ? "span 2" : "span 1" }}>
      <div
        onClick={() => !photo && inputRef.current?.click()}
        style={{
          width: "100%",
          aspectRatio: index === 4 ? "16/9" : "3/4",
          background: photo ? "transparent" : "rgba(35,33,30,0.05)",
          border: `1px dashed ${photo ? "transparent" : "rgba(35,33,30,0.2)"}`,
          borderRadius: 6,
          overflow: "hidden",
          cursor: photo ? "default" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "border-color 0.2s",
        }}
      >
        {photo ? (
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: PHOTO_FILTER, transform: "scale(1.01)" }} />
        ) : (
          <>
            <Upload size={18} color="rgba(35,33,30,0.4)" style={{ marginBottom: 6 }} />
            <p style={{ fontFamily: sans, fontSize: 10, color: "rgba(35,33,30,0.6)", margin: 0, letterSpacing: "0.05em", textAlign: "center", padding: "0 8px" }}>
              {labels[index]}
            </p>
          </>
        )}
      </div>
      {photo && (
        <button
          onClick={() => onRemove(index)}
          style={{
            position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%",
            background: "rgba(35,33,30,0.8)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={11} color="#fff" />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => onUpload(index, ev.target?.result); r.readAsDataURL(f); } }} />
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function GraduationCarousel() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState(Array(11).fill(null));
  const [view, setView] = useState("preview");
  const [slide, setSlide] = useState(0);
  const [downloading, setDl] = useState(false);
  const [texts, setTexts] = useState({
    gradName: "Nama Wisudawan",
    year: "2026",
  });

  const uploadPhoto = useCallback(
    (i: number, src: any) =>
      setPhotos((p) => {
        const n = [...p];
        n[i] = src;
        return n;
      }),
    []
  );
  const removePhoto = useCallback(
    (i: number) =>
      setPhotos((p) => {
        const n = [...p];
        n[i] = null;
        return n;
      }),
    []
  );

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setDl(true);
    try {
      const { toPng } = await import("html-to-image");
      const targetWidth = slide === 0 ? CANVAS_W : SLIDE_W;
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: C.bg,
        pixelRatio: 2,
        width: targetWidth,
        height: SLIDE_H,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
          padding: "0",
        },
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download =
        slide === 0 ? "carousel-avant-garde-hd.png" : `slide-${slide}-hd.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat meng-export gambar.");
    } finally {
      setDl(false);
    }
  };

  const SCALE_PANORAMA = 700 / SLIDE_H;
  const SCALE_SINGLE = 600 / SLIDE_H;

  return (
    <>
      <style>{`
        ${FONTS}
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080807; color: #f5f0e8; font-family: 'Jost', sans-serif; }
        ::-webkit-scrollbar { width: 4px; background: #111; }
        ::-webkit-scrollbar-thumb { background: rgba(184,159,125,0.4); border-radius: 2px; }
        .slide-btn { background: transparent; border: none; cursor: pointer; transition: all .15s; padding: 7px 11px; border-radius: 6px; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; }
        .slide-btn:hover { background: rgba(255,255,255,0.1); }
        .slide-btn.active { background: rgba(255,255,255,0.18); color: #fff; }
        .text-input { background: rgba(255,255,255,0.06); border: 0.5px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 12px; color: #fff; font-family: 'Jost', sans-serif; font-size: 12px; width: 100%; outline: none; transition: border-color .2s; }
        .text-input::placeholder { color: rgba(255,255,255,0.3); }
        .text-input:focus { border-color: rgba(255,255,255,0.5); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#080807",
        }}
      >
        {/* ── TOPBAR ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(8,8,7,0.96)",
            backdropFilter: "blur(12px)",
            borderBottom: "0.5px solid rgba(255,255,255,0.1)",
            padding: "12px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: `1px solid #fff`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Instagram size={13} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  color: "#fff",
                  fontWeight: 500,
                  margin: "0 0 1px",
                }}
              >
                WANGRPHY
              </p>
              <p
                style={{
                  fontFamily: serif,
                  fontSize: 16,
                  fontWeight: 300,
                  color: "#aaa",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                Gaya 3: Avant-Garde Editorial
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: 4,
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              className={`slide-btn ${slide === 0 ? "active" : ""}`}
              onClick={() => setSlide(0)}
              style={{ color: slide === 0 ? "#fff" : "#888" }}
            >
              Panorama
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <button
                key={i}
                className={`slide-btn ${slide === i ? "active" : ""}`}
                onClick={() => setSlide(i)}
                style={{ color: slide === i ? "#fff" : "#888" }}
              >
                S{i}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              onClick={() =>
                setView((v) => (v === "preview" ? "grid" : "preview"))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(255,255,255,0.08)",
                border: "0.5px solid rgba(255,255,255,0.2)",
                borderRadius: 7,
                padding: "8px 16px",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              {view === "preview" ? (
                <>
                  <Grid size={14} /> Grid
                </>
              ) : (
                <>
                  <Eye size={14} /> Preview
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#fff",
                border: "none",
                borderRadius: 7,
                padding: "8px 20px",
                color: "#000",
                fontSize: 12,
                fontWeight: 600,
                cursor: downloading ? "not-allowed" : "pointer",
                opacity: downloading ? 0.7 : 1,
                letterSpacing: "0.05em",
              }}
            >
              <Download size={14} />
              {downloading
                ? "Proses..."
                : slide === 0
                  ? "Download Panorama"
                  : `Download Slide ${slide}`}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* ── SIDEBAR PENGATURAN ── */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: "0.5px solid rgba(255,255,255,0.1)",
              overflowY: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  color: "#fff",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                UPLOAD FOTO (11 SLOT)
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <PhotoSlot
                    key={i}
                    index={i}
                    photo={photos[i]}
                    onUpload={uploadPhoto}
                    onRemove={removePhoto}
                  />
                ))}
              </div>
            </div>
            <div
              style={{ height: "0.5px", background: "rgba(255,255,255,0.1)" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  color: "#fff",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                TEKS COVER
              </p>
              {[
                { key: "gradName", label: "Nama Wisudawan", ph: "Jane Doe" },
                { key: "year", label: "Tahun", ph: "2026" },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#888",
                      marginBottom: 5,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                  </p>
                  <input
                    className="text-input"
                    placeholder={ph}
                    value={(texts as any)[key]}
                    onChange={(e) =>
                      setTexts((t) => ({ ...t, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── AREA PREVIEW ── */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              background: "#111",
            }}
          >
            {view === "grid" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 12,
                  width: "100%",
                  maxWidth: 1000,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSlide(i + 1);
                      setView("preview");
                    }}
                    style={{
                      cursor: "pointer",
                      borderRadius: 6,
                      overflow: "hidden",
                      border: `1px solid ${slide === i + 1 ? "#fff" : "rgba(255,255,255,0.15)"}`,
                      transition: "border-color 0.2s",
                      aspectRatio: "4/5",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: SLIDE_W,
                        height: SLIDE_H,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transformOrigin: "top left",
                        transform: `scale(${(1000 / 5 - 12) / SLIDE_W})`,
                      }}
                    >
                      <SlideView index={i}>
                        <CarouselCanvas photos={photos} texts={texts} />
                      </SlideView>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div
                  style={{
                    width:
                      slide === 0
                        ? Math.min(CANVAS_W * SCALE_PANORAMA, 1300)
                        : SLIDE_W * SCALE_SINGLE,
                    height:
                      slide === 0
                        ? SLIDE_H * SCALE_PANORAMA
                        : SLIDE_H * SCALE_SINGLE,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 8,
                    boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                    transition: "width 0.3s ease, height 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transformOrigin: "top left",
                      transform: `scale(${slide === 0 ? Math.min(SCALE_PANORAMA, 1300 / CANVAS_W) : SCALE_SINGLE})`,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      ref={canvasRef}
                      style={{
                        width: slide === 0 ? CANVAS_W : SLIDE_W,
                        height: SLIDE_H,
                      }}
                    >
                      {slide === 0 ? (
                        <CarouselCanvas photos={photos} texts={texts} />
                      ) : (
                        <SlideView index={slide - 1}>
                          <CarouselCanvas photos={photos} texts={texts} />
                        </SlideView>
                      )}
                    </div>
                  </div>
                </div>
                {slide > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 20,
                      marginTop: 20,
                    }}
                  >
                    <button
                      onClick={() => setSlide((s) => Math.max(1, s - 1))}
                      disabled={slide === 1}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: slide === 1 ? "default" : "pointer",
                        opacity: slide === 1 ? 0.3 : 1,
                      }}
                    >
                      <ChevronLeft size={24} color="#fff" />
                    </button>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div
                          key={i}
                          onClick={() => setSlide(i)}
                          style={{
                            width: slide === i ? 20 : 6,
                            height: 6,
                            borderRadius: 3,
                            background:
                              slide === i ? "#fff" : "rgba(255,255,255,0.2)",
                            cursor: "pointer",
                            transition: "all .2s",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setSlide((s) => Math.min(N, s + 1))}
                      disabled={slide === N}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: slide === N ? "default" : "pointer",
                        opacity: slide === N ? 0.3 : 1,
                      }}
                    >
                      <ChevronRight size={24} color="#fff" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}