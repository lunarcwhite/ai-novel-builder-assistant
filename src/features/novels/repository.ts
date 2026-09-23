import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Novel, CreateNovelInput, UpdateNovelInput } from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not yet connected
const localDevNovelsStore: Map<string, Novel[]> = new Map();

// Seed initial sample novel for demo author
const demoUserId = "usr_demo_author_01";
localDevNovelsStore.set(demoUserId, [
  {
    id: "nov_demo_bayang_kota_tua",
    user_id: demoUserId,
    title: "Bayang Kota Tua",
    slug: "bayang-kota-tua",
    genre: "Dark Fantasy / Mystery",
    status: "in_progress",
    premise: "Seorang sarjana muda menemukan dokumen kuno bertutupkan segel perunggu yang dapat menghentikan perang antara ordo alkimia dan monarki.",
    theme: "Kebenaran vs Perdamaian yang Rapuh",
    tone: "Misterius, Atmosferik, Editorial",
    target_audience: "Pembaca fiksi spekulatif dewasa",
    description: "Kisah petualangan Kaelen Voss melintasi perbatasan Oakhaven demi mengantar segel perjanjian rahasia.",
    word_count: 5820,
    target_word_count: 65000,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export class NovelRepository {
  /**
   * Find a single novel by ID, ensuring strict ownership by userId.
   * Rule 5.3 (AGENTS.md): Never trust client-provided IDs. Always verify ownership.
   */
  static async findById(id: string, userId: string): Promise<Novel | null> {
    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error || !data) return null;
      return data as Novel;
    }

    const userNovels = localDevNovelsStore.get(userId) || [];
    return userNovels.find((n) => n.id === id) || null;
  }

  /**
   * Find a single novel by slug and userId.
   */
  static async findBySlug(slug: string, userId: string): Promise<Novel | null> {
    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("slug", slug)
        .eq("user_id", userId)
        .single();

      if (error || !data) return null;
      return data as Novel;
    }

    const userNovels = localDevNovelsStore.get(userId) || [];
    return userNovels.find((n) => n.slug === slug) || null;
  }

  /**
   * Find all novels owned by the user, ordered by latest update.
   */
  static async findManyByUser(userId: string): Promise<Novel[]> {
    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error || !data) return [];
      return data as Novel[];
    }

    const userNovels = localDevNovelsStore.get(userId) || [];
    return [...userNovels].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  /**
   * Create a new novel enforcing userId association and unique slug.
   */
  static async create(data: CreateNovelInput & { slug: string }, userId: string): Promise<Novel> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const newNovel: Novel = {
      id: "nov_" + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      title: data.title,
      slug: data.slug,
      genre: data.genre || null,
      status: "planning",
      premise: data.premise || null,
      theme: data.theme || null,
      tone: data.tone || null,
      target_audience: data.target_audience || null,
      description: data.description || null,
      word_count: 0,
      target_word_count: data.target_word_count || 50000,
      created_at: now,
      updated_at: now,
    };

    if (supabase && isSupabaseConfigured) {
      const { data: created, error } = await supabase
        .from("novels")
        .insert({
          ...newNovel,
          id: undefined, // Let PostgreSQL gen_random_uuid() generate it
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal membuat novel di database: ${error.message}`);
      }
      return created as Novel;
    }

    const currentNovels = localDevNovelsStore.get(userId) || [];
    localDevNovelsStore.set(userId, [newNovel, ...currentNovels]);
    return newNovel;
  }

  /**
   * Update an existing novel, strictly checking ownership.
   */
  static async update(
    id: string,
    userId: string,
    data: UpdateNovelInput & { slug?: string }
  ): Promise<Novel | null> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    if (supabase && isSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from("novels")
        .update({
          ...data,
          updated_at: now,
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !updated) return null;
      return updated as Novel;
    }

    const userNovels = localDevNovelsStore.get(userId) || [];
    const index = userNovels.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const existing = userNovels[index];
    const updated: Novel = {
      ...existing,
      ...data,
      genre: data.genre !== undefined ? data.genre : existing.genre,
      premise: data.premise !== undefined ? data.premise : existing.premise,
      theme: data.theme !== undefined ? data.theme : existing.theme,
      tone: data.tone !== undefined ? data.tone : existing.tone,
      target_audience: data.target_audience !== undefined ? data.target_audience : existing.target_audience,
      description: data.description !== undefined ? data.description : existing.description,
      status: data.status || existing.status,
      updated_at: now,
    };

    userNovels[index] = updated;
    localDevNovelsStore.set(userId, userNovels);
    return updated;
  }

  /**
   * Delete a novel, strictly checking ownership.
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("novels")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      return !error;
    }

    const userNovels = localDevNovelsStore.get(userId) || [];
    const filtered = userNovels.filter((n) => n.id !== id);
    const deleted = filtered.length < userNovels.length;
    localDevNovelsStore.set(userId, filtered);
    return deleted;
  }
}
