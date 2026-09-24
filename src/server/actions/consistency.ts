"use server";

import { requireAuth } from "@/server/auth/guards";
import { ConsistencyService } from "@/features/consistency/service";
import {
  runConsistencyCheckSchema,
  updateConsistencyFindingSchema,
  type ConsistencyFinding,
} from "@/types";

export interface ConsistencyActionResult {
  success?: boolean;
  error?: string;
  findings?: ConsistencyFinding[];
  created?: number;
  checkedScenes?: number;
  aiValidated?: boolean;
  finding?: ConsistencyFinding;
}

const statusList = ["open", "reviewed", "dismissed", "resolved"] as const;
const typeList = ["character_contradiction", "timeline_inconsistency", "lore_conflict", "plot_hole"] as const;

/**
 * Run a consistency check (Phase 8).
 * Read-only against the manuscript: the checker produces findings with
 * evidence (source A / source B); it never writes to scenes.
 */
export async function runConsistencyCheckAction(
  novelId: string,
  rawInput: unknown
): Promise<ConsistencyActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };

    const parsed = runConsistencyCheckSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Cakupan pemeriksaan tidak valid." };
    }

    const res = await ConsistencyService.runCheck({
      novelId,
      userId: user.id,
      scope: parsed.data.scope,
      sceneId: parsed.data.sceneId,
      chapterId: parsed.data.chapterId,
    });

    if (!res.success) return { error: res.error || "Pemeriksaan konsistensi gagal." };
    return {
      success: true,
      findings: res.findings,
      created: res.created,
      checkedScenes: res.checkedScenes,
      aiValidated: res.aiValidated,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Pemeriksaan konsistensi gagal.";
    return { error: message };
  }
}

/**
 * List findings for a novel, optionally filtered by status/type.
 */
export async function listConsistencyFindingsAction(
  novelId: string,
  filters: { status?: string; type?: string } = {}
): Promise<ConsistencyActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };

    const status =
      filters.status === "all" || !filters.status
        ? "all"
        : statusList.includes(filters.status as (typeof statusList)[number])
          ? (filters.status as "open" | "reviewed" | "dismissed" | "resolved")
          : "all";
    const type =
      filters.type === "all" || !filters.type
        ? "all"
        : typeList.includes(filters.type as (typeof typeList)[number])
          ? (filters.type as ConsistencyFinding["type"])
          : "all";

    const findings = await ConsistencyService.listFindings(novelId, user.id, { status, type });
    return { success: true, findings };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat temuan konsistensi.";
    return { error: message };
  }
}

/**
 * Review workflow (Task 8.7): Review / Dismiss / Resolve.
 * The author decides; the system never auto-resolves story content.
 */
export async function reviewConsistencyFindingAction(
  novelId: string,
  findingId: string,
  rawInput: unknown
): Promise<ConsistencyActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId || !findingId) return { error: "ID novel atau temuan tidak valid." };

    const parsed = updateConsistencyFindingSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Status temuan tidak valid." };
    }

    const res = await ConsistencyService.review(findingId, novelId, user.id, parsed.data.status);
    if (!res.success) return { error: res.error || "Gagal memperbarui temuan." };
    return { success: true, finding: res.finding };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui temuan.";
    return { error: message };
  }
}

/**
 * Delete a finding (housekeeping; never touches the manuscript).
 */
export async function deleteConsistencyFindingAction(
  novelId: string,
  findingId: string
): Promise<ConsistencyActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId || !findingId) return { error: "ID novel atau temuan tidak valid." };

    const res = await ConsistencyService.remove(findingId, novelId, user.id);
    if (!res.success) return { error: res.error || "Gagal menghapus temuan." };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus temuan.";
    return { error: message };
  }
}
