/**
 * Novel Builder - Global Types & Domain Definitions
 * Derived from docs/database-schema.md
 */

import { z } from "zod";

export type UUID = string;

// Novel Domain
export type NovelStatus = "planning" | "in_progress" | "first_draft" | "revising" | "completed" | "archived";

export interface Novel {
  id: UUID;
  user_id: UUID;
  title: string;
  slug: string;
  genre?: string | null;
  status: NovelStatus;
  premise?: string | null;
  theme?: string | null;
  tone?: string | null;
  target_audience?: string | null;
  description?: string | null;
  word_count: number;
  target_word_count: number;
  created_at: string;
  updated_at: string;
}

export const createNovelSchema = z.object({
  title: z.string().min(1, "Judul novel wajib diisi").max(150, "Judul maksimal 150 karakter"),
  genre: z.string().optional().nullable(),
  premise: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  target_audience: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  target_word_count: z.coerce.number().int().min(1000, "Target minimal 1,000 kata").default(50000),
});

export type CreateNovelInput = z.input<typeof createNovelSchema>;

export const updateNovelSchema = createNovelSchema.partial().extend({
  status: z.enum(["planning", "in_progress", "first_draft", "revising", "completed", "archived"]).optional(),
});

export type UpdateNovelInput = z.infer<typeof updateNovelSchema>;

