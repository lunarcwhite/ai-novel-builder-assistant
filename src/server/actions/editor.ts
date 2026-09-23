"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { SceneService } from "@/features/scenes/service";
import type { SceneVersion } from "@/types";

export type SaveActionResult = {
  success?: boolean;
  error?: string;
  wordCount?: number;
  updatedAt?: string;
};

export type VersionActionResult = {
  success?: boolean;
  error?: string;
  version?: SceneVersion;
  versions?: SceneVersion[];
  restoredContent?: string | null;
};

/**
 * Debounced autosave server action for scene manuscript text.
 */
export async function saveSceneContentAction(
  novelId: string,
  sceneId: string,
  content: string
): Promise<SaveActionResult> {
  try {
    const user = await requireAuth();

    if (!novelId || !sceneId) {
      return { error: "ID novel atau adegan tidak valid." };
    }

    const updated = await SceneService.updateSceneContent(sceneId, novelId, user.id, content);
    if (!updated) {
      return { error: "Adegan tidak ditemukan atau akses ditolak." };
    }

    revalidatePath(`/workspace/${novelId}`);
    return {
      success: true,
      wordCount: updated.word_count,
      updatedAt: updated.updated_at,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan naskah adegan.";
    return { error: message };
  }
}

/**
 * Creates an explicit version snapshot with optional title/notes.
 */
export async function createSceneVersionAction(
  novelId: string,
  sceneId: string,
  title?: string,
  notes?: string
): Promise<VersionActionResult> {
  try {
    const user = await requireAuth();

    if (!novelId || !sceneId) {
      return { error: "ID novel atau adegan tidak valid." };
    }

    const scene = await SceneService.getScene(sceneId, novelId, user.id);
    if (!scene) {
      return { error: "Adegan tidak ditemukan." };
    }

    const version = await SceneService.createSceneVersion(sceneId, novelId, user.id, {
      content: scene.content || "",
      title: title || undefined,
      notes: notes || undefined,
      change_type: "manual",
    });

    revalidatePath(`/workspace/${novelId}/write/${sceneId}`);
    return { success: true, version };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat versi snapshot.";
    return { error: message };
  }
}

/**
 * Retrieves all versions for a scene.
 */
export async function getSceneVersionsAction(
  novelId: string,
  sceneId: string
): Promise<VersionActionResult> {
  try {
    const user = await requireAuth();

    if (!novelId || !sceneId) {
      return { error: "ID novel atau adegan tidak valid." };
    }

    const versions = await SceneService.getSceneVersions(sceneId, novelId, user.id);
    return { success: true, versions };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil riwayat versi.";
    return { error: message };
  }
}

/**
 * Safely restores a prior version. Current text is automatically checkpointed.
 */
export async function restoreSceneVersionAction(
  novelId: string,
  sceneId: string,
  versionId: string
): Promise<VersionActionResult> {
  try {
    const user = await requireAuth();

    if (!novelId || !sceneId || !versionId) {
      return { error: "Parameter pemulihan versi tidak lengkap." };
    }

    const result = await SceneService.restoreSceneVersion(sceneId, novelId, user.id, versionId);

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/write/${sceneId}`);

    return {
      success: true,
      restoredContent: result.scene.content,
      version: result.restoredVersion,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memulihkan versi.";
    return { error: message };
  }
}
