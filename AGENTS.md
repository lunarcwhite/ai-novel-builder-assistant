# AGENTS.md: AI Novel Writing Workspace

> **Operational Guide for Coding Agents**  
> For product philosophy and behavioral principles, read [`SOUL.md`](SOUL.md).  
> For technical specifications, read: [`docs/prd.md`](docs/prd.md) • [`docs/design.md`](docs/design.md) • [`docs/architecture.md`](docs/architecture.md) • [`docs/database-schema.md`](docs/database-schema.md).

---

## Daftar Isi (Table of Contents)

- [Bagian I: Misi & Fondasi Dasar](#bagian-i-misi--fondasi-dasar)
  - [1. Mission](#1-mission)
  - [2. Mandatory Reading](#2-mandatory-reading)
  - [3. General Coding Principles](#3-general-coding-principles)
  - [4. Before Implementing a Feature](#4-before-implementing-a-feature)
- [Bagian II: Database & Keselamatan Naskah](#bagian-ii-database--keselamatan-naskah)
  - [5. Database Rules](#5-database-rules)
  - [6. Manuscript Safety](#6-manuscript-safety)
  - [26. Database Testing](#26-database-testing)
  - [27. Migration Safety](#27-migration-safety)
  - [43. Database Provider Changes](#43-database-provider-changes)
- [Bagian III: AI & Story Memory Architecture](#bagian-iii-ai--story-memory-architecture)
  - [7. AI Rules](#7-ai-rules)
  - [8. Story Memory Rules](#8-story-memory-rules)
  - [9. Context Retrieval Rules](#9-context-retrieval-rules)
  - [10. Never Treat Vector Search as Truth](#10-never-treat-vector-search-as-truth)
  - [11. Prompt Architecture](#11-prompt-architecture)
  - [12. Structured AI Responses](#12-structured-ai-responses)
  - [13. AI Context Privacy](#13-ai-context-privacy)
  - [25. AI Testing](#25-ai-testing)
  - [29. Story Context Performance](#29-story-context-performance)
  - [30. Long Novel Support](#30-long-novel-support)
  - [31. Source Attribution](#31-source-attribution)
  - [32. Consistency Checker](#32-consistency-checker)
  - [33. Story Doctor](#33-story-doctor)
  - [34. No Fake Intelligence](#34-no-fake-intelligence)
  - [42. AI Provider Changes](#42-ai-provider-changes)
  - [45. AI Feature Development Pattern](#45-ai-feature-development-pattern)
- [Bagian IV: Editor, Autosave & UX Penulisan](#bagian-iv-editor-autosave--ux-penulisan)
  - [14. Editor Rules](#14-editor-rules)
  - [15. Autosave](#15-autosave)
  - [16. Version History](#16-version-history)
  - [17. UI Rules](#17-ui-rules)
  - [18. Writing Experience](#18-writing-experience)
  - [19. Accessibility](#19-accessibility)
  - [20. Components](#20-components)
  - [48. Preserve Existing Behavior](#48-preserve-existing-behavior)
- [Bagian V: Kualitas Kode, Validasi & Pengujian](#bagian-v-kualitas-kode-validasi--pengujian)
  - [21. Server / Client Boundary](#21-server--client-boundary)
  - [22. Validation](#22-validation)
  - [23. Error Handling](#23-error-handling)
  - [24. Testing](#24-testing)
  - [28. Performance](#28-performance)
  - [41. Dependencies](#41-dependencies)
  - [44. Feature Development Pattern](#44-feature-development-pattern)
  - [46. When Requirements Are Ambiguous](#46-when-requirements-are-ambiguous)
  - [47. Avoid Premature Refactoring](#47-avoid-premature-refactoring)
- [Bagian VI: Standar Bahasa, Git & Checklist Akhir](#bagian-vi-standar-bahasa-git--checklist-akhir)
  - [35. Documentation](#35-documentation)
  - [36. Git Practices](#36-git-practices)
  - [37. Pull Request Discipline](#37-pull-request-discipline)
  - [38. Before Finishing a Task](#38-before-finishing-a-task)
  - [39. Never Commit Secrets](#39-never-commit-secrets)
  - [40. Environment Variables](#40-environment-variables)
  - [49. Product Language](#49-product-language)
  - [50. UX Language](#50-ux-language)
  - [51. Final Agent Checklist](#51-final-agent-checklist)
  - [52. Final Rule](#52-final-rule)

---

## Bagian I: Misi & Fondasi Dasar

### 1. Mission

Membangun workspace penulisan novel yang andal, aman, dan mudah dirawat.

Prioritas produk (secara berurutan):
1. **Author control** (kendali penuh di tangan penulis)
2. **Manuscript safety** (keamanan data naskah mutlak)
3. **Story integrity** (integritas fakta cerita)
4. **Writing experience** (pengalaman menulis yang tenang & fokus)
5. **Maintainable architecture** (arsitektur modular yang bersih)
6. **Useful AI assistance** (bantuan AI yang solutif & non-intrusif)

> [!NOTE]
> Jangan mengoptimalkan kode semata-mata untuk memperbanyak volume baris atau jumlah fitur. Kualitas dan keandalan jauh lebih utama.

---

### 2. Mandatory Reading & Conflict Resolution

Sebelum membuat perubahan substansial, selalu pelajari dokumentasi terkait:
- [`SOUL.md`](SOUL.md) — Karakter & perilaku produk.
- [`docs/prd.md`](docs/prd.md) — Kebutuhan produk.
- [`docs/design.md`](docs/design.md) — Desain antarmuka & UX.
- [`docs/architecture.md`](docs/architecture.md) — Arsitektur sistem.
- [`docs/database-schema.md`](docs/database-schema.md) — Skema database.

Jika terjadi kontradiksi kebutuhan, gunakan hierarki kedaulatan berikut:
```text
SOUL.md
  ↓
docs/prd.md
  ↓
docs/architecture.md
  ↓
docs/design.md
  ↓
Detail Implementasi Teknis
```
Jika konflik tidak dapat diselesaikan sendiri, **berhenti dan tanyakan pada penulis**, jangan membuat asumsi sepihak.

---

### 3. General Coding Principles

#### 3.1 Prefer Simple Solutions
Gunakan solusi arsitektur paling sederhana yang memenuhi kebutuhan. Jangan memperkenalkan microservices, Redis, Kafka, Elasticsearch, atau event bus kompleks kecuali beban kerja sistem saat ini benar-benar mewajibkannya.

#### 3.2 Modular Monolith First
Arsitektur standar repositori ini adalah:
```text
Next.js (App Router) + PostgreSQL + pgvector + AI Provider
```
Pertahankan batas-batas domain secara rapi tanpa memecah service secara prematur.

#### 3.3 Feature-Oriented Code
Gunakan pengelompokan berbasis fitur domain di `src/features/`:
```text
features/
├── novels/         ├── scenes/        ├── timeline/      ├── ai/
├── chapters/       ├── characters/    ├── plot/          └── consistency/
└── world/          └── memories/
```
Hindari menjadikan folder `utils/`, `helpers/`, atau `services/` sebagai tempat pembuangan kode generik.

---

### 4. Before Implementing a Feature

Ikuti urutan disiplin kerja berikut sebelum menulis kode:
1. Baca kebutuhan (requirements).
2. Periksa kode yang sudah ada (inspect existing code).
3. Identifikasi domain yang terdampak.
4. Identifikasi dampak skema database.
5. Identifikasi dampak otorisasi & keamanan.
6. Terapkan perubahan terkecil yang koheren.
7. Tambahkan atau perbarui unit/integration tests.
8. Jalankan validasi (typecheck, test, lint).
9. Tinjau kembali `git diff`.

---

## Bagian II: Database & Keselamatan Naskah

### 5. Database Rules

#### 5.1 Never Modify Schema Without Migration
Dilarang mengubah skema database produksi secara manual. Setiap perubahan struktur tabel wajib memiliki berkas migrasi SQL versi terurut.

#### 5.2 Foreign Keys Matter
Gunakan Foreign Key untuk relasi kepemilikan data:
- `ON DELETE CASCADE`: Saat entitas anak tidak memiliki arti tanpa induknya (misal: adegan di dalam bab).
- `ON DELETE SET NULL`: Saat entitas anak harus tetap bertahan jika referensinya dihapus.

#### 5.3 Tenant / Ownership Safety
Setiap novel dimiliki oleh user. Setiap entitas cerita harus dapat dirunut jalurnya:
```text
entity → novel → user
```
Jangan pernah mempercayai ID dari input klien. Selalu verifikasi kepemilikan di sisi server.

---

### 6. Manuscript Safety

> [!CAUTION]
> **Data Naskah Adalah Sakral:**
> - **DILARANG** menimpa konten naskah secara sepihak/otomatis.
> - **DILARANG** menghapus teks naskah sebagai bagian dari operasi AI.
> - **DILARANG** menjalankan migrasi destruktif tanpa rencana migrasi cadangan yang aman.
> - Sebelum operasi penggantian AI (*replacement*), buat snapshot versi terlebih dahulu:
>   ```text
>   create version → apply replacement
>   ```

---

### 26. Database Testing

Sebelum mengubah skema:
1. Buat berkas migrasi SQL.
2. Terapkan migrasi di lingkungan lokal.
3. Uji rollback jika didukung.
4. Seed data representatif.
5. Uji integritas foreign keys & cascade behavior.
6. Uji otorisasi tenant per-penulis.

---

### 27. Migration Safety

Untuk migrasi data dalam skala besar, gunakan pola:
```text
expand → migrate → verify → contract
```
Jangan pernah menghapus kolom produksi atau mengubah tipe enum tanpa memeriksa data riil yang ada.

---

### 43. Database Provider Changes

Jangan menyebarkan API khusus vendor database ke seluruh aplikasi. Selalu bungkus akses database di balik abstraksi repository atau service domain.

---

## Bagian III: AI & Story Memory Architecture

### 7. AI Rules

- **7.1 Provider-Agnostic:** Kode aplikasi wajib menggunakan interface `AIProvider`, bukan memanggil SDK vendor AI secara langsung di sembarang file.
- **7.2 API Keys Stay Server-Side:** Kunci rahasia API AI tidak boleh bocor ke browser atau diawali dengan `NEXT_PUBLIC_`.
- **7.3 AI Output Is Not Automatically Truth:** Fakta cerita hasil generasi AI harus berstatus `proposed` sampai dikonfirmasi oleh penulis (`confirmed`).
- **7.4 AI Must Not Silently Modify Manuscript:** Antarmuka harus selalu menyediakan opsi eksplisit: `Accept`, `Insert`, `Replace`, `Dismiss`.

---

### 8. Story Memory Rules

Story Memory adalah domain tingkat pertama (*first-class domain*). Setiap memori wajib memiliki:
- `type` (misal: fakta karakter, world rule, timeline event)
- `content` (isi fakta ringkas)
- `status` (`confirmed` atau `proposed`)
- `source` (atribusi bab atau adegan asal)

---

### 9. Context Retrieval Rules

Jangan mengirim seluruh isi novel ke model AI. Bangun konteks secara bertingkat (*layered context*):
```text
Current selection
  ↓
Current scene
  ↓
Current chapter
  ↓
Relevant characters
  ↓
Relevant memories
  ↓
World rules & Lore
  ↓
Timeline & Plot threads
```

---

### 10. Never Treat Vector Search as Truth

Vector search hanyalah mekanisme pengambilan data (*retrieval*), bukan otoritas kebenaran cerita. Data terstruktur yang ditentukan langsung oleh penulis memiliki otoritas lebih tinggi daripada inferensi AI.

---

### 11. Prompt Architecture

Prompt wajib dipusatkan dan memiliki versioning di folder `src/server/ai/prompts.ts` atau modul domain terkait. Jangan menyebarkan string prompt panjang di dalam komponen React.

Operasi AI harus eksplisit:
`continue_scene`, `rewrite`, `expand`, `improve_prose`, `improve_dialogue`, `critique`, `summarize`, `consistency_check`, `memory_extraction`, `story_analysis`.

---

### 12. Structured AI Responses

Untuk operasi yang dikonsumsi oleh mesin, gunakan structured output (JSON) dan validasi selalu menggunakan **Zod Schema**. Jangan pernah mempercayai output LLM tanpa validasi batas (*boundary validation*).

---

### 13. AI Context Privacy

Hindari pencatatan log (*logging*) berlebihan yang memuat teks naskah utuh atau prompt penuh. Log sistem harus berfokus pada metadata:
`operation`, `model`, `latency`, `token counts`, `status`, `cost`.

---

### 25. AI Testing

Pengujian AI tidak hanya menguji apakah AI mengembalikan teks. Uji pula:
- Validitas schema structured output;
- Inklusi konteks relevan & eksklusi konteks non-relevan;
- Atribusi sumber data;
- Kepatuhan status `proposed`;
- Pencegahan modifikasi naskah destruktif.

---

### 29. Story Context Performance

Optimalkan context retrieval dengan context budget yang terukur, metadata filtering, dan ranking relevansi. Hindari mengambil seluruh data novel sekaligus ke dalam prompt.

---

### 30. Long Novel Support

Arsitektur aplikasi harus mampu mendukung novel panjang: 100+ bab, 1000+ adegan, banyak karakter, dan memori cerita besar melalui ringkasan hierarkis (*hierarchical context rollups*).

---

### 31. Source Attribution

Setiap fitur yang menyatakan referensi cerita ("Cerita Anda menyebutkan bahwa...") wajib menyertakan sumbernya (misal: *Chapter 12, Scene 3*). Ini berlaku mutlak pada **Story Memory**, **Consistency Checker**, dan **Story Doctor**.

---

### 32. Consistency Checker

Temuan inkonsistensi harus disajikan sebagai observasi berbasis bukti:
- Gunakan frasa: `Potensi Masalah / Observasi`
- Jangan gunakan: `Error / Kesalahan Penulis`
- Sadari bahwa kontradiksi yang disengaja (narator tidak andal, misteri, perubahan karakter) adalah teknik sastra yang sah.

---

### 33. Story Doctor

Hindari menciptakan skor buatan seperti "Story Quality Score: 85/100". Sajikan masukan editorial dalam struktur:
```text
Observasi → Bukti Naskah → Kemungkinan Interpretasi → Saran Perbaikan
```

---

### 34. No Fake Intelligence

Jangan menambahkan ornamen visual atau metrik fiktif hanya agar aplikasi tampak "canggih". Setiap fitur AI harus memiliki nilai guna praktis bagi proses kreatif penulis.

---

### 42. AI Provider Changes

Jika mengganti provider AI, perbarui implementasi pada `AIProvider`. Jangan menulis ulang logika aplikasi di sekitar SDK vendor tertentu.

---

### 45. AI Feature Development Pattern

Alur baku pengembangan fitur AI:
```text
Aksi Pengguna → Definisi Operasi → Context Resolver → Context Builder →
Prompt → AI Provider → Zod Validation → Domain Action → Review Penulis
```

---

## Bagian IV: Editor, Autosave & UX Penulisan

### 14. Editor Rules

Editor naskah harus tetap responsif dan lancar (*typing latency* minimal). Keystroke pengetikan dilarang bergantung secara langsung pada request API, inferensi AI, atau roundtrip database.

---

### 15. Autosave Flow

```text
Pengetikan (typing)
  ↓
State lokal editor (TipTap)
  ↓
Debounce timer (1-2 detik)
  ↓
Persistensi server (Server Action)
  ↓
Indikator tersimpan (Saved)
```

> [!IMPORTANT]
> Jika penyimpanan ke server gagal: pertahankan draf lokal, tampilkan status offline/error yang dapat dicoba ulang (*retry*), dan jangan pernah membuang tulisan penulis.

---

### 16. Version History

Buat snapshot versi (*version snapshot*) bermakna pada saat:
- Penulis secara eksplisit menyimpan versi;
- AI melakukan operasi penggantian teks (*Replace*);
- Penulis me-restore versi terdahulu;
- Terjadi operasi editorial mayor.

Jangan membuat entri versi database untuk setiap ketukan tombol.

---

### 17. UI Rules

Patuhi pedoman [`docs/design.md`](docs/design.md):
- Tata letak tenang, visual editorial, whitespace luas, dan kontras terbaca (WCAG AA).
- Hindari cards bertumpuk, gradasi neon berlebihan, efek animasi heboh, atau dashboard bisnis.

---

### 18. Writing Experience

> **Naskah lebih penting daripada antarmuka di sekelilingnya.**

Panel AI, navigasi, toolbar, dan statistik tidak boleh mendominasi atau mengganggu area penulisan naskah utama.

---

### 19. Accessibility

Setiap komponen interaktif wajib mendukung:
- Navigasi keyboard penuh (`Tab`, `Enter`, `Escape`);
- Visible focus outline;
- Atribut semantik (`aria-label`, `<span className="sr-only">`);
- Rasio kontras warna standar WCAG AA (minimal 4.5:1 untuk teks normal).

---

### 20. Components

Buat komponen modular untuk pola yang berulang secara nyata (`SceneNavigator`, `CharacterCard`, `ConsistencyFinding`). Hindari membuat mega-abstraksi generik yang tidak dibutuhkan.

---

### 48. Preserve Existing Behavior

Sebelum mengubah kode bersama (*shared code*): identifikasi pemanggil, pahami perilaku saat ini, dan lakukan perubahan terkecil yang aman tanpa merusak fitur lain.

---

## Bagian V: Kualitas Kode, Validasi & Pengujian

### 21. Server / Client Boundary

Pertahankan isolasi logika server: akses database, API keys, dan embedding generator harus berada di server. Komponen klien hanya menerima data yang dibutuhkan.

---

### 22. Validation

Validasi seluruh input data di perbatasan (*boundary*) menggunakan **Zod**:
- Formulir input pengguna;
- Server actions & API routes;
- Respons terstruktur dari AI.

---

### 23. Error Handling

Pesan kesalahan harus bermakna, solutif, dan aman:
- Jangan tampilkan stack trace internal atau kredensial database kepada pengguna.
- Berikan instruksi pemulihan (misal: "Draf lokal Anda tetap aman. Coba lagi").

---

### 24. Testing

Setiap modul domain wajib memiliki pengujian otomatis (`npm run test`):
- **Unit:** kalkulasi kata, deduplikasi memori, perankingan konteks, logika linimasa.
- **Integration:** alur pembuatan novel, bab, adegan, autosave, dan context retrieval.

---

### 28. Performance

Ukur sebelum melakukan optimasi. Pantau latensi autosave, latensi query database, dan rendering dokumen panjang. Hindari N+1 query dengan index yang tepat.

---

### 41. Dependencies

Sebelum menambahkan package baru, pastikan:
1. Apakah fungsinya benar-benar esensial?
2. Apakah dapat dibuat dengan utilitas yang sudah ada?
3. Apakah meningkatkan bundle size secara berlebihan?
4. Lebih baik meminimalkan jumlah dependensi pihak ketiga.

---

### 44. Feature Development Pattern

Alur baku penambahan fitur domain:
```text
Kebutuhan (PRD) → Model Domain → Skema Database & Migrasi →
Service Domain → Server Action / API → Antarmuka Pengguna (UI) → Automated Tests
```

---

### 46. Ambiguity Protocol

Untuk detail teknis kecil, pilih opsi paling sederhana dan konsisten. Untuk keputusan tingkat produk (kepemilikan cerita, keamanan naskah, operasi destruktif), **selalu tanyakan pada penulis**.

---

### 47. Avoid Premature Refactoring

Fokus pada fitur yang sedang dikerjakan. Jangan merefaktor kode yang tidak terkait di tengah pengerjaan sebuah tugas.

---

## Bagian VI: Standar Bahasa, Git & Checklist Akhir

### 35. Documentation

Ketika arsitektur, skema database, atau perilaku produk berubah, perbarui dokumen terkait:
- Entitas database baru → `docs/database-schema.md`
- Subsistem baru → `docs/architecture.md`
- Kemampuan produk baru → `docs/prd.md`
- Pola UX baru → `docs/design.md`

---

### 36. Git Practices

Gunakan commit kecil dan deskriptif berbasis Conventional Commits:
- `feat: add character arc visualizer`
- `fix: preserve local draft when autosave network fails`
- `test: add context retrieval budget tests`

Jangan mencampuradukkan perubahan yang tidak terkait ke dalam satu commit.

---

### 37. Pull Request Discipline

Setiap PR harus menjelaskan: apa yang berubah, mengapa berubah, berkas yang terdampak, cara pengujian, dan apakah ada perubahan skema database.

---

### 38. Before Finishing a Task

Sebelum menyelesaikan tugas, jalankan verifikasi:
```bash
npm run typecheck    # tsc --noEmit
npm run test         # test suite lengkap
npm run build        # validasi build produksi
git diff             # tinjau perubahan
```

---

### 39. Never Commit Secrets

> [!CAUTION]
> Dilarang memasukkan berkas `.env`, `.env.local`, API keys, password database, atau access tokens ke dalam git history. Gunakan `.env.example` dengan placeholder kosong.

---

### 40. Environment Variables

Variabel publik diizinkan menggunakan prefix `NEXT_PUBLIC_`. Variabel rahasia (API key, service role key) dilarang menggunakan prefix tersebut.

---

### 49. Product Language

Gunakan terminologi domain yang konsisten:
`Novel`, `Act`, `Chapter`, `Scene`, `Character`, `Relationship`, `Location`, `World Rule`, `World Lore`, `Plot Thread`, `Timeline Event`, `Story Memory`, `Consistency Finding`, `Story Doctor`.

---

### 50. UX Language

Aplikasi dirancang untuk mendukung penulis, bukan menghakimi. Hindari bahasa yang meremehkan (*shaming*):
- Hindari: `Tulisan lemah`, `Plot gagal`, `Karakter salah`
- Gunakan: `Observasi`, `Potensi masalah`, `Thread belum terselesaikan`, `Saran perbaikan`

---

### 51. Final Agent Checklist

```text
[ ] Membaca dokumentasi relevan
[ ] Memeriksa kode yang ada
[ ] Mengidentifikasi domain yang terdampak
[ ] Memeriksa dampak database & migrasi
[ ] Memeriksa otorisasi kepemilikan tenant
[ ] Menjaga keselamatan naskah (non-destruktif)
[ ] Menambahkan validasi batas (Zod)
[ ] Menambahkan automated tests
[ ] Memastikan lint & typecheck lolos
[ ] Memastikan npm test lolos 100%
[ ] Memastikan build produksi berhasil
[ ] Memeriksa git diff (bersih dari debug log / secrets)
[ ] Memperbarui dokumentasi terkait
```

---

### 52. Final Rule

Saat menghadapi keraguan, pilihlah:
```text
Sederhana • Aman • Reversibel • Terjelaskan • Dikendalikan Penulis
```
daripada:
```text
Canggih Otomatis • Destruktif • Opaque • Over-Engineered
```
Tujuannya bukan untuk membangun sistem AI yang paling memukau, melainkan alat kerja yang dapat dipercaya sepenuhnya oleh seorang novelis untuk menjaga cerita yang mereka cintai.

---

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Before starting, ask the user when antislop applies: during the work, or after it is done.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
