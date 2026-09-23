import { ActRepository } from "./repository";
import { createActSchema, updateActSchema, type CreateActInput, type UpdateActInput, type Act } from "@/types";

export class ActService {
  /**
   * Retrieve all acts for a given novel.
   */
  static async getActs(novelId: string, userId: string): Promise<Act[]> {
    return ActRepository.findManyByNovel(novelId, userId);
  }

  /**
   * Retrieve single act.
   */
  static async getAct(id: string, novelId: string, userId: string): Promise<Act | null> {
    return ActRepository.findById(id, novelId, userId);
  }

  /**
   * Create act with schema validation.
   */
  static async createAct(input: CreateActInput, novelId: string, userId: string): Promise<Act> {
    const validated = createActSchema.parse(input);
    return ActRepository.create(validated, novelId, userId);
  }

  /**
   * Update act with schema validation.
   */
  static async updateAct(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateActInput
  ): Promise<Act | null> {
    const validated = updateActSchema.parse(input);
    return ActRepository.update(id, novelId, userId, validated);
  }

  /**
   * Delete act.
   */
  static async deleteAct(id: string, novelId: string, userId: string): Promise<boolean> {
    return ActRepository.delete(id, novelId, userId);
  }

  /**
   * Reorder acts.
   */
  static async reorderActs(novelId: string, userId: string, orderedIds: string[]): Promise<boolean> {
    return ActRepository.reorder(novelId, userId, orderedIds);
  }
}
