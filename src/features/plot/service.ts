import { PlotThreadRepository } from "./repository";
import { NovelRepository } from "@/features/novels/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import {
  createPlotThreadSchema,
  updatePlotThreadSchema,
  type PlotThread,
  type PlotThreadStatus,
} from "@/types";

const STATUS_TRANSITIONS: Record<PlotThreadStatus, PlotThreadStatus[]> = {
  planned: ["active", "abandoned"],
  active: ["resolved", "abandoned", "planned"],
  resolved: ["active"],
  abandoned: ["active", "planned"],
};

export class PlotThreadService {
  static async listThreads(
    novelId: string,
    userId: string,
    filters: { status?: PlotThreadStatus | "all" } = {}
  ): Promise<PlotThread[]> {
    return PlotThreadRepository.listByNovel(novelId, userId, filters);
  }

  static async getThread(
    id: string,
    novelId: string,
    userId: string
  ): Promise<PlotThread | null> {
    return PlotThreadRepository.findById(id, novelId, userId);
  }

  static async createThread(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; thread?: PlotThread; error?: string }> {
    const parsed = createPlotThreadSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data plot thread tidak valid." };
    }
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };

    const chapterCheck = await this.verifyChapterLinks(novelId, userId, parsed.data);
    if (!chapterCheck.ok) return { success: false, error: chapterCheck.error };

    const thread = await PlotThreadRepository.create(novelId, userId, parsed.data);
    if (!thread) return { success: false, error: "Gagal membuat plot thread atau akses ditolak." };
    return { success: true, thread };
  }

  static async updateThread(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; thread?: PlotThread; error?: string }> {
    const parsed = updatePlotThreadSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data plot thread tidak valid." };
    }
    const existing = await PlotThreadRepository.findById(id, novelId, userId);
    if (!existing) return { success: false, error: "Plot thread tidak ditemukan atau akses ditolak." };

    // Guard status transitions: author stays in control, but accidental
    // jumps (e.g. planned -> resolved without activation) need confirmation.
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = STATUS_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(parsed.data.status)) {
        return {
          success: false,
          error: `Transisi status dari "${existing.status}" ke "${parsed.data.status}" tidak didukung. Ubah bertahap melalui status perantara.`,
        };
      }
    }

    const chapterCheck = await this.verifyChapterLinks(novelId, userId, parsed.data);
    if (!chapterCheck.ok) return { success: false, error: chapterCheck.error };

    const thread = await PlotThreadRepository.update(id, novelId, userId, parsed.data);
    if (!thread) return { success: false, error: "Gagal memperbarui plot thread." };
    return { success: true, thread };
  }

  static async deleteThread(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await PlotThreadRepository.delete(id, novelId, userId);
    if (!ok) return { success: false, error: "Plot thread tidak ditemukan atau akses ditolak." };
    return { success: true };
  }

  static async getStatusCounts(
    novelId: string,
    userId: string
  ): Promise<Record<PlotThreadStatus, number>> {
    return PlotThreadRepository.countByStatus(novelId, userId);
  }

  /** Chapter links must belong to the same novel — never trust client IDs. */
  private static async verifyChapterLinks(
    novelId: string,
    userId: string,
    input: { introduced_chapter_id?: string | null; resolved_chapter_id?: string | null }
  ): Promise<{ ok: boolean; error?: string }> {
    for (const [field, label] of [
      ["introduced_chapter_id", "Bab pengantar"],
      ["resolved_chapter_id", "Bab penyelesaian"],
    ] as const) {
      const chapterId = input[field];
      if (!chapterId) continue;
      const chapter = await ChapterRepository.findById(chapterId, novelId, userId);
      if (!chapter) return { ok: false, error: `${label} tidak ditemukan di novel ini.` };
    }
    return { ok: true };
  }
}
