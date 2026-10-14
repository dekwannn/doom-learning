// src/lib/speaking-cards.ts
// "Kartu ucapan": cards to say out loud, made from each chapter's lesson data (vocabulary words, their
// example sentences, and the speaking-practice phrases), plus a simple way to compare what was heard with a card.

import dummyData from "@/data/dummyData.json";
import jaData from "@/data/jaData.json";
import zhData from "@/data/zhData.json";
import koData from "@/data/koData.json";

export type SpeakingCard = { id: string; text: string; kind: "kata" | "kalimat"; meaning?: string; phonetic?: string };
export type CardDeck = { id: string; title: string; subtitle: string; color: string; xpRequired: number; cards: SpeakingCard[] };

type FeedItem = { id: string; type: string; content?: { word?: string; meaningId?: string; phonetic?: string; exampleSentence?: string; phrase?: string; translation?: string } };
type LessonData = {
  chapters?: { id: number | string; title: string; subtitle: string; color?: string; xpRequired?: number; stages?: { feedKey: string }[] }[];
  feeds?: Record<string, FeedItem[]>;
};
const DATA: Record<string, LessonData> = { en: dummyData, ja: jaData, zh: zhData, ko: koData } as unknown as Record<string, LessonData>;
export const TTS_LANG: Record<string, string> = { en: "en-US", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR" };

/** One deck per chapter, with every card the chapter's stages have (no duplicates) */
export function buildDecks(lang: string): CardDeck[] {
  const data = DATA[lang] ?? DATA.en;
  const feeds = data.feeds ?? {};
  return (data.chapters ?? []).map((ch) => {
    const seen = new Set<string>();
    const cards: SpeakingCard[] = [];
    const add = (c: SpeakingCard) => {
      const key = c.text.trim().toLowerCase();
      if (!c.text.trim() || seen.has(key)) return;
      seen.add(key);
      cards.push(c);
    };
    for (const st of ch.stages ?? []) {
      for (const item of feeds[st.feedKey] ?? []) {
        const c = item.content ?? {};
        if (item.type === "vocabulary" && c.word) {
          add({ id: `${item.id}-w`, text: c.word, kind: "kata", meaning: c.meaningId, phonetic: c.phonetic });
          // Example sentences are speakable in English; in the other languages they are notes like "あお (ao) = biru"
          if (lang === "en" && c.exampleSentence) add({ id: `${item.id}-s`, text: c.exampleSentence, kind: "kalimat" });
        }
        if (item.type === "speaking_test" && c.phrase) add({ id: item.id, text: c.phrase, kind: "kalimat", meaning: c.translation });
      }
    }
    return { id: String(ch.id), title: ch.title, subtitle: ch.subtitle, color: ch.color ?? "#10b981", xpRequired: ch.xpRequired ?? 0, cards };
  });
}

/** Words of a card as shown and checked (punctuation dropped, case kept for display) */
export const cardWords = (text: string) => text.split(/\s+/).map((w) => w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "")).filter(Boolean);

const usesSpaces = (lang: string) => lang === "en";
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "");

/**
 * Compares what the browser's speech recognition heard with the card (used when the pronunciation check of
 * Lingo's voice server is not available, e.g. for Japanese, Mandarin and Korean): which words were heard, and a score.
 */
export function compareHeard(target: string, heard: string, lang: string): { score: number; words: { word: string; ok: boolean }[] } {
  if (!usesSpaces(lang)) {
    // No spaces between words: compare characters (longest common subsequence)
    const a = [...norm(target)];
    const b = [...norm(heard)];
    const score = a.length ? Math.round((lcs(a, b) / a.length) * 100) : 0;
    return { score, words: [{ word: target, ok: score >= 70 }] };
  }
  const words = cardWords(target);
  const want = words.map(norm);
  const got = heard.split(/\s+/).map(norm).filter(Boolean);
  // Mark each target word heard in order (longest common subsequence of words)
  const okIdx = lcsIndexes(want, got);
  const result = words.map((word, i) => ({ word, ok: okIdx.has(i) }));
  return { score: words.length ? Math.round((okIdx.size / words.length) * 100) : 0, words: result };
}

function lcs(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

function lcsIndexes(a: string[], b: string[]): Set<number> {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const out = new Set<number>();
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { out.add(i - 1); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return out;
}
