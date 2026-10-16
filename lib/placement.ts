// src/lib/placement.ts
// The placement test: a few questions from the review stage at the end of each chapter, chapter after chapter.
// A chapter is passed with two thirds of its questions right; the test stops at the first chapter that is not
// passed, and the learner starts there. Questions come from the course itself (the same data as the stages).

export type PlacementQuestion = {
  chapter: number;
  chapterTitle: string;
  question: string;
  context?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

export type PlacementChapter = { id: number; title: string; subtitle: string; color: string; questions: PlacementQuestion[] };

type Item = { type: string; content: Record<string, unknown> };
type Chapter = { id: number | string; title: string; subtitle?: string; color?: string; stages: { id: string; feedKey: string }[] };
export type CourseData = { chapters: Chapter[]; feeds: Record<string, Item[]> };

const CHOICE = ['translation_quiz', 'fill_in_blank', 'mini_conversation'];
/** Questions per chapter, at most */
export const PER_CHAPTER = 3;

/** Every chapter with its test questions (the chapter's last stage is its review) */
export function placementChapters(data: CourseData): PlacementChapter[] {
  return data.chapters.map((ch) => {
    const review = ch.stages[ch.stages.length - 1];
    const items = (data.feeds[review?.feedKey] ?? []).filter((it) => {
      const c = it.content as { options?: unknown[]; correctAnswer?: unknown };
      return CHOICE.includes(it.type) && Array.isArray(c.options) && c.options.length > 1 && typeof c.correctAnswer === 'string';
    });
    // Spread over the stage (not just its first questions), so they cover the whole chapter
    const step = Math.max(1, Math.floor(items.length / PER_CHAPTER));
    const picked = items.filter((_, i) => i % step === 0).slice(0, PER_CHAPTER);
    return {
      id: Number(ch.id), title: ch.title, subtitle: ch.subtitle ?? '', color: ch.color ?? '#10b981',
      questions: picked.map((it) => {
        const c = it.content as { question?: string; sentence?: string; context?: string; options: string[]; correctAnswer: string; explanations?: Record<string, string>; explanation?: string };
        return {
          chapter: Number(ch.id), chapterTitle: ch.title, question: c.sentence || c.question || '', context: c.context,
          options: c.options, correctAnswer: c.correctAnswer, explanation: c.explanations?.[c.correctAnswer] ?? c.explanation,
        };
      }),
    };
  }).filter((ch) => ch.questions.length > 0);
}

/** Right answers needed to pass a chapter with `n` questions */
export const passMark = (n: number) => Math.ceil((n * 2) / 3);

/** The chapter to start at, from the chapters passed in a row (the last chapter at most) */
export function placedAt(chapters: PlacementChapter[], passedInARow: number): PlacementChapter {
  return chapters[Math.min(passedInARow, chapters.length - 1)];
}
