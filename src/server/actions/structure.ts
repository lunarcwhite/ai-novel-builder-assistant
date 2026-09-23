"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import type { ChapterStatus, SceneStatus } from "@/types";

export type StructureActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

// ==========================================
// ACT ACTIONS
// ==========================================

export async function createActAction(
  prevState: StructureActionResult | null,
  formData: FormData
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || undefined;

    if (!novelId) {
      return { error: "ID novel tidak ditemukan." };
    }
    if (!title) {
      return { error: "Judul babak (act) wajib diisi." };
    }

    const created = await ActService.createAct({ title, description }, novelId, user.id);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true, id: created.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat babak.";
    return { error: message };
  }
}

export async function updateActAction(
  prevState: StructureActionResult | null,
  formData: FormData
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const actId = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || undefined;

    if (!novelId || !actId) {
      return { error: "ID babak atau novel tidak valid." };
    }
    if (!title) {
      return { error: "Judul babak wajib diisi." };
    }

    await ActService.updateAct(actId, novelId, user.id, { title, description });
    revalidatePath(`/workspace/${novelId}`);
    return { success: true, id: actId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui babak.";
    return { error: message };
  }
}

export async function deleteActAction(novelId: string, actId: string): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    await ActService.deleteAct(actId, novelId, user.id);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus babak.";
    return { error: message };
  }
}

export async function reorderActsAction(
  novelId: string,
  orderedIds: string[]
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    await ActService.reorderActs(novelId, user.id, orderedIds);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menata ulang babak.";
    return { error: message };
  }
}

// ==========================================
// CHAPTER ACTIONS
// ==========================================

export async function createChapterAction(
  prevState: StructureActionResult | null,
  formData: FormData
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const title = (formData.get("title") as string)?.trim();
    const act_id = (formData.get("act_id") as string)?.trim() || undefined;
    const summary = (formData.get("summary") as string)?.trim() || undefined;
    const objective = (formData.get("objective") as string)?.trim() || undefined;
    const conflict = (formData.get("conflict") as string)?.trim() || undefined;
    const emotional_beat = (formData.get("emotional_beat") as string)?.trim() || undefined;
    const outcome = (formData.get("outcome") as string)?.trim() || undefined;
    const status = (formData.get("status") as ChapterStatus) || "planned";

    if (!novelId) {
      return { error: "ID novel tidak ditemukan." };
    }
    if (!title) {
      return { error: "Judul bab wajib diisi." };
    }

    const created = await ChapterService.createChapter(
      {
        title,
        act_id,
        summary,
        objective,
        conflict,
        emotional_beat,
        outcome,
        status,
      },
      novelId,
      user.id
    );

    revalidatePath(`/workspace/${novelId}`);
    return { success: true, id: created.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat bab.";
    return { error: message };
  }
}

export async function updateChapterAction(
  prevState: StructureActionResult | null,
  formData: FormData
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const chapterId = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim();
    const act_id = (formData.get("act_id") as string)?.trim() || null;
    const summary = (formData.get("summary") as string)?.trim() || undefined;
    const objective = (formData.get("objective") as string)?.trim() || undefined;
    const conflict = (formData.get("conflict") as string)?.trim() || undefined;
    const emotional_beat = (formData.get("emotional_beat") as string)?.trim() || undefined;
    const outcome = (formData.get("outcome") as string)?.trim() || undefined;
    const status = (formData.get("status") as ChapterStatus) || undefined;

    if (!novelId || !chapterId) {
      return { error: "ID bab atau novel tidak valid." };
    }
    if (!title) {
      return { error: "Judul bab wajib diisi." };
    }

    await ChapterService.updateChapter(chapterId, novelId, user.id, {
      title,
      act_id,
      summary,
      objective,
      conflict,
      emotional_beat,
      outcome,
      status,
    });

    revalidatePath(`/workspace/${novelId}`);
    return { success: true, id: chapterId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui bab.";
    return { error: message };
  }
}

export async function deleteChapterAction(
  novelId: string,
  chapterId: string
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    await ChapterService.deleteChapter(chapterId, novelId, user.id);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus bab.";
    return { error: message };
  }
}

export async function reorderChaptersAction(
  novelId: string,
  orderedIds: string[],
  actId?: string | null
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    await ChapterService.reorderChapters(novelId, user.id, orderedIds, actId);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menata ulang bab.";
    return { error: message };
  }
}

// ==========================================
// SCENE ACTIONS
// ==========================================

export async function createSceneAction(
  prevState: StructureActionResult | null,
  formData: FormData
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const title = (formData.get("title") as string)?.trim();
    const chapter_id = (formData.get("chapter_id") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() || undefined;
    const purpose = (formData.get("purpose") as string)?.trim() || undefined;
    const status = (formData.get("status") as SceneStatus) || "planned";

    if (!novelId) {
      return { error: "ID novel tidak ditemukan." };
    }
    if (!title) {
      return { error: "Judul adegan wajib diisi." };
    }
    if (!chapter_id) {
      return { error: "Bab untuk adegan ini wajib dipilih." };
    }

    const created = await SceneService.createScene(
      {
        title,
        chapter_id,
        summary,
        purpose,
        status,
      },
      novelId,
      user.id
    );

    revalidatePath(`/workspace/${novelId}`);
    return { success: true, id: created.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat adegan.";
    return { error: message };
  }
}

export async function updateSceneAction(
  prevState: StructureActionResult | null,
  formData: FormData
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const sceneId = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim();
    const chapter_id = (formData.get("chapter_id") as string)?.trim();
    const summary = (formData.get("summary") as string)?.trim() || undefined;
    const purpose = (formData.get("purpose") as string)?.trim() || undefined;
    const status = (formData.get("status") as SceneStatus) || undefined;

    if (!novelId || !sceneId) {
      return { error: "ID adegan atau novel tidak valid." };
    }
    if (!title) {
      return { error: "Judul adegan wajib diisi." };
    }

    await SceneService.updateScene(sceneId, novelId, user.id, {
      title,
      ...(chapter_id ? { chapter_id } : {}),
      summary,
      purpose,
      status,
    });

    revalidatePath(`/workspace/${novelId}`);
    return { success: true, id: sceneId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui adegan.";
    return { error: message };
  }
}

export async function deleteSceneAction(
  novelId: string,
  sceneId: string
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    await SceneService.deleteScene(sceneId, novelId, user.id);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus adegan.";
    return { error: message };
  }
}

export async function reorderScenesAction(
  novelId: string,
  chapterId: string,
  orderedIds: string[]
): Promise<StructureActionResult> {
  try {
    const user = await requireAuth();
    await SceneService.reorderScenes(chapterId, novelId, user.id, orderedIds);
    revalidatePath(`/workspace/${novelId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menata ulang adegan.";
    return { error: message };
  }
}
