import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
  CharacterRelationship,
  CreateRelationshipInput,
  UpdateRelationshipInput,
  SceneCharacter,
} from "@/types";

// In-memory store for local dev mode when PostgreSQL/Supabase is not connected
export const localDevCharactersStore: Map<string, Character[]> = new Map();
export const localDevRelationshipsStore: Map<string, CharacterRelationship[]> = new Map();
export const localDevSceneCharactersStore: Map<string, SceneCharacter[]> = new Map();

// Seed initial sample characters for demo novel "Bayang Kota Tua"
localDevCharactersStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "char_kaelen",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Kaelen Voss",
    role: "protagonist",
    age: "23 tahun",
    occupation: "Sarjana Peneliti Arsip & Paleografi",
    description:
      "Pemuda berambut cokelat kusut dengan tatapan abu-abu tajam yang terbiasa membaca manuskrip kuno di bawah cahaya lilin redup.",
    personality:
      "Observan, teliti, bersikeras mencari kebenaran fakta, cenderung enggan berkompromi dengan dogma ordo.",
    motivation:
      "Menguak kebenaran di balik perjanjian segel perunggu kuno yang disembunyikan dari publik.",
    goal: "Menemukan dokumen asli monarki sebelum faksi militer ordo membakarnya.",
    fear: "Menjadi bidak catur tak berdaya dalam konspirasi kekaisaran.",
    strengths: "Daya ingat fotografis, mahir menerjemahkan simbol aksara kuno Oakhaven.",
    weaknesses: "Terlalu gegabah saat mengejar petunjuk, stamina fisik terbatas.",
    secret: "Menyimpan fragmen plat perunggu berukir sandi di balik lapisan jaket wolnya.",
    backstory:
      "Dibesarkan di biara arsip pinggiran setelah keluarganya hilang dalam krisis transmutasi 15 tahun lalu.",
    character_arc:
      "Awal: Sarjana pemalu yang bersembunyi di balik buku -> Tengah: Terpaksa menjadi buronan aktif yang berani mengambil risiko fisik -> Akhir: Memimpin pengungkapan kebenaran bagi perdamaian kota.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "char_vane",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Vane",
    role: "deuteragonist",
    age: "27 tahun",
    occupation: "Kurir Bayangan & Penyelundup Jalur Barat",
    description:
      "Sosok jangkung berkerudung kanvas gelap dengan bekas luka sabetan pisau tipis melintang di tulang pipi kanan.",
    personality:
      "Skeptis, pragmatis, sarkastik, namun memiliki kode kehormatan jalanan yang sangat teguh.",
    motivation: "Memastikan jaringan penyelundup kota bawah tetap bebas dari cengkeraman monarki.",
    goal: "Membawa Kaelen melintasi perbatasan Oakhaven hidup-hidup.",
    fear: "Dikhianati oleh kawan seperjuangan seperti insiden masa lalunya.",
    strengths: "Menguasai labirin lorong bawah tanah kota tua, gesit dalam pertempuran jarak dekat.",
    weaknesses: "Sukar mempercayai kaum terpelajar dan bangsawan, cenderung sinis.",
    secret: "Merupakan mantan prajurit pengawal benteng timur yang desersi.",
    backstory:
      "Dituduh membocorkan rute patroli benteng dan melarikan diri ke kota bawah untuk bertahan hidup.",
    character_arc:
      "Awal: Menolong Kaelen murni demi imbalan koin perak -> Tengah: Tersentuh oleh ketulusan sang sarjana -> Akhir: Menaruh nyawanya untuk melindungi kebenaran.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "char_thorne",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Komandan Thorne",
    role: "antagonist",
    age: "42 tahun",
    occupation: "Inkuisitor Kepala Ordo Alkimia",
    description:
      "Pria tegap berahang kaku berseragam mantel abu-abu perak dengan lencana matahari terbelah di dada kirinya.",
    personality:
      "Disiplin tanpa kompromi, dingin, yakin bahwa stabilitas kota hanya bisa terjaga dengan kontrol mutlak informasi.",
    motivation:
      "Mempertahankan tatanan kekuasaan Ordo Alkimia dari ancaman pemberontakan sipil.",
    goal: "Merebut kembali segel perunggu dan melenyapkan siapa pun yang telah membacanya.",
    fear: "Kekacauan massal dan perang saudara jika aib sejarah leluhur monarki terbongkar.",
    strengths: "Pengaruh politik tinggi, komando atas pasukan patroli berkuda bersenjata perak.",
    weaknesses: "Kaku, meremehkan tekad dan kecerdikan warga sipil biasa.",
    secret:
      "Mengetahui bahwa segel tersebut memuat surat perintah pembantaian yang ditandatangani leluhurnya sendiri.",
    backstory: "Generasi ketiga keluarga Thorne yang mengabdikan hidup bagi kepatuhan mutlak ordo.",
    character_arc:
      "Awal: Inkuisitor kejam tanpa keraguan -> Tengah: Mulai gelisah melihat bukti manipulasi ordo -> Akhir: Menghadapi dilema moral antara sumpah jabatan dan nurani manusia.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "char_lyra",
    novel_id: "nov_demo_bayang_kota_tua",
    name: "Dame Lyra",
    role: "supporting",
    age: "50 tahun",
    occupation: "Kurator Utama Arsip Terlarang",
    description:
      "Wanita paruh baya dengan kacamata berbingkai perak bulat, senyum teduh yang menyembunyikan kelihaian manuver politik.",
    personality: "Tenang, bijaksana, penuh perhitungan, memiliki kesabaran tak terbatas.",
    motivation: "Melestarikan sejarah sejati Oakhaven dari api sensor penguasa.",
    goal: "Membimbing Kaelen memahami teka-teki dokumen tanpa membahayakan biara arsip.",
    fear: "Pembakaran seluruh perpustakaan kuno oleh inkuisitor ordo.",
    strengths: "Jaringan relasi rahasia dengan bangsawan reformis dan cendekiawan independen.",
    weaknesses: "Fisik yang mulai menua, terikat pada tanggung jawab biara.",
    secret: "Secara sengaja meninggalkan kunci ruang brankas arsip kuno di meja kerja Kaelen.",
    backstory: "Pernah menjabat sebagai arsiparis resmi istana sebelum mengundurkan diri ke biara.",
    character_arc:
      "Mentor yang bertindak di balik layar, menjaga lentera pengetahuan tetap menyala di masa kegelapan.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]);

