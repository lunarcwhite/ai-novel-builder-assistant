"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { PlotThreadService } from "@/features/plot/service";
import { TimelineService } from "@/features/timeline/service";
import type { PlotThreadStatus } from "@/types";

export type PlotActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

// ==========================================
// PLOT THREAD ACTIONS (Task 9.1)
// ==========================================

export async function createPlotThreadAction(
  prevState: PlotActionResult | null,
  formData: FormData
): Promise<PlotActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      title: (formData.get("title") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      status: (formData.get("status") as PlotThreadStatus) || "planned",
      importance: Number(formData.get("importance") || 3),
      introduced_chapter_id: (formData.get("introduced_chapter_id") as string) || null,
      resolved_chapter_id: (formData.get("resolved_chapter_id") as string) || null,
    };

    const res = await PlotThreadService.createThread(novelId, user.id, rawData);
    if (!res.success) return { error: res.error || "Gagal membuat plot thread." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: res.thread?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat plot thread.";
    return { error: message };
  }
}

export async function updatePlotThreadAction(
  prevState: PlotActionResult | null,
  formData: FormData
): Promise<PlotActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const threadId = formData.get("id") as string;
    if (!novelId || !threadId) return { error: "ID plot thread atau novel tidak valid." };

    const rawData: Record<string, unknown> = {};
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const status = formData.get("status") as string | null;
    const importance = formData.get("importance") as string | null;
    const intro = formData.get("introduced_chapter_id") as string | null;
    const resolved = formData.get("resolved_chapter_id") as string | null;
    if (title !== null) rawData.title = title.trim();
    if (description !== null) rawData.description = description.trim() || null;
    if (status) rawData.status = status;
    if (importance !== null && importance !== "") rawData.importance = Number(importance);
    if (intro !== null) rawData.introduced_chapter_id = intro || null;
    if (resolved !== null) rawData.resolved_chapter_id = resolved || null;

    const res = await PlotThreadService.updateThread(threadId, novelId, user.id, rawData);
    if (!res.success) return { error: res.error || "Gagal memperbarui plot thread." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: threadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui plot thread.";
    return { error: message };
  }
}

export async function updatePlotThreadStatusAction(formData: FormData): Promise<PlotActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const threadId = formData.get("id") as string;
    const status = formData.get("status") as PlotThreadStatus;
    if (!novelId || !threadId || !status) {
      return { error: "Parameter status plot thread tidak lengkap." };
    }

    const res = await PlotThreadService.updateThread(threadId, novelId, user.id, { status });
    if (!res.success) return { error: res.error || "Gagal memperbarui status plot thread." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: threadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status.";
    return { error: message };
  }
}

export async function deletePlotThreadAction(
  prevState: PlotActionResult | null,
  formData: FormData
): Promise<PlotActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const threadId = formData.get("id") as string;
    if (!novelId || !threadId) return { error: "ID plot thread tidak valid." };

    const res = await PlotThreadService.deleteThread(threadId, novelId, user.id);
    if (!res.success) return { error: res.error || "Gagal menghapus plot thread." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: threadId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus plot thread.";
    return { error: message };
  }
}

// ==========================================
// TIMELINE ACTIONS (Task 9.2)
// ==========================================

export type TimelineActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

export async function createTimelineEventAction(
  prevState: TimelineActionResult | null,
  formData: FormData
): Promise<TimelineActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      title: (formData.get("title") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      date_value: (formData.get("date_value") as string)?.trim() || null,
      date_precision: (formData.get("date_precision") as string) || "unknown",
      relative_time: (formData.get("relative_time") as string)?.trim() || null,
      chapter_id: (formData.get("chapter_id") as string) || null,
      location_id: (formData.get("location_id") as string) || null,
    };

    const res = await TimelineService.createEvent(novelId, user.id, rawData);
    if (!res.success) return { error: res.error || "Gagal membuat peristiwa timeline." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: res.event?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat peristiwa.";
    return { error: message };
  }
}

export async function updateTimelineEventAction(
  prevState: TimelineActionResult | null,
  formData: FormData
): Promise<TimelineActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const eventId = formData.get("id") as string;
    if (!novelId || !eventId) return { error: "ID peristiwa atau novel tidak valid." };

    const rawData: Record<string, unknown> = {};
    const get = (k: string) => formData.get(k) as string | null;
    const title = get("title");
    const description = get("description");
    const dateValue = get("date_value");
    const precision = get("date_precision");
    const relative = get("relative_time");
    const chapter = get("chapter_id");
    const location = get("location_id");
    if (title !== null) rawData.title = title.trim();
    if (description !== null) rawData.description = description.trim() || null;
    if (dateValue !== null) rawData.date_value = dateValue.trim() || null;
    if (precision) rawData.date_precision = precision;
    if (relative !== null) rawData.relative_time = relative.trim() || null;
    if (chapter !== null) rawData.chapter_id = chapter || null;
    if (location !== null) rawData.location_id = location || null;

    const res = await TimelineService.updateEvent(eventId, novelId, user.id, rawData);
    if (!res.success) return { error: res.error || "Gagal memperbarui peristiwa timeline." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui peristiwa.";
    return { error: message };
  }
}

export async function deleteTimelineEventAction(
  prevState: TimelineActionResult | null,
  formData: FormData
): Promise<TimelineActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const eventId = formData.get("id") as string;
    if (!novelId || !eventId) return { error: "ID peristiwa tidak valid." };

    const res = await TimelineService.deleteEvent(eventId, novelId, user.id);
    if (!res.success) return { error: res.error || "Gagal menghapus peristiwa timeline." };

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/plot`);
    return { success: true, id: eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus peristiwa.";
    return { error: message };
  }
}
