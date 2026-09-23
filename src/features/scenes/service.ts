import { SceneRepository } from "./repository";
import {
  createSceneSchema,
  updateSceneSchema,
  type CreateSceneInput,
  type UpdateSceneInput,
  type Scene,
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
}
