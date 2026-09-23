import { ChapterRepository } from "./repository";
import {
  createChapterSchema,
  updateChapterSchema,
  type CreateChapterInput,
  type UpdateChapterInput,
  type Chapter,
} from "@/types";

export class ChapterService {
  /**
   * Retrieve all chapters for a given novel.
   */
  static async getChapters(novelId: string, userId: string): Promise<Chapter[]> {
    return ChapterRepository.findManyByNovel(novelId, userId);
  }

  /**
   * Retrieve single chapter.
   */
  static async getChapter(id: string, novelId: string, userId: string): Promise<Chapter | null> {
    return ChapterRepository.findById(id, novelId, userId);
  }

  /**
   * Retrieve chapters belonging to an act.
   */
  static async getChaptersByAct(actId: string, novelId: string, userId: string): Promise<Chapter[]> {
    return ChapterRepository.findManyByAct(actId, novelId, userId);
  }

  /**
   * Create chapter with schema validation.
   */
  static async createChapter(
    input: CreateChapterInput,
    novelId: string,
    userId: string
  ): Promise<Chapter> {
    const validated = createChapterSchema.parse(input);
    return ChapterRepository.create(validated, novelId, userId);
  }

  /**
   * Update chapter with schema validation.
   */
  static async updateChapter(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateChapterInput
  ): Promise<Chapter | null> {
    const validated = updateChapterSchema.parse(input);
    return ChapterRepository.update(id, novelId, userId, validated);
  }

  /**
   * Delete chapter.
   */
  static async deleteChapter(id: string, novelId: string, userId: string): Promise<boolean> {
    return ChapterRepository.delete(id, novelId, userId);
  }

  /**
   * Reorder chapters.
   */
  static async reorderChapters(
    novelId: string,
    userId: string,
    orderedIds: string[],
    actId?: string | null
  ): Promise<boolean> {
    return ChapterRepository.reorder(novelId, userId, orderedIds, actId);
  }
}
