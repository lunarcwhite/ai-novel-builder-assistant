import type {
  ActWithChapters,
  ChapterWithScenes,
  ExportFormat,
  Novel,
  NovelStructureTree,
  Scene,
} from "@/types";

// ---------------------------------------------------------------
// Pure export formatters (Phase 10 — TXT + Markdown MVP)
// ---------------------------------------------------------------
// No I/O, no auth. Renders data the author owns into file text.
// Read-only: the manuscript body is never modified here.
// ponytail: DOCX/PDF/EPUB are post-MVP (PRD #22) — add renderers
// here only when those formats are actually required.

export interface ExportBuildOptions {
  /** When false, scenes/chapters/acts without manuscript text are skipped. */
  includeEmpty?: boolean;
  /** ISO timestamp for the header. Defaults to now. */
  exportedAt?: string;
}

const EMPTY_SCENE_NOTE = "[Belum ada naskah pada adegan ini.]";
const EMPTY_CHAPTER_NOTE = "[Belum ada naskah pada bab ini.]";
const EMPTY_NOVEL_NOTE =
  "Belum ada naskah untuk diekspor. Tulis adegan terlebih dahulu, lalu ekspor ulang.";

/**
 * Editor HTML -> plain text with paragraph breaks preserved.
 * Same entity decoding as word count; block boundaries become
 * blank lines so export keeps the author's paragraphing.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  const text = html
    .replace(/<\/li[^>]*>/gi, "\n")
    .replace(/<\/(p|h[1-6]|div|blockquote|ul|ol|section|article)>/gi, "\n\n")
    .replace(/<(br|hr)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const lines = text.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim());
  const out: string[] = [];
  let blanks = 0;
  for (const line of lines) {
    if (!line) {
      blanks += 1;
      if (blanks <= 1) out.push("");
      continue;
    }
    blanks = 0;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

interface VisibleScene {
  title: string;
  text: string;
}

function visibleScenes(chapter: ChapterWithScenes, includeEmpty: boolean): VisibleScene[] {
  const ordered = [...chapter.scenes].sort((a, b) => a.position - b.position);
  return ordered
    .map((s: Scene) => ({ title: s.title, text: htmlToText(s.content) }))
    .filter((s) => includeEmpty || s.text);
}

function orderedChapters(act: ActWithChapters): ChapterWithScenes[] {
  return [...act.chapters].sort((a, b) => a.position - b.position);
}

export function exportFilename(
  novel: Pick<Novel, "title" | "slug">,
  format: ExportFormat
): string {
  const base =
    (novel.slug || "").trim() ||
    novel.title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "") ||
    "novel";
  return `${base}.${format === "txt" ? "txt" : "md"}`;
}

export function mimeTypeFor(format: ExportFormat): string {
  return format === "txt" ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8";
}

/** Plain-text manuscript: title block, then Act -> Chapter -> Scene. */
export function buildTxt(
  novel: Novel,
  tree: NovelStructureTree,
  opts: ExportBuildOptions = {}
): string {
  const includeEmpty = opts.includeEmpty ?? true;
  const exportedAt = opts.exportedAt ?? new Date().toISOString();
  const lines: string[] = [];

  lines.push(novel.title);
  if (novel.genre) lines.push(`Genre: ${novel.genre}`);
  lines.push(`Jumlah kata: ${tree.totalWords}`);
  lines.push(`Diekspor: ${exportedAt}`);
  lines.push("");
  if ((novel.premise || "").trim()) {
    lines.push(novel.premise!.trim());
    lines.push("");
  }
  lines.push("=".repeat(40));
  lines.push("");

  let chapterNo = 0;
  let renderedScenes = 0;

  const pushChapter = (chapter: ChapterWithScenes) => {
    const scenes = visibleScenes(chapter, includeEmpty);
    if (scenes.length === 0 && !includeEmpty) return;
    chapterNo += 1;
    lines.push(`Bab ${chapterNo}: ${chapter.title}`);
    lines.push("");
    if (scenes.length === 0) {
      lines.push(EMPTY_CHAPTER_NOTE);
      lines.push("");
    }
    for (const scene of scenes) {
      renderedScenes += 1;
      lines.push(`Adegan: ${scene.title}`);
      lines.push("");
      lines.push(scene.text || EMPTY_SCENE_NOTE);
      lines.push("");
    }
    lines.push("-".repeat(40));
    lines.push("");
  };

  for (const act of tree.acts) {
    const chapters = orderedChapters(act);
    const visible = includeEmpty
      ? chapters
      : chapters.filter((c) => visibleScenes(c, false).length > 0);
    if (visible.length === 0) continue;
    lines.push(`BABAK: ${act.title}`);
    lines.push("");
    for (const chapter of visible) pushChapter(chapter);
  }
  for (const chapter of [...tree.unassignedChapters].sort((a, b) => a.position - b.position)) {
    pushChapter(chapter);
  }

  if (renderedScenes === 0 && !includeEmpty) {
    lines.push(EMPTY_NOVEL_NOTE);
    lines.push("");
  } else if (renderedScenes === 0) {
    // includeEmpty rendered only placeholders — still no real manuscript.
    const hasAnyScene =
      tree.acts.some((a) => a.chapters.some((c) => c.scenes.length > 0)) ||
      tree.unassignedChapters.some((c) => c.scenes.length > 0);
    if (!hasAnyScene) {
      lines.push(EMPTY_NOVEL_NOTE);
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

/** Markdown manuscript: # novel, ## act, ### chapter, #### scene. */
export function buildMarkdown(
  novel: Novel,
  tree: NovelStructureTree,
  opts: ExportBuildOptions = {}
): string {
  const includeEmpty = opts.includeEmpty ?? true;
  const exportedAt = opts.exportedAt ?? new Date().toISOString();
  const lines: string[] = [];

  lines.push(`# ${novel.title}`);
  lines.push("");
  if (novel.genre) lines.push(`- Genre: ${novel.genre}`);
  lines.push(`- Jumlah kata: ${tree.totalWords}`);
  lines.push(`- Diekspor: ${exportedAt}`);
  lines.push("");
  if ((novel.premise || "").trim()) {
    lines.push(`> ${novel.premise!.trim()}`);
    lines.push("");
  }
  lines.push("---");
  lines.push("");

  let chapterNo = 0;
  let renderedScenes = 0;

  const pushChapter = (chapter: ChapterWithScenes) => {
    const scenes = visibleScenes(chapter, includeEmpty);
    if (scenes.length === 0 && !includeEmpty) return;
    chapterNo += 1;
    lines.push(`### Bab ${chapterNo}: ${chapter.title}`);
    lines.push("");
    if (scenes.length === 0) {
      lines.push(`*${EMPTY_CHAPTER_NOTE}*`);
      lines.push("");
    }
    for (const scene of scenes) {
      renderedScenes += 1;
      lines.push(`#### ${scene.title}`);
      lines.push("");
      lines.push(scene.text || `*${EMPTY_SCENE_NOTE}*`);
      lines.push("");
    }
  };

  for (const act of tree.acts) {
    const chapters = orderedChapters(act);
    const visible = includeEmpty
      ? chapters
      : chapters.filter((c) => visibleScenes(c, false).length > 0);
    if (visible.length === 0) continue;
    lines.push(`## Babak: ${act.title}`);
    lines.push("");
    for (const chapter of visible) pushChapter(chapter);
  }
  for (const chapter of [...tree.unassignedChapters].sort((a, b) => a.position - b.position)) {
    pushChapter(chapter);
  }

  if (renderedScenes === 0) {
    const hasAnyScene =
      tree.acts.some((a) => a.chapters.some((c) => c.scenes.length > 0)) ||
      tree.unassignedChapters.some((c) => c.scenes.length > 0);
    if (!hasAnyScene || !includeEmpty) {
      lines.push(EMPTY_NOVEL_NOTE);
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}
