import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type {
  Location,
  CreateLocationInput,
  UpdateLocationInput,
  WorldRule,
  CreateWorldRuleInput,
  UpdateWorldRuleInput,
  WorldLore,
  CreateWorldLoreInput,
  UpdateWorldLoreInput,
} from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not connected
export const localDevLocationsStore: Map<string, Location[]> = new Map();
export const localDevWorldRulesStore: Map<string, WorldRule[]> = new Map();
export const localDevWorldLoreStore: Map<string, WorldLore[]> = new Map();

// Seed initial locations for demo novel "Bayang Kota Tua"
localDevLocationsStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "loc_arsip",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Arsip Terlarang Oakhaven",
    description:
      "Perpustakaan bawah tanah peninggalan monarki pertama dengan langit-langit kubah batu andesit bertuliskan kaligrafi kuno.",
    geography: "Terletak tiga lantai di bawah Biara Santo Valen, distrik utara Oakhaven.",
    atmosphere:
      "Dingin, berbau perkamen tua, lilin lebah, dan debu berabad-abad. Hening mencekam dengan gema tetesan air di sudut lorong.",
    notes: "Hanya kurator senior dan pejabat ordo yang memiliki segel kunci pembuka pintu tembaga.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "loc_kedai",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Kedai Lentera Patah",
    description:
      "Kedai minum kumuh dua lantai berlantai papan kayu lapuk di tepi kanal barat kota tua.",
    geography: "Distrik Kanal Barat, titik transit para penyelundup dan kurir bayangan.",
    atmosphere:
      "Pekat oleh asap tembakau murahan, bau bir basi, dan bisik-bisik rahasia di balik meja bilik berkain goni.",
    notes: "Tempat aman bagi buronan kota selama mereka mematuhi aturan netralitas pemilik kedai.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "loc_benteng",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Pos Benteng Tua Perbatasan",
    description:
      "Reruntuhan benteng batu pertahanan perbatasan yang sebagian dindingnya telah ditumbuhi lumut hitam dan semak belukar berduri.",
    geography: "Di lereng Bukit Abu, lima mil di luar gerbang barat kota Oakhaven.",
    atmosphere:
      "Angin kencang dingin berdesir di antara celah batu, sudut pandang sempurna untuk mengawasi jalan raya utama.",
    notes: "Titik temu rahasia antara kelompok penentang ordo dan kurir pembawa pesan lintas batas.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]);

// Seed initial world rules
localDevWorldRulesStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "rule_1",
    novel_id: "nov_demo_bayang_kota_tua",
    title: "Segel Perunggu Alkimia",
    rule:
      "Setiap dokumen rahasia ordo disegel dengan paduan perunggu alkimia yang hanya mencair jika disentuhkan intisari darah pewaris sah atau kata sandi vokal primer.",
    description:
      "Jika dibuka secara paksa tanpa ritual yang benar, serbuk asam dalam matriks segel akan membakar habis perkamen di dalamnya.",
    importance: 5,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "rule_2",
    novel_id: "nov_demo_bayang_kota_tua",
    title: "Jam Malam Transmutasi Energi",
    rule:
      "Warga sipil dilarang menyalakan perapian berbahan esensi kimia atau mengoperasikan mesin distilasi setelah lonceng ketiga ordo berbunyi.",
    description:
      "Patroli inkuisitor berhak membobol dan menggeledah setiap bangunan yang memancarkan pendar fosfor setelah jam malam.",
    importance: 4,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "rule_3",
    novel_id: "nov_demo_bayang_kota_tua",
    title: "Kedaulatan Jalur Bawah Tanah",
    rule:
      "Hukum monarki tidak berlaku di dalam jaringan terowongan pembuangan dan saluran drainase kuno (Kota Bawah).",
    description:
      "Inkuisitor dilarang masuk tanpa izin tertulis dari Dewan Tetua Distrik Barat untuk mencegah perang terbuka antarfaksi.",
    importance: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

// Seed initial world lore
localDevWorldLoreStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "lore_1",
    novel_id: "nov_demo_bayang_kota_tua",
    category: "Sejarah & Politik",
    title: "Perang Alkimia & Monarki (Krisis 15 Tahun Lalu)",
    content:
      "Konflik berdarah antara keluarga kerajaan Oakhaven dan Serikat Alkimiawan mengenai monopoli pengolahan kristal brimstone. Perang diakhiri dengan penandatanganan Perjanjian Tiga Segel yang membagi kekuasaan administratif kepada Ordo Alkimia.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "lore_2",
    novel_id: "nov_demo_bayang_kota_tua",
    category: "Geografi & Kota",
    title: "Peta Tiga Distrik Oakhaven",
    content:
      "Oakhaven terbelah menjadi tiga zona utama: Distrik Atas (kediaman bangsawan dan menara ordo), Distrik Tengah (pasar pedagang dan biara Santo Valen), serta Distrik Kanal Barat (pemukiman buruh tambang, dok kapal, dan labirin lorong kota bawah).",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "lore_3",
    novel_id: "nov_demo_bayang_kota_tua",
    category: "Misteri & Mitologi",
    title: "Legenda Sang Penjaga Segel Terakhir",
    content:
      "Mitos di kalangan kurir bayangan bahwa ada salinan keempat dari Perjanjian Tiga Segel yang disimpan bukan oleh raja ataupun ketua ordo, melainkan oleh seorang arsiparis bisu yang mengasingkan diri ke perbatasan.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
]);

