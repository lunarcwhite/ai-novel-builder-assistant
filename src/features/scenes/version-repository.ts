import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { SceneRepository } from "@/features/scenes/repository";
import { countWords } from "@/lib/words";
import type { SceneVersion, CreateSceneVersionInput } from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not connected
export const localDevSceneVersionsStore: Map<string, SceneVersion[]> = new Map();

// Seed initial snapshot for demo scene
localDevSceneVersionsStore.set("sc_demo_1", [
  {
    id: "ver_demo_sc1_1",
    scene_id: "sc_demo_1",
    version_number: 1,
    title: "Draf Awal Babak 1",
    content: "Lilin kedua hampir padam ketika jemari Kaelen merasakan guratan berbeda di balik rak perkamen marmer...",
    word_count: 1500,
    created_by: "usr_demo_author_01",
    change_type: "manual",
    notes: "Draf pertama ditulis saat sesi malam.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]);

export class SceneVersionRepository {
  /**
   * Find all versions for a scene, newest first.
   * Verifies novel ownership through SceneRepository.
   */
  static async findManyByScene(
    sceneId: string,
    novelId: string,
    userId: string
  ): Promise<SceneVersion[]> {
    const scene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!scene) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("scene_versions")
        .select("*")
        .eq("scene_id", sceneId)
        .order("version_number", { ascending: false });

      if (error || !data) return [];
      return data as SceneVersion[];
    }

    const versions = localDevSceneVersionsStore.get(sceneId) || [];
    return [...versions].sort((a, b) => b.version_number - a.version_number);
  }

  /**
   * Find a specific scene version by ID.
   */
  static async findById(
    versionId: string,
    sceneId: string,
    novelId: string,
    userId: string
  ): Promise<SceneVersion | null> {
    const scene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!scene) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("scene_versions")
        .select("*")
        .eq("id", versionId)
        .eq("scene_id", sceneId)
        .single();

      if (error || !data) return null;
      return data as SceneVersion;
    }

    const versions = localDevSceneVersionsStore.get(sceneId) || [];
    return versions.find((v) => v.id === versionId) || null;
  }

  /**
   * Create a new scene version snapshot.
   * Automatically calculates sequential version_number.
   */
  static async create(
    sceneId: string,
    novelId: string,
    userId: string,
    input: CreateSceneVersionInput
  ): Promise<SceneVersion> {
    const scene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!scene) {
      throw new Error("Akses ditolak: Adegan tidak ditemukan.");
    }

    const wordCount = countWords(input.content);
    const now = new Date().toISOString();

    const existingVersions = await this.findManyByScene(sceneId, novelId, userId);
    const nextVersionNumber =
      existingVersions.length > 0
        ? Math.max(...existingVersions.map((v) => v.version_number)) + 1
        : 1;

    const newVersion: SceneVersion = {
      id: "ver_" + Math.random().toString(36).substring(2, 10),
      scene_id: sceneId,
      version_number: nextVersionNumber,
      title: input.title || `Versi ${nextVersionNumber}`,
      content: input.content,
      word_count: wordCount,
      created_by: userId,
      change_type: input.change_type || "manual",
      notes: input.notes || null,
      created_at: now,
    };

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: created, error } = await supabase
        .from("scene_versions")
        .insert({
          scene_id: newVersion.scene_id,
          version_number: newVersion.version_number,
          title: newVersion.title,
          content: newVersion.content,
          word_count: newVersion.word_count,
          created_by: userId,
          change_type: newVersion.change_type,
          notes: newVersion.notes,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal menyimpan versi adegan di database: ${error.message}`);
      }
      return created as SceneVersion;
    }

    const currentList = localDevSceneVersionsStore.get(sceneId) || [];
    localDevSceneVersionsStore.set(sceneId, [newVersion, ...currentList]);
    return newVersion;
  }
}
