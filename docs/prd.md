# PRD: AI Novel Writing Workspace

> **Product Requirements Document (PRD)**  
> **Status:** Version 1.0 (Implemented & Verified)  
> **Working Description:** AI-powered workspace for planning, writing, organizing, and analyzing novels.  
> **Related Documents:** [`SOUL.md`](../SOUL.md) • [`AGENTS.md`](../AGENTS.md) • [`docs/architecture.md`](architecture.md) • [`docs/design.md`](design.md)

---

## Daftar Isi (Table of Contents)

1. [Product Vision & Problem Statement](#1-product-vision--problem-statement)
2. [Target Users & Personas](#2-target-users--personas)
3. [Product Principles](#3-product-principles)
4. [Core Product Loop & User Flow](#4-core-product-loop--user-flow)
5. [Fitur Utama (Functional Scope)](#5-fitur-utama-functional-scope)
   - [5.1 Autentikasi & Profil Pengguna](#51-autentikasi--profil-pengguna)
   - [5.2 Manajemen Novel & Perpustakaan](#52-manajemen-novel--perpustakaan)
   - [5.3 Struktur Naskah (Acts, Chapters, Scenes)](#53-struktur-naskah-acts-chapters-scenes)
   - [5.4 TipTap Editorial Writing Studio](#54-tiptap-editorial-writing-studio)
   - [5.5 Character Bible & Matriks Relasi](#55-character-bible--matriks-relasi)
   - [5.6 Worldbuilding, Lore & World Rules](#56-worldbuilding-lore--world-rules)
   - [5.7 Story Memory Architecture & Fact Extraction](#57-story-memory-architecture--fact-extraction)
   - [5.8 Layered Context Retrieval Engine](#58-layered-context-retrieval-engine)
   - [5.9 Consistency Checker](#59-consistency-checker)
   - [5.10 Story Doctor Narrative Diagnosis](#510-story-doctor-narrative-diagnosis)
   - [5.11 Plot Threads & Interactive Timeline](#511-plot-threads--interactive-timeline)
   - [5.12 Version History & Manuscript Safety](#512-version-history--manuscript-safety)
   - [5.13 Ekspor Naskah (TXT, Markdown, DOCX)](#513-ekspor-naskah-txt-markdown-docx)
6. [Kebutuhan Non-Fungsional (NFR)](#6-kebutuhan-non-fungsional-nfr)
7. [Tech Stack & Data Entities](#7-tech-stack--data-entities)
8. [Batasan Ruang Lingkup (Scope Boundaries)](#8-batasan-ruang-lingkup-scope-boundaries)
9. [Key Product Metrics & Visi Masa Depan](#9-key-product-metrics--visi-masa-depan)

---

## 1. Product Vision & Problem Statement

### 1.1 Visi Produk
Membangun aplikasi yang membantu novelis mentransformasikan ide mentah menjadi novel yang terstruktur, kaya nuansa, dan konsisten. Aplikasi ini bukan sekadar pembuat teks AI instan, melainkan **ruang kerja kreatif terintegrasi dengan Story Intelligence**:
> Penulis tetap memegang otoritas penuh. AI memahami dunia cerita, mengingat fakta lampau, mendampingi proses penulisan, dan menjaga konsistensi kontinuitas.

### 1.2 Problem Statement
Sebelumnya, seorang novelis harus mengelola banyak alat yang terfragmentasi:
- Catatan acak untuk ide mentah;
- Dokumen word terpisah untuk naskah bab;
- Lembar kerja spreadsheet untuk profil karakter dan timeline;
- Chatbot AI generik yang cepat lupa konteks naskah;
- Buku catatan manual untuk aturan sihir / hukum dunia (*world rules*).

**Dampaknya:** Informasi cerita tercerai-berai, detail tokoh mudah terlupakan, linimasa bertentangan, plot thread terbengkalai, dan AI generik sering kali berhalusinasi merusak suara asli penulis. Novel Builder menyatukan seluruh subsistem ini dalam satu ruang kerja yang koheren.

---

## 2. Target Users & Personas

| Persona | Profil & Kebutuhan | Manfaat Novel Builder |
|---|---|---|
| **Primary: Independent Novelist** | Penulis mandiri (debutan atau reguler) yang sedang membangun novel lintas genre (fantasi, misteri, fiksi ilmiah, roman) dan ingin memanfaatkan AI tanpa kehilangan kontrol narasi. | Outline terstruktur, TipTap editor yang hening, character bible terintegrasi, dan memori cerita otomatis. |
| **Secondary: Experienced Author** | Penulis berpengalaman dengan volume novel panjang (50–100+ bab) yang membutuhkan audit kontinuitas dan pemecahan kebuntuan alur. | Consistency Checker bukti naskah, Story Doctor tanpa skor fiktif, pelacak plot threads, dan ekspor multi-format. |

---

## 3. Product Principles

1. **Author First:** AI tidak boleh mengambil alih kendali artistik dan keputusan kreatif.
2. **Story Is the Source of Truth:** Naskah dan data terstruktur penulis adalah otoritas tertinggi, bukan kesimpulan sepihak AI.
3. **Structured + Creative:** Fleksibilitas menulis bebas dipadukan dengan struktur data yang kokoh.
4. **Context-Aware AI:** AI menerima konteks adegan, bab, tokoh, dan memori cerita yang terkurasi, bukan seluruh novel sekaligus.
5. **Non-Destructive AI:** AI dilarang menimpa teks naskah secara diam-diam.
6. **Explainable Findings:** Setiap temuan atau catatan kontinuitas wajib menyertakan bukti dan kutipan naskah asal.

---

## 4. Core Product Loop & User Flow

```text
Ide Mentah
  ↓
Fondasi Cerita & Premis
  ↓
Character Bible & Worldbuilding
  ↓
Struktur Babak (Acts) & Bab (Chapters)
  ↓
Penyusunan Adegan (Scenes) dengan POV & Lokasi
  ↓
Penulisan Naskah Editorial (TipTap + Autosave Debounced)
  ↓
AI Companion (Eksplorasi Ide, Perluasan Dialog, Pertanyaan Pemantik)
  ↓
Ekstraksi Fakta Baru ke Story Memory (Status: Proposed → Confirmed)
  ↓
Pemeriksaan Kontinuitas (Consistency Checker)
  ↓
Diagnosis Naratif (Story Doctor)
  ↓
Revisi Terarah & Snapshot Versi Aman
  ↓
Ekspor Naskah Selesai (Markdown, Teks, Word DOCX)
```

---

## 5. Fitur Utama (Functional Scope)

### 5.1 Autentikasi & Profil Pengguna
- Registrasi, Login email/password, dan Reset Password via Supabase Auth.
- Mode **Masuk Cepat Demo Author (Lokal)** untuk kemudahan eksplorasi antarmuka saat offline / testing.
- Isolasi tenant mutlak: setiap pengguna hanya dapat mengakses novel miliknya sendiri.

### 5.2 Manajemen Novel & Perpustakaan
- Manajemen koleksi novel: Judul, Slug unik, Genre, Premis, Nada (*Tone*), Target Pembaca, dan Status (`planning`, `writing`, `revising`, `completed`, `archived`).
- Kartu ringkasan naskah: Jumlah kata aktual, estimasi durasi baca, persentase target, jumlah bab/tokoh, dan tanggal pembaruan.
- Dialog hapus aman [`DeleteNovelDialog`](../src/features/novels/components/delete-novel-dialog.tsx) dengan konfirmasi modal untuk melindungi karya penulis.

### 5.3 Struktur Naskah (Acts, Chapters, Scenes)
- **Babak (Acts):** Pengelompokan makro struktur dramatik tiga babak (*Three-Act Structure*).
- **Bab (Chapters):** Bab bertingkat dengan judul, sinopsis, target kata, status draft, dan nomor urut.
- **Adegan (Scenes):** Unit penulisan terkecil dengan metadata kontekstual: karakter Sudut Pandang (POV), lokasi kejadian, karakter yang terlibat, tujuan adegan (*purpose*), dan ringkasan naratif.

### 5.4 TipTap Editorial Writing Studio
- Ruang penulisan bersih tanpa distraksi (*writing comes first*).
- Autosave lokal ter-debounce (1-2 detik) dengan indikator visual tersimpan.
- Mode Fokus layar penuh (*Distraction-Free Mode*) via shortcut `F11`.
- Pelacak kata real-time dan estimasi menit membaca.

### 5.5 Character Bible & Matriks Relasi
- Profil mendalam: Peran (Protagonis, Antagonis, Pendukung), Usia, Pekerjaan, Ark Karakter, Motivasi, Ketakutan, Rahasia, dan Latar Belakang.
- Peta relasi dua arah: Tipe relasi (Kawan, Rival, Keluarga, Asmara, Musuh) beserta deskripsi status dinamika hubungan.

### 5.6 Worldbuilding, Lore & World Rules
- **Lokasi:** Peta tempat kejadian, geografi, dan atmosfer.
- **Faksi:** Kelompok masyarakat, pemimpin, tujuan, sekutu, dan musuh.
- **Hukum Dunia (World Rules):** Aturan kausalitas dunia novel bergradasi (Tingkat 1 Catatan Minor s.d. Tingkat 5 Hukum Mutlak).
- **Lore:** Catatan bebas mengenai sejarah, mitologi, sihir, dan teknologi.

### 5.7 Story Memory Architecture & Fact Extraction
- Penyimpanan memori cerita berbasis fakta teratribusi (sumber bab/adegan).
- Klasifikasi status fakta: `confirmed` (diverifikasi penulis) vs `proposed` (usulan AI yang menunggu persetujuan).
- Ekstraksi AI otomatis non-destruktif setelah penulisan adegan.

### 5.8 Layered Context Retrieval Engine
Penyusunan prompt AI secara berjenjang berdasarkan *Context Budget* yang terukur:
```text
Selection Target → Current Scene → Current Chapter → Involved Characters →
Confirmed Story Memories → World Rules → Timeline Events → Active Plot Threads
```

### 5.9 Consistency Checker
- Analisis naskah otomatis untuk mendeteksi kontradiksi fakta karakter, pelanggaran aturan dunia, dan dislokasi waktu.
- Menyajikan temuan sebagai observasi berdasar bukti kutipan (*Evidence-based Observations*), menghormati teknik narator tak andal.

### 5.10 Story Doctor Narrative Diagnosis
- Analisis ritme pacing (adegan lambat vs tergesa-gesa).
- Identifikasi plot threads yang terbengkalai.
- Evaluasi motivasi tokoh tanpa memberikan skor angka subjektif.

### 5.11 Plot Threads & Interactive Timeline
- Pelacakan alur subplot: Diperkenalkan di bab mana, diselesaikan di bab mana, dan statusnya saat ini.
- Garis waktu kronologis peristiwa dengan presisi fleksibel (tanggal absolut, waktu relatif, atau era).

### 5.12 Version History & Manuscript Safety
- Snapshot versi otomatis sebelum operasi penggantian AI (*Replace*).
- Kemampuan perbandingan visual (*diff*) dan pemulihan draf (*restore*).

### 5.13 Ekspor Naskah (TXT, Markdown, DOCX)
- Kompilasi naskah editorial utuh ke format **Markdown (.md)**, **Teks Polos (.txt)**, dan **Word (.docx)**.

---

## 6. Kebutuhan Non-Fungsional (NFR)

| Aspek | Spesifikasi & Standar |
|---|---|
| **Responsivitas Editor** | Keystroke pengetikan instan (< 16ms), tidak ada roundtrip jaringan per-karakter. |
| **Aksesibilitas (a11y)** | Kepatuhan WCAG AA untuk kontras teks (minimal 4.5:1), navigasi keyboard penuh, dan pelabelan ARIA. |
| **Keandalan Naskah** | Kegagalan koneksi atau timeout AI tidak boleh merusak atau menghapus naskah lokal. |
| **Dukungan Novel Panjang** | Mampu menangani naskah 100+ bab, 1000+ adegan, dan puluhan tokoh melalui *hierarchical summaries*. |
| **Privasi Data** | Naskah bersifat privat; data penulis tidak digunakan untuk pelatihan model AI publik. |

---

## 7. Tech Stack & Data Entities

- **Frontend & App Server:** Next.js 15.1.7 (React 19, TypeScript), Tailwind CSS 3.4, shadcn/ui.
- **Editor:** TipTap 2.11 (StarterKit, Link, Placeholder).
- **Database & Retrieval:** PostgreSQL 15, pgvector, Supabase Auth.
- **Validasi:** Zod 3.24 di seluruh batasan Server Action dan schema respons AI.
- **Ekspor Dokumen:** Library native `docx` 9.7 untuk kompilasi berkas Microsoft Word.

```text
Entitas Utama:
users ──< novels ──┬──< acts ──< chapters ──< scenes ──< scene_versions
                   ├──< characters ──< character_relationships
                   ├──< locations, factions, world_rules, world_lore
                   ├──< plot_threads, timeline_events
                   ├──< story_memories, consistency_findings
                   └──< ai_conversations, ai_usage_logs
```

---

## 8. Batasan Ruang Lingkup (Scope Boundaries)

Untuk menjaga fokus dan keandalan sistem penulisan inti, fitur-fitur berikut **secara sengaja tidak disertakan pada MVP**:
- Jejaring sosial dan platform penerbitan publik mandiri;
- Kolaborasi multiplayer real-time bergaya Google Docs (ditargetkan untuk fase pasca-MVP);
- Aplikasi native seluler terpisah (difokuskan pada web responsif prima);
- Generator gambar AI atau sintesis suara AI;
- Pembuatan novel otomatis penuh secara sepihak (*full-novel one-click generation*).

---

## 9. Key Product Metrics & Visi Masa Depan

Bukan mengukur seberapa banyak kata yang diproduksi oleh bot AI, melainkan:
1. **Writing Activation:** Penulis berhasil mendesain novel dan menyelesaikan adegan pertama mereka.
2. **Writing Retention:** Penulis kembali menulis secara konsisten setiap minggu.
3. **Story Integrity:** Inkonsistensi narasi berhasil terdeteksi dan diselesaikan oleh penulis sebelum diterbitkan.
4. **Author Trust:** Penulis merasa aman mempercayakan naskah berharga mereka pada sistem.
