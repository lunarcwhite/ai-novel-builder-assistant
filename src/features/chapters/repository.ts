import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type { Chapter, CreateChapterInput, UpdateChapterInput } from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not connected
export const localDevChaptersStore: Map<string, Chapter[]> = new Map();

// Seed initial sample chapters for demo novel
localDevChaptersStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "ch_demo_1",
    novel_id: "nov_demo_bayang_kota_tua",
    act_id: "act_demo_1",
    title: "Bab 1: Segel Bertinta Perak",
    summary: "Kaelen memeriksa naskah terlarang di perpustakaan akademi sebelum fajar menyingsing.",
    objective: "Menemukan bukti perjanjian alkimia kuno",
    conflict: "Waktu terbatas sebelum penjaga arsip berpatroli malam",
    emotional_beat: "Rasa penasaran bercampur ketakutan terungkap",
    outcome: "Dokumen berhasil disalin, namun penjaga mendengar langkah kaki",
    position: 1,
    status: "completed",
    word_count: 2800,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "ch_demo_2",
    novel_id: "nov_demo_bayang_kota_tua",
    act_id: "act_demo_1",
    title: "Bab 2: Malam Pelarian",
    summary: "Perjalanan melintasi labirin gang kota tua menuju dermaga barat untuk menemui kurir rahasia.",
    objective: "Menemui kurir bayangan untuk keluar dari perbatasan kota",
    conflict: "Patroli kota menutup gerbang utama dan merazia kedai",
    emotional_beat: "Keterasingan dan keputusasaan di bawah hujan dingin",
    outcome: "Berhasil mencapai dermaga tetapi pemburu bayaran ordo membuntuti",
    position: 2,
    status: "in_progress",
    word_count: 3020,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "ch_demo_3",
    novel_id: "nov_demo_bayang_kota_tua",
    act_id: "act_demo_2",
    title: "Bab 3: Aliansi yang Goyah",
    summary: "Kaelen dan Vane bersembunyi di pos reruntuhan benteng tua sambil merundingkan pembagian peran.",
    objective: "Membangun kesepakatan rute perjalanan melewati Hutan Kabut Hitam",
    conflict: "Vane menginginkan bayaran emas lebih tinggi atau segel dilepas",
    emotional_beat: "Ketidakpercayaan timbal balik",
    outcome: "Kesepakatan sementara tercapai di bawah ancaman cuaca badai",
    position: 1,
    status: "planned",
    word_count: 0,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export class ChapterRepository {
  /**
   * Find chapter by ID, verifying novel ownership.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<Chapter | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as Chapter;
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    return chapters.find((c) => c.id === id) || null;
  }

  /**
   * Find all chapters for a given novel.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<Chapter[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId)
        .order("position", { ascending: true });

      if (error || !data) return [];
      return data as Chapter[];
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    return [...chapters].sort((a, b) => a.position - b.position);
  }

  /**
   * Find chapters belonging to a specific act.
   */
  static async findManyByAct(actId: string, novelId: string, userId: string): Promise<Chapter[]> {
    const chapters = await this.findManyByNovel(novelId, userId);
    return chapters.filter((c) => c.act_id === actId);
  }

  /**
   * Create a new chapter.
   */
  static async create(data: CreateChapterInput, novelId: string, userId: string): Promise<Chapter> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) {
      throw new Error("Akses ditolak: Novel tidak ditemukan.");
    }

    const currentChapters = await this.findManyByNovel(novelId, userId);
    // Find next position either within the specific act or novel-wide
    const relevantChapters = data.act_id
      ? currentChapters.filter((c) => c.act_id === data.act_id)
      : currentChapters.filter((c) => !c.act_id);

    const nextPosition =
      relevantChapters.length > 0
        ? Math.max(...relevantChapters.map((c) => c.position)) + 1
        : currentChapters.length + 1;

    const now = new Date().toISOString();
    const newChapter: Chapter = {
      id: "ch_" + Math.random().toString(36).substring(2, 10),
      novel_id: novelId,
      act_id: data.act_id || null,
      title: data.title,
      summary: data.summary || null,
      objective: data.objective || null,
      conflict: data.conflict || null,
      emotional_beat: data.emotional_beat || null,
      outcome: data.outcome || null,
      position: nextPosition,
      status: data.status || "planned",
      word_count: 0,
      created_at: now,
      updated_at: now,
    };

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: created, error } = await supabase
        .from("chapters")
        .insert({
          novel_id: newChapter.novel_id,
          act_id: newChapter.act_id,
          title: newChapter.title,
          summary: newChapter.summary,
          objective: newChapter.objective,
          conflict: newChapter.conflict,
          emotional_beat: newChapter.emotional_beat,
          outcome: newChapter.outcome,
          position: newChapter.position,
          status: newChapter.status,
          word_count: newChapter.word_count,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal membuat bab di database: ${error.message}`);
      }
      return created as Chapter;
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    localDevChaptersStore.set(novelId, [...chapters, newChapter]);
    return newChapter;
  }

  /**
   * Update chapter metadata.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    data: UpdateChapterInput
  ): Promise<Chapter | null> {
    const chapter = await this.findById(id, novelId, userId);
    if (!chapter) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from("chapters")
        .update({
          ...(data.title ? { title: data.title } : {}),
          ...(data.act_id !== undefined ? { act_id: data.act_id } : {}),
          ...(data.summary !== undefined ? { summary: data.summary } : {}),
          ...(data.objective !== undefined ? { objective: data.objective } : {}),
          ...(data.conflict !== undefined ? { conflict: data.conflict } : {}),
          ...(data.emotional_beat !== undefined ? { emotional_beat: data.emotional_beat } : {}),
          ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
          ...(data.status ? { status: data.status } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal memperbarui bab: ${error.message}`);
      }
      return updated as Chapter;
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    const index = chapters.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated: Chapter = {
      ...chapters[index],
      ...(data.title ? { title: data.title } : {}),
      ...(data.act_id !== undefined ? { act_id: data.act_id } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.objective !== undefined ? { objective: data.objective } : {}),
      ...(data.conflict !== undefined ? { conflict: data.conflict } : {}),
      ...(data.emotional_beat !== undefined ? { emotional_beat: data.emotional_beat } : {}),
      ...(data.outcome !== undefined ? { outcome: data.outcome } : {}),
      ...(data.status ? { status: data.status } : {}),
      updated_at: new Date().toISOString(),
    };

    chapters[index] = updated;
    localDevChaptersStore.set(novelId, chapters);
    return updated;
  }

  /**
   * Update word count for a chapter (calculated from scenes).
   */
  static async updateWordCount(id: string, novelId: string, wordCount: number): Promise<void> {
    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      await supabase
        .from("chapters")
        .update({ word_count: wordCount, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("novel_id", novelId);
      return;
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    const index = chapters.findIndex((c) => c.id === id);
    if (index !== -1) {
      chapters[index].word_count = wordCount;
      chapters[index].updated_at = new Date().toISOString();
      localDevChaptersStore.set(novelId, chapters);
    }
  }

  /**
   * Delete chapter.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const chapter = await this.findById(id, novelId, userId);
    if (!chapter) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("chapters")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      if (error) {
        throw new Error(`Gagal menghapus bab: ${error.message}`);
      }
      return true;
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    localDevChaptersStore.set(
      novelId,
      chapters.filter((c) => c.id !== id)
    );
    return true;
  }

  /**
   * Reorder chapters within novel or act.
   */
  static async reorder(
    novelId: string,
    userId: string,
    orderedIds: string[],
    actId?: string | null
  ): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from("chapters")
          .update({
            position: i + 1,
            ...(actId !== undefined ? { act_id: actId } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderedIds[i])
          .eq("novel_id", novelId);
      }
      return true;
    }

    const chapters = localDevChaptersStore.get(novelId) || [];
    const updated = chapters.map((chapter) => {
      const newPos = orderedIds.indexOf(chapter.id);
      if (newPos !== -1) {
        return {
          ...chapter,
          position: newPos + 1,
          ...(actId !== undefined ? { act_id: actId } : {}),
          updated_at: new Date().toISOString(),
        };
      }
      return chapter;
    });

    localDevChaptersStore.set(novelId, updated);
    return true;
  }
}
