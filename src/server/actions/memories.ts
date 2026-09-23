"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { MemoryService } from "@/features/memories/service";
import type {
  MemoryStatus,
  MemoryType,
  MemorySearchResult,
  MemoryDeduplicationCheckResult,
} from "@/types";

export type MemoryActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
  duplicateWarning?: string;
};

// ==========================================
// MEMORY CRUD ACTIONS
// ==========================================

export async function createMemoryAction(
  prevState: MemoryActionResult | null,
  formData: FormData
): Promise<MemoryActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const characterIdsRaw = formData.getAll("character_ids") as string[];
    const locationIdsRaw = formData.getAll("location_ids") as string[];
    const tagsRaw = (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || [];

    const rawData = {
      type: formData.get("type") as MemoryType,
      content: (formData.get("content") as string)?.trim(),
      importance: Number(formData.get("importance") || 3),
      status: (formData.get("status") as MemoryStatus) || "confirmed",
      source_type: formData.get("source_type") as string || "manual",
      source_id: (formData.get("source_id") as string) || null,
      character_ids: characterIdsRaw.filter(Boolean),
      location_ids: locationIdsRaw.filter(Boolean),
      tags: tagsRaw,
    };

    const res = await MemoryService.createMemory(novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal menyimpan memori cerita." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/memories`);
    return {
      success: true,
      id: res.memory?.id,
      duplicateWarning: res.duplicateWarning,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan memori.";
    return { error: message };
  }
}

export async function updateMemoryAction(
  prevState: MemoryActionResult | null,
  formData: FormData
): Promise<MemoryActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const memoryId = formData.get("id") as string;
    if (!novelId || !memoryId) return { error: "ID novel atau memori tidak valid." };

    const characterIdsRaw = formData.getAll("character_ids") as string[];
    const locationIdsRaw = formData.getAll("location_ids") as string[];
    const tagsRaw = (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || [];

    const rawData = {
      type: formData.get("type") as MemoryType,
      content: (formData.get("content") as string)?.trim(),
      importance: Number(formData.get("importance") || 3),
      status: formData.get("status") as MemoryStatus,
      source_type: formData.get("source_type") as string,
      source_id: (formData.get("source_id") as string) || null,
      character_ids: characterIdsRaw.filter(Boolean),
      location_ids: locationIdsRaw.filter(Boolean),
      tags: tagsRaw,
    };

    const res = await MemoryService.updateMemory(memoryId, novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui memori cerita." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/memories`);
    return { success: true, id: memoryId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui memori.";
    return { error: message };
  }
}

export async function updateMemoryStatusAction(formData: FormData): Promise<MemoryActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const memoryId = formData.get("id") as string;
    const status = formData.get("status") as MemoryStatus;

    if (!novelId || !memoryId || !status) {
      return { error: "Parameter status memori tidak lengkap." };
    }

    const res = await MemoryService.updateStatus(memoryId, novelId, user.id, status);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui status memori." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/memories`);
    return { success: true, id: memoryId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah status.";
    return { error: message };
  }
}

export async function deleteMemoryAction(
  prevState: MemoryActionResult | null,
  formData: FormData
): Promise<MemoryActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const memoryId = formData.get("id") as string;

    if (!novelId || !memoryId) return { error: "ID novel atau memori tidak valid." };

    const res = await MemoryService.deleteMemory(memoryId, novelId, user.id);
    if (!res.success) {
      return { error: res.error || "Gagal menghapus memori cerita." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/memories`);
    return { success: true, id: memoryId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus memori.";
    return { error: message };
  }
}

// ==========================================
// SEARCH & RETRIEVAL ACTIONS
// ==========================================

export async function searchMemoriesAction(
  novelId: string,
  query: string,
  filters: {
    types?: MemoryType[];
    statuses?: MemoryStatus[];
    threshold?: number;
    limit?: number;
  } = {}
): Promise<MemorySearchResult[]> {
  try {
    const user = await requireAuth();
    return await MemoryService.searchSimilarMemories(novelId, user.id, query, filters);
  } catch {
    return [];
  }
}

export async function checkDuplicateMemoryAction(
  novelId: string,
  content: string
): Promise<MemoryDeduplicationCheckResult> {
  try {
    const user = await requireAuth();
    return await MemoryService.checkDuplicateCandidate(novelId, user.id, content);
  } catch {
    return { isDuplicate: false, score: 0 };
  }
}

export async function quickAddSceneMemoryAction(
  prevState: MemoryActionResult | null,
  formData: FormData
): Promise<MemoryActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const sceneId = formData.get("scene_id") as string;
    const content = (formData.get("content") as string)?.trim();
    const type = (formData.get("type") as MemoryType) || "story_fact";
    const importance = Number(formData.get("importance") || 3);

    if (!novelId || !content) {
      return { error: "Konten fakta cerita wajib diisi." };
    }

    const res = await MemoryService.createMemory(novelId, user.id, {
      type,
      content,
      importance,
      status: "confirmed",
      source_type: sceneId ? "scene" : "manual",
      source_id: sceneId || null,
    });

    if (!res.success) {
      return { error: res.error || "Gagal menyimpan fakta cerita." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/write/${sceneId}`);
    return { success: true, id: res.memory?.id, duplicateWarning: res.duplicateWarning };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mencatat fakta.";
    return { error: message };
  }
}
