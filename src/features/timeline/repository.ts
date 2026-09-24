import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type {
  CreateTimelineEventInput,
  TimelineEvent,
  UpdateTimelineEventInput,
} from "@/types";

// In-memory store for local dev mode (no Supabase credentials).
// Keyed by novelId, mirroring sibling repositories (Phase 8 pattern).
export const localDevTimelineStore: Map<string, TimelineEvent[]> = new Map();

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const now = () => new Date().toISOString();

async function ownsNovel(novelId: string, userId: string): Promise<boolean> {
  return Boolean(await NovelRepository.findById(novelId, userId));
}

export class TimelineEventRepository {
  static async listByNovel(novelId: string, userId: string): Promise<TimelineEvent[]> {
    if (!(await ownsNovel(novelId, userId))) return [];
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("novel_id", novelId)
        .order("created_at", { ascending: true })
        .limit(500);
      return (data ?? []) as TimelineEvent[];
    }
    return [...(localDevTimelineStore.get(novelId) || [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, 500);
  }

  static async findById(id: string, novelId: string, userId: string): Promise<TimelineEvent | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();
      return (data ?? null) as TimelineEvent | null;
    }
    return (localDevTimelineStore.get(novelId) || []).find((e) => e.id === id) || null;
  }

  static async create(
    novelId: string,
    userId: string,
    input: CreateTimelineEventInput
  ): Promise<TimelineEvent | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("timeline_events")
        .insert({
          novel_id: novelId,
          title: input.title,
          description: input.description ?? null,
          date_value: input.date_value ?? null,
          date_precision: input.date_precision || "unknown",
          relative_time: input.relative_time ?? null,
          chapter_id: input.chapter_id ?? null,
          location_id: input.location_id ?? null,
        })
        .select()
        .single();
      if (error || !data) return null;
      return data as TimelineEvent;
    }
    const event: TimelineEvent = {
      id: uid("tml"),
      novel_id: novelId,
      title: input.title,
      description: input.description ?? null,
      date_value: input.date_value ?? null,
      date_precision: input.date_precision || "unknown",
      relative_time: input.relative_time ?? null,
      chapter_id: input.chapter_id ?? null,
      location_id: input.location_id ?? null,
      created_at: now(),
      updated_at: now(),
    };
    localDevTimelineStore.set(novelId, [...(localDevTimelineStore.get(novelId) || []), event]);
    return event;
  }

  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateTimelineEventInput
  ): Promise<TimelineEvent | null> {
    const existing = await this.findById(id, novelId, userId);
    if (!existing) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.description !== undefined) patch.description = input.description;
      if (input.date_value !== undefined) patch.date_value = input.date_value;
      if (input.date_precision !== undefined) patch.date_precision = input.date_precision;
      if (input.relative_time !== undefined) patch.relative_time = input.relative_time;
      if (input.chapter_id !== undefined) patch.chapter_id = input.chapter_id;
      if (input.location_id !== undefined) patch.location_id = input.location_id;
      const { data, error } = await supabase
        .from("timeline_events")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      return data as TimelineEvent;
    }
    const rows = localDevTimelineStore.get(novelId) || [];
    const idx = rows.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const updated: TimelineEvent = {
      ...rows[idx],
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.date_value !== undefined ? { date_value: input.date_value } : {}),
      ...(input.date_precision !== undefined ? { date_precision: input.date_precision } : {}),
      ...(input.relative_time !== undefined ? { relative_time: input.relative_time } : {}),
      ...(input.chapter_id !== undefined ? { chapter_id: input.chapter_id } : {}),
      ...(input.location_id !== undefined ? { location_id: input.location_id } : {}),
      updated_at: now(),
    };
    rows[idx] = updated;
    localDevTimelineStore.set(novelId, rows);
    return updated;
  }

  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, novelId, userId);
    if (!existing) return false;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.from("timeline_events").delete().eq("id", id);
      return !error;
    }
    localDevTimelineStore.set(
      novelId,
      (localDevTimelineStore.get(novelId) || []).filter((e) => e.id !== id)
    );
    return true;
  }
}
