import { MemoryRepository } from "./repository";
import { NovelRepository } from "@/features/novels/repository";
import { SceneRepository } from "@/features/scenes/repository";
import { CharacterService } from "@/features/characters/service";
import { EmbeddingService } from "@/server/ai/embeddings";
import { resolveAIProvider } from "@/server/ai/providers";
import type { AIMessage } from "@/server/ai/provider";
import {
  MEMORY_EXTRACTION_SYSTEM,
  buildMemoryExtractionPrompt,
} from "@/server/ai/prompts";
import { z } from "zod";
import {
  createStoryMemorySchema,
  proposeSceneMemoriesSchema,
  updateStoryMemorySchema,
  type StoryMemory,
  type MemoryProposalCandidate,
  type MemoryStatus,
  type MemoryRetrievalFilters,
  type MemorySearchResult,
  type MemoryStats,
  type MemoryDeduplicationCheckResult,
  type ProposeSceneMemoriesResult,
} from "@/types";

export class MemoryService {
  /**
   * Enforces novel ownership for authorization safety
   */
  private static async verifyNovelOwnership(novelId: string, userId: string): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    return Boolean(novel);
  }

  /**
   * Get all memories with optional status/type/search filtering
   */
  static async getMemories(
    novelId: string,
    userId: string,
    options: {
      status?: MemoryStatus | "all";
      type?: StoryMemory["type"] | "all";
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<StoryMemory[]> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) return [];

    return MemoryRepository.findManyByNovel(novelId, options);
  }

  /**
   * Get a single memory by ID
   */
  static async getMemory(
    id: string,
    novelId: string,
    userId: string
  ): Promise<StoryMemory | null> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) return null;

    return MemoryRepository.findById(id, novelId);
  }

  /**
   * Get memory counts and stats
   */
  static async getStats(novelId: string, userId: string): Promise<MemoryStats> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) {
      return { total: 0, confirmed: 0, proposed: 0, rejected: 0, archived: 0 };
    }

    return MemoryRepository.getStats(novelId);
  }

  /**
   * Create a new memory
   */
  static async createMemory(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; memory?: StoryMemory; error?: string; duplicateWarning?: string }> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) {
      return { success: false, error: "Akses novel tidak diizinkan." };
    }

    const validation = createStoryMemorySchema.safeParse(rawInput);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const data = validation.data;

    // Check for potential duplicate facts
    const duplicateCheck = await MemoryRepository.checkDuplicate(novelId, data.content);

    // Generate vector embedding
    const embedding = await EmbeddingService.generateEmbedding(data.content);

    const memory = await MemoryRepository.create(novelId, data, embedding);
    return {
      success: true,
      memory,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck.warningMessage : undefined,
    };
  }

  /**
   * Update an existing memory
   */
  static async updateMemory(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; memory?: StoryMemory; error?: string }> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) {
      return { success: false, error: "Akses novel tidak diizinkan." };
    }

    const validation = updateStoryMemorySchema.safeParse(rawInput);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const memory = await MemoryRepository.update(id, novelId, validation.data);
    if (!memory) {
      return { success: false, error: "Memori cerita tidak ditemukan." };
    }

    return { success: true, memory };
  }

  /**
   * Quick status change (Confirm, Reject, Archive)
   */
  static async updateStatus(
    id: string,
    novelId: string,
    userId: string,
    status: MemoryStatus
  ): Promise<{ success: boolean; memory?: StoryMemory; error?: string }> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) {
      return { success: false, error: "Akses novel tidak diizinkan." };
    }

    const memory = await MemoryRepository.updateStatus(id, novelId, status);
    if (!memory) {
      return { success: false, error: "Memori cerita tidak ditemukan." };
    }

    return { success: true, memory };
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) {
      return { success: false, error: "Akses novel tidak diizinkan." };
    }

    const ok = await MemoryRepository.delete(id, novelId);
    if (!ok) {
      return { success: false, error: "Gagal menghapus memori cerita." };
    }

    return { success: true };
  }

  /**
   * Semantic Similarity Search
   */
  static async searchSimilarMemories(
    novelId: string,
    userId: string,
    queryText: string,
    options: MemoryRetrievalFilters = {}
  ): Promise<MemorySearchResult[]> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess || !queryText.trim()) return [];

    const queryEmbedding = await EmbeddingService.generateEmbedding(queryText);
    return MemoryRepository.searchSimilar(novelId, queryEmbedding, options);
  }

  /**
   * Check if a candidate text is duplicate of an existing memory
   */
  static async checkDuplicateCandidate(
    novelId: string,
    userId: string,
    contentText: string
  ): Promise<MemoryDeduplicationCheckResult> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) return { isDuplicate: false, score: 0 };

    return MemoryRepository.checkDuplicate(novelId, contentText);
  }

  /**
   * Propose memory candidates from a scene's manuscript (Task 9.5).
   *
   * SOUL.md #6/#8: candidates are stored with status "proposed" only —
   * never auto-confirmed. The author confirms or rejects each one in
   * the Memory Studio. The manuscript body is never touched.
   */
  static async proposeFromScene(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<ProposeSceneMemoriesResult> {
    const parsed = proposeSceneMemoriesSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Parameter usulan memori tidak valid.",
      };
    }
    const { sceneId } = parsed.data;

    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) {
      return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };
    }

    const scene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!scene) {
      return { success: false, error: "Adegan tidak ditemukan atau akses ditolak." };
    }

    const plain = stripSceneText(scene.content);
    if (plain.length < MIN_SCENE_CHARS) {
      return {
        success: false,
        error: "Naskah adegan masih terlalu pendek untuk diekstrak. Tulis lebih dulu, lalu usulkan lagi.",
      };
    }

    // 1. Extract candidates: AI when available, deterministic fallback otherwise.
    let candidates = extractDeterministicCandidates(plain);
    let aiEnriched = false;
    try {
      const provider = resolveAIProvider();
      if (provider.name !== "local-dev-draft") {
        const messages: AIMessage[] = [
          { role: "system", content: MEMORY_EXTRACTION_SYSTEM },
          {
            role: "user",
            content: buildMemoryExtractionPrompt({
              sceneTitle: scene.title,
              sceneText: plain.slice(0, SCENE_CLIP_CHARS),
            }),
          },
        ];
        const raw = await provider.generateStructured<unknown>(messages, null, {
          temperature: 0.3,
          maxTokens: 800,
        });
        const aiParsed = aiCandidateListSchema.safeParse(raw);
        const valid = (aiParsed.success ? aiParsed.data.candidates : []).filter(
          (c) => c.content.trim().length >= MIN_CANDIDATE_CHARS
        );
        if (valid.length > 0) {
          candidates = valid.slice(0, MAX_CANDIDATES);
          aiEnriched = true;
        }
      }
    } catch {
      aiEnriched = false; // fall through with the deterministic candidates
    }

    // 2. Dedup: within-batch exact matches, then against stored memories.
    const created: StoryMemory[] = [];
    const seen = new Set<string>();
    let skippedDuplicates = 0;
    for (const c of candidates.slice(0, MAX_CANDIDATES)) {
      const content = c.content.trim();
      if (!content) continue;
      const key = content.toLowerCase();
      if (seen.has(key)) {
        skippedDuplicates++;
        continue;
      }
      seen.add(key);

      const dup = await MemoryRepository.checkDuplicate(novelId, content);
      if (dup.isDuplicate) {
        skippedDuplicates++;
        continue;
      }

      const embedding = await EmbeddingService.generateEmbedding(content);
      const memory = await MemoryRepository.create(
        novelId,
        {
          type: c.type,
          content,
          importance: Math.min(5, Math.max(1, c.importance)),
          status: "proposed",
          source_type: "ai_extraction",
          source_id: sceneId,
          character_ids: [],
          location_ids: [],
          tags: ["usulan-otomatis"],
        },
        embedding
      );
      created.push(memory);
    }

    return { success: true, sceneId, created, skippedDuplicates, aiEnriched };
  }

  /**
   * Retrieve memories relevant to a specific scene's context
   * (Linked characters, location, or semantic purpose)
   */
  static async getSceneRelevantMemories(
    novelId: string,
    userId: string,
    sceneId: string,
    limit: number = 6
  ): Promise<StoryMemory[]> {
    const hasAccess = await this.verifyNovelOwnership(novelId, userId);
    if (!hasAccess) return [];

    const scene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!scene) return [];

    // Get linked scene characters and location
    const context = await CharacterService.getSceneContext(sceneId, novelId, userId);
    const characterIds = [
      ...(context.pov_character_id ? [context.pov_character_id] : []),
      ...context.involved_characters.map((c) => c.id),
    ];

    const locationIds = context.location_id ? [context.location_id] : [];

    // 1. Direct entity-linked memories
    const allNovelMemories = await MemoryRepository.findManyByNovel(novelId, {
      status: "confirmed",
      limit: 100,
    });

    const directMatches = allNovelMemories.filter((m) => {
      const mChars = m.metadata.character_ids || [];
      const mLocs = m.metadata.location_ids || [];
      const charMatch = characterIds.some((cid) => mChars.includes(cid));
      const locMatch = locationIds.some((lid) => mLocs.includes(lid));
      const sceneSourceMatch = m.source_type === "scene" && m.source_id === sceneId;
      return charMatch || locMatch || sceneSourceMatch;
    });

    // 2. If we need more context and scene has a purpose/summary, run semantic search
    if (directMatches.length < limit && (scene.purpose || scene.summary || scene.title)) {
      const queryContext = `${scene.title} ${scene.purpose || ""} ${scene.summary || ""}`.trim();
      const semanticResults = await this.searchSimilarMemories(novelId, userId, queryContext, {
        statuses: ["confirmed"],
        threshold: 0.50,
        limit: limit,
      });

      for (const res of semanticResults) {
        if (!directMatches.some((m) => m.id === res.memory.id)) {
          directMatches.push(res.memory);
        }
      }
    }

    return directMatches.slice(0, limit);
  }
}

