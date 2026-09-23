import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import { countWords } from "@/lib/words";
import type { Scene, CreateSceneInput, UpdateSceneInput } from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not connected
export const localDevScenesStore: Map<string, Scene[]> = new Map();

// Seed initial sample scenes for demo novel
localDevScenesStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "sc_demo_1",
    novel_id: "nov_demo_bayang_kota_tua",
    chapter_id: "ch_demo_1",
    title: "Adegan 1: Penemuan di Arsip Terlarang",
    summary: "Kaelen memecahkan kode katalog tersembunyi di balik rak manuskrip kuno sebelum patroli malam lewat.",
    purpose: "Mengenalkan keahlian riset karakter utama dan ancaman ordo alkimia.",
    position: 1,
    status: "completed",
    content: "Lilin kedua hampir padam ketika jemari Kaelen merasakan guratan berbeda di balik rak perkamen marmer...",
    word_count: 1500,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "sc_demo_2",
    novel_id: "nov_demo_bayang_kota_tua",
    chapter_id: "ch_demo_1",
    title: "Adegan 2: Langkah Kaki di Luar Pintu",
    summary: "Kaelen mengemas barangnya tergesa-gesa saat ketukan tongkat besi pengawas malam bergema di lorong.",
    purpose: "Meningkatkan tensi dramatis dan memaksa protagonis mengambil keputusan nekat.",
    position: 2,
    status: "completed",
    content: "Ketukan tongkat besi pengawas malam bergema di lorong batu yang dingin...",
    word_count: 1300,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "sc_demo_3",
    novel_id: "nov_demo_bayang_kota_tua",
    chapter_id: "ch_demo_2",
    title: "Adegan 1: Pertemuan di Kedai Lentera Patah",
    summary: "Kaelen mencocokkan kata sandi dengan kurir bayangan bernama Vane di tengah asap tembakau murahan.",
    purpose: "Memperkenalkan sekutu baru yang misterius dan rute penyelundupan rahasia.",
    position: 1,
    status: "in_progress",
    content: "Asap tembakau murahan memenuhi kedai sempit dekat kanal barat itu...",
    word_count: 1720,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "sc_demo_4",
    novel_id: "nov_demo_bayang_kota_tua",
    chapter_id: "ch_demo_2",
    title: "Adegan 2: Melompati Atap Perbatasan",
    summary: "Pelarian dramatis saat kedai digerebek oleh kesatria ordo alkimia bersenjata perak.",
    purpose: "Menghadirkan aksi pengejaran dan mempertegas bahwa tidak ada jalan kembali ke kehidupan lama.",
    position: 2,
    status: "draft",
    content: "Genteng basah licin oleh embun malam saat sepatu bot Kaelen menginjak sudut genting...",
    word_count: 1300,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "sc_demo_5",
    novel_id: "nov_demo_bayang_kota_tua",
    chapter_id: "ch_demo_3",
    title: "Adegan 1: Menguak Simbol Pertama",
    summary: "Di reruntuhan pos benteng tua, Kaelen menerjemahkan baris pembuka segel perunggu bersama Vane.",
    purpose: "Mengungkap petunjuk awal mengenai rahasia besar monarki.",
    position: 1,
    status: "planned",
    content: "",
    word_count: 0,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export class SceneRepository {
  /**
   * Find scene by ID, verifying novel ownership.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<Scene | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("scenes")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as Scene;
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    return scenes.find((s) => s.id === id) || null;
  }

  /**
   * Find all scenes for a novel.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<Scene[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("scenes")
        .select("*")
        .eq("novel_id", novelId)
        .order("position", { ascending: true });

      if (error || !data) return [];
      return data as Scene[];
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    return [...scenes].sort((a, b) => a.position - b.position);
  }

  /**
   * Find scenes for a specific chapter.
   */
  static async findManyByChapter(chapterId: string, novelId: string, userId: string): Promise<Scene[]> {
    const scenes = await this.findManyByNovel(novelId, userId);
    return scenes.filter((s) => s.chapter_id === chapterId);
  }

  /**
   * Create a new scene and update chapter word count.
   */
  static async create(data: CreateSceneInput, novelId: string, userId: string): Promise<Scene> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) {
      throw new Error("Akses ditolak: Novel tidak ditemukan.");
    }

    const chapterScenes = await this.findManyByChapter(data.chapter_id, novelId, userId);
    const nextPosition =
      chapterScenes.length > 0 ? Math.max(...chapterScenes.map((s) => s.position)) + 1 : 1;

    const now = new Date().toISOString();
    const newScene: Scene = {
      id: "sc_" + Math.random().toString(36).substring(2, 10),
      novel_id: novelId,
      chapter_id: data.chapter_id,
      title: data.title,
      summary: data.summary || null,
      purpose: data.purpose || null,
      pov_character_id: null,
      location_id: null,
      position: nextPosition,
      status: data.status || "planned",
      content: "",
      word_count: 0,
      created_at: now,
      updated_at: now,
    };

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: created, error } = await supabase
        .from("scenes")
        .insert({
          novel_id: newScene.novel_id,
          chapter_id: newScene.chapter_id,
          title: newScene.title,
          summary: newScene.summary,
          purpose: newScene.purpose,
          position: newScene.position,
          status: newScene.status,
          content: newScene.content,
          word_count: newScene.word_count,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal membuat adegan di database: ${error.message}`);
      }
      return created as Scene;
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    localDevScenesStore.set(novelId, [...scenes, newScene]);
    return newScene;
  }

  /**
   * Update scene metadata.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    data: UpdateSceneInput
  ): Promise<Scene | null> {
    const scene = await this.findById(id, novelId, userId);
    if (!scene) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from("scenes")
        .update({
          ...(data.title ? { title: data.title } : {}),
          ...(data.chapter_id ? { chapter_id: data.chapter_id } : {}),
          ...(data.summary !== undefined ? { summary: data.summary } : {}),
          ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
          ...(data.status ? { status: data.status } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal memperbarui adegan: ${error.message}`);
      }
      return updated as Scene;
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    const index = scenes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const updated: Scene = {
      ...scenes[index],
      ...(data.title ? { title: data.title } : {}),
      ...(data.chapter_id ? { chapter_id: data.chapter_id } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.purpose !== undefined ? { purpose: data.purpose } : {}),
      ...(data.status ? { status: data.status } : {}),
      updated_at: new Date().toISOString(),
    };

    scenes[index] = updated;
    localDevScenesStore.set(novelId, scenes);
    return updated;
  }

  /**
   * Update scene content and sync word count up to chapter and novel.
   */
  static async updateContent(
    id: string,
    novelId: string,
    userId: string,
    content: string
  ): Promise<Scene | null> {
    const scene = await this.findById(id, novelId, userId);
    if (!scene) return null;

    // Calculate word count
    const wordCount = countWords(content);

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from("scenes")
        .update({
          content,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal menyimpan naskah adegan: ${error.message}`);
      }

      // Recalculate chapter word count
      const chapterScenes = await this.findManyByChapter(scene.chapter_id, novelId, userId);
      const totalChapterWords = chapterScenes.reduce((acc, s) => acc + (s.id === id ? wordCount : s.word_count), 0);
      await ChapterRepository.updateWordCount(scene.chapter_id, novelId, totalChapterWords);

      return updated as Scene;
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    const index = scenes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    scenes[index].content = content;
    scenes[index].word_count = wordCount;
    scenes[index].updated_at = new Date().toISOString();
    localDevScenesStore.set(novelId, scenes);

    // Update chapter word count in mock store
    const chapterScenes = scenes.filter((s) => s.chapter_id === scene.chapter_id);
    const totalChapterWords = chapterScenes.reduce((acc, s) => acc + s.word_count, 0);
    await ChapterRepository.updateWordCount(scene.chapter_id, novelId, totalChapterWords);

    return scenes[index];
  }

  /**
   * Delete scene.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const scene = await this.findById(id, novelId, userId);
    if (!scene) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("scenes")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      if (error) {
        throw new Error(`Gagal menghapus adegan: ${error.message}`);
      }

      // Update chapter word count
      const remainingScenes = (await this.findManyByChapter(scene.chapter_id, novelId, userId)).filter((s) => s.id !== id);
      const totalWords = remainingScenes.reduce((acc, s) => acc + s.word_count, 0);
      await ChapterRepository.updateWordCount(scene.chapter_id, novelId, totalWords);

      return true;
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    localDevScenesStore.set(
      novelId,
      scenes.filter((s) => s.id !== id)
    );

    const remainingScenes = scenes.filter((s) => s.novel_id === novelId && s.chapter_id === scene.chapter_id && s.id !== id);
    const totalWords = remainingScenes.reduce((acc, s) => acc + s.word_count, 0);
    await ChapterRepository.updateWordCount(scene.chapter_id, novelId, totalWords);

    return true;
  }

  /**
   * Reorder scenes within a chapter.
   */
  static async reorder(
    chapterId: string,
    novelId: string,
    userId: string,
    orderedIds: string[]
  ): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from("scenes")
          .update({
            position: i + 1,
            chapter_id: chapterId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderedIds[i])
          .eq("novel_id", novelId);
      }
      return true;
    }

    const scenes = localDevScenesStore.get(novelId) || [];
    const updated = scenes.map((scene) => {
      const newPos = orderedIds.indexOf(scene.id);
      if (newPos !== -1) {
        return {
          ...scene,
          position: newPos + 1,
          chapter_id: chapterId,
          updated_at: new Date().toISOString(),
        };
      }
      return scene;
    });

    localDevScenesStore.set(novelId, updated);
    return true;
  }
}
