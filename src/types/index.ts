/**
 * Novel Builder - Global Types & Domain Definitions
 * Derived from docs/database-schema.md
 */

import { z } from "zod";

export type UUID = string;

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

export interface Act {
  id: UUID;
  novel_id: UUID;
  title: string;
  act_number: number;
  order_index: number;
  summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: UUID;
  novel_id: UUID;
  act_id?: UUID | null;
  chapter_number: number;
  order_index: number;
  title: string;
  summary?: string | null;
  status: "draft" | "in_review" | "completed";
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: UUID;
  novel_id: UUID;
  chapter_id: UUID;
  order_index: number;
  title: string;
  slug?: string | null;
  pov_character_id?: UUID | null;
  location_id?: UUID | null;
  timeline_order: number;
  content_json?: Record<string, unknown> | null;
  content_text?: string | null;
  word_count: number;
  status: "draft" | "review" | "final";
  created_at: string;
  updated_at: string;
}

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
