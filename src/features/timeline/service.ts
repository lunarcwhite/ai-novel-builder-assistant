import { TimelineEventRepository } from "./repository";
import { NovelRepository } from "@/features/novels/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import { LocationRepository } from "@/features/world/repository";
import {
  createTimelineEventSchema,
  updateTimelineEventSchema,
  type TimelineEvent,
} from "@/types";

export class TimelineService {
  static async listEvents(novelId: string, userId: string): Promise<TimelineEvent[]> {
    return TimelineEventRepository.listByNovel(novelId, userId);
  }

  static async getEvent(
    id: string,
    novelId: string,
    userId: string
  ): Promise<TimelineEvent | null> {
    return TimelineEventRepository.findById(id, novelId, userId);
  }

  static async createEvent(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; event?: TimelineEvent; error?: string }> {
    const parsed = createTimelineEventSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data peristiwa timeline tidak valid." };
    }
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };

    // SOUL.md #15: "unknown" precision needs no date; a dated precision does.
    const needsDate = parsed.data.date_precision !== "unknown" && parsed.data.date_precision !== "relative";
    if (needsDate && !parsed.data.date_value?.trim()) {
      return { success: false, error: "Presisi tanggal ini membutuhkan nilai tanggal." };
    }
    if (parsed.data.date_precision === "relative" && !parsed.data.relative_time?.trim()) {
      return { success: false, error: "Presisi relatif membutuhkan keterangan waktu relatif." };
    }

    const linkCheck = await this.verifyLinks(novelId, userId, parsed.data);
    if (!linkCheck.ok) return { success: false, error: linkCheck.error };

    const event = await TimelineEventRepository.create(novelId, userId, parsed.data);
    if (!event) return { success: false, error: "Gagal membuat peristiwa timeline atau akses ditolak." };
    return { success: true, event };
  }

  static async updateEvent(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; event?: TimelineEvent; error?: string }> {
    const parsed = updateTimelineEventSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data peristiwa timeline tidak valid." };
    }
    const existing = await TimelineEventRepository.findById(id, novelId, userId);
    if (!existing) return { success: false, error: "Peristiwa tidak ditemukan atau akses ditolak." };

    const merged = { ...existing, ...parsed.data };
    const needsDate = merged.date_precision !== "unknown" && merged.date_precision !== "relative";
    if (needsDate && !merged.date_value?.trim()) {
      return { success: false, error: "Presisi tanggal ini membutuhkan nilai tanggal." };
    }

    const linkCheck = await this.verifyLinks(novelId, userId, parsed.data);
    if (!linkCheck.ok) return { success: false, error: linkCheck.error };

    const event = await TimelineEventRepository.update(id, novelId, userId, parsed.data);
    if (!event) return { success: false, error: "Gagal memperbarui peristiwa timeline." };
    return { success: true, event };
  }

  static async deleteEvent(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await TimelineEventRepository.delete(id, novelId, userId);
    if (!ok) return { success: false, error: "Peristiwa tidak ditemukan atau akses ditolak." };
    return { success: true };
  }

  /** Chapter/location links must belong to the same novel — never trust client IDs. */
  private static async verifyLinks(
    novelId: string,
    userId: string,
    input: { chapter_id?: string | null; location_id?: string | null }
  ): Promise<{ ok: boolean; error?: string }> {
    if (input.chapter_id) {
      const chapter = await ChapterRepository.findById(input.chapter_id, novelId, userId);
      if (!chapter) return { ok: false, error: "Bab tertaut tidak ditemukan di novel ini." };
    }
    if (input.location_id) {
      const location = await LocationRepository.findById(input.location_id, novelId, userId);
      if (!location) return { ok: false, error: "Lokasi tertaut tidak ditemukan di novel ini." };
    }
    return { ok: true };
  }
}