// Act Domain (Babak Cerita)
export interface Act {
  id: UUID;
  novel_id: UUID;
  title: string;
  description?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export const createActSchema = z.object({
  title: z.string().min(1, "Judul babak/act wajib diisi").max(150, "Judul maksimal 150 karakter"),
  description: z.string().optional().nullable(),
});

export type CreateActInput = z.infer<typeof createActSchema>;

export const updateActSchema = createActSchema.partial();
export type UpdateActInput = z.infer<typeof updateActSchema>;

// Chapter Domain (Bab Cerita)
export type ChapterStatus = "planned" | "draft" | "in_progress" | "completed" | "revising";

export interface Chapter {
  id: UUID;
  novel_id: UUID;
  act_id?: UUID | null;
  title: string;
  summary?: string | null;
  objective?: string | null;
  conflict?: string | null;
  emotional_beat?: string | null;
  outcome?: string | null;
  position: number;
  status: ChapterStatus;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export const createChapterSchema = z.object({
  title: z.string().min(1, "Judul bab wajib diisi").max(150, "Judul bab maksimal 150 karakter"),
  act_id: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  objective: z.string().optional().nullable(),
  conflict: z.string().optional().nullable(),
  emotional_beat: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  status: z.enum(["planned", "draft", "in_progress", "completed", "revising"]).default("planned"),
});

export type CreateChapterInput = z.input<typeof createChapterSchema>;

export const updateChapterSchema = createChapterSchema.partial();
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

// Scene Domain (Adegan Naskah)
export type SceneStatus = "planned" | "draft" | "in_progress" | "completed" | "revising";

export interface Scene {
  id: UUID;
  novel_id: UUID;
  chapter_id: UUID;
  title: string;
  summary?: string | null;
  purpose?: string | null;
  pov_character_id?: UUID | null;
  location_id?: UUID | null;
  position: number;
  status: SceneStatus;
  content?: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export const createSceneSchema = z.object({
  title: z.string().min(1, "Judul adegan wajib diisi").max(150, "Judul adegan maksimal 150 karakter"),
  chapter_id: z.string().min(1, "Bab harus dipilih"),
  summary: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  pov_character_id: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  status: z.enum(["planned", "draft", "in_progress", "completed", "revising"]).default("planned"),
});

export type CreateSceneInput = z.input<typeof createSceneSchema>;

export const updateSceneSchema = createSceneSchema.partial();
export type UpdateSceneInput = z.infer<typeof updateSceneSchema>;

// Scene Version Domain (Riwayat & Snapshot Versi Naskah)
export type ChangeType = "manual" | "ai_insert" | "ai_replace" | "restore" | "import" | "checkpoint";

export interface SceneVersion {
  id: UUID;
  scene_id: UUID;
  version_number: number;
  title?: string | null;
  content: string;
  word_count: number;
  created_by?: UUID | null;
  change_type: ChangeType;
  notes?: string | null;
  created_at: string;
}

export const createSceneVersionSchema = z.object({
  title: z.string().max(100, "Label versi maksimal 100 karakter").optional().nullable(),
  content: z.string(),
  change_type: z.enum(["manual", "ai_insert", "ai_replace", "restore", "import", "checkpoint"]).default("manual"),
  notes: z.string().max(300, "Catatan versi maksimal 300 karakter").optional().nullable(),
});

export type CreateSceneVersionInput = z.input<typeof createSceneVersionSchema>;

// Composite Hierarchy Tree Types (for Outline View)
export interface ChapterWithScenes extends Chapter {
  scenes: Scene[];
}

export interface ActWithChapters extends Act {
  chapters: ChapterWithScenes[];
}

export interface NovelStructureTree {
  acts: ActWithChapters[];
  unassignedChapters: ChapterWithScenes[];
  totalActs: number;
  totalChapters: number;
  totalScenes: number;
  totalWords: number;
}

// -------------------------------------------------------------
// Phase 5 — Characters & World Domains
// -------------------------------------------------------------

// 1. Characters Domain
export type CharacterRole = "protagonist" | "antagonist" | "deuteragonist" | "supporting" | "minor";

export interface Character {
  id: UUID;
  novel_id: UUID;
  name: string;
  role: CharacterRole;
  age?: string | null;
  occupation?: string | null;
  description?: string | null;
  personality?: string | null;
  motivation?: string | null;
  goal?: string | null;
  fear?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  secret?: string | null;
  backstory?: string | null;
  character_arc?: string | null;
  created_at: string;
  updated_at: string;
}

export const createCharacterSchema = z.object({
  name: z.string().min(1, "Nama karakter wajib diisi").max(100, "Nama maksimal 100 karakter"),
  role: z.enum(["protagonist", "antagonist", "deuteragonist", "supporting", "minor"]).default("supporting"),
  age: z.string().max(50, "Usia maksimal 50 karakter").optional().nullable(),
  occupation: z.string().max(100, "Profesi maksimal 100 karakter").optional().nullable(),
  description: z.string().optional().nullable(),
  personality: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
  fear: z.string().optional().nullable(),
  strengths: z.string().optional().nullable(),
  weaknesses: z.string().optional().nullable(),
  secret: z.string().optional().nullable(),
  backstory: z.string().optional().nullable(),
  character_arc: z.string().optional().nullable(),
});

export type CreateCharacterInput = z.input<typeof createCharacterSchema>;

export const updateCharacterSchema = createCharacterSchema.partial();
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;

// 2. Character Relationships Domain
export type RelationshipType =
  | "ally"
  | "rival"
  | "enemy"
  | "mentor"
  | "family"
  | "love_interest"
  | "friend"
  | "custom";

export interface CharacterRelationship {
  id: UUID;
  novel_id: UUID;
  from_character_id: UUID;
  to_character_id: UUID;
  relationship_type: RelationshipType;
  description?: string | null;
  history?: string | null;
  current_state?: string | null;
  from_character_name?: string;
  to_character_name?: string;
  created_at: string;
  updated_at: string;
}

export const createRelationshipSchema = z
  .object({
    from_character_id: z.string().min(1, "Karakter asal harus dipilih"),
    to_character_id: z.string().min(1, "Karakter target harus dipilih"),
    relationship_type: z
      .enum(["ally", "rival", "enemy", "mentor", "family", "love_interest", "friend", "custom"])
      .default("friend"),
    description: z.string().optional().nullable(),
    history: z.string().optional().nullable(),
    current_state: z.string().optional().nullable(),
  })
  .refine((data) => data.from_character_id !== data.to_character_id, {
    message: "Karakter tidak dapat memiliki relasi dengan dirinya sendiri",
    path: ["to_character_id"],
  });

export type CreateRelationshipInput = z.input<typeof createRelationshipSchema>;

export const updateRelationshipSchema = z.object({
  relationship_type: z
    .enum(["ally", "rival", "enemy", "mentor", "family", "love_interest", "friend", "custom"])
    .optional(),
  description: z.string().optional().nullable(),
  history: z.string().optional().nullable(),
  current_state: z.string().optional().nullable(),
});

export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;

// 3. Locations Domain
export interface Location {
  id: UUID;
  novel_id: UUID;
  name: string;
  description?: string | null;
  geography?: string | null;
  atmosphere?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export const createLocationSchema = z.object({
  name: z.string().min(1, "Nama lokasi wajib diisi").max(120, "Nama lokasi maksimal 120 karakter"),
  description: z.string().optional().nullable(),
  geography: z.string().optional().nullable(),
  atmosphere: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = createLocationSchema.partial();
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// 4. World Rules Domain
export interface WorldRule {
  id: UUID;
  novel_id: UUID;
  title: string;
  rule: string;
  description?: string | null;
  importance: number; // 1 to 5
  created_at: string;
  updated_at: string;
}

export const createWorldRuleSchema = z.object({
  title: z.string().min(1, "Judul aturan wajib diisi").max(150, "Judul aturan maksimal 150 karakter"),
  rule: z.string().min(1, "Isi kaidah/aturan wajib diisi"),
  description: z.string().optional().nullable(),
  importance: z.coerce.number().int().min(1).max(5).default(3),
});

export type CreateWorldRuleInput = z.input<typeof createWorldRuleSchema>;

export const updateWorldRuleSchema = createWorldRuleSchema.partial();
export type UpdateWorldRuleInput = z.infer<typeof updateWorldRuleSchema>;

// 5. World Lore Domain
export interface WorldLore {
  id: UUID;
  novel_id: UUID;
  category: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const createWorldLoreSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi").default("general"),
  title: z.string().min(1, "Judul lore wajib diisi").max(150, "Judul lore maksimal 150 karakter"),
  content: z.string().min(1, "Konten lore wajib diisi"),
});

export type CreateWorldLoreInput = z.input<typeof createWorldLoreSchema>;

export const updateWorldLoreSchema = createWorldLoreSchema.partial();
export type UpdateWorldLoreInput = z.infer<typeof updateWorldLoreSchema>;

// 6. Scene Context & Linking Domain
export interface SceneCharacter {
  id: UUID;
  novel_id: UUID;
  scene_id: UUID;
  character_id: UUID;
  role_in_scene?: string | null;
  created_at: string;
}

export interface SceneContextData {
  pov_character_id?: UUID | null;
  pov_character?: Character | null;
  location_id?: UUID | null;
  location?: Location | null;
  involved_characters: Character[];
}

export const updateSceneContextSchema = z.object({
  pov_character_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  character_ids: z.array(z.string().uuid()).default([]),
});

export type UpdateSceneContextInput = z.infer<typeof updateSceneContextSchema>;

// -------------------------------------------------------------
// Phase 6 Domain: Story Memory
// -------------------------------------------------------------
export type MemoryType =
  | "character_fact"
  | "relationship_fact"
  | "world_fact"
  | "timeline_fact"
  | "plot_fact"
  | "story_fact";

export type MemoryStatus = "proposed" | "confirmed" | "rejected" | "archived";

export type MemorySourceType =
  | "manual"
  | "scene"
  | "chapter"
  | "character"
  | "world_rule"
  | "timeline_event"
  | "ai_extraction";

export interface MemoryMetadata {
  character_ids?: UUID[];
  location_ids?: UUID[];
  chapter_number?: number;
  confidence?: number;
  tags?: string[];
  duplicate_of_id?: UUID;
  [key: string]: unknown;
}

export interface StoryMemory {
  id: UUID;
  novel_id: UUID;
  type: MemoryType;
  content: string;
  importance: number; // 1 to 5
  status: MemoryStatus;
  source_type: MemorySourceType;
  source_id?: UUID | null;
  metadata: MemoryMetadata;
  embedding?: number[] | null;
  created_at: string;
  updated_at: string;
}

export const createStoryMemorySchema = z.object({
  type: z.enum([
    "character_fact",
    "relationship_fact",
    "world_fact",
    "timeline_fact",
    "plot_fact",
    "story_fact",
  ]),
  content: z.string().min(1, "Konten memori cerita wajib diisi"),
  importance: z.coerce.number().int().min(1).max(5).default(3),
  status: z.enum(["proposed", "confirmed", "rejected", "archived"]).default("confirmed"),
  source_type: z.enum([
    "manual",
    "scene",
    "chapter",
    "character",
    "world_rule",
    "timeline_event",
    "ai_extraction",
  ]).default("manual"),
  source_id: z.string().uuid().nullable().optional(),
  character_ids: z.array(z.string().uuid()).optional().default([]),
  location_ids: z.array(z.string().uuid()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export type CreateStoryMemoryInput = z.input<typeof createStoryMemorySchema>;

export const updateStoryMemorySchema = createStoryMemorySchema.partial().extend({
  status: z.enum(["proposed", "confirmed", "rejected", "archived"]).optional(),
});

export type UpdateStoryMemoryInput = z.infer<typeof updateStoryMemorySchema>;

export interface MemoryRetrievalFilters {
  query?: string;
  types?: MemoryType[];
  statuses?: MemoryStatus[];
  minImportance?: number;
  characterIds?: UUID[];
  locationIds?: UUID[];
  limit?: number;
  threshold?: number;
}

export interface MemorySearchResult {
  memory: StoryMemory;
  similarity: number; // 0 to 1
  matchedReason?: string;
}

export interface MemoryStats {
  total: number;
  confirmed: number;
  proposed: number;
  rejected: number;
  archived: number;
}

export interface MemoryDeduplicationCheckResult {
  isDuplicate: boolean;
  score: number;
  existingMemory?: StoryMemory;
  warningMessage?: string;
}

// -------------------------------------------------------------
// Phase 7 Domain: AI Assistant
// -------------------------------------------------------------

export type AIOperation =
  | "brainstorm"
  | "continue_scene"
  | "rewrite"
  | "expand"
  | "shorten"
  | "improve_prose"
  | "improve_dialogue"
  | "summarize"
  | "critique"
  | "ask";

export const aiOperationSchema = z.enum([
  "brainstorm",
  "continue_scene",
  "rewrite",
  "expand",
  "shorten",
  "improve_prose",
  "improve_dialogue",
  "summarize",
  "critique",
  "ask",
]);

export type AIOperationInput = z.infer<typeof aiOperationSchema>;

export const askAISchema = z.object({
  operation: aiOperationSchema,
  userQuery: z
    .string()
    .min(1, "Pertanyaan atau instruksi wajib diisi.")
    .max(2000, "Instruksi maksimal 2.000 karakter."),
  selectedText: z.string().max(8000, "Teks terpilih maksimal 8.000 karakter.").optional().nullable(),
  conversationId: z.string().min(1).max(100).nullable().optional(),
});

export type AskAIInput = z.infer<typeof askAISchema>;

export const applySuggestionSchema = z.object({
  mode: z.enum(["insert", "replace"]),
  finalContent: z
    .string()
    .min(1, "Konten akhir tidak boleh kosong.")
    .max(200000, "Konten akhir terlalu besar."),
  operation: aiOperationSchema.optional(),
});

export type ApplySuggestionInput = z.infer<typeof applySuggestionSchema>;

export type AIMessageRole = "system" | "user" | "assistant";

export interface AIConversation {
  id: UUID;
  novel_id: UUID;
  user_id: UUID;
  title?: string | null;
  context: {
    chapter_id?: UUID;
    scene_id?: UUID;
    selected_text?: boolean;
    operation?: AIOperation;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface AIMessageRow {
  id: UUID;
  conversation_id: UUID;
  role: AIMessageRole;
  content: string;
  metadata: {
    operation?: AIOperation;
    model?: string;
    input_tokens?: number;
    output_tokens?: number;
    scene_id?: UUID;
    chapter_id?: UUID;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface AIUsageLog {
  id: UUID;
  user_id: UUID;
  novel_id?: UUID | null;
  provider: string;
  model: string;
  operation: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost?: number | null;
  latency_ms?: number | null;
  status: string;
  created_at: string;
}

export interface AIUsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  byOperation: Record<string, number>;
}

export interface AISuggestionResult {
  text: string;
  operation: AIOperation;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  conversationId: string;
  messageId: string;
};

// -------------------------------------------------------------
// Phase 8 Domain: Consistency Engine
// -------------------------------------------------------------
// SOUL.md #13/#32: findings are tentative observations with evidence,
// never verdicts. Timeline/plot tables do not exist yet (Phase 9+) —
// timeline_inconsistency / plot_hole types are reserved; the checker
// only produces character_contradiction + lore_conflict until then.

export type ConsistencyFindingType =
  | "character_contradiction"
  | "timeline_inconsistency"
  | "lore_conflict"
  | "plot_hole";

export type ConsistencySeverity = "potential" | "notable" | "high_attention";

export type ConsistencyStatus = "open" | "reviewed" | "dismissed" | "resolved";

export type ConsistencyScope = "scene" | "chapter";

export interface ConsistencySourceRef {
  type: "scene" | "chapter" | "character" | "world_rule" | "world_lore" | "memory" | "timeline_event";
  id?: string | null;
  label?: string | null;
  excerpt?: string | null;
}

export interface ConsistencyRelatedEntity {
  type: string;
  id: string;
}

export interface ConsistencyFinding {
  id: UUID;
  novel_id: UUID;
  type: ConsistencyFindingType;
  severity: ConsistencySeverity;
  description: string;
  status: ConsistencyStatus;
  source_ids: ConsistencySourceRef[];
  related_entity_ids: ConsistencyRelatedEntity[];
  metadata: {
    scope?: ConsistencyScope;
    fact_key?: string;
    ai_generated?: boolean;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export const consistencyScopeSchema = z.enum(["scene", "chapter"]);

export const runConsistencyCheckSchema = z.object({
  scope: consistencyScopeSchema,
  sceneId: z.string().min(1).max(100).nullable().optional(),
  chapterId: z.string().min(1).max(100).nullable().optional(),
});

export type RunConsistencyCheckInput = z.infer<typeof runConsistencyCheckSchema>;

export const updateConsistencyFindingSchema = z.object({
  status: z.enum(["reviewed", "dismissed", "resolved"]),
});

export type UpdateConsistencyFindingInput = z.infer<typeof updateConsistencyFindingSchema>;

// -------------------------------------------------------------
// Phase 9 Domain: Plot Threads + Timeline Events (Story Intelligence)
// -------------------------------------------------------------
// SOUL.md #13/#15: thread status is author-decided; "unknown" is a
// valid timeline state. The system observes and suggests, never
// auto-resolves story content.

export type PlotThreadStatus = "planned" | "active" | "resolved" | "abandoned";

export interface PlotThread {
  id: UUID;
  novel_id: UUID;
  title: string;
  description?: string | null;
  status: PlotThreadStatus;
  importance: number; // 1 to 5
  introduced_chapter_id?: UUID | null;
  resolved_chapter_id?: UUID | null;
  created_at: string;
  updated_at: string;
}

export const createPlotThreadSchema = z.object({
  title: z.string().min(1, "Judul plot thread wajib diisi").max(150, "Judul plot thread maksimal 150 karakter"),
  description: z.string().optional().nullable(),
  status: z.enum(["planned", "active", "resolved", "abandoned"]).default("planned"),
  importance: z.coerce.number().int().min(1).max(5).default(3),
  introduced_chapter_id: z.string().min(1).max(100).nullable().optional(),
  resolved_chapter_id: z.string().min(1).max(100).nullable().optional(),
});

export type CreatePlotThreadInput = z.input<typeof createPlotThreadSchema>;

export const updatePlotThreadSchema = createPlotThreadSchema.partial();

export type UpdatePlotThreadInput = z.infer<typeof updatePlotThreadSchema>;

export type TimelinePrecision = "exact" | "day" | "month" | "year" | "relative" | "unknown";

export interface TimelineEvent {
  id: UUID;
  novel_id: UUID;
  title: string;
  description?: string | null;
  date_value?: string | null;
  date_precision: TimelinePrecision;
  relative_time?: string | null;
  chapter_id?: UUID | null;
  location_id?: UUID | null;
  created_at: string;
  updated_at: string;
}

export const createTimelineEventSchema = z.object({
  title: z.string().min(1, "Judul peristiwa wajib diisi").max(150, "Judul peristiwa maksimal 150 karakter"),
  description: z.string().optional().nullable(),
  date_value: z.string().max(120, "Nilai tanggal maksimal 120 karakter").optional().nullable(),
  date_precision: z.enum(["exact", "day", "month", "year", "relative", "unknown"]).default("unknown"),
  relative_time: z.string().max(200, "Waktu relatif maksimal 200 karakter").optional().nullable(),
  chapter_id: z.string().min(1).max(100).nullable().optional(),
  location_id: z.string().min(1).max(100).nullable().optional(),
});

export type CreateTimelineEventInput = z.input<typeof createTimelineEventSchema>;

export const updateTimelineEventSchema = createTimelineEventSchema.partial();

export type UpdateTimelineEventInput = z.infer<typeof updateTimelineEventSchema>;

