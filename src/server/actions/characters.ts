"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/guards";
import { CharacterService } from "@/features/characters/service";

export type CharacterActionResult = {
  success?: boolean;
  error?: string;
  id?: string;
};

// ==========================================
// CHARACTER ACTIONS
// ==========================================

export async function createCharacterAction(
  prevState: CharacterActionResult | null,
  formData: FormData
): Promise<CharacterActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      role: formData.get("role") as string,
      age: (formData.get("age") as string)?.trim() || null,
      occupation: (formData.get("occupation") as string)?.trim() || null,
      description: (formData.get("description") as string)?.trim() || null,
      personality: (formData.get("personality") as string)?.trim() || null,
      motivation: (formData.get("motivation") as string)?.trim() || null,
      goal: (formData.get("goal") as string)?.trim() || null,
      fear: (formData.get("fear") as string)?.trim() || null,
      strengths: (formData.get("strengths") as string)?.trim() || null,
      weaknesses: (formData.get("weaknesses") as string)?.trim() || null,
      secret: (formData.get("secret") as string)?.trim() || null,
      backstory: (formData.get("backstory") as string)?.trim() || null,
      character_arc: (formData.get("character_arc") as string)?.trim() || null,
    };

    const res = await CharacterService.createCharacter(novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal membuat karakter." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true, id: res.character?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat karakter.";
    return { error: message };
  }
}

export async function updateCharacterAction(
  prevState: CharacterActionResult | null,
  formData: FormData
): Promise<CharacterActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const characterId = formData.get("id") as string;
    if (!novelId || !characterId) return { error: "ID karakter atau novel tidak valid." };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      role: formData.get("role") as string,
      age: (formData.get("age") as string)?.trim() || null,
      occupation: (formData.get("occupation") as string)?.trim() || null,
      description: (formData.get("description") as string)?.trim() || null,
      personality: (formData.get("personality") as string)?.trim() || null,
      motivation: (formData.get("motivation") as string)?.trim() || null,
      goal: (formData.get("goal") as string)?.trim() || null,
      fear: (formData.get("fear") as string)?.trim() || null,
      strengths: (formData.get("strengths") as string)?.trim() || null,
      weaknesses: (formData.get("weaknesses") as string)?.trim() || null,
      secret: (formData.get("secret") as string)?.trim() || null,
      backstory: (formData.get("backstory") as string)?.trim() || null,
      character_arc: (formData.get("character_arc") as string)?.trim() || null,
    };

    const res = await CharacterService.updateCharacter(characterId, novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui karakter." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true, id: characterId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui karakter.";
    return { error: message };
  }
}

export async function deleteCharacterAction(formData: FormData): Promise<CharacterActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const characterId = formData.get("id") as string;
    if (!novelId || !characterId) return { error: "ID karakter tidak valid." };

    const res = await CharacterService.deleteCharacter(characterId, novelId, user.id);
    if (!res.success) {
      return { error: res.error || "Gagal menghapus karakter." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus karakter.";
    return { error: message };
  }
}

// ==========================================
// RELATIONSHIP ACTIONS
// ==========================================

export async function createRelationshipAction(
  prevState: CharacterActionResult | null,
  formData: FormData
): Promise<CharacterActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    if (!novelId) return { error: "ID novel tidak ditemukan." };

    const rawData = {
      from_character_id: formData.get("from_character_id") as string,
      to_character_id: formData.get("to_character_id") as string,
      relationship_type: formData.get("relationship_type") as string,
      description: (formData.get("description") as string)?.trim() || null,
      history: (formData.get("history") as string)?.trim() || null,
      current_state: (formData.get("current_state") as string)?.trim() || null,
    };

    const res = await CharacterService.createRelationship(novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal membuat relasi karakter." };
    }

    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true, id: res.relationship?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat membuat relasi.";
    return { error: message };
  }
}

export async function updateRelationshipAction(
  prevState: CharacterActionResult | null,
  formData: FormData
): Promise<CharacterActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const relId = formData.get("id") as string;
    if (!novelId || !relId) return { error: "ID relasi atau novel tidak valid." };

    const rawData = {
      relationship_type: formData.get("relationship_type") as string,
      description: (formData.get("description") as string)?.trim() || null,
      history: (formData.get("history") as string)?.trim() || null,
      current_state: (formData.get("current_state") as string)?.trim() || null,
    };

    const res = await CharacterService.updateRelationship(relId, novelId, user.id, rawData);
    if (!res.success) {
      return { error: res.error || "Gagal memperbarui relasi." };
    }

    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true, id: relId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui relasi.";
    return { error: message };
  }
}

export async function deleteRelationshipAction(formData: FormData): Promise<CharacterActionResult> {
  try {
    const user = await requireAuth();
    const novelId = formData.get("novel_id") as string;
    const relId = formData.get("id") as string;
    if (!novelId || !relId) return { error: "ID relasi tidak valid." };

    const res = await CharacterService.deleteRelationship(relId, novelId, user.id);
    if (!res.success) {
      return { error: res.error || "Gagal menghapus relasi." };
    }

    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus relasi.";
    return { error: message };
  }
}

// ==========================================
// SCENE CONTEXT LINKING ACTION
// ==========================================

export async function updateSceneContextAction(
  novelId: string,
  sceneId: string,
  data: {
    pov_character_id?: string | null;
    location_id?: string | null;
    character_ids: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    if (!novelId || !sceneId) return { success: false, error: "ID adegan tidak valid." };

    const res = await CharacterService.updateSceneContext(sceneId, novelId, user.id, data);
    if (!res.success) {
      return { success: false, error: res.error || "Gagal memperbarui konteks adegan." };
    }

    revalidatePath(`/workspace/${novelId}`);
    revalidatePath(`/workspace/${novelId}/write/${sceneId}`);
    revalidatePath(`/workspace/${novelId}/characters`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan pada server.";
    return { success: false, error: message };
  }
}
