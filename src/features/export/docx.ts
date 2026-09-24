import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type {
  ChapterWithScenes,
  Novel,
  NovelStructureTree,
} from "@/types";
import {
  EMPTY_CHAPTER_NOTE,
  EMPTY_NOVEL_NOTE,
  EMPTY_SCENE_NOTE,
  type ExportBuildOptions,
  orderedChapters,
  visibleScenes,
} from "./formatters";

// ---------------------------------------------------------------
// DOCX renderer (Phase 11 — first post-MVP format, PRD #22)
// ---------------------------------------------------------------
// Same traversal + empty semantics as buildTxt/buildMarkdown.
// Delegates paragraph splitting to htmlToText so DOCX keeps the
// author's paragraphing without inventing a second HTML parser.

// ponytail: no images/tables/TOC — manuscript scenes are prose
// paragraphs. Add runs/tables only when a real scene needs them.
export type DocxBlockKind =
  | "title"
  | "meta"
  | "premise"
  | "act"
  | "chapter"
  | "scene"
  | "body"
  | "note";

export interface DocxBlock {
  kind: DocxBlockKind;
  text: string;
}

/**
 * Pure walk: NovelStructureTree -> flat heading/body blocks.
 * Same act -> chapter -> scene order and includeEmpty semantics
 * as the TXT/Markdown builders. No docx dependency in the shape.
 */
export function collectDocxBlocks(
  novel: Novel,
  tree: NovelStructureTree,
  opts: ExportBuildOptions = {}
): DocxBlock[] {
  const includeEmpty = opts.includeEmpty ?? true;
  const exportedAt = opts.exportedAt ?? new Date().toISOString();
  const blocks: DocxBlock[] = [];

  blocks.push({ kind: "title", text: novel.title });
  blocks.push({ kind: "meta", text: `Jumlah kata: ${tree.totalWords}` });
  blocks.push({ kind: "meta", text: `Diekspor: ${exportedAt}` });
  if (novel.genre) blocks.push({ kind: "meta", text: `Genre: ${novel.genre}` });
  if ((novel.premise || "").trim()) {
    blocks.push({ kind: "premise", text: novel.premise!.trim() });
  }

  let chapterNo = 0;
  let renderedScenes = 0;

  const pushChapter = (chapter: ChapterWithScenes) => {
    const scenes = visibleScenes(chapter, includeEmpty);
    if (scenes.length === 0 && !includeEmpty) return;
    chapterNo += 1;
    blocks.push({ kind: "chapter", text: `Bab ${chapterNo}: ${chapter.title}` });
    if (scenes.length === 0) {
      blocks.push({ kind: "note", text: EMPTY_CHAPTER_NOTE });
    }
    for (const scene of scenes) {
      renderedScenes += 1;
      blocks.push({ kind: "scene", text: scene.title });
      if (scene.text) {
        for (const para of scene.text.split("\n").filter((p) => p.trim())) {
          blocks.push({ kind: "body", text: para });
        }
      } else {
        blocks.push({ kind: "note", text: EMPTY_SCENE_NOTE });
      }
    }
  };

  for (const act of tree.acts) {
    const chapters = orderedChapters(act);
    const visible = includeEmpty
      ? chapters
      : chapters.filter((c) => visibleScenes(c, false).length > 0);
    if (visible.length === 0) continue;
    blocks.push({ kind: "act", text: `Babak: ${act.title}` });
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
      blocks.push({ kind: "note", text: EMPTY_NOVEL_NOTE });
    }
  }

  return blocks;
}

function blockToParagraph(block: DocxBlock): Paragraph {
  switch (block.kind) {
    case "title":
      return new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: block.text, bold: true, size: 56 })],
      });
    case "act":
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: block.text, bold: true })],
      });
    case "chapter":
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: block.text, bold: true })],
      });
    case "scene":
      return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: block.text, bold: true })],
      });
    case "meta":
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: block.text, size: 20, color: "666666" })],
      });
    case "premise":
      return new Paragraph({
        children: [new TextRun({ text: block.text, italics: true })],
      });
    case "note":
      return new Paragraph({
        children: [new TextRun({ text: block.text, italics: true, color: "666666" })],
      });
    case "body":
    default:
      return new Paragraph({ children: [new TextRun(block.text)] });
  }
}

/** Renders the same data the author owns into a .docx Buffer. Read-only. */
export async function buildDocx(
  novel: Novel,
  tree: NovelStructureTree,
  opts: ExportBuildOptions = {}
): Promise<Buffer> {
  const blocks = collectDocxBlocks(novel, tree, opts);
  const doc = new Document({
    creator: "Novel Builder",
    title: novel.title,
    description: `Ekspor naskah "${novel.title}"`,
    sections: [{ children: blocks.map(blockToParagraph) }],
  });
  return Packer.toBuffer(doc);
}
