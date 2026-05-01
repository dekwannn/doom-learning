// src/app/learn/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/Layout/BottomNav";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProgress } from "@/hooks/useProgress";

/* ─── Data per bahasa ─────────────────────────────────────
   Tambah entry baru di sini kalau ada bahasa baru.
   studyData = data materi belajar (sections + practice)
   chaptersData = data chapter + stage (dari adventure data)
────────────────────────────────────────────────────────── */
import enStudyData from "@/data/studyData.json";
import enDummyData from "@/data/dummyData.json";
import jaStudyData from "@/data/jaStudyData.json";
import jaAdventureData from "@/data/jaData.json";
import zhStudyData from "@/data/zhStudyData.json";
import zhAdventureData from "@/data/zhData.json";
import koStudyData     from '@/data/koStudyData.json';
import koAdventureData from '@/data/koData.json';

const STUDY_DATA_MAP: Record<string, any> = {
  en: enStudyData,
  ja: jaStudyData,
  zh: zhStudyData,
  ko: koStudyData,   // ← tambah
};

const CHAPTERS_DATA_MAP: Record<string, any> = {
  en: enDummyData,
  ja: jaAdventureData,
  zh: zhAdventureData,
  ko: koAdventureData,   // ← tambah
};

/* ─── Chapter images per index ────────────────────────── */
const CHAPTER_IMAGES: Record<number, string> = {
  0: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
  1: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
  2: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=800&q=80",
  3: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
  4: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
};

/* ─── Section type labels ─────────────────────────────── */
const SECTION_TYPE_LABELS: Record<string, { label: string }> = {
  vocabulary:    { label: "Kosakata" },
  grammar:       { label: "Tata Bahasa" },
  conversation:  { label: "Percakapan" },
  pronunciation: { label: "Lafal" },
};

/* ─── Language config display ─────────────────────────── */
const LANG_META: Record<string, { name: string; flag: string; learnTitle: string; learnSubtitle: string }> = {
  en: { name: "English", flag: "🇬🇧", learnTitle: "Learn English", learnSubtitle: "Pelajari materi sebelum mengerjakan soal" },
  ja: { name: "日本語", flag: "🇯🇵", learnTitle: "Belajar Bahasa Jepang", learnSubtitle: "Dari hiragana, kanji, hingga percakapan dasar" },
  zh: { name: "普通话", flag: "🇨🇳", learnTitle: "Belajar Bahasa Mandarin", learnSubtitle: "Dari pinyin, karakter, hingga percakapan sehari-hari" },
  ko: {
    name: '한국어',
    flag: '🇰🇷',
    learnTitle: 'Belajar Bahasa Korea',
    learnSubtitle: 'Dari Hangul, kosakata, hingga percakapan sehari-hari',
  },
};

