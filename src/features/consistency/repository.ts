import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type {
  ConsistencyFinding,
  ConsistencyFindingType,
  ConsistencySeverity,
  ConsistencySourceRef,
  ConsistencyRelatedEntity,
  ConsistencyStatus,
} from "@/types";

// In-memory store for local dev mode (no Supabase credentials).
// Keyed by novelId, mirroring sibling repositories (Phase 7 pattern).
export const localDevFindingsStore: Map<string, ConsistencyFinding[]> = new Map();

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const now = () => new Date().toISOString();

async function ownsNovel(novelId: string, userId: string): Promise<boolean> {
  return Boolean(await NovelRepository.findById(novelId, userId));
}

export interface ConsistencyFindingDraft {
  type: ConsistencyFindingType;
  severity?: ConsistencySeverity;
  description: string;
  source_ids?: ConsistencySourceRef[];
  related_entity_ids?: ConsistencyRelatedEntity[];
  metadata?: ConsistencyFinding["metadata"];
}

export class ConsistencyFindingRepository {
  static async listByNovel(
    novelId: string,
    userId: string,
    filters: { status?: ConsistencyStatus | "all"; type?: ConsistencyFindingType | "all" } = {}
  ): Promise<ConsistencyFinding[]> {
    if (!(await ownsNovel(novelId, userId))) return [];
    const { status, type } = filters;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      let query = supabase
        .from("consistency_findings")
        .select("*")
        .eq("novel_id", novelId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (status && status !== "all") query = query.eq("status", status);
      if (type && type !== "all") query = query.eq("type", type);
      const { data } = await query;
      return (data ?? []) as ConsistencyFinding[];
    }
    let rows = [...(localDevFindingsStore.get(novelId) || [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    if (status && status !== "all") rows = rows.filter((r) => r.status === status);
    if (type && type !== "all") rows = rows.filter((r) => r.type === type);
    return rows.slice(0, 100);
  }

  static async findById(id: string, novelId: string, userId: string): Promise<ConsistencyFinding | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("consistency_findings")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();
      return (data ?? null) as ConsistencyFinding | null;
    }
    return (localDevFindingsStore.get(novelId) || []).find((f) => f.id === id) || null;
  }

  /** Dedupe guard: an open/reviewed finding with the same fact_key means "already reported". */
  static async findOpenByFactKey(
    novelId: string,
    userId: string,
    factKey: string
  ): Promise<ConsistencyFinding | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("consistency_findings")
        .select("*")
        .eq("novel_id", novelId)
        .in("status", ["open", "reviewed"])
        .contains("metadata", { fact_key: factKey })
        .limit(1);
      const row = (data ?? [])[0] as ConsistencyFinding | undefined;
      return row || null;
    }
    return (
      (localDevFindingsStore.get(novelId) || []).find(
        (f) => (f.status === "open" || f.status === "reviewed") && f.metadata?.fact_key === factKey
      ) || null
    );
  }

  static async create(
    novelId: string,
    userId: string,
    draft: ConsistencyFindingDraft
  ): Promise<ConsistencyFinding | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("consistency_findings")
        .insert({
          novel_id: novelId,
          type: draft.type,
          severity: draft.severity || "potential",
          description: draft.description,
          source_ids: draft.source_ids || [],
          related_entity_ids: draft.related_entity_ids || [],
          metadata: draft.metadata || {},
        })
        .select()
        .single();
      if (error || !data) return null;
      return data as ConsistencyFinding;
    }
    const finding: ConsistencyFinding = {
      id: uid("con"),
      novel_id: novelId,
      type: draft.type,
      severity: draft.severity || "potential",
      description: draft.description,
      status: "open",
      source_ids: draft.source_ids || [],
      related_entity_ids: draft.related_entity_ids || [],
      metadata: draft.metadata || {},
      created_at: now(),
      updated_at: now(),
    };
    localDevFindingsStore.set(novelId, [finding, ...(localDevFindingsStore.get(novelId) || [])]);
    return finding;
  }

  static async updateStatus(
    id: string,
    novelId: string,
    userId: string,
    status: Exclude<ConsistencyStatus, "open">
  ): Promise<ConsistencyFinding | null> {
    const existing = await this.findById(id, novelId, userId);
    if (!existing) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("consistency_findings")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      return data as ConsistencyFinding;
    }
    existing.status = status;
    existing.updated_at = now();
    return existing;
  }

  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, novelId, userId);
    if (!existing) return false;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.from("consistency_findings").delete().eq("id", id);
      return !error;
    }
    localDevFindingsStore.set(
      novelId,
      (localDevFindingsStore.get(novelId) || []).filter((f) => f.id !== id)
    );
    return true;
  }

  static async countOpen(novelId: string, userId: string): Promise<number> {
    if (!(await ownsNovel(novelId, userId))) return 0;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { count } = await supabase
        .from("consistency_findings")
        .select("id", { count: "exact", head: true })
        .eq("novel_id", novelId)
        .eq("status", "open");
      return count || 0;
    }
    return (localDevFindingsStore.get(novelId) || []).filter((f) => f.status === "open").length;
  }
}
