/**
 * Story Context Resolver (Phase 7 — Task 7.4)
 * Layered retrieval per AGENTS.md Rule 9: selection -> scene -> chapter ->
 * characters -> memories -> world rules -> lore. Never the whole novel.
 * Timeline/plot threads do not exist as tables yet (Phase 10/11), so they
 * resolve to [] with a ponytail note — no fake data.
 */

import { NovelRepository } from "@/features/novels/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import { SceneRepository } from "@/features/scenes/repository";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import type {
  Chapter,
  Character,
  Location,
  Novel,
  Scene,
  StoryMemory,
  WorldLore,
  WorldRule,
} from "@/types";

export interface ResolvedStoryContext {
  novel: Novel;
  chapter: Chapter | null;
  scene: Scene | null;
  povCharacter: Character | null;
  location: Location | null;
  involvedCharacters: Character[];
  relevantMemories: StoryMemory[];
  worldRules: WorldRule[];
  worldLore: WorldLore[];
  /** ponytail: no timeline_events table yet (Phase 10); resolves [] until then. */
  timeline: never[];
  /** ponytail: no plot_threads table yet (Phase 11); resolves [] until then. */
  plotThreads: never[];
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
  memories: 6,
  worldRules: 8,
  lore: 4,
  characters: 6,
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

  const [sceneCtx, memories, worldRules, lore] = await Promise.all([
    scene ? CharacterService.getSceneContext(scene.id, novelId, userId) : Promise.resolve(null),
    scene
      ? MemoryService.getSceneRelevantMemories(novelId, userId, scene.id, CAPS.memories)
      : queryMemories(novelId, userId, input.userQuery),
    WorldService.getWorldRules(novelId, userId),
    WorldService.getWorldLoreList(novelId, userId),
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
    povCharacter: pov,
    location: sceneCtx?.location ?? null,
    involvedCharacters: characters,
    relevantMemories: (memories ?? []).slice(0, CAPS.memories),
    worldRules: (worldRules ?? []).slice(0, CAPS.worldRules),
    worldLore: (lore ?? []).slice(0, CAPS.lore),
    timeline: [],
    plotThreads: [],
    selectedText: input.selectedText?.trim() ? input.selectedText.trim() : null,
    truncated,
  };
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
