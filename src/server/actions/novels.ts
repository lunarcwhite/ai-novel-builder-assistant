"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import type { CreateNovelInput, UpdateNovelInput, NovelStatus } from "@/types";

export type NovelActionResult = {
  success?: boolean;
  error?: string;
  novelId?: string;
};

/**
 * Server action to create a new novel.
 */
export async function createNovelAction(
  prevState: NovelActionResult | null,
  formData: FormData
): Promise<NovelActionResult> {
  const user = await requireAuth();

  const title = (formData.get("title") as string)?.trim();
  const genre = (formData.get("genre") as string)?.trim() || undefined;
  const premise = (formData.get("premise") as string)?.trim() || undefined;
  const theme = (formData.get("theme") as string)?.trim() || undefined;
  const tone = (formData.get("tone") as string)?.trim() || undefined;
  const target_audience = (formData.get("target_audience") as string)?.trim() || undefined;
  const target_word_count = Number(formData.get("target_word_count")) || 50000;

  if (!title) {
    return { error: "Judul novel wajib diisi." };
  }

  let novelId = "";

  try {
    const input: CreateNovelInput = {
      title,
      genre,
      premise,
      theme,
      tone,
      target_audience,
      target_word_count,
    };

    const novel = await NovelService.createNovel(input, user.id);
    novelId = novel.id;
    revalidatePath("/workspace");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat novel.";
    return { error: message };
  }

  redirect(`/workspace/${novelId}`);
}

/**
 * Server action to update existing novel metadata.
 */
export async function updateNovelAction(
  prevState: NovelActionResult | null,
  formData: FormData
): Promise<NovelActionResult> {
  const user = await requireAuth();

  const id = formData.get("id") as string;
  if (!id) return { error: "ID novel tidak ditemukan." };

  const title = (formData.get("title") as string)?.trim();
  const genre = (formData.get("genre") as string)?.trim() || undefined;
  const status = (formData.get("status") as NovelStatus) || undefined;
  const premise = (formData.get("premise") as string)?.trim() || undefined;
  const theme = (formData.get("theme") as string)?.trim() || undefined;
  const tone = (formData.get("tone") as string)?.trim() || undefined;
  const target_audience = (formData.get("target_audience") as string)?.trim() || undefined;
  const target_word_count = Number(formData.get("target_word_count")) || undefined;

  try {
    const input: UpdateNovelInput = {
      ...(title ? { title } : {}),
      ...(genre !== undefined ? { genre } : {}),
      ...(status ? { status } : {}),
      ...(premise !== undefined ? { premise } : {}),
      ...(theme !== undefined ? { theme } : {}),
      ...(tone !== undefined ? { tone } : {}),
      ...(target_audience !== undefined ? { target_audience } : {}),
      ...(target_word_count ? { target_word_count } : {}),
    };

    const updated = await NovelService.updateNovel(id, user.id, input);
    if (!updated) {
      return { error: "Novel tidak ditemukan atau Anda tidak memiliki akses." };
    }

    revalidatePath("/workspace");
    revalidatePath(`/workspace/${id}`);
    return { success: true, novelId: id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui novel.";
    return { error: message };
  }
}

/**
 * Server action to delete a novel.
 */
export async function deleteNovelAction(formData: FormData): Promise<void> {
  const user = await requireAuth();
  const id = formData.get("id") as string;

  if (id) {
    await NovelService.deleteNovel(id, user.id);
    revalidatePath("/workspace");
  }

  redirect("/workspace");
}
