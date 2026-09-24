"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { SummaryService } from "@/features/summaries/service";
import type { SummaryHierarchy, SummaryLevel } from "@/types";

export interface SummaryHierarchyResult {
  success?: boolean;
  error?: string;
  hierarchy?: SummaryHierarchy;
}

export interface SynthesizeSummaryResult {
  success?: boolean;
  error?: string;
  level?: SummaryLevel;
  id?: string;
  title?: string;
  candidate?: string;
  deterministic?: string;
  aiEnriched?: boolean;
}

export interface ApplySummaryResult {
  success?: boolean;
  error?: string;
}

/**
 * Load the full summary hierarchy (Phase 9, Task 9.4).
 * Read-only: assembles layered context from data the author owns.
 */
export async function getSummaryHierarchyAction(
  novelId: string
): Promise<SummaryHierarchyResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };
    const res = await SummaryService.getHierarchy(novelId, user.id);
    if (!res.success) return { error: res.error || "Gagal memuat ringkasan." };
    return { success: true, hierarchy: res.hierarchy };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat ringkasan.";
    return { error: message };
  }
}

/**
 * Synthesize a summary candidate for one level.
 * Returns a proposal only — never writes anything.
 */
export async function synthesizeSummaryAction(
  novelId: string,
  rawInput: unknown
): Promise<SynthesizeSummaryResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };
    const res = await SummaryService.synthesize(novelId, user.id, rawInput);
    if (!res.success) return { error: res.error || "Sintesis ringkasan gagal." };
    return {
      success: true,
      level: res.level,
      id: res.id,
      title: res.title,
      candidate: res.candidate,
      deterministic: res.deterministic,
      aiEnriched: res.aiEnriched,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sintesis ringkasan gagal.";
    return { error: message };
  }
}

/**
 * Apply an author-approved summary (SOUL.md #6: explicit author action).
 * Writes only to summary/description columns — never to manuscript content.
 */
export async function applySummaryAction(
  novelId: string,
  rawInput: unknown
): Promise<ApplySummaryResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };
    const res = await SummaryService.apply(novelId, user.id, rawInput);
    if (!res.success) return { error: res.error || "Gagal menyimpan ringkasan." };
    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/summaries`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan ringkasan.";
    return { error: message };
  }
}