// ---------------------------------------------------------------
// Task 9.5 helpers (module-level, no I/O except via repositories)
// ---------------------------------------------------------------

const MIN_SCENE_CHARS = 80;
const SCENE_CLIP_CHARS = 3000;
const MIN_CANDIDATE_CHARS = 12;
const MAX_CANDIDATES = 5;

/** Strip editor HTML to plain text (same approach as word count). */
function stripSceneText(html: string | null | undefined): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const aiCandidateListSchema = z.object({
  candidates: z
    .array(
      z.object({
        type: z.enum([
          "character_fact",
          "relationship_fact",
          "world_fact",
          "timeline_fact",
          "plot_fact",
          "story_fact",
        ]),
        content: z.string(),
        importance: z.coerce.number().int().min(1).max(5).default(3),
      })
    )
    .max(10)
    .default([]),
});

const HEDGE_RE = /\b(mungkin|diduga|kabarnya|konon|sepertinya|barangkali|mungkinkah)\b/i;

/**
 * Local-dev fallback: split the scene into sentences, keep the first
 * few long non-hedged ones as story_fact proposals. Deterministic,
 * zero-cost, never invents facts beyond the author's own sentences.
 */
function extractDeterministicCandidates(plain: string): MemoryProposalCandidate[] {
  const sentences = plain
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_CANDIDATE_CHARS && !HEDGE_RE.test(s));
  return sentences.slice(0, MAX_CANDIDATES).map((content) => ({
    type: "story_fact" as const,
    content,
    importance: 3,
  }));
}
