import { ActRepository } from "@/features/acts/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import { SceneRepository } from "@/features/scenes/repository";
import { buildStructureTree } from "./tree";
import type { NovelStructureTree } from "@/types";

export class StructureService {
  /**
   * Fetches the entire novel structure (Acts, Chapters, Scenes) in batch
   * to avoid N+1 query overhead, organizing into a clean hierarchy.
   */
  static async getNovelStructureTree(novelId: string, userId: string): Promise<NovelStructureTree> {
    const [acts, chapters, scenes] = await Promise.all([
      ActRepository.findManyByNovel(novelId, userId),
      ChapterRepository.findManyByNovel(novelId, userId),
      SceneRepository.findManyByNovel(novelId, userId),
    ]);

    return buildStructureTree(acts, chapters, scenes);
  }
}
