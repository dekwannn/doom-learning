// src/store/useReviewStore.ts
// "Ulas kata": the words the learner has met, scheduled for review with a Leitner system. A word starts in box 0
// (review today); every right answer moves it one box up and the next review further away (1, 3, 7, 14, 30 days);
// a wrong answer sends it back to box 0. Spaced, repeated recall is what makes words stick.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DAY = 24 * 60 * 60 * 1000;
/** Days until the next review, by box (box 0 = today) */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = INTERVAL_DAYS.length - 1;

export interface ReviewCard {
  id: string;
  lang: string;
  word: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  /** Where the word was met: an adventure stage, a lesson, or the speaking cards */
  source: 'stage' | 'materi' | 'kartu';
  box: number;
  /** When the card is due (ms) */
  due: number;
  added: number;
  /** Times answered wrong */
  lapses: number;
}

export type NewWord = Pick<ReviewCard, 'word' | 'meaning' | 'phonetic' | 'example' | 'source'>;

const key = (lang: string, word: string) => `${lang}:${word.trim().toLowerCase().replace(/[.!?]+$/, '')}`;

interface ReviewState {
  cards: Record<string, ReviewCard>;
  /** Adds words not seen before; `hard` puts a word (new or known) back to box 0, due now */
  addWords: (lang: string, words: NewWord[], opts?: { hard?: boolean }) => void;
  /** Moves a card after an answer and schedules its next review */
  grade: (id: string, right: boolean) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      cards: {},
      addWords: (lang, words, opts = {}) =>
        set((s) => {
          const now = Date.now();
          const cards = { ...s.cards };
          for (const w of words) {
            const word = w.word?.trim();
            const meaning = w.meaning?.trim();
            if (!word || !meaning) continue;
            const id = key(lang, word);
            const old = cards[id];
            if (old) {
              // A lesson gives a short meaning ("Buku"); keep it over a longer description
              const shorter = w.source === 'materi' && meaning.length < old.meaning.length;
              cards[id] = {
                ...old,
                ...(shorter ? { meaning, example: w.example ?? old.example } : {}),
                ...(opts.hard ? { box: 0, due: now } : {}),
              };
            } else {
              cards[id] = { id, lang, word, meaning, phonetic: w.phonetic, example: w.example, source: w.source, box: 0, due: now, added: now, lapses: 0 };
            }
          }
          return { cards };
        }),
      grade: (id, right) =>
        set((s) => {
          const c = s.cards[id];
          if (!c) return s;
          const now = Date.now();
          const box = right ? Math.min(c.box + 1, MAX_BOX) : 0;
          // A wrong word comes back in the next session (a few minutes later), not right away
          const due = right ? now + INTERVAL_DAYS[box] * DAY : now + 10 * 60 * 1000;
          return { cards: { ...s.cards, [id]: { ...c, box, due, lapses: c.lapses + (right ? 0 : 1) } } };
        }),
    }),
    { name: 'lingora-review-store-v1', partialize: (s) => ({ cards: s.cards }) },
  ),
);

/** The cards of a language that are due now, the oldest first */
export const dueCards = (cards: Record<string, ReviewCard>, lang: string, now = Date.now()) =>
  Object.values(cards)
    .filter((c) => c.lang === lang && c.due <= now)
    .sort((a, b) => a.due - b.due || a.box - b.box);

/** When the next card of a language becomes due (ms), or null when there are none */
export const nextDue = (cards: Record<string, ReviewCard>, lang: string) => {
  const later = Object.values(cards).filter((c) => c.lang === lang).map((c) => c.due);
  return later.length ? Math.min(...later) : null;
};
