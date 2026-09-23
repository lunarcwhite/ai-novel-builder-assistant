import {
  LocationRepository,
  WorldRuleRepository,
  WorldLoreRepository,
} from "./repository";
import {
  createLocationSchema,
  updateLocationSchema,
  createWorldRuleSchema,
  updateWorldRuleSchema,
  createWorldLoreSchema,
  updateWorldLoreSchema,
  type Location,
  type WorldRule,
  type WorldLore,
} from "@/types";

export class WorldService {
  // -------------------------------------------------------------
  // Locations
  // -------------------------------------------------------------

  static async getLocations(novelId: string, userId: string): Promise<Location[]> {
    return LocationRepository.findManyByNovel(novelId, userId);
  }

  static async getLocation(
    id: string,
    novelId: string,
    userId: string
  ): Promise<Location | null> {
    return LocationRepository.findById(id, novelId, userId);
  }

  static async createLocation(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; location?: Location; error?: string }> {
    const parsed = createLocationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data lokasi tidak valid" };
    }

    const loc = await LocationRepository.create(novelId, userId, parsed.data);
    if (!loc) {
      return { success: false, error: "Gagal membuat lokasi atau akses novel ditolak" };
    }

    return { success: true, location: loc };
  }

  static async updateLocation(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; location?: Location; error?: string }> {
    const parsed = updateLocationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data lokasi tidak valid" };
    }

    const updated = await LocationRepository.update(id, novelId, userId, parsed.data);
    if (!updated) {
      return { success: false, error: "Lokasi tidak ditemukan atau akses ditolak" };
    }

    return { success: true, location: updated };
  }

  static async deleteLocation(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await LocationRepository.delete(id, novelId, userId);
    if (!ok) {
      return { success: false, error: "Gagal menghapus lokasi atau akses ditolak" };
    }
    return { success: true };
  }

  // -------------------------------------------------------------
  // World Rules
  // -------------------------------------------------------------

  static async getWorldRules(novelId: string, userId: string): Promise<WorldRule[]> {
    return WorldRuleRepository.findManyByNovel(novelId, userId);
  }

  static async getWorldRule(
    id: string,
    novelId: string,
    userId: string
  ): Promise<WorldRule | null> {
    return WorldRuleRepository.findById(id, novelId, userId);
  }

  static async createWorldRule(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; rule?: WorldRule; error?: string }> {
    const parsed = createWorldRuleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data aturan dunia tidak valid" };
    }

    const rule = await WorldRuleRepository.create(novelId, userId, parsed.data);
    if (!rule) {
      return { success: false, error: "Gagal membuat aturan dunia atau akses ditolak" };
    }

    return { success: true, rule };
  }

  static async updateWorldRule(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; rule?: WorldRule; error?: string }> {
    const parsed = updateWorldRuleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data aturan dunia tidak valid" };
    }

    const updated = await WorldRuleRepository.update(id, novelId, userId, parsed.data);
    if (!updated) {
      return { success: false, error: "Aturan dunia tidak ditemukan atau akses ditolak" };
    }

    return { success: true, rule: updated };
  }

  static async deleteWorldRule(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await WorldRuleRepository.delete(id, novelId, userId);
    if (!ok) {
      return { success: false, error: "Gagal menghapus aturan dunia atau akses ditolak" };
    }
    return { success: true };
  }

  // -------------------------------------------------------------
  // World Lore
  // -------------------------------------------------------------

  static async getWorldLoreList(novelId: string, userId: string): Promise<WorldLore[]> {
    return WorldLoreRepository.findManyByNovel(novelId, userId);
  }

  static async getWorldLore(
    id: string,
    novelId: string,
    userId: string
  ): Promise<WorldLore | null> {
    return WorldLoreRepository.findById(id, novelId, userId);
  }

  static async createWorldLore(
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; lore?: WorldLore; error?: string }> {
    const parsed = createWorldLoreSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data lore tidak valid" };
    }

    const lore = await WorldLoreRepository.create(novelId, userId, parsed.data);
    if (!lore) {
      return { success: false, error: "Gagal membuat artikel lore atau akses ditolak" };
    }

    return { success: true, lore };
  }

  static async updateWorldLore(
    id: string,
    novelId: string,
    userId: string,
    rawInput: unknown
  ): Promise<{ success: boolean; lore?: WorldLore; error?: string }> {
    const parsed = updateWorldLoreSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data lore tidak valid" };
    }

    const updated = await WorldLoreRepository.update(id, novelId, userId, parsed.data);
    if (!updated) {
      return { success: false, error: "Artikel lore tidak ditemukan atau akses ditolak" };
    }

    return { success: true, lore: updated };
  }

  static async deleteWorldLore(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await WorldLoreRepository.delete(id, novelId, userId);
    if (!ok) {
      return { success: false, error: "Gagal menghapus artikel lore atau akses ditolak" };
    }
    return { success: true };
  }
}
