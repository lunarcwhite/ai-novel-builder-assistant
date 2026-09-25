# DATABASE-SCHEMA.md: AI Novel Writing Workspace

> **Relational & Vector Database Specification**  
> **Status:** Version 1.0 (Implemented & Verified)  
> **Engine:** PostgreSQL 15 + pgvector (`vector(1536)`)  
> **Related Documents:** [`SOUL.md`](../SOUL.md) • [`AGENTS.md`](../AGENTS.md) • [`docs/prd.md`](prd.md) • [`docs/architecture.md`](architecture.md)

---

## Daftar Isi (Table of Contents)

1. [Strategi & Konvensi Basis Data](#1-strategi--konvensi-basis-data)
2. [Peta Relasi Entitas (Entity-Relationship Overview)](#2-peta-relasi-entitas-entity-relationship-overview)
3. [Tipe Data Enum & Domain Checks](#3-tipe-data-enum--domain-checks)
4. [Skema Tabel Inti (Core Tables)](#4-skema-tabel-inti-core-tables)
   - [4.1 `user_profiles`](#41-user_profiles)
   - [4.2 `novels`](#42-novels)
   - [4.3 `acts`](#43-acts)
   - [4.4 `chapters`](#44-chapters)
   - [4.5 `scenes`](#45-scenes)
   - [4.6 `scene_versions`](#46-scene_versions)
5. [Skema Story Bible (Characters & World)](#5-skema-story-bible-characters--world)
   - [5.1 `characters`](#51-characters)
   - [5.2 `character_relationships`](#52-character_relationships)
   - [5.3 `locations`](#53-locations)
   - [5.4 `factions`](#54-factions)
   - [5.5 `world_rules`](#55-world_rules)
   - [5.6 `world_lore`](#56-world_lore)
6. [Skema Alur Cerita & Linimasa (Plot & Timeline)](#6-skema-alur-cerita--linimasa-plot--timeline)
   - [6.1 `plot_threads`](#61-plot_threads)
   - [6.2 `timeline_events`](#62-timeline_events)
7. [Skema Story Memory & AI Intelligence](#7-skema-story-memory--ai-intelligence)
   - [7.1 `story_memories`](#71-story_memories)
   - [7.2 `consistency_findings`](#72-consistency_findings)
   - [7.3 `ai_usage_logs`](#73-ai_usage_logs)
8. [Strategi Indexing & Vector Search](#8-strategi-indexing--vector-search)
9. [Keamanan Tenant, RLS & Trigger](#9-keamanan-tenant-rls--trigger)

---

## 1. Strategi & Konvensi Basis Data

1. **Relational Truth:** Data relasional PostgreSQL adalah sumber kebenaran mutlak; data vektor hanya digunakan untuk akselerasi *semantic retrieval*.
2. **Primary Key:** Seluruh tabel menggunakan tipe `UUID` dengan default `gen_random_uuid()`.
3. **Timestamp:** Seluruh entitas memiliki `created_at timestamptz default now()` dan `updated_at timestamptz default now()` dalam zona waktu UTC.
4. **Penamaan:** Standar `snake_case` untuk tabel dan kolom.
5. **Foreign Key:** Hubungan kepemilikan wajib diverifikasi secara eksplisit dengan aturan `ON DELETE CASCADE` (jika entitas anak tidak berarti tanpa induk) atau `ON DELETE SET NULL` (jika entitas anak harus bertahan saat referensi terhapus).

---

## 2. Peta Relasi Entitas (Entity-Relationship Overview)

```text
auth.users
  │ (1:1)
  ├──> user_profiles
  │
  │ (1:N)
  └──> novels
        │
        ├── acts ──> chapters ──> scenes ──> scene_versions
        │
        ├── characters ──> character_relationships
        │
        ├── locations, factions, world_rules, world_lore
        │
        ├── plot_threads, timeline_events
        │
        ├── story_memories (pgvector)
        │
        ├── consistency_findings
        │
        └── ai_usage_logs
```

---

## 3. Tipe Data Enum & Domain Checks

| Nama Enum / Check | Nilai yang Diizinkan | Domain / Penggunaan |
|---|---|---|
| `novel_status` | `planning`, `writing`, `revising`, `completed`, `archived` | Status progres novel |
| `chapter_status` | `planned`, `draft`, `in_progress`, `completed`, `revising` | Status penyusunan bab |
| `scene_status` | `planned`, `draft`, `in_progress`, `completed`, `revising` | Status penulisan adegan |
| `memory_type` | `character_fact`, `relationship_fact`, `world_fact`, `timeline_fact`, `plot_fact`, `story_fact` | Klasifikasi fakta memori |
| `memory_status` | `proposed`, `confirmed`, `rejected`, `archived` | Otoritas status memori |
| `plot_thread_status` | `planned`, `active`, `resolved`, `abandoned` | Status subplot naratif |
| `timeline_precision`| `exact`, `day`, `month`, `year`, `relative`, `unknown` | Presisi penanggalan peristiwa |
| `consistency_severity`| `info`, `warning`, `critical` | Bobot temuan inkonsistensi |
| `consistency_status`| `open`, `dismissed`, `resolved` | Status tindakan penulis |

---

## 4. Skema Tabel Inti (Core Tables)

### 4.1 `user_profiles`
Menyimpan profil dan preferensi penulis (terhubung 1:1 ke `auth.users`).

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Referensi ke `auth.users.id ON DELETE CASCADE` |
| `pen_name` | `varchar(100)` | Nama pena penulis |
| `bio` | `text` | Biografi singkat penulis |
| `created_at` | `timestamptz` | Timestamp pembuatan entri |
| `updated_at` | `timestamptz` | Timestamp pembaruan terakhir |

### 4.2 `novels`
Pusat dari seluruh karya penulisan.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `user_id` | `uuid NOT NULL` | Pemilik novel (`auth.users.id ON DELETE CASCADE`) |
| `title` | `varchar(255) NOT NULL` | Judul novel |
| `slug` | `varchar(255) NOT NULL` | Identifier ramah URL (unik per user) |
| `genre` | `varchar(100)` | Genre utama (misal: Fantasy, Mystery) |
| `premise` | `text` | Premis singkat cerita |
| `theme` | `text` | Tema filosofis inti |
| `tone` | `varchar(100)` | Nada narasi (misal: Dark, Whimsical, Gritty) |
| `target_audience` | `varchar(100)` | Target pembaca |
| `target_word_count` | `integer` | Target jumlah kata (default: 80.000) |
| `status` | `novel_status NOT NULL` | Default: `'planning'` |
| `created_at` / `updated_at` | `timestamptz` | Standar timestamp |

### 4.3 `acts`
Babak makro cerita (misal: Act I, Act II, Act III).

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `title` | `varchar(255) NOT NULL` | Judul babak |
| `sort_order` | `integer NOT NULL` | Urutan babak |
| `created_at` / `updated_at` | `timestamptz` | Standar timestamp |

### 4.4 `chapters`
Bab naskah cerita.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `act_id` | `uuid` | Referensi opsional ke `acts.id ON DELETE SET NULL` |
| `title` | `varchar(255) NOT NULL` | Judul bab |
| `synopsis` | `text` | Ringkasan alur bab |
| `sort_order` | `integer NOT NULL` | Urutan bab di dalam novel |
| `target_word_count` | `integer` | Target kata bab (default: 3.000) |
| `status` | `chapter_status NOT NULL`| Default: `'planned'` |
| `created_at` / `updated_at` | `timestamptz` | Standar timestamp |

### 4.5 `scenes`
Unit penulisan naskah terkecil dengan konteks naratif.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `chapter_id` | `uuid NOT NULL` | Referensi ke `chapters.id ON DELETE CASCADE` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `title` | `varchar(255) NOT NULL` | Judul / label adegan |
| `content` | `text NOT NULL` | Isi naskah editorial (HTML TipTap) |
| `word_count` | `integer NOT NULL` | Jumlah kata terhitung aktual |
| `sort_order` | `integer NOT NULL` | Urutan adegan dalam bab |
| `pov_character_id` | `uuid` | Karakter sudut pandang (`characters.id ON DELETE SET NULL`) |
| `location_id` | `uuid` | Lokasi adegan (`locations.id ON DELETE SET NULL`) |
| `purpose` | `text` | Tujuan dramatik adegan |
| `summary` | `text` | Ringkasan kejadian untuk context rollups |
| `status` | `scene_status NOT NULL` | Default: `'draft'` |
| `created_at` / `updated_at` | `timestamptz` | Standar timestamp |

### 4.6 `scene_versions`
Snapshot riwayat revisi dan cadangan sebelum modifikasi AI.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `scene_id` | `uuid NOT NULL` | Referensi ke `scenes.id ON DELETE CASCADE` |
| `content` | `text NOT NULL` | Snapshot teks naskah |
| `word_count` | `integer NOT NULL` | Jumlah kata pada versi tersebut |
| `version_number` | `integer NOT NULL` | Nomor versi bertahap |
| `created_by` | `varchar(50) NOT NULL` | Pembuat versi (`'user'` atau `'ai'`) |
| `label` | `varchar(255)` | Keterangan alasan pembuatan versi |
| `created_at` | `timestamptz` | Waktu snapshot diambil |

---

## 5. Skema Story Bible (Characters & World)

### 5.1 `characters`
Profil tokoh cerita.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `name` | `varchar(255) NOT NULL` | Nama karakter |
| `role` | `varchar(50) NOT NULL` | `protagonist`, `antagonist`, `supporting`, `minor` |
| `description` | `text` | Penampilan fisik & ciri khas |
| `personality` | `text` | Karakteristik psikologis |
| `motivation` | `text` | Dorongan / motif tindakan |
| `goal` | `text` | Sasaran yang ingin dicapai |
| `arc` | `text` | Rencana perkembangan karakter |
| `notes` | `text` | Catatan tambahan |

### 5.2 `character_relationships`
Hubungan antar dua tokoh.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `character_a_id` | `uuid NOT NULL` | Referensi ke `characters.id ON DELETE CASCADE` |
| `character_b_id` | `uuid NOT NULL` | Referensi ke `characters.id ON DELETE CASCADE` |
| `relationship_type` | `varchar(100) NOT NULL`| Tipe hubungan (misal: *Allies*, *Rivals*, *Family*) |
| `description` | `text` | Dinamika hubungan saat ini |

### 5.3 `locations`, `factions`, `world_rules`, `world_lore`
- **`locations`:** `id`, `novel_id`, `name`, `description`, `atmosphere`.
- **`factions`:** `id`, `novel_id`, `name`, `purpose`, `leader_name`.
- **`world_rules`:** `id`, `novel_id`, `rule_text`, `consequence`, `importance` (integer 1-5).
- **`world_lore`:** `id`, `novel_id`, `title`, `category`, `content`.

---

## 6. Skema Alur Cerita & Linimasa (Plot & Timeline)

### 6.1 `plot_threads`
Pelacakan alur subplot dan resolusi cerita.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `title` | `varchar(255) NOT NULL` | Nama / premis subplot |
| `description` | `text` | Detail taruhan naratif |
| `introduced_chapter_id` | `uuid` | Bab awal thread muncul |
| `resolved_chapter_id` | `uuid` | Bab thread tuntas |
| `status` | `varchar(50) NOT NULL` | CHECK: `planned`, `active`, `resolved`, `abandoned` |

### 6.2 `timeline_events`
Peristiwa kronologis linimasa.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `title` | `varchar(255) NOT NULL` | Nama peristiwa |
| `description` | `text` | Apa yang terjadi |
| `date_value` | `text` | Nilai tanggal / hari (misal: "Hari ke-47") |
| `relative_time` | `text` | Waktu relatif (misal: "3 hari sebelum perang") |
| `date_precision` | `varchar(50) NOT NULL` | CHECK: `exact`, `day`, `month`, `year`, `relative`, `unknown` |
| `chapter_id` | `uuid` | Bab yang mendokumentasikan kejadian |
| `location_id` | `uuid` | Lokasi kejadian |

---

## 7. Skema Story Memory & AI Intelligence

### 7.1 `story_memories`
Memori fakta novel teratribusi dengan dukungan vector embedding.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `type` | `memory_type NOT NULL` | Tipe fakta cerita |
| `content` | `text NOT NULL` | Isi fakta naskah ringkas |
| `status` | `memory_status NOT NULL`| Default: `'proposed'` (menunggu konfirmasi) |
| `source_type` | `varchar(50)` | `'scene'`, `'chapter'`, `'character'`, dll. |
| `source_id` | `uuid` | ID entitas naskah rujukan asal |
| `source_label` | `varchar(255)` | Label yang mudah dibaca (misal: "Bab 2, Adegan 1") |
| `embedding` | `vector(1536)` | Vektor embedding teks fakta |
| `created_at` / `updated_at` | `timestamptz` | Standar timestamp |

### 7.2 `consistency_findings`
Temuan observasi inkonsistensi naskah.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi ke `novels.id ON DELETE CASCADE` |
| `type` | `varchar(50) NOT NULL` | `character`, `world_rule`, `timeline`, `plot` |
| `severity` | `consistency_severity` | `info`, `warning`, `critical` |
| `description` | `text NOT NULL` | Penjelasan observasi perbedaan fakta |
| `source_ids` | `jsonb NOT NULL` | Array bukti kutipan: `[{ label, excerpt }]` |
| `status` | `consistency_status` | Default: `'open'` |
| `created_at` / `updated_at` | `timestamptz` | Standar timestamp |

### 7.3 `ai_usage_logs`
Audit jejak operasional AI untuk privasi dan pemantauan biaya.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Default: `gen_random_uuid()` |
| `novel_id` | `uuid NOT NULL` | Referensi novel |
| `operation` | `varchar(100) NOT NULL`| Misal: `rewrite`, `consistency_check` |
| `model` | `varchar(100) NOT NULL`| Model LLM yang digunakan |
| `prompt_tokens` | `integer` | Jumlah token prompt |
| `completion_tokens` | `integer` | Jumlah token respons |
| `latency_ms` | `integer` | Waktu eksekusi dalam milidetik |
| `created_at` | `timestamptz` | Timestamp eksekusi |

---

## 8. Strategi Indexing & Vector Search

Untuk memastikan performa tetap instan pada novel panjang:
1. **Index Komposit:**
   ```sql
   create index idx_chapters_novel_order on chapters (novel_id, sort_order);
   create index idx_scenes_chapter_order on scenes (chapter_id, sort_order);
   create index idx_memories_novel_status on story_memories (novel_id, status);
   ```
2. **Index Vektor HNSW / IVFFlat:**
   ```sql
   create index idx_story_memories_embedding
     on story_memories
     using hnsw (embedding vector_cosine_ops);
   ```

---

## 9. Keamanan Tenant, RLS & Trigger

- **Row Level Security (RLS):** Diaktifkan di seluruh tabel dengan memeriksa kepemilikan user pada tabel `novels`:
  ```sql
  create policy "Users own their novels" on novels
    for all using (auth.uid() = user_id);
  ```
- **Trigger `updated_at`:** Diterapkan secara otomatis pada setiap mutasi data untuk menjamin akurasi waktu pembaruan naskah.
- **Pencegahan Data Yatim:** Seluruh entitas anak memiliki foreign key bertingkat menuju `novel_id`, menjamin tidak ada data yang tertinggal saat novel dihapus secara sah.