// Seed initial relationships
localDevRelationshipsStore.set("nov_demo_bayang_kota_tua", [
  {
    id: "rel_1",
    novel_id: "nov_demo_bayang_kota_tua",
    from_character_id: "char_kaelen",
    to_character_id: "char_vane",
    relationship_type: "ally",
    description: "Kemitraan darurat antara sarjana buronan dan penyelundup kota bawah.",
    history: "Pertama kali bertemu di Kedai Lentera Patah melalui kata sandi rahasia dari Dame Lyra.",
    current_state: "Saling berhati-hati namun perlahan membangun kepercayaan saat saling melindungi nyawa.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "rel_2",
    novel_id: "nov_demo_bayang_kota_tua",
    from_character_id: "char_kaelen",
    to_character_id: "char_thorne",
    relationship_type: "enemy",
    description: "Permusuhan maut antara target pengejaran dan inkuisitor kepala.",
    history: "Thorne memimpin penggerebekan arsip tepat setelah Kaelen kabur membawa dokumen.",
    current_state: "Pengejaran aktif di seluruh penjuru distrik barat.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "rel_3",
    novel_id: "nov_demo_bayang_kota_tua",
    from_character_id: "char_kaelen",
    to_character_id: "char_lyra",
    relationship_type: "mentor",
    description: "Ikatan guru dan murid dalam pelestarian manuskrip kuno.",
    history: "Lyra mendidik Kaelen sejak masa magang pertamanya di biara sepuluh tahun lalu.",
    current_state: "Lyra memfasilitasi pelarian Kaelen dan menghapus catatan kunjungan arsipnya.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "rel_4",
    novel_id: "nov_demo_bayang_kota_tua",
    from_character_id: "char_vane",
    to_character_id: "char_thorne",
    relationship_type: "rival",
    description: "Rivalitas lama antara penyelundup cerdik dan penegak hukum militer.",
    history: "Vane beberapa kali meloloskan kargo gelap di bawah hidung patroli bawahan Thorne.",
    current_state: "Thorne melipatgandakan hadiah buruan atas kepala Vane.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]);

// Seed initial scene-character linkings
localDevSceneCharactersStore.set("sc_demo_1", [
  {
    id: "sc_char_1",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_1",
    character_id: "char_kaelen",
    role_in_scene: "focal",
    created_at: new Date().toISOString(),
  },
  {
    id: "sc_char_2",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_1",
    character_id: "char_lyra",
    role_in_scene: "present",
    created_at: new Date().toISOString(),
  },
]);

localDevSceneCharactersStore.set("sc_demo_2", [
  {
    id: "sc_char_3",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_2",
    character_id: "char_kaelen",
    role_in_scene: "focal",
    created_at: new Date().toISOString(),
  },
  {
    id: "sc_char_4",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_2",
    character_id: "char_thorne",
    role_in_scene: "present",
    created_at: new Date().toISOString(),
  },
]);

localDevSceneCharactersStore.set("sc_demo_3", [
  {
    id: "sc_char_5",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_3",
    character_id: "char_kaelen",
    role_in_scene: "focal",
    created_at: new Date().toISOString(),
  },
  {
    id: "sc_char_6",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_3",
    character_id: "char_vane",
    role_in_scene: "present",
    created_at: new Date().toISOString(),
  },
]);

localDevSceneCharactersStore.set("sc_demo_4", [
  {
    id: "sc_char_7",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_4",
    character_id: "char_kaelen",
    role_in_scene: "focal",
    created_at: new Date().toISOString(),
  },
  {
    id: "sc_char_8",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_4",
    character_id: "char_vane",
    role_in_scene: "present",
    created_at: new Date().toISOString(),
  },
  {
    id: "sc_char_9",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_4",
    character_id: "char_thorne",
    role_in_scene: "present",
    created_at: new Date().toISOString(),
  },
]);

localDevSceneCharactersStore.set("sc_demo_5", [
  {
    id: "sc_char_10",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_5",
    character_id: "char_kaelen",
    role_in_scene: "focal",
    created_at: new Date().toISOString(),
  },
  {
    id: "sc_char_11",
    novel_id: "nov_demo_bayang_kota_tua",
    scene_id: "sc_demo_5",
    character_id: "char_vane",
    role_in_scene: "present",
    created_at: new Date().toISOString(),
  },
]);

export class CharacterRepository {
  /**
   * Find character by ID verifying novel ownership.
   */
  static async findById(id: string, novelId: string, userId: string): Promise<Character | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();

      if (error || !data) return null;
      return data as Character;
    }

    const characters = localDevCharactersStore.get(novelId) || [];
    return characters.find((c) => c.id === id) || null;
  }

  /**
   * Find all characters in a novel verifying ownership.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<Character[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("novel_id", novelId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];
      return data as Character[];
    }

    const characters = localDevCharactersStore.get(novelId) || [];
    return [...characters].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * Create a new character in a novel.
   */
  static async create(
    novelId: string,
    userId: string,
    input: CreateCharacterInput
  ): Promise<Character | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("characters")
        .insert({
          novel_id: novelId,
          ...input,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data as Character;
    }

    const characters = localDevCharactersStore.get(novelId) || [];
    const newCharacter: Character = {
      id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      novel_id: novelId,
      name: input.name,
      role: input.role ?? "supporting",
      age: input.age ?? null,
      occupation: input.occupation ?? null,
      description: input.description ?? null,
      personality: input.personality ?? null,
      motivation: input.motivation ?? null,
      goal: input.goal ?? null,
      fear: input.fear ?? null,
      strengths: input.strengths ?? null,
      weaknesses: input.weaknesses ?? null,
      secret: input.secret ?? null,
      backstory: input.backstory ?? null,
      character_arc: input.character_arc ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    characters.push(newCharacter);
    localDevCharactersStore.set(novelId, characters);
    return newCharacter;
  }

  /**
   * Update character details.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateCharacterInput
  ): Promise<Character | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("characters")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error || !data) return null;
      return data as Character;
    }

    const characters = localDevCharactersStore.get(novelId) || [];
    const index = characters.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated: Character = {
      ...characters[index],
      ...input,
      updated_at: new Date().toISOString(),
    };

    characters[index] = updated;
    localDevCharactersStore.set(novelId, characters);
    return updated;
  }

  /**
   * Delete a character safely.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      return !error;
    }

    const characters = localDevCharactersStore.get(novelId) || [];
    const filtered = characters.filter((c) => c.id !== id);
    localDevCharactersStore.set(novelId, filtered);

    // Also remove associated relationships in local store
    const rels = localDevRelationshipsStore.get(novelId) || [];
    const filteredRels = rels.filter(
      (r) => r.from_character_id !== id && r.to_character_id !== id
    );
    localDevRelationshipsStore.set(novelId, filteredRels);

    return true;
  }
}

export class RelationshipRepository {
  /**
   * Find all relationships in a novel, joining character names.
   */
  static async findManyByNovel(novelId: string, userId: string): Promise<CharacterRelationship[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const characters = await CharacterRepository.findManyByNovel(novelId, userId);
    const charMap = new Map(characters.map((c) => [c.id, c.name]));

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("character_relationships")
        .select("*")
        .eq("novel_id", novelId)
        .order("created_at", { ascending: true });

      if (error || !data) return [];
      return (data as CharacterRelationship[]).map((r) => ({
        ...r,
        from_character_name: charMap.get(r.from_character_id) || "Karakter",
        to_character_name: charMap.get(r.to_character_id) || "Karakter",
      }));
    }

    const rels = localDevRelationshipsStore.get(novelId) || [];
    return rels.map((r) => ({
      ...r,
      from_character_name: charMap.get(r.from_character_id) || "Karakter",
      to_character_name: charMap.get(r.to_character_id) || "Karakter",
    }));
  }

  /**
   * Find relationships where a specific character is either from or to.
   */
  static async findByCharacter(
    characterId: string,
    novelId: string,
    userId: string
  ): Promise<CharacterRelationship[]> {
    const all = await this.findManyByNovel(novelId, userId);
    return all.filter(
      (r) => r.from_character_id === characterId || r.to_character_id === characterId
    );
  }

  /**
   * Create a new relationship.
   */
  static async create(
    novelId: string,
    userId: string,
    input: CreateRelationshipInput
  ): Promise<CharacterRelationship | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("character_relationships")
        .insert({
          novel_id: novelId,
          ...input,
        })
        .select()
        .single();

      if (error || !data) return null;
      return data as CharacterRelationship;
    }

    const rels = localDevRelationshipsStore.get(novelId) || [];
    const newRel: CharacterRelationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      novel_id: novelId,
      from_character_id: input.from_character_id,
      to_character_id: input.to_character_id,
      relationship_type: input.relationship_type ?? "friend",
      description: input.description ?? null,
      history: input.history ?? null,
      current_state: input.current_state ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    rels.push(newRel);
    localDevRelationshipsStore.set(novelId, rels);
    return newRel;
  }

  /**
   * Update a relationship.
   */
  static async update(
    id: string,
    novelId: string,
    userId: string,
    input: UpdateRelationshipInput
  ): Promise<CharacterRelationship | null> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return null;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("character_relationships")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("novel_id", novelId)
        .select()
        .single();

      if (error || !data) return null;
      return data as CharacterRelationship;
    }

    const rels = localDevRelationshipsStore.get(novelId) || [];
    const index = rels.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated: CharacterRelationship = {
      ...rels[index],
      ...input,
      updated_at: new Date().toISOString(),
    };

    rels[index] = updated;
    localDevRelationshipsStore.set(novelId, rels);
    return updated;
  }

  /**
   * Delete a relationship.
   */
  static async delete(id: string, novelId: string, userId: string): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase
        .from("character_relationships")
        .delete()
        .eq("id", id)
        .eq("novel_id", novelId);

      return !error;
    }

    const rels = localDevRelationshipsStore.get(novelId) || [];
    const filtered = rels.filter((r) => r.id !== id);
    localDevRelationshipsStore.set(novelId, filtered);
    return true;
  }
}

