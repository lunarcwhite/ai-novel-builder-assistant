import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { EmbeddingService } from "@/server/ai/embeddings";
import type {
  StoryMemory,
  CreateStoryMemoryInput,
  UpdateStoryMemoryInput,
  MemoryStatus,
  MemoryRetrievalFilters,
  MemorySearchResult,
  MemoryStats,
  MemoryDeduplicationCheckResult,
} from "@/types";

// In-memory store for local dev mode when PostgreSQL / Supabase is not connected
export const localDevMemoriesStore: Map<string, StoryMemory[]> = new Map();

// Helper to pre-embed seed memories
function createSeedMemory(
  id: string,
  novelId: string,
  type: StoryMemory["type"],
  content: string,
  importance: number,
  status: MemoryStatus,
  sourceType: StoryMemory["source_type"],
  sourceId: string | null = null,
  metadata: StoryMemory["metadata"] = {}
): StoryMemory {
  return {
    id,
    novel_id: novelId,
    type,
    content,
    importance,
    status,
    source_type: sourceType,
    source_id: sourceId,
    metadata,
    embedding: null, // Populated lazily or during first load
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  };
}

// Seed initial rich memories for demo novel "Bayang Kota Tua"
const demoNovelId = "nov_demo_bayang_kota_tua";
localDevMemoriesStore.set(demoNovelId, [
  createSeedMemory(
    "mem_kaelen_burn",
    demoNovelId,
    "character_fact",
    "Kaelen memiliki bekas luka bakar di bahu kanan akibat ledakan transmutasi di Oakhaven 15 tahun lalu.",
    4,
    "confirmed",
    "manual",
    null,
    { character_ids: ["char_kaelen"], tags: ["fisik", "trauma"] }
  ),
  createSeedMemory(
    "mem_kaelen_bronze_key",
    demoNovelId,
    "character_fact",
    "Kaelen secara rahasia menyembunyikan fragmen plat perunggu berukir sandi Oakhaven di balik lapisan jaket wolnya.",
    5,
    "confirmed",
    "chapter",
    null,
    { character_ids: ["char_kaelen"], chapter_number: 1 }
  ),
  createSeedMemory(
    "mem_vane_mentor_debt",
    demoNovelId,
    "relationship_fact",
    "Vane pernah berhutang nyawa pada Romo Alden (mentor Kaelen di biara arsip pinggiran) saat pelariannya 5 tahun lalu.",
    4,
    "confirmed",
    "manual",
    null,
    { character_ids: ["char_kaelen", "char_vane"], tags: ["aliansi", "hutang-budi"] }
  ),
  createSeedMemory(
    "mem_rule_bronze_seal",
    demoNovelId,
    "world_fact",
    "Pintu Segel Perunggu di bawah katedral kuno hanya dapat dibuka bila dua kunci dari faksi monarki dan ordo arsip disatukan secara bersamaan.",
    5,
    "confirmed",
    "world_rule",
    null,
    { location_ids: ["loc_perpustakaan"], tags: ["kuno", "ordo", "mekanisme"] }
  ),
  createSeedMemory(
    "mem_timeline_transmutation",
    demoNovelId,
    "timeline_fact",
    "Krisis Transmutasi Besar terjadi 15 tahun yang lalu dan melenyapkan seluruh arsip silsilah keluarga bangsawan Oakhaven.",
    4,
    "confirmed",
    "timeline_event",
    null,
    { tags: ["sejarah", "kronologi"] }
  ),
  createSeedMemory(
    "mem_sc1_prop_daniel",
    demoNovelId,
    "story_fact",
    "Daniel belum pernah menginjakkan kaki di kawasan dermaga barat Kota Tua sebelum malam penyerangan.",
    3,
    "proposed",
    "scene",
    "sc_demo_1",
    { confidence: 0.92, tags: ["usulan-naskah"] }
  ),
  createSeedMemory(
    "mem_plot_order_treason",
    demoNovelId,
    "plot_fact",
    "Komandan Garda Monarki mendalangi pembunuhan kurir dokumen untuk mengkambinghitamkan faksi penyelundup bawah tanah.",
    4,
    "proposed",
    "scene",
    "sc_demo_2",
    { confidence: 0.88, tags: ["intrik", "konspirasi"] }
  ),
]);

export class MemoryRepository {
  /**
   * Helper to ensure in-memory embeddings are populated for similarity searches
   */
  private static async ensureMemoryEmbedding(memory: StoryMemory): Promise<StoryMemory> {
    if (!memory.embedding || memory.embedding.length === 0) {
      memory.embedding = await EmbeddingService.generateEmbedding(memory.content);
    }
    return memory;
  }

