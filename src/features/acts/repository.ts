import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type { Act, CreateActInput, UpdateActInput } from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not connected
export const localDevActsStore: Map<string, Act[]> = new Map();

// Seed initial sample acts for demo novel
localDevActsStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "act_demo_1",
    novel_id: "nov_demo_bayang_kota_tua",
    title: "Act I: Permulaan Rahasia",
    description: "Kaelen menemukan dokumen segel perunggu dan terpaksa melarikan diri dari kejaran ordo alkimia.",
    position: 1,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "act_demo_2",
    novel_id: "nov_demo_bayang_kota_tua",
    title: "Act II: Lembah Persimpangan",
    description: "Perjalanan melewati Hutan Kabut Hitam dan misteri isi rahasia segel perjanjian.",
    position: 2,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export class ActRepository {
  /**
   * Find an act by ID and verify ownership through novel -> user.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<Act | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("acts")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as Act;
    }

    const acts = localDevActsStore.get(novelId) || [];
    return acts.find((a) => a.id === id) || null;
  }

  /**
   * Find all acts for a given novel, ordered by position.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<Act[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("acts")
        .select("*")
        .eq("novel_id", novelId)
        .order("position", { ascending: true });

      if (error || !data) return [];
      return data as Act[];
    }

    const acts = localDevActsStore.get(novelId) || [];
    return [...acts].sort((a, b) => a.position - b.position);
  }

  /**
   * Create a new act in a novel.
   */
  static async create(data: CreateActInput, novelId: string, userId: string): Promise<Act> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) {
      throw new Error("Akses ditolak: Novel tidak ditemukan.");
    }

    const currentActs = await this.findManyByNovel(novelId, userId);
    const nextPosition = currentActs.length > 0 ? Math.max(...currentActs.map((a) => a.position)) + 1 : 1;

    const now = new Date().toISOString();
    const newAct: Act = {
      id: "act_" + Math.random().toString(36).substring(2, 10),
      novel_id: novelId,
      title: data.title,
      description: data.description || null,
      position: nextPosition,
      created_at: now,
      updated_at: now,
    };

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: created, error } = await supabase
        .from("acts")
        .insert({
          novel_id: newAct.novel_id,
          title: newAct.title,
          description: newAct.description,
          position: newAct.position,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal membuat babak di database: ${error.message}`);
      }
      return created as Act;
    }

    const acts = localDevActsStore.get(novelId) || [];
    localDevActsStore.set(novelId, [...acts, newAct]);
    return newAct;
  }

  /**
   * Update an existing act.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    data: UpdateActInput
  ): Promise<Act | null> {
    const act = await this.findById(id, novelId, userId);
    if (!act) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from("acts")
        .update({
          ...(data.title ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error) {
        throw new Error(`Gagal memperbarui babak: ${error.message}`);
      }
      return updated as Act;
    }

    const acts = localDevActsStore.get(novelId) || [];
    const index = acts.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated: Act = {
      ...acts[index],
      ...(data.title ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      updated_at: new Date().toISOString(),
    };

    acts[index] = updated;
    localDevActsStore.set(novelId, acts);
    return updated;
  }

  /**
   * Delete an act. Chapters with act_id will have act_id set to null or cascade as per rule.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const act = await this.findById(id, novelId, userId);
    if (!act) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("acts")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      if (error) {
        throw new Error(`Gagal menghapus babak: ${error.message}`);
      }
      return true;
    }

    const acts = localDevActsStore.get(novelId) || [];
    localDevActsStore.set(
      novelId,
      acts.filter((a) => a.id !== id)
    );
    return true;
  }

  /**
   * Reorder acts based on an array of ordered act IDs.
   */
  static async reorder(novelId: string, userId: string, orderedIds: string[]): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from("acts")
          .update({ position: i + 1, updated_at: new Date().toISOString() })
          .eq("id", orderedIds[i])
          .eq("novel_id", novelId);
      }
      return true;
    }

    const acts = localDevActsStore.get(novelId) || [];
    const updated = acts.map((act) => {
      const newPos = orderedIds.indexOf(act.id);
      return newPos !== -1 ? { ...act, position: newPos + 1 } : act;
    });

    localDevActsStore.set(novelId, updated);
    return true;
  }
}
