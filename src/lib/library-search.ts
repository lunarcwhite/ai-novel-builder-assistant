// ---------------------------------------------------------------
// Library search filter (Phase 11 — Polish)
// ---------------------------------------------------------------
// Pure server-safe helper: filters the author's novel list by
// title/genre/premise, case-insensitive. Tested via palette suite.

export function filterNovelsForLibrary<
  T extends { title: string; genre?: string | null; premise?: string | null },
>(novels: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return novels;
  return novels.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      (n.genre ?? "").toLowerCase().includes(q) ||
      (n.premise ?? "").toLowerCase().includes(q)
  );
}