export class SceneCharacterRepository {
  /**
   * Get all characters linked/present in a scene.
   */
  static async findByScene(
    sceneId: string,
    novelId: string,
    userId: string
  ): Promise<Character[]> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const characters = await CharacterRepository.findManyByNovel(novelId, userId);
    const charMap = new Map(characters.map((c) => [c.id, c]));

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("scene_characters")
        .select("character_id")
        .eq("scene_id", sceneId);

      if (error || !data) return [];
      return data
        .map((row) => charMap.get(row.character_id))
        .filter((c): c is Character => Boolean(c));
    }

    const sceneChars = localDevSceneCharactersStore.get(sceneId) || [];
    return sceneChars
      .map((sc) => charMap.get(sc.character_id))
      .filter((c): c is Character => Boolean(c));
  }

  /**
   * Set the list of character IDs present in a scene.
   */
  static async setForScene(
    sceneId: string,
    novelId: string,
    userId: string,
    characterIds: string[]
  ): Promise<boolean> {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return false;

    const supabase = await createClient();

    if (supabase && isSupabaseConfigured) {
      // Delete existing
      await supabase.from("scene_characters").delete().eq("scene_id", sceneId);

      if (characterIds.length > 0) {
        const rows = characterIds.map((charId) => ({
          novel_id: novelId,
          scene_id: sceneId,
          character_id: charId,
          role_in_scene: "present",
        }));
        await supabase.from("scene_characters").insert(rows);
      }
      return true;
    }

    const rows: SceneCharacter[] = characterIds.map((charId) => ({
      id: `sc_char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      novel_id: novelId,
      scene_id: sceneId,
      character_id: charId,
      role_in_scene: "present",
      created_at: new Date().toISOString(),
    }));

    localDevSceneCharactersStore.set(sceneId, rows);
    return true;
  }

  /**
   * Find scene appearances for a character (scenes where character is POV or present).
   */
  static async findAppearancesByCharacter(
    characterId: string,
    novelId: string,
    userId: string
  ): Promise<
    Array<{
      sceneId: string;
      sceneTitle: string;
      chapterId: string;
      isPov: boolean;
    }>
  > {
    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) return [];

    const { localDevScenesStore } = await import("@/features/scenes/repository");
    const scenes = localDevScenesStore.get(novelId) || [];

    const appearances: Array<{
      sceneId: string;
      sceneTitle: string;
      chapterId: string;
      isPov: boolean;
    }> = [];

    for (const sc of scenes) {
      const isPov = sc.pov_character_id === characterId;
      const sceneChars = localDevSceneCharactersStore.get(sc.id) || [];
      const isPresent = sceneChars.some((c) => c.character_id === characterId);

      if (isPov || isPresent) {
        appearances.push({
          sceneId: sc.id,
          sceneTitle: sc.title,
          chapterId: sc.chapter_id,
          isPov,
        });
      }
    }

    return appearances;
  }
}
