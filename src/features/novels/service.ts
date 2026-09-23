import { NovelRepository } from "./repository";
import { 
  createNovelSchema, 
  updateNovelSchema, 
  type Novel, 
  type CreateNovelInput, 
  type UpdateNovelInput 
} from "@/types";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export class NovelService {
  /**
   * Generates a unique slug for a novel under a specific user account.
   */
  static async generateUniqueSlug(title: string, userId: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(title) || "novel";
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await NovelRepository.findBySlug(candidate, userId);
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Validates and creates a new novel.
   */
  static async createNovel(input: CreateNovelInput, userId: string): Promise<Novel> {
    const validated = createNovelSchema.parse(input);
    const slug = await this.generateUniqueSlug(validated.title, userId);

    return NovelRepository.create(
      {
        ...validated,
        slug,
      },
      userId
    );
  }

  /**
   * Retrieves a novel with strict tenant verification.
   */
  static async getNovel(id: string, userId: string): Promise<Novel | null> {
    return NovelRepository.findById(id, userId);
  }

  /**
   * Lists all novels owned by the user.
   */
  static async listUserNovels(userId: string): Promise<Novel[]> {
    return NovelRepository.findManyByUser(userId);
  }

  /**
   * Validates and updates novel metadata.
   */
  static async updateNovel(
    id: string,
    userId: string,
    input: UpdateNovelInput
  ): Promise<Novel | null> {
    const validated = updateNovelSchema.parse(input);
    let slug: string | undefined = undefined;

    if (validated.title) {
      slug = await this.generateUniqueSlug(validated.title, userId, id);
    }

    return NovelRepository.update(id, userId, {
      ...validated,
      ...(slug ? { slug } : {}),
    });
  }

  /**
   * Deletes a novel.
   */
  static async deleteNovel(id: string, userId: string): Promise<boolean> {
    return NovelRepository.delete(id, userId);
  }

  /**
   * Calculates writing progress and estimated reading time.
   */
  static calculateStats(wordCount: number, targetCount: number) {
    const safeTarget = targetCount > 0 ? targetCount : 50000;
    const progressPercent = Math.min(100, Math.round((wordCount / safeTarget) * 100));
    // Average reading speed: 220 words per minute
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 220));

    return {
      progressPercent,
      readingTimeMinutes,
    };
  }
}
