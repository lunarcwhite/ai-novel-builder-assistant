import { z } from "zod";
import { NovelRepository } from "@/features/novels/repository";
import { StructureService } from "@/features/structure/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { NovelService } from "@/features/novels/service";
import { resolveAIProvider } from "@/server/ai/providers";
import {
  buildSummarySynthesisPrompt,
  SUMMARY_SYNTHESIS_SYSTEM,
} from "@/server/ai/prompts";
import type { AIMessage } from "@/server/ai/provider";
import {
  applySummarySchema,
  synthesizeSummarySchema,
  type SummaryHierarchy,
  type SummaryLevel,
} from "@/types";
import {
  buildSummaryHierarchy,
  composeDeterministic,
  stripToText,
} from "./hierarchy";

// ---------------------------------------------------------------
// Summary synthesis service (Phase 9 — Task 9.4)
// ---------------------------------------------------------------
// SOUL.md #6/#8: the candidate is a proposal until the author
// applies it. applySummary writes to the existing summary/
// description columns; the manuscript body is never touched.

const aiCandidateSchema = z.object({
  summary: z.string().max(2000),
});

export interface HierarchyResult {
  success: boolean;
  error?: string;
  hierarchy?: SummaryHierarchy;
}

export interface SynthesizeResult {
  success: boolean;
  error?: string;
  level?: SummaryLevel;
  id?: string;
  title?: string;
  /** Proposal for the author to review — never auto-applied. */
  candidate?: string;
  deterministic?: string;
  aiEnriched?: boolean;
}

export interface ApplyResult {
  success: boolean;
  error?: string;
}

const SOURCE_CLIP = 1200;
const EXCERPT_CHARS = 600;

function clip(text: string, max: number = SOURCE_CLIP): string {
  const t = text.trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

export class SummaryService {
  static async getHierarchy(
    novelId: string,
    userId: string
  ): Promise<HierarchyResult> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) {
      return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };
    }
    const structure = await StructureService.getNovelStructureTree(novelId, userId);
    return { success: true, hierarchy: buildSummaryHierarchy(novel, structure) };
  }

  static async synthesize(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<SynthesizeResult> {
    const parsed = synthesizeSummarySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Parameter sintesis tidak valid.",
      };
    }
    const { level, id, withAI } = parsed.data;

    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) {
      return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };
    }
    const structure = await StructureService.getNovelStructureTree(novelId, userId);
    const hierarchy = buildSummaryHierarchy(novel, structure);

    const gathered = gatherSources(level, id, hierarchy, structure);
    if (!gathered) {
      return { success: false, error: "Target ringkasan tidak ditemukan." };
    }
    if (!gathered.hasMaterial) {
      return {
        success: false,
        error: "Belum ada materi untuk diringkas pada level ini. Tulis naskah atau ringkasan anak terlebih dahulu.",
      };
    }

    const deterministic =
      gathered.existing || gathered.derived || gathered.excerpt || "";

    // Local-dev provider (or withAI=false): the extractive draft is the result.
    let candidate = deterministic;
    let aiEnriched = false;
    if (withAI) {
      try {
        const provider = resolveAIProvider();
        if (provider.name !== "local-dev-draft") {
          const messages: AIMessage[] = [
            { role: "system", content: SUMMARY_SYNTHESIS_SYSTEM },
            {
              role: "user",
              content: buildSummarySynthesisPrompt({
                level,
                title: gathered.title,
                existing: gathered.existing,
                sources: gathered.sources,
              }),
            },
          ];
          const raw = await provider.generateStructured<unknown>(messages, null, {
            temperature: 0.4,
            maxTokens: 600,
          });
          const aiParsed = aiCandidateSchema.safeParse(raw);
          const text = aiParsed.success ? aiParsed.data.summary.trim() : "";
          if (text) {
            candidate = text;
            aiEnriched = true;
          }
        }
      } catch {
        aiEnriched = false; // fall through with the deterministic draft
      }
    }

    return {
      success: true,
      level,
      id,
      title: gathered.title,
      candidate,
      deterministic,
      aiEnriched,
    };
  }

  static async apply(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<ApplyResult> {
    const parsed = applySummarySchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Ringkasan tidak valid.",
      };
    }
    const { level, id, text } = parsed.data;

    // Each service verifies ownership through novel -> user (AGENTS.md #5.3).
    // Act/novel reuse the description column (no migration — see types ponytail).
    if (level === "scene") {
      const updated = await SceneService.updateScene(id, novelId, userId, {
        summary: text,
      });
      if (!updated) return { success: false, error: "Adegan tidak ditemukan atau akses ditolak." };
    } else if (level === "chapter") {
      const updated = await ChapterService.updateChapter(id, novelId, userId, {
        summary: text,
      });
      if (!updated) return { success: false, error: "Bab tidak ditemukan atau akses ditolak." };
    } else if (level === "act") {
      const updated = await ActService.updateAct(id, novelId, userId, {
        description: text,
      });
      if (!updated) return { success: false, error: "Babak tidak ditemukan atau akses ditolak." };
    } else {
      if (id !== novelId) {
        return { success: false, error: "ID novel tidak cocok." };
      }
      const updated = await NovelService.updateNovel(novelId, userId, {
        description: text,
      });
      if (!updated) return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };
    }
    return { success: true };
  }
}

