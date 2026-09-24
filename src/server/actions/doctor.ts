"use server";

import { requireAuth } from "@/server/auth/guards";
import { StoryDoctorService } from "@/features/doctor/service";
import {
  runStoryDoctorSchema,
  type StoryDoctorReport,
  type StoryDoctorSection,
} from "@/types";

export interface StoryDoctorActionResult {
  success?: boolean;
  error?: string;
  report?: StoryDoctorReport;
}

const sectionList: StoryDoctorSection[] = [
  "plot",
  "character_arcs",
  "pacing",
  "plot_threads",
  "worldbuilding",
  "unresolved_questions",
];

/**
 * Run Story Doctor diagnosis (Phase 9, Task 9.3).
 * Read-only: aggregates deterministic observations with evidence.
 * Never scores, never writes to the manuscript.
 */
export async function runStoryDoctorAction(
  novelId: string,
  rawInput: unknown
): Promise<StoryDoctorActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };

    const parsed = runStoryDoctorSchema.safeParse(rawInput || {});
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Parameter diagnosis tidak valid." };
    }

    const sections = parsed.data.sections?.filter((s) => sectionList.includes(s));
    const res = await StoryDoctorService.runDiagnosis({
      novelId,
      userId: user.id,
      sections: sections?.length ? sections : undefined,
      withAI: parsed.data.withAI,
    });

    if (!res.success) return { error: res.error || "Diagnosis Story Doctor gagal." };
    return { success: true, report: res.report };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Diagnosis Story Doctor gagal.";
    return { error: message };
  }
}
