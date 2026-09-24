import type {
  ActWithChapters,
  ChapterWithScenes,
  Novel,
  NovelStructureTree,
  Scene,
  SummaryNode,
} from "@/types";
import type { ActSummaryNode, ChapterSummaryNode } from "@/types";

// ---------------------------------------------------------------
// Pure hierarchy builder (Phase 9 — Task 9.4)
// ---------------------------------------------------------------
// No I/O, no auth: assembles Scene -> Chapter -> Act -> Novel
// summary layers from data the author already owns. Author text
// (summary/description columns) always outranks derived rollups.

function textOrNull(value: string | null | undefined): string | null {
  const t = (value || "").trim();
  return t ? t : null;
}

/** Strip editor HTML to plain text (same approach as word count). */
export function stripToText(html: string | null | undefined): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Join child texts into a deterministic rollup. Empty input yields "",
 * which callers must treat as "no material yet" — never as a summary.
 */
export function composeDeterministic(
  texts: (string | null | undefined)[],
  maxChars = 1500
): string {
  const parts = texts.map((t) => (t || "").trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const joined = parts.join(" ");
  if (joined.length <= maxChars) return joined;
  return joined.slice(0, maxChars).trimEnd() + "… [dipadatkan]";
}

function sceneNode(s: Scene): SummaryNode {
  const authorText = textOrNull(s.summary);
  return {
    level: "scene",
    id: s.id,
    title: s.title,
    authorText,
    derivedText: authorText || "",
    wordCount: s.word_count || 0,
    childrenTotal: 0,
    childrenWithText: 0,
  };
}

function chapterNode(c: ChapterWithScenes): ChapterSummaryNode {
  const scenes = [...c.scenes]
    .sort((a, b) => a.position - b.position)
    .map(sceneNode);
  const authorText = textOrNull(c.summary);
  return {
    level: "chapter",
    id: c.id,
    title: c.title,
    authorText,
    derivedText: composeDeterministic(scenes.map((s) => s.authorText)),
    wordCount: c.word_count || 0,
    childrenTotal: scenes.length,
    childrenWithText: scenes.filter((s) => s.authorText).length,
    scenes,
  };
}

function actNode(a: ActWithChapters): ActSummaryNode {
  const chapters = [...a.chapters]
    .sort((x, y) => x.position - y.position)
    .map(chapterNode);
  const authorText = textOrNull(a.description);
  return {
    level: "act",
    id: a.id,
    title: a.title,
    authorText,
    derivedText: composeDeterministic(
      chapters.map((c) => c.authorText || c.derivedText)
    ),
    wordCount: chapters.reduce((n, c) => n + (c.wordCount || 0), 0),
    childrenTotal: chapters.length,
    childrenWithText: chapters.filter((c) => c.authorText || c.derivedText).length,
    chapters,
  };
}

export function buildSummaryHierarchy(
  novel: Novel,
  structure: NovelStructureTree
): import("@/types").SummaryHierarchy {
  const acts = [...structure.acts]
    .sort((a, b) => a.position - b.position)
    .map(actNode);
  const unassignedChapters = [...structure.unassignedChapters]
    .sort((a, b) => a.position - b.position)
    .map(chapterNode);

  const allChapters = [...acts.flatMap((a) => a.chapters), ...unassignedChapters];
  const allScenes = allChapters.flatMap((c) => c.scenes);

  const authorText = textOrNull(novel.description);
  const novelNode: SummaryNode = {
    level: "novel",
    id: novel.id,
    title: novel.title,
    authorText,
    derivedText: composeDeterministic([
      ...acts.map((a) => a.authorText || a.derivedText),
      ...unassignedChapters.map((c) => c.authorText || c.derivedText),
    ]),
    wordCount: structure.totalWords || 0,
    childrenTotal: acts.length + unassignedChapters.length,
    childrenWithText: [...acts, ...unassignedChapters].filter(
      (n) => n.authorText || n.derivedText
    ).length,
  };

  return {
    novel: novelNode,
    acts,
    unassignedChapters,
    coverage: {
      scenes: {
        total: allScenes.length,
        withText: allScenes.filter((s) => s.authorText).length,
      },
      chapters: {
        total: allChapters.length,
        withText: allChapters.filter((c) => c.authorText).length,
      },
      acts: {
        total: acts.length,
        withText: acts.filter((a) => a.authorText).length,
      },
      novel: authorText !== null,
    },
  };
}
