"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { WorldService } from "@/features/world/service";

export type WorldActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

// ==========================================
// LOCATION ACTIONS
// ==========================================

export async function createLocationAction(
  prevState: WorldActionResult | null,
  formData: FormData
): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      geography: (formData.get("geography") as string)?.trim() || null,
      atmosphere: (formData.get("atmosphere") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    const res = await WorldService.createLocation(novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal membuat lokasi." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true, id: res.location?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat lokasi.";
    return { error: message };
  }
}

export async function updateLocationAction(
  prevState: WorldActionResult | null,
  formData: FormData
): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const locId = formData.get("id") as string;
    if (!novelId || !locId) return { error: "ID lokasi atau novel tidak valid." };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      geography: (formData.get("geography") as string)?.trim() || null,
      atmosphere: (formData.get("atmosphere") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    const res = await WorldService.updateLocation(locId, novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui lokasi." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true, id: locId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui lokasi.";
    return { error: message };
  }
}

export async function deleteLocationAction(formData: FormData): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const locId = formData.get("id") as string;
    if (!novelId || !locId) return { error: "ID lokasi tidak valid." };

    const res = await WorldService.deleteLocation(locId, novelId, user.id);
    if (!res.success) {
      return { error: res.error || "Gagal menghapus lokasi." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus lokasi.";
    return { error: message };
  }
}

// ==========================================
// WORLD RULE ACTIONS
// ==========================================

export async function createWorldRuleAction(
  prevState: WorldActionResult | null,
  formData: FormData
): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      title: (formData.get("title") as string)?.trim(),
      rule: (formData.get("rule") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      importance: Number(formData.get("importance") || 3),
    };

    const res = await WorldService.createWorldRule(novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal membuat aturan dunia." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true, id: res.rule?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat aturan dunia.";
    return { error: message };
  }
}

export async function updateWorldRuleAction(
  prevState: WorldActionResult | null,
  formData: FormData
): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const ruleId = formData.get("id") as string;
    if (!novelId || !ruleId) return { error: "ID aturan atau novel tidak valid." };

    const rawData = {
      title: (formData.get("title") as string)?.trim(),
      rule: (formData.get("rule") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || null,
      importance: Number(formData.get("importance") || 3),
    };

    const res = await WorldService.updateWorldRule(ruleId, novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui aturan dunia." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true, id: ruleId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui aturan dunia.";
    return { error: message };
  }
}

export async function deleteWorldRuleAction(formData: FormData): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const ruleId = formData.get("id") as string;
    if (!novelId || !ruleId) return { error: "ID aturan tidak valid." };

    const res = await WorldService.deleteWorldRule(ruleId, novelId, user.id);
    if (!res.success) {
      return { error: res.error || "Gagal menghapus aturan dunia." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus aturan dunia.";
    return { error: message };
  }
}

// ==========================================
// WORLD LORE ACTIONS
// ==========================================

export async function createWorldLoreAction(
  prevState: WorldActionResult | null,
  formData: FormData
): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      category: (formData.get("category") as string)?.trim() || "general",
      title: (formData.get("title") as string)?.trim(),
      content: (formData.get("content") as string)?.trim(),
    };

    const res = await WorldService.createWorldLore(novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal membuat artikel lore." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true, id: res.lore?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat artikel lore.";
    return { error: message };
  }
}

export async function updateWorldLoreAction(
  prevState: WorldActionResult | null,
  formData: FormData
): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const loreId = formData.get("id") as string;
    if (!novelId || !loreId) return { error: "ID lore atau novel tidak valid." };

    const rawData = {
      category: (formData.get("category") as string)?.trim() || "general",
      title: (formData.get("title") as string)?.trim(),
      content: (formData.get("content") as string)?.trim(),
    };

    const res = await WorldService.updateWorldLore(loreId, novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui artikel lore." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true, id: loreId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui artikel lore.";
    return { error: message };
  }
}

export async function deleteWorldLoreAction(formData: FormData): Promise<WorldActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const loreId = formData.get("id") as string;
    if (!novelId || !loreId) return { error: "ID lore tidak valid." };

    const res = await WorldService.deleteWorldLore(loreId, novelId, user.id);
    if (!res.success) {
      return { error: res.error || "Gagal menghapus artikel lore." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/world`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus artikel lore.";
    return { error: message };
  }
}
