import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type {
  CreatePlotThreadInput,
  PlotThread,
  PlotThreadStatus,
  UpdatePlotThreadInput,
} from "@/types";

// In-memory store for local dev mode (no Supabase credentials).
// Keyed by novelId, mirroring sibling repositories (Phase 8 pattern).
export const localDevPlotThreadsStore: Map<string, PlotThread[]> = new Map();

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const now = () => new Date().toISOString();

async function ownsNovel(novelId: string, userId: string): Promise<boolean> {
  return Boolean(await NovelRepository.findById(novelId, userId));
}

export class PlotThreadRepository {
  static async listByNovel(
    novelId: string,
    userId: string,
    filters: { status?: PlotThreadStatus | "all" } = {}
  ): Promise<PlotThread[]> {
    if (!(await ownsNovel(novelId, userId))) return [];
    const { status } = filters;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      let query = supabase
        .from("plot_threads")
        .select("*")
        .eq("novel_id", novelId)
        .order("importance", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(200);
      if (status && status !== "all") query = query.eq("status", status);
      const { data } = await query;
      return (data ?? []) as PlotThread[];
    }
    let rows = [...(localDevPlotThreadsStore.get(novelId) || [])].sort(
      (a, b) => b.importance - a.importance || a.created_at.localeCompare(b.created_at)
    );
    if (status && status !== "all") rows = rows.filter((r) => r.status === status);
    return rows.slice(0, 200);
  }

  static async findById(id: string, novelId: string, userId: string): Promise<PlotThread | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("plot_threads")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();
      return (data ?? null) as PlotThread | null;
    }
    return (localDevPlotThreadsStore.get(novelId) || []).find((t) => t.id === id) || null;
  }

  static async create(
    novelId: string,
    userId: string,
    input: CreatePlotThreadInput
  ): Promise<PlotThread | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("plot_threads")
        .insert({
          novel_id: novelId,
          title: input.title,
          description: input.description ?? null,
          status: input.status || "planned",
          importance: input.importance ?? 3,
          introduced_chapter_id: input.introduced_chapter_id ?? null,
          resolved_chapter_id: input.resolved_chapter_id ?? null,
        })
        .select()
        .single();
      if (error || !data) return null;
      return data as PlotThread;
    }
    const thread: PlotThread = {
      id: uid("plt"),
      novel_id: novelId,
      title: input.title,
      description: input.description ?? null,
      status: input.status || "planned",
      importance: input.importance ?? 3,
      introduced_chapter_id: input.introduced_chapter_id ?? null,
      resolved_chapter_id: input.resolved_chapter_id ?? null,
      created_at: now(),
      updated_at: now(),
    };
    localDevPlotThreadsStore.set(novelId, [thread, ...(localDevPlotThreadsStore.get(novelId) || [])]);
    return thread;
  }

  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdatePlotThreadInput
  ): Promise<PlotThread | null> {
    const existing = await this.findById(id, novelId, userId);
    if (!existing) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.description !== undefined) patch.description = input.description;
      if (input.status !== undefined) patch.status = input.status;
      if (input.importance !== undefined) patch.importance = input.importance;
      if (input.introduced_chapter_id !== undefined)
        patch.introduced_chapter_id = input.introduced_chapter_id;
      if (input.resolved_chapter_id !== undefined)
        patch.resolved_chapter_id = input.resolved_chapter_id;
      const { data, error } = await supabase
        .from("plot_threads")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      return data as PlotThread;
    }
    const rows = localDevPlotThreadsStore.get(novelId) || [];
    const idx = rows.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated: PlotThread = {
      ...rows[idx],
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.importance !== undefined ? { importance: input.importance } : {}),
      ...(input.introduced_chapter_id !== undefined
        ? { introduced_chapter_id: input.introduced_chapter_id }
        : {}),
      ...(input.resolved_chapter_id !== undefined
        ? { resolved_chapter_id: input.resolved_chapter_id }
        : {}),
      updated_at: now(),
    };
    rows[idx] = updated;
    localDevPlotThreadsStore.set(novelId, rows);
    return updated;
  }

  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, novelId, userId);
    if (!existing) return false;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.from("plot_threads").delete().eq("id", id);
      return !error;
    }
    localDevPlotThreadsStore.set(
      novelId,
      (localDevPlotThreadsStore.get(novelId) || []).filter((t) => t.id !== id)
    );
    return true;
  }

  static async countByStatus(
    novelId: string,
    userId: string
  ): Promise<Record<PlotThreadStatus, number>> {
    const rows = await this.listByNovel(novelId, userId);
    const counts: Record<PlotThreadStatus, number> = {
      planned: 0,
      active: 0,
      resolved: 0,
      abandoned: 0,
    };
    for (const r of rows) counts[r.status] += 1;
    return counts;
  }
}
