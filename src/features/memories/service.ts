import { MemoryRepository } from "./repository";
import { NovelRepository } from "@/features/novels/repository";
import { SceneRepository } from "@/features/scenes/repository";
import { CharacterService } from "@/features/characters/service";
import { EmbeddingService } from "@/server/ai/embeddings";
import {
  createStoryMemorySchema,
  updateStoryMemorySchema,
  type StoryMemory,
  type MemoryStatus,
  type MemoryRetrievalFilters,
  type MemorySearchResult,
  type MemoryStats,
  type MemoryDeduplicationCheckResult,
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
