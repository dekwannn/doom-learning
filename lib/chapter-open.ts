// src/lib/chapter-open.ts
// Whether a chapter is open: by XP (each chapter's xpRequired), or because the placement test (/tes-penempatan)
// started the learner there. The test gives no XP, so the leaderboard stays fair.

export const chapterOpen = (ch: { id: number | string; xpRequired?: number }, xp: number, placedChapter = 0) =>
  xp >= (ch.xpRequired ?? 0) || placedChapter >= Number(ch.id);