interface Gathered {
  title: string;
  existing: string | null;
  derived: string;
  excerpt: string;
  hasMaterial: boolean;
  sources: { label: string; text: string }[];
}

function gatherSources(
  level: SummaryLevel,
  id: string,
  hierarchy: SummaryHierarchy,
  structure: import("@/types").NovelStructureTree
): Gathered | null {
  if (level === "novel") {
    const n = hierarchy.novel;
    if (n.id !== id) return null;
    return {
      title: n.title,
      existing: n.authorText,
      derived: n.derivedText,
      excerpt: "",
      hasMaterial: Boolean(n.authorText || n.derivedText),
      sources: [
        ...hierarchy.acts.map((a) => ({
          label: `Babak: ${a.title}`,
          text: clip(a.authorText || a.derivedText),
        })),
        ...hierarchy.unassignedChapters.map((c) => ({
          label: `Bab: ${c.title}`,
          text: clip(c.authorText || c.derivedText),
        })),
      ]
        .filter((s) => s.text)
        .slice(0, 12),
    };
  }

  if (level === "act") {
    const a = hierarchy.acts.find((x) => x.id === id);
    if (!a) return null;
    return {
      title: a.title,
      existing: a.authorText,
      derived: a.derivedText,
      excerpt: "",
      hasMaterial: Boolean(a.authorText || a.derivedText),
      sources: a.chapters
        .map((c) => ({
          label: `Bab: ${c.title}`,
          text: clip(c.authorText || c.derivedText),
        }))
        .filter((s) => s.text)
        .slice(0, 12),
    };
  }

  if (level === "chapter") {
    const all = [...hierarchy.acts.flatMap((a) => a.chapters), ...hierarchy.unassignedChapters];
    const c = all.find((x) => x.id === id);
    if (!c) return null;
    const allScenes = [
      ...structure.acts.flatMap((a) => a.chapters),
      ...structure.unassignedChapters,
    ].flatMap((ch) => ch.scenes);
    const excerpt = composeDeterministic(
      c.scenes.map((s) => {
        if (s.authorText) return "";
        const raw = allScenes.find((x) => x.id === s.id);
        const plain = stripToText(raw?.content);
        return plain ? plain.slice(0, EXCERPT_CHARS) : "";
      }),
      900
    );
    return {
      title: c.title,
      existing: c.authorText,
      derived: c.derivedText,
      excerpt,
      hasMaterial: Boolean(c.authorText || c.derivedText || excerpt),
      sources: c.scenes
        .map((s) => {
          const raw = allScenes.find((x) => x.id === s.id);
          const text = s.authorText || stripToText(raw?.content).slice(0, EXCERPT_CHARS);
          return { label: `Adegan: ${s.title}`, text: clip(text) };
        })
        .filter((s) => s.text)
        .slice(0, 10),
    };
  }

  // level === "scene"
  const allScenes = [
    ...structure.acts.flatMap((a) => a.chapters),
    ...structure.unassignedChapters,
  ].flatMap((ch) => ch.scenes);
  const raw = allScenes.find((x) => x.id === id);
  if (!raw) return null;
  const plain = stripToText(raw.content);
  const excerpt = plain ? plain.slice(0, EXCERPT_CHARS).trimEnd() + (plain.length > EXCERPT_CHARS ? "…" : "") : "";
  const existing = (raw.summary || "").trim() || null;
  return {
    title: raw.title,
    existing,
    derived: "",
    excerpt,
    hasMaterial: Boolean(existing || excerpt || (raw.purpose || "").trim()),
    sources: [
      raw.purpose?.trim()
        ? { label: "Tujuan adegan", text: clip(raw.purpose.trim(), 400) }
        : null,
      plain ? { label: `Naskah: ${raw.title}`, text: clip(plain, 2000) } : null,
    ].filter(Boolean) as { label: string; text: string }[],
  };
}
