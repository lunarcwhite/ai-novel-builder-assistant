import {
  CharacterRepository,
  RelationshipRepository,
  SceneCharacterRepository,
} from "./repository";
import { SceneRepository } from "@/features/scenes/repository";
import { LocationRepository } from "@/features/world/repository";
import {
  createCharacterSchema,
  updateCharacterSchema,
  createRelationshipSchema,
  updateRelationshipSchema,
  updateSceneContextSchema,
  type Character,
  type CharacterRelationship,
  type SceneContextData,
} from "@/types";

export class CharacterService {
  /**
   * Get all characters for a novel.
   */
  static async getCharacters(novelId: string, userId: string): Promise<Character[]> {
    return CharacterRepository.findManyByNovel(novelId, userId);
  }

  /**
   * Get single character by ID.
   */
  static async getCharacter(
    id: string,
    novelId: string,
    userId: string
  ): Promise<Character | null> {
    return CharacterRepository.findById(id, novelId, userId);
  }

  /**
   * Create a character with schema validation.
   */
  static async createCharacter(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; character?: Character; error?: string }> {
    const parsed = createCharacterSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data karakter tidak valid" };
    }

    const character = await CharacterRepository.create(novelId, userId, parsed.data);
    if (!character) {
      return { success: false, error: "Gagal menyimpan karakter atau akses novel ditolak" };
    }

    return { success: true, character };
  }

  /**
   * Update character details.
   */
  static async updateCharacter(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; character?: Character; error?: string }> {
    const parsed = updateCharacterSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data karakter tidak valid" };
    }

    const updated = await CharacterRepository.update(id, novelId, userId, parsed.data);
    if (!updated) {
      return { success: false, error: "Karakter tidak ditemukan atau akses ditolak" };
    }

    return { success: true, character: updated };
  }

  /**
   * Delete a character.
   */
  static async deleteCharacter(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await CharacterRepository.delete(id, novelId, userId);
    if (!ok) {
      return { success: false, error: "Gagal menghapus karakter atau akses ditolak" };
    }
    return { success: true };
  }

  // -------------------------------------------------------------
  // Relationships
  // -------------------------------------------------------------

  /**
   * Get all relationships for a novel.
   */
  static async getRelationships(
    novelId: string,
    userId: string
  ): Promise<CharacterRelationship[]> {
    return RelationshipRepository.findManyByNovel(novelId, userId);
  }

  /**
   * Create a relationship between two characters.
   */
  static async createRelationship(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; relationship?: CharacterRelationship; error?: string }> {
    const parsed = createRelationshipSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data relasi tidak valid" };
    }

    const rel = await RelationshipRepository.create(novelId, userId, parsed.data);
    if (!rel) {
      return { success: false, error: "Gagal membuat relasi atau akses novel ditolak" };
    }

    return { success: true, relationship: rel };
  }

  /**
   * Update a relationship.
   */
  static async updateRelationship(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; relationship?: CharacterRelationship; error?: string }> {
    const parsed = updateRelationshipSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data relasi tidak valid" };
    }

    const updated = await RelationshipRepository.update(id, novelId, userId, parsed.data);
    if (!updated) {
      return { success: false, error: "Relasi tidak ditemukan atau akses ditolak" };
    }

    return { success: true, relationship: updated };
  }

  /**
   * Delete a relationship.
   */
  static async deleteRelationship(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await RelationshipRepository.delete(id, novelId, userId);
    if (!ok) {
      return { success: false, error: "Gagal menghapus relasi atau akses ditolak" };
    }
    return { success: true };
  }

  // -------------------------------------------------------------
  // Appearances & Scene Context Linking
  // -------------------------------------------------------------

  /**
   * Get all scenes where a character appears.
   */
  static async getCharacterAppearances(
    characterId: string,
    novelId: string,
    userId: string
  ): Promise<
    Array<{
      sceneId: string;
      sceneTitle: string;
      chapterId: string;
      isPov: boolean;
    }>
  > {
    return SceneCharacterRepository.findAppearancesByCharacter(characterId, novelId, userId);
  }

  /**
   * Get complete context data for a scene (POV character, Location, Involved Characters).
   */
  static async getSceneContext(
    sceneId: string,
    novelId: string,
    userId: string
  ): Promise<SceneContextData> {
    const scene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!scene) {
      return { involved_characters: [] };
    }

    const [povChar, loc, involved] = await Promise.all([
      scene.pov_character_id
        ? CharacterRepository.findById(scene.pov_character_id, novelId, userId)
        : Promise.resolve(null),
      scene.location_id
        ? LocationRepository.findById(scene.location_id, novelId, userId)
        : Promise.resolve(null),
      SceneCharacterRepository.findByScene(sceneId, novelId, userId),
    ]);

    return {
      pov_character_id: scene.pov_character_id,
      pov_character: povChar,
      location_id: scene.location_id,
      location: loc,
      involved_characters: involved,
    };
  }

  /**
   * Update scene context linking (POV, Location, Involved Characters).
   */
  static async updateSceneContext(
    sceneId: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; error?: string }> {
    const parsed = updateSceneContextSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data konteks adegan tidak valid" };
    }

    const { pov_character_id, location_id, character_ids } = parsed.data;

    // Update scene table (pov_character_id & location_id)
    const updatedScene = await SceneRepository.update(sceneId, novelId, userId, {
      pov_character_id: pov_character_id ?? null,
      location_id: location_id ?? null,
    });

    if (!updatedScene) {
      return { success: false, error: "Gagal memperbarui adegan atau akses ditolak" };
    }

    // Update scene_characters table
    const ok = await SceneCharacterRepository.setForScene(sceneId, novelId, userId, character_ids);
    if (!ok) {
      return { success: false, error: "Gagal menghubungkan karakter terlibat ke adegan" };
    }

    return { success: true };
  }
}
