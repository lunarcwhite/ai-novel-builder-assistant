import { SceneRepository } from "./repository";
import { SceneVersionRepository } from "./version-repository";
import {
  createSceneSchema,
  updateSceneSchema,
  createSceneVersionSchema,
  type CreateSceneInput,
  type UpdateSceneInput,
  type CreateSceneVersionInput,
  type Scene,
  type SceneVersion,
} from "@/types";

export class SceneService {
  /**
   * Retrieve all scenes for a novel.
   */
  static async getScenes(novelId: string, userId: string): Promise<Scene[]> {
    return SceneRepository.findManyByNovel(novelId, userId);
  }

  /**
   * Retrieve single scene.
   */
  static async getScene(id: string, novelId: string, userId: string): Promise<Scene | null> {
    return SceneRepository.findById(id, novelId, userId);
  }

  /**
   * Retrieve scenes for a chapter.
   */
  static async getScenesByChapter(chapterId: string, novelId: string, userId: string): Promise<Scene[]> {
    return SceneRepository.findManyByChapter(chapterId, novelId, userId);
  }

  /**
   * Create scene with schema validation.
   */
  static async createScene(input: CreateSceneInput, novelId: string, userId: string): Promise<Scene> {
    const validated = createSceneSchema.parse(input);
    return SceneRepository.create(validated, novelId, userId);
  }

  /**
   * Update scene metadata.
   */
  static async updateScene(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateSceneInput
  ): Promise<Scene | null> {
    const validated = updateSceneSchema.parse(input);
    return SceneRepository.update(id, novelId, userId, validated);
  }

  /**
   * Update scene content.
   */
  static async updateSceneContent(
    id: string,
    novelId: string,
    userId: string,
    content: string
  ): Promise<Scene | null> {
    return SceneRepository.updateContent(id, novelId, userId, content);
  }

  /**
   * Delete scene.
   */
  static async deleteScene(id: string, novelId: string, userId: string): Promise<boolean> {
    return SceneRepository.delete(id, novelId, userId);
  }

  /**
   * Reorder scenes.
   */
  static async reorderScenes(
    chapterId: string,
    novelId: string,
    userId: string,
    orderedIds: string[]
  ): Promise<boolean> {
    return SceneRepository.reorder(chapterId, novelId, userId, orderedIds);
  }

  /**
   * Retrieve version history for a scene.
   */
  static async getSceneVersions(
    sceneId: string,
    novelId: string,
    userId: string
  ): Promise<SceneVersion[]> {
    return SceneVersionRepository.findManyByScene(sceneId, novelId, userId);
  }

  /**
   * Create an explicit snapshot version of current scene.
   */
  static async createSceneVersion(
    sceneId: string,
    novelId: string,
    userId: string,
    input: CreateSceneVersionInput
  ): Promise<SceneVersion> {
    const validated = createSceneVersionSchema.parse(input);
    return SceneVersionRepository.create(sceneId, novelId, userId, validated);
  }

  /**
   * Safely restore a past version.
   * Rule 6 (AGENTS.md): Manuscript safety.
   * Automatically checkpoints current draft before applying restoration.
   */
  static async restoreSceneVersion(
    sceneId: string,
    novelId: string,
    userId: string,
    versionId: string
  ): Promise<{ scene: Scene; restoredVersion: SceneVersion }> {
    const targetVersion = await SceneVersionRepository.findById(versionId, sceneId, novelId, userId);
    if (!targetVersion) {
      throw new Error("Versi yang dipilih tidak ditemukan.");
    }

    const currentScene = await SceneRepository.findById(sceneId, novelId, userId);
    if (!currentScene) {
      throw new Error("Adegan tidak ditemukan.");
    }

    // Safeguard current draft before restoring
    if (currentScene.content && currentScene.content.trim() !== targetVersion.content.trim()) {
      await SceneVersionRepository.create(sceneId, novelId, userId, {
        title: "Sebelum Pemulihan (Checkpoint Otomatis)",
        content: currentScene.content,
        change_type: "checkpoint",
        notes: `Dicadangkan secara otomatis sebelum memulihkan Versi #${targetVersion.version_number}.`,
      });
    }

    // Apply restored content to scene
    const updatedScene = await SceneRepository.updateContent(
      sceneId,
      novelId,
      userId,
      targetVersion.content
    );

    if (!updatedScene) {
      throw new Error("Gagal memperbarui naskah dengan versi yang dipulihkan.");
    }

    // Record restore event as new version entry
    const newVersion = await SceneVersionRepository.create(sceneId, novelId, userId, {
      title: `Dipulihkan dari Versi #${targetVersion.version_number}`,
      content: targetVersion.content,
      change_type: "restore",
      notes: targetVersion.title ? `Berdasarkan: ${targetVersion.title}` : undefined,
    });

    return { scene: updatedScene, restoredVersion: newVersion };
  }
}