  /**
   * Find a memory by ID
   */
  static async findById(id: string, novelId: string): Promise<StoryMemory | null> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("story_memories")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as StoryMemory;
    }

    const list = localDevMemoriesStore.get(novelId) || [];
    return list.find((m) => m.id === id) || null;
  }

  /**
   * Find many memories for a novel with optional filters
   */
  static async findManyByNovel(
    novelId: string,
    options: {
      status?: MemoryStatus | "all";
      type?: StoryMemory["type"] | "all";
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<StoryMemory[]> {
    const { status, type, search, limit = 100, offset = 0 } = options;

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (!supabase) return [];

      let query = supabase
        .from("story_memories")
        .select("*")
        .eq("novel_id", novelId)
        .order("importance", { ascending: false })
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }
      if (type && type !== "all") {
        query = query.eq("type", type);
      }
      if (search && search.trim()) {
        query = query.ilike("content", `%${search.trim()}%`);
      }

      const { data, error } = await query.range(offset, offset + limit - 1);
      if (error || !data) return [];
      return data as StoryMemory[];
    }

    let list = localDevMemoriesStore.get(novelId) || [];

    if (status && status !== "all") {
      list = list.filter((m) => m.status === status);
    }
    if (type && type !== "all") {
      list = list.filter((m) => m.type === type);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => m.content.toLowerCase().includes(q));
    }

    // Sort by importance desc, then updated_at desc
    list = [...list].sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list.slice(offset, offset + limit);
  }

  /**
   * Create a new memory
   */
  static async create(
    novelId: string,
    input: CreateStoryMemoryInput,
    embedding?: number[]
  ): Promise<StoryMemory> {
    const generatedEmbedding = embedding || (await EmbeddingService.generateEmbedding(input.content));

    const metadata = {
      character_ids: input.character_ids || [],
      location_ids: input.location_ids || [],
      tags: input.tags || [],
    };

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (!supabase) throw new Error("Database client not available");

      const insertPayload = {
        novel_id: novelId,
        type: input.type,
        content: input.content,
        importance: input.importance,
        status: input.status,
        source_type: input.source_type,
        source_id: input.source_id || null,
        metadata,
        embedding: generatedEmbedding,
      };

      const { data, error } = await supabase
        .from("story_memories")
        .insert(insertPayload)
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Gagal menyimpan memori cerita ke database.");
      }
      return data as StoryMemory;
    }

    const newMemory: StoryMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      novel_id: novelId,
      type: input.type,
      content: input.content,
      importance: input.importance ?? 3,
      status: input.status ?? "confirmed",
      source_type: input.source_type ?? "manual",
      source_id: input.source_id || null,
      metadata,
      embedding: generatedEmbedding,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const list = localDevMemoriesStore.get(novelId) || [];
    localDevMemoriesStore.set(novelId, [newMemory, ...list]);
    return newMemory;
  }

  /**
   * Update an existing memory
   */
  static async update(
    id: string,
    novelId: string,
    input: UpdateStoryMemoryInput,
    embedding?: number[]
  ): Promise<StoryMemory | null> {
    const existing = await this.findById(id, novelId);
    if (!existing) return null;

    let updatedEmbedding = existing.embedding;
    if (input.content && input.content !== existing.content) {
      updatedEmbedding = embedding || (await EmbeddingService.generateEmbedding(input.content));
    }

    const updatedMetadata = {
      ...existing.metadata,
      ...(input.character_ids ? { character_ids: input.character_ids } : {}),
      ...(input.location_ids ? { location_ids: input.location_ids } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    };

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (!supabase) return null;

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.type) updatePayload.type = input.type;
      if (input.content) updatePayload.content = input.content;
      if (input.importance !== undefined) updatePayload.importance = input.importance;
      if (input.status) updatePayload.status = input.status;
      if (input.source_type) updatePayload.source_type = input.source_type;
      if (input.source_id !== undefined) updatePayload.source_id = input.source_id;
      updatePayload.metadata = updatedMetadata;
      if (updatedEmbedding) updatePayload.embedding = updatedEmbedding;

      const { data, error } = await supabase
        .from("story_memories")
        .update(updatePayload)
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error || !data) return null;
      return data as StoryMemory;
    }

    const updated: StoryMemory = {
      ...existing,
      type: input.type || existing.type,
      content: input.content || existing.content,
      importance: input.importance !== undefined ? input.importance : existing.importance,
      status: input.status || existing.status,
      source_type: input.source_type || existing.source_type,
      source_id: input.source_id !== undefined ? input.source_id : existing.source_id,
      metadata: updatedMetadata,
      embedding: updatedEmbedding,
      updated_at: new Date().toISOString(),
    };

    const list = localDevMemoriesStore.get(novelId) || [];
    localDevMemoriesStore.set(
      novelId,
      list.map((m) => (m.id === id ? updated : m))
    );
    return updated;
  }

  /**
   * Update memory status (e.g. quick 1-click confirm / reject / archive)
   */
  static async updateStatus(
    id: string,
    novelId: string,
    status: MemoryStatus
  ): Promise<StoryMemory | null> {
    return this.update(id, novelId, { status });
  }

  /**
   * Delete a memory.
   * Returns false when the memory does not exist in the novel, so a
   * missing-ID delete is reported as "not deleted" instead of silently
   * succeeding (Supabase RLS would block a cross-novel write, but `!error`
   * alone cannot distinguish "deleted" from "matched zero rows").
   */
  static async delete(id: string, novelId: string): Promise<boolean> {
    const existing = await this.findById(id, novelId);
    if (!existing) return false;

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (!supabase) return false;

      const { error } = await supabase
        .from("story_memories")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      return !error;
    }

    const list = localDevMemoriesStore.get(novelId) || [];
    const filtered = list.filter((m) => m.id !== id);
    if (filtered.length === list.length) return false;
    localDevMemoriesStore.set(novelId, filtered);
    return true;
  }

  /**
   * Semantic Similarity Search
   * Retrieves memories ranked by cosine similarity against query embedding
   */
  static async searchSimilar(
    novelId: string,
    queryEmbedding: number[],
    options: MemoryRetrievalFilters = {}
  ): Promise<MemorySearchResult[]> {
    const {
      types,
      statuses = ["confirmed", "proposed"],
      minImportance = 1,
      characterIds,
      locationIds,
      limit = 10,
      threshold = 0.55,
    } = options;

    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.rpc("match_story_memories", {
          query_novel_id: novelId,
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: limit,
          filter_types: types && types.length > 0 ? types : null,
          filter_statuses: statuses && statuses.length > 0 ? statuses : null,
        });

        if (!error && data) {
          return (data as Array<StoryMemory & { similarity: number }>).map((item) => ({
            memory: {
              id: item.id,
              novel_id: item.novel_id,
              type: item.type,
              content: item.content,
              importance: item.importance,
              status: item.status,
              source_type: item.source_type,
              source_id: item.source_id,
              metadata: item.metadata,
              created_at: item.created_at,
              updated_at: item.updated_at,
            },
            similarity: item.similarity,
          }));
        }
      }
    }

    // In-memory fallback vector search
    let list = localDevMemoriesStore.get(novelId) || [];

    // Filter by status
    if (statuses && statuses.length > 0) {
      list = list.filter((m) => statuses.includes(m.status));
    }
    // Filter by type
    if (types && types.length > 0) {
      list = list.filter((m) => types.includes(m.type));
    }
    // Filter by importance
    if (minImportance > 1) {
      list = list.filter((m) => m.importance >= minImportance);
    }
    // Filter by characterIds
    if (characterIds && characterIds.length > 0) {
      list = list.filter((m) => {
        const charIds = m.metadata.character_ids || [];
        return characterIds.some((cid) => charIds.includes(cid));
      });
    }
    // Filter by locationIds
    if (locationIds && locationIds.length > 0) {
      list = list.filter((m) => {
        const locIds = m.metadata.location_ids || [];
        return locationIds.some((lid) => locIds.includes(lid));
      });
    }

    // Ensure embeddings exist and compute cosine similarity
    const scoredList: MemorySearchResult[] = [];

    for (const memory of list) {
      const mWithEmbedding = await this.ensureMemoryEmbedding(memory);
      if (mWithEmbedding.embedding) {
        const sim = EmbeddingService.cosineSimilarity(queryEmbedding, mWithEmbedding.embedding);
        if (sim >= threshold) {
          scoredList.push({
            memory: mWithEmbedding,
            similarity: sim,
          });
        }
      }
    }

    // Sort descending by similarity
    return scoredList.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /**
   * Check for potential duplicates when creating or editing a memory
   */
  static async checkDuplicate(
    novelId: string,
    content: string,
    threshold: number = 0.82
  ): Promise<MemoryDeduplicationCheckResult> {
    if (!content || content.trim().length < 5) {
      return { isDuplicate: false, score: 0 };
    }

    const queryEmbedding = await EmbeddingService.generateEmbedding(content);
    const matches = await this.searchSimilar(novelId, queryEmbedding, {
      statuses: ["confirmed", "proposed"],
      threshold,
      limit: 1,
    });

    if (matches.length > 0) {
      const topMatch = matches[0];
      return {
        isDuplicate: true,
        score: topMatch.similarity,
        existingMemory: topMatch.memory,
        warningMessage: `Fakta ini memiliki kemiripan ${(topMatch.similarity * 100).toFixed(0)}% dengan memori yang sudah tersimpan: "${topMatch.memory.content}".`,
      };
    }

    return { isDuplicate: false, score: 0 };
  }

  /**
   * Get stats (counts) of memories grouped by status
   */
  static async getStats(novelId: string): Promise<MemoryStats> {
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("story_memories")
          .select("status")
          .eq("novel_id", novelId);

        if (!error && data) {
          const stats: MemoryStats = {
            total: data.length,
            confirmed: 0,
            proposed: 0,
            rejected: 0,
            archived: 0,
          };
          for (const item of data) {
            if (item.status === "confirmed") stats.confirmed++;
            else if (item.status === "proposed") stats.proposed++;
            else if (item.status === "rejected") stats.rejected++;
            else if (item.status === "archived") stats.archived++;
          }
          return stats;
        }
      }
    }

    const list = localDevMemoriesStore.get(novelId) || [];
    return {
      total: list.length,
      confirmed: list.filter((m) => m.status === "confirmed").length,
      proposed: list.filter((m) => m.status === "proposed").length,
      rejected: list.filter((m) => m.status === "rejected").length,
      archived: list.filter((m) => m.status === "archived").length,
    };
  }
}
