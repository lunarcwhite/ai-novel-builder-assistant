/**
 * Story Context Resolver (Phase 7 — Task 7.4, extended Task 9.4)
 * Layered retrieval per AGENTS.md Rule 9: selection -> scene -> chapter ->
 * act -> characters -> memories -> world rules -> lore -> plot threads ->
 * timeline. Never the whole novel. Plot threads + timeline resolve from
 * the live Phase 9 tables (Task 9.1/9.2).
 */

import { NovelRepository } from "@/features/novels/repository";
import { ActRepository } from "@/features/acts/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import { SceneRepository } from "@/features/scenes/repository";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import { PlotThreadService } from "@/features/plot/service";
import { TimelineService } from "@/features/timeline/service";
import type {
  Act,
  Chapter,
  Character,
  Location,
  Novel,
  PlotThread,
  Scene,
  StoryMemory,
  TimelineEvent,
  WorldLore,
  WorldRule,
} from "@/types";

export interface ResolvedStoryContext {
  novel: Novel;
  chapter: Chapter | null;
  scene: Scene | null;
  /** Owning act of the current chapter (null when unassigned). */
  act: Act | null;
  povCharacter: Character | null;
  location: Location | null;
  involvedCharacters: Character[];
  relevantMemories: StoryMemory[];
  worldRules: WorldRule[];
  worldLore: WorldLore[];
  plotThreads: PlotThread[];
  timeline: TimelineEvent[];
  selectedText: string | null;
  truncated: Record<string, boolean>;
}

export interface ResolveInput {
  novelId: string;
  userId: string;
  chapterId?: string | null;
  sceneId?: string | null;
  selectedText?: string | null;
  userQuery?: string | null;
}

/** Per-layer caps: relevance over volume (AGENTS.md Rule 29). */
const CAPS = {
  sceneChars: 3000,
  sceneSummary: 800,
  actDescription: 500,
  memories: 6,
  worldRules: 8,
  lore: 4,
  characters: 6,
  threads: 5,
  timeline: 8,
};

function clip(text: string | null | undefined, max: number): { text: string; cut: boolean } {
  const t = (text || "").trim();
  if (t.length <= max) return { text: t, cut: false };
  return { text: t.slice(0, max) + "…", cut: true };
}

export async function resolveStoryContext(input: ResolveInput): Promise<ResolvedStoryContext | null> {
  const { novelId, userId } = input;
  const novel = await NovelRepository.findById(novelId, userId);
  if (!novel) return null;

  const scene = input.sceneId ? await SceneRepository.findById(input.sceneId, novelId, userId) : null;
  const chapterId = scene?.chapter_id || input.chapterId || null;
  const chapter = chapterId ? await ChapterRepository.findById(chapterId, novelId, userId) : null;

  const [sceneCtx, memories, worldRules, lore, threads, events, act] = await Promise.all([
    scene ? CharacterService.getSceneContext(scene.id, novelId, userId) : Promise.resolve(null),
    scene
      ? MemoryService.getSceneRelevantMemories(novelId, userId, scene.id, CAPS.memories)
      : queryMemories(novelId, userId, input.userQuery),
    WorldService.getWorldRules(novelId, userId),
    WorldService.getWorldLoreList(novelId, userId),
    // Active thread context outranks resolved history; the caller caps.
    PlotThreadService.listThreads(novelId, userId).catch(() => []),
    TimelineService.listEvents(novelId, userId).catch(() => []),
    chapter?.act_id
      ? ActRepository.findById(chapter.act_id, novelId, userId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const involved = sceneCtx?.involved_characters ?? [];
  const pov = sceneCtx?.pov_character ?? null;
  // POV first, then involved, deduped, capped.
  const seen = new Set<string>();
  const characters: Character[] = [];
  for (const c of [pov, ...involved].filter(Boolean) as Character[]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      characters.push(c);
    }
    if (characters.length >= CAPS.characters) break;
  }

  const truncated: Record<string, boolean> = {};
  if (scene) {
    const plain = (scene.content || "").replace(/<[^>]*>/g, " ");
    truncated.sceneContent = plain.length > CAPS.sceneChars;
  }

  return {
    novel,
    chapter,
    scene,
    act,
    povCharacter: pov,
    location: sceneCtx?.location ?? null,
    involvedCharacters: characters,
    relevantMemories: (memories ?? []).slice(0, CAPS.memories),
    worldRules: (worldRules ?? []).slice(0, CAPS.worldRules),
    worldLore: (lore ?? []).slice(0, CAPS.lore),
    plotThreads: rankThreads(threads ?? [], chapterId).slice(0, CAPS.threads),
    timeline: (events ?? []).slice(0, CAPS.timeline),
    selectedText: input.selectedText?.trim() ? input.selectedText.trim() : null,
    truncated,
  };
}

/**
 * Active threads touching this chapter first, then active, then the rest.
 * Deterministic, no scoring — mirrors the "calm counts" spirit (SOUL.md #31).
 */
function rankThreads(
  threads: import("@/types").PlotThread[],
  chapterId: string | null
): import("@/types").PlotThread[] {
  const weight = (t: import("@/types").PlotThread): number => {
    if (chapterId && (t.introduced_chapter_id === chapterId || t.resolved_chapter_id === chapterId)) return 0;
    if (t.status === "active") return 1;
    if (t.status === "planned") return 2;
    return 3;
  };
  return [...threads].sort(
    (a, b) => weight(a) - weight(b) || b.importance - a.importance
  );
}

async function queryMemories(novelId: string, userId: string, query?: string | null): Promise<StoryMemory[]> {
  if (query?.trim()) {
    try {
      const hits = await MemoryService.searchSimilarMemories(novelId, userId, query, {
        statuses: ["confirmed"],
        threshold: 0.5,
        limit: CAPS.memories,
      });
      return hits.map((h) => h.memory);
    } catch {
      // fall through to plain list
    }
  }
  return MemoryService.getMemories(novelId, userId, { status: "confirmed", limit: CAPS.memories });
}

export const CONTEXT_CAPS = CAPS;
export { clip };