export default function LearnPage() {
  const router = useRouter();
  const selectedLanguage = useLanguageStore(s => s.selectedLanguage) ?? "en";
  const { completedStages } = useProgress();

  const [expandedChapter, setExpandedChapter] = useState<number | null>(0);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // Pilih data sesuai bahasa
  const studyData = STUDY_DATA_MAP[selectedLanguage] ?? STUDY_DATA_MAP["en"];
  const adventureData = CHAPTERS_DATA_MAP[selectedLanguage] ?? CHAPTERS_DATA_MAP["en"];
  const chaptersData = (adventureData as any).chapters ?? [];
  const langMeta = LANG_META[selectedLanguage] ?? LANG_META["en"];

  // Hitung total
  let totalTopics = 0;
  let totalPractice = 0;
  chaptersData.forEach((ch: any) => {
    ch.stages?.forEach((st: any) => {
      const entry = st.feedKey ? (studyData as any)[st.feedKey] : null;
      if (entry) {
        totalTopics += entry.sections?.length ?? 0;
        totalPractice += entry.practice?.length ?? 0;
      }
    });
  });

  if (!isMounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#080810", paddingBottom: 100, fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(8,8,16,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 20px 18px",
      }}>
        {/* Language badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>{langMeta.flag}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
            {langMeta.name} · BELAJAR
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#f4f4f5", letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
              {langMeta.learnTitle}
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "5px 0 0" }}>
              {langMeta.learnSubtitle}
            </p>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {[
              { val: chaptersData.length, label: "Bab", color: "#3b82f6" },
              { val: totalTopics,         label: "Topik", color: "#10b981" },
              { val: totalPractice,       label: "Soal", color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{
                background: `${s.color}10`, border: `1px solid ${s.color}25`,
                borderRadius: 12, padding: "6px 10px", textAlign: "center",
              }}>
                <div style={{ color: s.color, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{s.val}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chapter Cards ──────────────────────────────────── */}
      <div style={{ padding: "16px 14px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {chaptersData.map((chapter: any, idx: number) => {
          const isOpen = expandedChapter === idx;
          const color: string = chapter.color ?? "#3b82f6";
          const imgUrl = CHAPTER_IMAGES[idx] ?? CHAPTER_IMAGES[0];
          const stages: any[] = chapter.stages ?? [];

          // Hitung progress
          let completedCount = 0;
          let totalXp = 0;
          const sectionTypeCounts: Record<string, number> = {};

          stages.forEach((stage: any) => {
            if (completedStages[stage.id]) completedCount++;
            const entry = stage.feedKey ? (studyData as any)[stage.feedKey] : null;
            if (entry) {
              entry.sections?.forEach((sec: any) => {
                sectionTypeCounts[sec.type] = (sectionTypeCounts[sec.type] ?? 0) + 1;
              });
              totalXp += entry.practice?.reduce((s: number, p: any) => s + (p.xpReward ?? 0), 0) ?? 0;
            }
          });

          const chapterProgress = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;
          const isChapterCompleted = stages.length > 0 && completedCount === stages.length;

          return (
            <div key={chapter.id ?? idx} style={{
              borderRadius: 20, overflow: "hidden",
              border: isOpen ? `1px solid ${color}35` : "1px solid rgba(255,255,255,0.07)",
              transition: "border-color 0.25s, box-shadow 0.25s",
              boxShadow: isOpen ? `0 8px 40px ${color}12` : "none",
            }}>

              {/* ── Chapter Banner ── */}
              <button
                onClick={() => setExpandedChapter(isOpen ? null : idx)}
                style={{ width: "100%", display: "block", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
              >
                {/* Hero image */}
                <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
                  <img src={imgUrl} alt={chapter.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover",
                      filter: isChapterCompleted ? "brightness(0.3) saturate(0.4)" : "brightness(0.4) saturate(1.1)",
                      display: "block" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${color}55 0%, transparent 55%, rgba(8,8,16,0.75) 100%)` }} />

                  {/* Chapter badge */}
                  <div style={{
                    position: "absolute", top: 12, left: 12,
                    width: 40, height: 40, borderRadius: 11,
                    background: isChapterCompleted ? "#10b98130" : `${color}28`,
                    border: `1.5px solid ${isChapterCompleted ? "#10b981" : color}60`,
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 900,
                    color: isChapterCompleted ? "#10b981" : color,
                  }}>
                    {isChapterCompleted ? "✓" : (chapter.id ?? idx + 1)}
                  </div>

                  {/* Progress badge */}
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                    border: `1px solid ${color}30`, borderRadius: 99, padding: "3px 10px",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    {/* Mini progress arc */}
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                      <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="2"
                        strokeDasharray={`${2*Math.PI*5}`}
                        strokeDashoffset={`${2*Math.PI*5*(1-chapterProgress/100)}`}
                        transform="rotate(-90 7 7)"
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}/>
                    </svg>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700 }}>
                      {completedCount}/{stages.length}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{ position: "absolute", bottom: 10, left: 14, right: 14 }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", textShadow: `0 1px 8px rgba(0,0,0,0.8), 0 0 30px ${color}60` }}>
                      {chapter.title}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                      {chapter.subtitle}
                    </p>
                  </div>
                </div>

                {/* Info bar */}
                <div style={{
                  padding: "10px 14px",
                  background: isOpen ? `${color}0c` : "rgba(255,255,255,0.02)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {/* Progress bar */}
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${chapterProgress}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 99, transition: "width 0.8s ease", boxShadow: chapterProgress > 0 ? `0 0 6px ${color}60` : "none" }}/>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{chapterProgress}%</span>

                  {/* Section type pills */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {Object.entries(sectionTypeCounts).slice(0, 3).map(([type]) => {
                      const meta = SECTION_TYPE_LABELS[type];
                      if (!meta) return null;
                      return (
                        <div key={type} style={{ background: `${color}12`, border: `1px solid ${color}20`, borderRadius: 99, padding: "2px 7px" }}>
                          <span style={{ color, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{meta.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chevron */}
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: isOpen ? `${color}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isOpen ? color+"30" : "rgba(255,255,255,0.07)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isOpen ? color : "rgba(255,255,255,0.25)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "all 0.25s",
                  }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </button>

              {/* ── Stage List ─────────────────────────────── */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${color}12`, background: "rgba(0,0,0,0.2)", animation: "fadeSlideIn 0.18s ease" }}>
                  {stages.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0 }}>Belum ada stage tersedia</p>
                    </div>
                  ) : stages.map((stage: any, si: number) => {
                    const entry = stage.feedKey ? (studyData as any)[stage.feedKey] : null;
                    const materiCount = entry?.sections?.length ?? 0;
                    const soalCount   = entry?.practice?.length ?? 0;
                    const stageXp     = entry?.practice?.reduce((s: number, p: any) => s + (p.xpReward ?? 0), 0) ?? 0;
                    const isCompleted = completedStages[stage.id] === true;
                    const isHovered   = hoveredStage === stage.id;

                    // Kumpulkan tipe soal unik
                    const practiceTypes = [...new Set(entry?.practice?.map((p: any) => p.type) ?? [])];
                    const PRACTICE_ICONS: Record<string, string> = {
                      translation_quiz: "", fill_in_blank: "", sentence_building: "",
                      matching_word: "", listening_quiz: "", speaking_test: "",
                    };

                    return (
                      <button
                        key={stage.id ?? si}
                        onClick={() => stage.id && router.push(`/learn/${stage.id}`)}
                        onMouseEnter={() => setHoveredStage(stage.id)}
                        onMouseLeave={() => setHoveredStage(null)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 14px",
                          background: isHovered ? `${color}0c` : "transparent",
                          border: "none",
                          borderBottom: si < stages.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          cursor: "pointer", textAlign: "left",
                          transition: "background 0.15s",
                          opacity: isCompleted ? 0.75 : 1,
                        }}
                      >
                        {/* Stage indicator */}
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: isCompleted ? "#10b98118" : `${color}14`,
                          border: `1px solid ${isCompleted ? "#10b98145" : color+"28"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800,
                          color: isCompleted ? "#10b981" : color,
                        }}>
                          {isCompleted ? "✓" : (si + 1)}
                        </div>

                        {/* Stage info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: isCompleted ? "rgba(255,255,255,0.5)" : "#e4e4e7",
                            fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.3,
                            textDecoration: isCompleted ? "line-through" : "none",
                          }}>
                            {stage.label ?? entry?.title ?? `Stage ${si + 1}`}
                          </p>
                          {entry && (
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                              {entry.title}
                            </p>
                          )}
                          {/* Practice type icons */}
                          <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                            {materiCount > 0 && (
                              <span style={{ fontSize: 10, color: `${color}80`, background: `${color}10`, border: `1px solid ${color}18`, borderRadius: 99, padding: "1px 6px" }}>
                                {materiCount} materi
                              </span>
                            )}
                            {(practiceTypes as string[]).slice(0, 4).map(type => (
                              <span key={type} style={{ fontSize: 10 }} title={type}>
                                {PRACTICE_ICONS[type] ?? "📝"}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* XP + arrow */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          {stageXp > 0 && !isCompleted && (
                            <div style={{
                              display: "flex", alignItems: "center", gap: 3,
                              background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.15)",
                              borderRadius: 99, padding: "2px 7px",
                            }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#facc15"/>
                              </svg>
                              <span style={{ color: "#facc15", fontSize: 10, fontWeight: 700 }}>+{stageXp}</span>
                            </div>
                          )}
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                            stroke={isHovered ? color : "rgba(255,255,255,0.2)"} strokeWidth={2.5}
                            style={{ transition: "stroke 0.15s, transform 0.15s", transform: isHovered ? "translateX(2px)" : "none" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}