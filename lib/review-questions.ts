// src/lib/review-questions.ts
// The questions of "Ulas kata". Most words ask for their meaning. Japanese is learned through its writing too, so a
// single hiragana asks for its reading (or, the other way round, which character a reading is), a hiragana word
// hides its romaji until it is answered, and a word with kanji shows the romaji as help.

import type { ReviewCard } from '@/store/useReviewStore';

export type ReviewQuestion = {
  card: ReviewCard;
  /** Small label over the prompt, e.g. "APA ARTINYA?" */
  ask: string;
  /** What is shown big */
  prompt: string;
  /** Shown under the prompt before answering (romaji for kanji, the phonetic for other languages) */
  hint?: string;
  /** Shown after answering: the reading, a note, the example */
  after: string[];
  /** The right answer and the choices (null: a flip card, the learner says if they knew it) */
  answer: string;
  options: string[] | null;
  /** Options are characters: shown large */
  bigOptions?: boolean;
  /** What the play button says */
  speak: string;
  /** The sound would give the answer away (a hiragana's reading): play it only after answering */
  listenAfter?: boolean;
};

const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

export const isKana = (w: string) => /^[぀-ゟ]$/.test(w.trim());
export const hasKanji = (w: string) => /[一-鿿]/.test(w);
/** "Ha (Wa sebagai partikel)" -> "ha", "Fu (bukan 'hu'!)" -> "fu" */
export const kanaReading = (phonetic?: string) => (phonetic ?? '').split(/[\s(/]/)[0].trim().toLowerCase();

/** Extra choices from the course itself, so a question has choices even when few words are known yet */
export type ChoicePool = { kana: { word: string; reading: string }[]; meanings: string[] };

type JaFeedItem = { type: string; content?: { word?: string; phonetic?: string; meaning?: string } };
/** Every hiragana and every word meaning in the Japanese stages */
export function japanesePool(data: { feeds: Record<string, JaFeedItem[]> }): ChoicePool {
  const kana: ChoicePool['kana'] = [];
  const meanings = new Set<string>();
  for (const items of Object.values(data.feeds)) {
    for (const it of items) {
      const c = it.content;
      if (it.type !== 'vocabulary' || !c?.word) continue;
      if (isKana(c.word)) {
        const reading = kanaReading(c.phonetic);
        if (reading && !kana.some((k) => k.word === c.word)) kana.push({ word: c.word, reading });
      } else if (c.meaning) {
        meanings.add(c.meaning);
      }
    }
  }
  return { kana, meanings: [...meanings] };
}

const choices = (answer: string, candidates: string[]) => {
  const others = shuffle([...new Set(candidates)].filter((x) => x && x !== answer)).slice(0, 3);
  return others.length === 3 ? shuffle([answer, ...others]) : null;
};

/** One question per card. `mine` are the learner's cards of this language; `pool` adds choices from the course. */
export function buildQuestion(card: ReviewCard, mine: ReviewCard[], pool: ChoicePool | null): ReviewQuestion {
  const example = card.example ? [`Contoh: ${card.example}`] : [];
  if (card.lang === 'ja' && isKana(card.word)) {
    const reading = kanaReading(card.phonetic);
    const kanaList = [
      ...mine.filter((c) => isKana(c.word)).map((c) => ({ word: c.word, reading: kanaReading(c.phonetic) })),
      ...(pool?.kana ?? []),
    ].filter((k) => k.reading);
    // The card's note ("shi (bukan 'si'!)"), unless it only repeats the reading
    const note = card.meaning && card.meaning.trim().toLowerCase() !== reading ? [card.meaning] : [];
    // Half the time the other way round: the reading is given, the character is asked
    if (Math.random() < 0.5) {
      return {
        card, ask: 'MANA HURUFNYA?', prompt: `"${reading}"`, after: [`${card.word} dibaca ${reading}`, ...note],
        answer: card.word, options: choices(card.word, kanaList.filter((k) => k.reading !== reading).map((k) => k.word)),
        bigOptions: true, speak: card.word,
      };
    }
    return {
      card, ask: 'BAGAIMANA CARA BACANYA?', prompt: card.word, after: note,
      answer: reading, options: choices(reading, kanaList.map((k) => k.reading)), speak: card.word, listenAfter: true,
    };
  }
  // A hiragana's note is not a meaning, so it is never one of the choices
  const meanings = [...mine.filter((c) => !(c.lang === 'ja' && isKana(c.word))).map((c) => c.meaning), ...(pool?.meanings ?? [])];
  if (card.lang === 'ja') {
    // Kanji can't be read yet: its romaji helps. A hiragana word is read by the learner; its romaji comes after.
    const kanji = hasKanji(card.word);
    return {
      card, ask: 'APA ARTINYA?', prompt: card.word, hint: kanji ? card.phonetic : undefined,
      after: [...(!kanji && card.phonetic ? [`Dibaca: ${card.phonetic}`] : []), ...example],
      answer: card.meaning, options: choices(card.meaning, meanings), speak: card.word,
    };
  }
  return {
    card, ask: card.source === 'kartu' ? 'KATA SULIT' : 'APA ARTINYA?', prompt: card.word, hint: card.phonetic,
    after: example, answer: card.meaning, options: choices(card.meaning, meanings), speak: card.word,
  };
}
