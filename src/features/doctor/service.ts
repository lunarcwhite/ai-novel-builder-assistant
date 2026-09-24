import { z } from "zod";
import { NovelRepository } from "@/features/novels/repository";
import { StructureService } from "@/features/structure/service";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import { PlotThreadService } from "@/features/plot/service";
import { TimelineService } from "@/features/timeline/service";
import { ConsistencyFindingRepository } from "@/features/consistency/repository";
import { SceneCharacterRepository } from "@/features/characters/repository";
import { resolveAIProvider } from "@/server/ai/providers";
import { buildStoryDoctorPrompt, STORY_DOCTOR_SYSTEM } from "@/server/ai/prompts";
import type { AIMessage } from "@/server/ai/provider";
import {
  analyzeCharacterArcs,
  analyzePacing,
  analyzePlot,
  analyzePlotThreads,
  analyzeUnresolved,
  analyzeWorldbuilding,
  type DoctorInput,
} from "./analyzers";
import {
  runStoryDoctorSchema,
  type StoryDoctorObservation,
  type StoryDoctorReport,
  type StoryDoctorSection,
} from "@/types";

const ALL_SECTIONS: StoryDoctorSection[] = [
  "plot",
  "character_arcs",
  "pacing",
  "plot_threads",
  "worldbuilding",
  "unresolved_questions",
];

/** AI may only enrich wording — validated shape keeps section + evidence intact. */
const aiEnrichmentSchema = z.object({
  enrichments: z
    .array(
      z.object({
        index: z.number().int().min(0),
        refined_observation: z.string().max(1000).optional(),
        interpretation: z.string().max(1000).optional(),
        suggestion: z.string().max(1000).optional(),
      })
    )
    .max(30),
});

export interface RunDoctorOptions {
  novelId: string;
  userId: string;
  sections?: StoryDoctorSection[];
  withAI?: boolean;
}

export interface RunDoctorResult {
  success: boolean;
  error?: string;
  report?: StoryDoctorReport;
}

export class StoryDoctorService {
  static async runDiagnosis(opts: RunDoctorOptions): Promise<RunDoctorResult> {
    const parsed = runStoryDoctorSchema.safeParse({
      sections: opts.sections,
      withAI: opts.withAI,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Parameter diagnosis tidak valid.",
      };
    }

    const novel = await NovelRepository.findById(opts.novelId, opts.userId);
    if (!novel) {
      return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };
    }

    const sections = parsed.data.sections?.length ? parsed.data.sections : ALL_SECTIONS;
    const want = new Set<StoryDoctorSection>(sections);

    // Gather everything the analyzers need — all reads, no writes.
    const [structure, characters, relationships, threads, events, memories, rules, lore, openFindings] =
      await Promise.all([
        StructureService.getNovelStructureTree(opts.novelId, opts.userId),
        CharacterService.getCharacters(opts.novelId, opts.userId),
        CharacterService.getRelationships(opts.novelId, opts.userId),
        PlotThreadService.listThreads(opts.novelId, opts.userId),
        TimelineService.listEvents(opts.novelId, opts.userId),
        MemoryService.getMemories(opts.novelId, opts.userId, { limit: 200 }),
        WorldService.getWorldRules(opts.novelId, opts.userId),
        WorldService.getWorldLoreList(opts.novelId, opts.userId),
        ConsistencyFindingRepository.listByNovel(opts.novelId, opts.userId, { status: "open" }),
      ]);

    const chapters = [
      ...structure.acts.flatMap((a) => a.chapters),
      ...structure.unassignedChapters,
    ];

    // Scene appearances per character (POV + involved) for arc presence.
    const appearances = new Map<string, number>();
    try {
      const allScenes = chapters.flatMap((c) => c.scenes);
      for (const s of allScenes) {
        if (s.pov_character_id) {
          appearances.set(s.pov_character_id, (appearances.get(s.pov_character_id) || 0) + 1);
        }
      }
      const sceneIds = allScenes.map((s) => s.id);
      const ctxs = await Promise.all(
        sceneIds.slice(0, 300).map((sid) =>
          SceneCharacterRepository.findByScene(sid, opts.novelId, opts.userId).catch(() => [])
        )
      );
      for (const list of ctxs) {
        for (const c of list) {
          appearances.set(c.id, (appearances.get(c.id) || 0) + 1);
        }
      }
    } catch {
      // Presence data is best-effort; analyzers degrade gracefully to empty.
    }

    const input: DoctorInput = {
      chapters,
      characters,
      relationships,
      threads,
      events,
      memories,
      rules,
      lore,
      openFindings,
    };

    const bucket: Record<StoryDoctorSection, StoryDoctorObservation[]> = {
      plot: [],
      character_arcs: [],
      pacing: [],
      plot_threads: [],
      worldbuilding: [],
      unresolved_questions: [],
    };
    if (want.has("plot")) bucket.plot = analyzePlot(input);
    if (want.has("character_arcs")) bucket.character_arcs = analyzeCharacterArcs(input, appearances);
    if (want.has("pacing")) bucket.pacing = analyzePacing(input);
    if (want.has("plot_threads")) bucket.plot_threads = analyzePlotThreads(input);
    if (want.has("worldbuilding")) bucket.worldbuilding = analyzeWorldbuilding(input);
    if (want.has("unresolved_questions")) bucket.unresolved_questions = analyzeUnresolved(input);

    // Optional AI enrichment: refines wording of EXISTING observations.
    // Deterministic results stand alone — AI failure never loses them.
    let aiEnriched = false;
    if (parsed.data.withAI) {
      const flat = ALL_SECTIONS.flatMap((s) => bucket[s]);
      if (flat.length > 0) {
        try {
          const provider = resolveAIProvider();
          if (provider.name !== "local-dev-draft") {
            const prompt = buildStoryDoctorPrompt(
              flat.map((o, i) => ({
                index: i,
                section: o.section,
                observation: o.observation,
                evidence: o.evidence.map((e) => e.label || e.type).slice(0, 5),
              }))
            );
            const messages: AIMessage[] = [
              { role: "system", content: STORY_DOCTOR_SYSTEM },
              { role: "user", content: prompt },
            ];
            const raw = await provider.generateStructured<unknown>(messages, null, {
              temperature: 0.4,
              maxTokens: 2000,
            });
            const enrichParsed = aiEnrichmentSchema.safeParse(raw);
            if (enrichParsed.success) {
              for (const e of enrichParsed.data.enrichments) {
                const target = flat[e.index];
                if (!target) continue;
                if (e.refined_observation?.trim()) {
                  target.observation = tentative(e.refined_observation.trim());
                }
                if (e.interpretation?.trim()) target.interpretation = e.interpretation.trim();
                if (e.suggestion?.trim()) target.suggestion = e.suggestion.trim();
                target.ai_enriched = true;
              }
              aiEnriched = true;
            }
          }
        } catch {
          aiEnriched = false; // fall through with deterministic observations
        }
      }
    }

    const counts = Object.fromEntries(
      ALL_SECTIONS.map((s) => [s, bucket[s].length])
    ) as Record<StoryDoctorSection, number>;

    return {
      success: true,
      report: {
        novel_id: opts.novelId,
        generated_at: new Date().toISOString(),
        ai_enriched: aiEnriched,
        sections: bucket,
        counts,
      },
    };
  }
}

/** Ensure AI-refined wording keeps tentative observation language (SOUL.md #13). */
function tentative(text: string): string {
  if (/mungkin|potensi|kemungkinan|nampaknya|sepertinya|salah satu tafsir|indikasi/i.test(text)) return text;
  return `Potensi observasi (perlu tinjauan penulis): ${text}`;
}
