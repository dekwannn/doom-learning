// src/store/useStudyStore.ts
// Which lessons ("Materi") the learner has finished, per language. A lesson gives its XP only the first time;
// it can be read and practised again as often as the learner likes.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StudyState {
  /** language code -> stage id -> when the lesson was first finished (ms) */
  done: Record<string, Record<string, number>>;
  isDone: (lang: string, stageId: string) => boolean;
  /** Marks the lesson as finished; returns true only the first time (when its XP should be given) */
  markDone: (lang: string, stageId: string) => boolean;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      done: {},
      isDone: (lang, stageId) => !!get().done[lang]?.[stageId],
      markDone: (lang, stageId) => {
        if (get().done[lang]?.[stageId]) return false;
        set((s) => ({ done: { ...s.done, [lang]: { ...s.done[lang], [stageId]: Date.now() } } }));
        return true;
      },
    }),
    { name: 'lingora-study-store-v1', partialize: (s) => ({ done: s.done }) },
  ),
);
