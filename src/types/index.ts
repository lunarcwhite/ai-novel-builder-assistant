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

export type CreateNovelInput = z.infer<typeof createNovelSchema>;

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

export type CreateChapterInput = z.infer<typeof createChapterSchema>;

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
  status: z.enum(["planned", "draft", "in_progress", "completed", "revising"]).default("planned"),
});

export type CreateSceneInput = z.infer<typeof createSceneSchema>;

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

export type CreateSceneVersionInput = z.infer<typeof createSceneVersionSchema>;

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

// Future Domains (Phase 5 & 6 Placeholders)
export interface Character {
  id: UUID;
  novel_id: UUID;
  name: string;
  full_name?: string | null;
  role: "protagonist" | "antagonist" | "deuteragonist" | "supporting" | "minor";
  archetype?: string | null;
  short_description?: string | null;
  background?: string | null;
  goal?: string | null;
  internal_conflict?: string | null;
  external_conflict?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryMemory {
  id: UUID;
  novel_id: UUID;
  memory_type: "fact" | "rule" | "relationship" | "decision" | "secret" | "promise" | "state_change";
  source_type: "author" | "scene" | "ai_extraction";
  source_scene_id?: UUID | null;
  content: string;
  confidence: number;
  status: "proposed" | "confirmed" | "rejected";
  created_at: string;
  updated_at: string;
}