export class LocationRepository {
  /**
   * Find location by ID verifying novel ownership.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<Location | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as Location;
    }

    const locs = localDevLocationsStore.get(novelId) || [];
    return locs.find((l) => l.id === id) || null;
  }

  /**
   * Find all locations for a novel.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<Location[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("novel_id", novelId)
        .order("name", { ascending: true });

      if (error || !data) return [];
      return data as Location[];
    }

    const locs = localDevLocationsStore.get(novelId) || [];
    return [...locs].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create a new location.
   */
  static async create(
    novelId: string,
    userId: string,
    input: CreateLocationInput
  ): Promise<Location | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("locations")
        .insert({
          novel_id: novelId,
          ...input,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data as Location;
    }

    const locs = localDevLocationsStore.get(novelId) || [];
    const newLoc: Location = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      novel_id: novelId,
      name: input.name,
      description: input.description ?? null,
      geography: input.geography ?? null,
      atmosphere: input.atmosphere ?? null,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    locs.push(newLoc);
    localDevLocationsStore.set(novelId, locs);
    return newLoc;
  }

  /**
   * Update a location.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateLocationInput
  ): Promise<Location | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("locations")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error || !data) return null;
      return data as Location;
    }

    const locs = localDevLocationsStore.get(novelId) || [];
    const index = locs.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const updated: Location = {
      ...locs[index],
      ...input,
      updated_at: new Date().toISOString(),
    };

    locs[index] = updated;
    localDevLocationsStore.set(novelId, locs);
    return updated;
  }

  /**
   * Delete a location.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      return !error;
    }

    const locs = localDevLocationsStore.get(novelId) || [];
    const filtered = locs.filter((l) => l.id !== id);
    localDevLocationsStore.set(novelId, filtered);
    return true;
  }
}

export class WorldRuleRepository {
  /**
   * Find rule by ID.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<WorldRule | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_rules")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as WorldRule;
    }

    const rules = localDevWorldRulesStore.get(novelId) || [];
    return rules.find((r) => r.id === id) || null;
  }

  /**
   * Find all world rules for a novel ordered by importance descending.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<WorldRule[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_rules")
        .select("*")
        .eq("novel_id", novelId)
        .order("importance", { ascending: false });

      if (error || !data) return [];
      return data as WorldRule[];
    }

    const rules = localDevWorldRulesStore.get(novelId) || [];
    return [...rules].sort((a, b) => b.importance - a.importance);
  }

  /**
   * Create a world rule.
   */
  static async create(
    novelId: string,
    userId: string,
    input: CreateWorldRuleInput
  ): Promise<WorldRule | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_rules")
        .insert({
          novel_id: novelId,
          ...input,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data as WorldRule;
    }

    const rules = localDevWorldRulesStore.get(novelId) || [];
    const newRule: WorldRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      novel_id: novelId,
      title: input.title,
      rule: input.rule,
      description: input.description ?? null,
      importance: input.importance ?? 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    rules.push(newRule);
    localDevWorldRulesStore.set(novelId, rules);
    return newRule;
  }

  /**
   * Update a world rule.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateWorldRuleInput
  ): Promise<WorldRule | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_rules")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error || !data) return null;
      return data as WorldRule;
    }

    const rules = localDevWorldRulesStore.get(novelId) || [];
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated: WorldRule = {
      ...rules[index],
      ...input,
      updated_at: new Date().toISOString(),
    };

    rules[index] = updated;
    localDevWorldRulesStore.set(novelId, rules);
    return updated;
  }

  /**
   * Delete a world rule.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("world_rules")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      return !error;
    }

    const rules = localDevWorldRulesStore.get(novelId) || [];
    const filtered = rules.filter((r) => r.id !== id);
    localDevWorldRulesStore.set(novelId, filtered);
    return true;
  }
}

export class WorldLoreRepository {
  /**
   * Find lore by ID.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<WorldLore | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_lore")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as WorldLore;
    }

    const loreList = localDevWorldLoreStore.get(novelId) || [];
    return loreList.find((l) => l.id === id) || null;
  }

  /**
   * Find all lore articles for a novel.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<WorldLore[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_lore")
        .select("*")
        .eq("novel_id", novelId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];
      return data as WorldLore[];
    }

    const loreList = localDevWorldLoreStore.get(novelId) || [];
    return [...loreList].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * Create a world lore entry.
   */
  static async create(
    novelId: string,
    userId: string,
    input: CreateWorldLoreInput
  ): Promise<WorldLore | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_lore")
        .insert({
          novel_id: novelId,
          ...input,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data as WorldLore;
    }

    const loreList = localDevWorldLoreStore.get(novelId) || [];
    const newLore: WorldLore = {
      id: `lore_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      novel_id: novelId,
      category: input.category ?? "general",
      title: input.title,
      content: input.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    loreList.push(newLore);
    localDevWorldLoreStore.set(novelId, loreList);
    return newLore;
  }

  /**
   * Update a world lore entry.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateWorldLoreInput
  ): Promise<WorldLore | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("world_lore")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error || !data) return null;
      return data as WorldLore;
    }

    const loreList = localDevWorldLoreStore.get(novelId) || [];
    const index = loreList.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const updated: WorldLore = {
      ...loreList[index],
      ...input,
      updated_at: new Date().toISOString(),
    };

    loreList[index] = updated;
    localDevWorldLoreStore.set(novelId, loreList);
    return updated;
  }

  /**
   * Delete a world lore entry.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("world_lore")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      return !error;
    }

    const loreList = localDevWorldLoreStore.get(novelId) || [];
    const filtered = loreList.filter((l) => l.id !== id);
    localDevWorldLoreStore.set(novelId, filtered);
    return true;
  }
}
