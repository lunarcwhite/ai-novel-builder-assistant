# ARCHITECTURE.md: AI Novel Writing Workspace

> **System Architecture & Technical Specification**  
> **Status:** Version 1.0 (Implemented & Verified)  
> **Related Documents:** [`SOUL.md`](../SOUL.md) • [`AGENTS.md`](../AGENTS.md) • [`docs/prd.md`](prd.md) • [`docs/database-schema.md`](database-schema.md) • [`docs/design.md`](design.md)

---

## Daftar Isi (Table of Contents)

- [1. Architecture Goals & Strategy](#1-architecture-goals--strategy)
- [2. Recommended Technology Stack](#2-recommended-technology-stack)
- [3. High-Level Architecture & Logical Layers](#3-high-level-architecture--logical-layers)
- [4. Feature-Based Organization (`src/features/`)](#4-feature-based-organization-srcfeatures)
- [5. Core Domain Data Model](#5-core-domain-data-model)
- [6. Story Context Engine Subsystem](#6-story-context-engine-subsystem)
- [7. Story Memory & Hybrid Retrieval Pipeline](#7-story-memory--hybrid-retrieval-pipeline)
- [8. AI Provider Abstraction & Pipeline](#8-ai-provider-abstraction--pipeline)
- [9. Editor, Autosave & Version History](#9-editor-autosave--version-history)
- [10. Consistency Checker & Story Doctor Engine](#10-consistency-checker--story-doctor-engine)
- [11. Security, Authorization & Tenant Safety](#11-security-authorization--tenant-safety)
- [12. Deployment, Caching & Performance](#12-deployment-caching--performance)
- [13. Architectural Evolution & Summary](#13-architectural-evolution--summary)

---

## 1. Architecture Goals & Strategy

Arsitektur aplikasi Novel Builder dirancang berdasarkan 9 tujuan utama:
1. **Sederhana & Terukur:** Tidak memperkenalkan microservices sebelum skala beban kerja benar-benar mewajibkannya (*Modular Monolith First*).
2. **Kedaulatan Penulis & Keamanan Naskah:** Setiap perubahan AI bersifat non-destruktif dan reversibel; data naskah disimpan dengan snapshot versi.
3. **Provider-Agnostic AI:** Tidak terikat pada satu vendor AI; LLM dapat diganti tanpa merombak logika aplikasi.
4. **Dukungan Novel Panjang:** Mampu menangani novel 100+ bab dan 1000+ adegan melalui ringkasan hierarkis (*Hierarchical Context Rollups*).
5. **Story Context sebagai First-Class Domain:** Konteks cerita bukan sekadar string prompt, melainkan subsistem domain terstruktur.
6. **Autosave Lokal Tanpa Latensi:** Pengetikan naskah berjalan instan tanpa menunggu respons API atau roundtrip jaringan.
7. **Isolasi Tenant Ketat:** Setiap data cerita terikat pada hierarki `user_id → novel_id → entity_id`.
8. **Operasional Rendah Biaya:** Menggunakan PostgreSQL + pgvector terpadu tanpa memerlukan vector database terpisah pada MVP.
9. **Kepatuhan SOUL.md:** Setiap keputusan teknis menjaga agar penulis tetap menjadi pemilik dan pengarah karya.

---

## 2. Recommended Technology Stack

| Komponen Sistem | Teknologi Terpilih | Peran & Tanggung Jawab |
|---|---|---|
| **App Framework** | **Next.js 15.1.7 (App Router)** | Server Components, Server Actions, API routes, dan client interactivity. |
| **Bahasa & Runtime** | **TypeScript 5 (Strict Mode) / Node.js 22** | Menjamin keamanan tipe data di seluruh batasan klien dan server. |
| **Antarmuka & Styling** | **Tailwind CSS 3.4 + Radix UI + Lucide** | Desain editorial responsif, tema gelap/terang, dan kepatuhan a11y WCAG AA. |
| **Editor Naskah** | **TipTap 2.11 (ProseMirror)** | Engine rich-text, autosave debounced, pemulihan draf, dan word count. |
| **Database & Vector** | **PostgreSQL 15 + pgvector** | Penyimpanan relasional naskah, metadata, memori cerita, dan embeddings. |
| **Otentikasi & Storage** | **Supabase Auth & Storage** | Manajemen sesi pengguna, session guard, dan ekspor berkas naskah. |
| **Validasi Skema** | **Zod 3.24** | Validasi input form, server actions, dan output terstruktur AI. |
| **Ekspor Dokumen** | **docx 9.7** | Pembuatan berkas Word (.docx) native di sisi server. |

---

## 3. High-Level Architecture & Logical Layers

```text
                                  PENULIS (BROWSER)
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │   Next.js Client    │
                               │ TipTap • UI • State │
                               └──────────┬──────────┘
                                          │ Server Actions / API
                                          ▼
                               ┌─────────────────────┐
                               │  Application Layer  │
                               │  Auth Guard • Zod   │
                               └──────────┬──────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
          Story Domain           Writing Domain           AI Context Engine
     Novels, Structure, Bible  TipTap Autosave, Version   Resolver, Budget, Prompts
                  │                       │                       │
                  └───────────────────────┼───────────────────────┘
                                          ▼
                               ┌─────────────────────┐
                               │  Persistence Layer  │
                               │ PostgreSQL + Vector │
                               └──────────┬──────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │ AI Provider Adapter │
                               │  OpenAI / Anthropic │
                               └─────────────────────┘
```

### Lapisan Kode (Code Layers)
- `src/app/`: Rute antarmuka, layout, error boundary, dan endpoint API.
- `src/components/`: Komponen antarmuka atomik (`ui/`), editor (`editor/`), dan outline (`outline/`).
- `src/features/`: Modul domain bisnis independen (service, query, action, types).
- `src/server/actions/`: Entry point Server Actions yang terlindungi otorisasi dan validasi Zod.
- `src/server/ai/`: Abstraksi provider AI, context builder, prompt catalog, dan validator JSON.
- `src/db/`: Berkas migrasi skema SQL terurut.

---

## 4. Feature-Based Organization (`src/features/`)

Setiap domain novel diisolasi dalam modul fiturnya masing-masing untuk mencegah dependensi silang yang tidak terkontrol:

```text
src/features/
├── novels/         # Manajemen perpustakaan novel & kalkulasi kemajuan kata
├── structure/      # Hierarki babak (acts), bab (chapters), urutan posisi
├── scenes/         # Draf adegan, autosave, snapshot versi, metadata POV
├── characters/     # Karakter, atribut, busur emosi, matriks relasi
├── world/          # Lokasi, faksi, aturan kausalitas (world rules), lore
├── memories/       # Ekstraksi fakta, memori teratribusi, status confirmed/proposed
├── ai/             # Abstraksi AIProvider, prompt contracts, streaming
├── consistency/    # Pemeriksa kontradiksi naskah berdasar bukti kutipan
├── plot/           # Manajemen plot threads dan linimasa kronologis
├── doctor/         # Diagnosis naratif editorial (pacing, motivasi, subplot)
└── summaries/      # Sintesis ringkasan hierarkis (scene → chapter → act → novel)
```

---

## 5. Core Domain Data Model

```text
users (Supabase Auth)
  │
  └── user_profiles (kuota, preferensi)
  │
  └── novels (judul, genre, premis, tone, target_audience)
       │
       ├── acts (babak I, II, III)
       │    └── chapters (bab, sinopsis, target kata)
       │         └── scenes (adegan, POV, lokasi, teks naskah)
       │              └── scene_versions (snapshot riwayat versi)
       │
       ├── characters (nama, peran, ark, motivasi)
       │    └── character_relationships (kawan, musuh, rival)
       │
       ├── locations (tempat, atmosfer, geografi)
       ├── factions (kelompok, faksi, pemimpin)
       ├── world_rules (aturan kausalitas dunia tingkat 1 - 5)
       ├── world_lore (catatan mitologi, sihir, sejarah)
       │
       ├── plot_threads (subplot aktif / selesai)
       ├── timeline_events (peristiwa linimasa, tanggal/relatif)
       │
       ├── story_memories (fakta naskah + pgvector embedding)
       ├── consistency_findings (observasi kontradiksi + kutipan bukti)
       │
       └── ai_usage_logs (metadata latensi, token, biaya)
```

---

## 6. Story Context Engine Subsystem

> **Keputusan Arsitektur Kunci:** Konteks cerita adalah sistem domain tersendiri, bukan sekadar string prompt yang dirangkai secara manual.

```text
Input Permintaan (novelId, sceneId, query)
  │
  ▼
[Context Resolver]
  ├─ 1. Ambil Scene aktif & teks naskah terkini
  ├─ 2. Ambil Bab induk & ringkasan bab sebelumnya
  ├─ 3. Ambil Karakter POV & Karakter yang hadir di adegan
  ├─ 4. Ambil Lokasi kejadian & aturan dunia terkait
  └─ 5. Ambil Fakta memori terkonfirmasi (status = confirmed)
  │
  ▼
[Context Budgeting & Ranking]
  ├─ Prioritas Tertinggi: Teks terpilih / adegan aktif
  ├─ Prioritas Tinggi: Karakter POV & Memori terkonfirmasi
  ├─ Prioritas Sedang: Linimasa & Plot threads aktif
  └─ Potong konteks jika melebihi alokasi token budget (misal: 4.000 token)
  │
  ▼
[Prompt Builder] ──> Menghasilkan prompt terstruktur untuk AIProvider
```

---

## 7. Story Memory & Hybrid Retrieval Pipeline

Memori cerita menyimpan fakta spesifik novel yang wajib dihormati oleh AI:
1. **Atribusi Sumber:** Setiap memori memiliki referensi asal (`source_type: scene`, `source_id: uuid`).
2. **Status Konfirmasi:**
   - `confirmed`: Fakta mapan yang telah ditetapkan atau disetujui penulis.
   - `proposed`: Usulan hasil ekstraksi otomatis AI yang masih menunggu persetujuan.
3. **Pencarian Hibrida (Hybrid Retrieval):**
   - **Semantic Search:** Menggunakan vektor embedding (`vector(1536)` / pgvector) dengan cosine similarity (`<=>`).
   - **Metadata Filtering:** Selalu memfilter berdasarkan `novel_id` dan `status = confirmed`.
   - **Keyword Fallback:** Pencarian teks eksak jika model embedding offline.

---

## 8. AI Provider Abstraction & Pipeline

Aplikasi tidak mengimpor SDK vendor AI di sembarang file. Seluruh interaksi AI diisolasi melalui interface `AIProvider`:

```typescript
export interface AIProvider {
  id: string;
  generateText(prompt: string, options?: AIOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
}
```

### Alur Eksekusi AI Non-Destruktif
```text
Penulis Memicu Aksi (Rewrite / Expand / Diagnose)
  ↓
Server Action mengumpulkan konteks via Context Engine
  ↓
AI Provider menghasilkan respons terstruktur (JSON tervalidasi Zod)
  ↓
Antarmuka menampilkan panel Saran AI (Accept, Insert, Replace, Dismiss)
  ↓
Jika penulis memilih "Replace": buat SceneVersion snapshot → terapkan ke naskah
```

---

## 9. Editor, Autosave & Version History

Untuk menjamin kenyamanan proses menulis (*writing flow*):
- **Local State First:** Pengetikan berlangsung instan di state ProseMirror TipTap tanpa menunggu jaringan.
- **Debounced Server Sync:** Perubahan disimpan otomatis ke server setelah jeda 1-2 detik tanpa ketukan tombol baru.
- **Offline Resilience:** Jika koneksi terputus, draf lokal dipertahankan dan indikator offline ditampilkan; tidak ada kata yang dibuang.
- **Safe Versioning:** Snapshot versi dibuat otomatis saat operasi *Replace* AI atau saat penulis mengeklik simpan versi secara manual.

---

## 10. Consistency Checker & Story Doctor Engine

- **Consistency Checker:**
  - Menggabungkan aturan dunia, memori karakter, linimasa, dan teks adegan.
  - Menggunakan Zod Schema untuk memvalidasi temuan.
  - Menyajikan temuan sebagai `Potensi Inkonsistensi` dengan menyandingkan Bukti Sumber A dan Bukti Sumber B.
- **Story Doctor:**
  - Analisis makro struktur cerita (ritme kata per bab, kepadatan konflik, plot thread yang belum terselesaikan).
  - Menyajikan observasi editorial objektif tanpa skor angka fiktif.

---

## 11. Security, Authorization & Tenant Safety

> [!IMPORTANT]
> **Aturan Keamanan Data:**
> 1. **Server-Side Secrets:** `AI_API_KEY`, `DATABASE_URL`, dan `SUPABASE_SERVICE_ROLE_KEY` hanya boleh diakses di sisi server.
> 2. **Tenant Verification:** Setiap query database wajib memverifikasi bahwa entitas yang diminta berada di bawah `novel_id` milik `user_id` yang sedang login.
> 3. **Sanitasi Konten:** Konten naskah HTML TipTap disanitasi sebelum disimpan untuk mencegah serangan XSS.

---

## 12. Deployment, Caching & Performance

- **Deployment Model:** Arsitektur terpadu di Vercel / server Node.js dengan database managed Supabase PostgreSQL.
- **Dukungan Offline Demo:** Mode demo lokal memungkinkan pengujian UI dan navigasi naskah tanpa koneksi database eksternal.
- **Caching Ringkasan:** Ringkasan bab dan adegan di-cache untuk menghindari pemanggilan LLM berulang pada naskah yang tidak berubah.
- **Optimalisasi Query:** Index komposit dibuat pada foreign keys utama (`novel_id, sort_order`, `novel_id, status`).

---

## 13. Architectural Evolution & Summary

Arsitektur Novel Builder dirancang untuk tumbuh secara organik:
```text
Modular Monolith (Sekarang: 187 tests, 11 fase lengkap)
  ↓ (Jika pengguna & beban bertambah)
Background Worker Queue (Pemisahan pemrosesan AI berat / embeddings)
  ↓ (Jika skala enterprise)
Dedicated Story Intelligence Microservices
```

Sistem membuktikan bahwa arsitektur yang sederhana, aman, dan disiplin mampu memberikan pengalaman penulisan yang luar biasa tanpa komplikasi infrastruktur yang berlebihan.
