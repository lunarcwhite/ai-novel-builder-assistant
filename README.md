# Novel Builder: AI Novel Writing Workspace

> **The author owns the story.** AI membantu proses kreatif; kendali dan keputusan naskah sepenuhnya di tangan penulis.

Ruang kerja penulisan novel terintegrasi yang dirancang untuk membantu novelis berpikir, membangun dunia, menulis naskah, melacak alur waktu, menguji konsistensi, dan merevisi cerita secara aman dan terfokus.

---

## Ringkasan Proyek

- **Status:** Selesai (Fase 0 – 11 Lengkap & Terverifikasi)
- **Cakupan Pengujian:** 187 automated tests (59 test suites) lolos 100%
- **Arsitektur:** Modular Monolith (Next.js 15 App Router + Server Actions + Supabase / PostgreSQL)
- **Filosofi & Pedoman:** Mengikuti [`SOUL.md`](SOUL.md) dan [`AGENTS.md`](AGENTS.md)

---

## Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Tech Stack](#tech-stack)
3. [Mulai Cepat (Demo Lokal)](#mulai-cepat-demo-lokal)
4. [Konfigurasi Penuh (Supabase + AI)](#konfigurasi-penuh-supabase--ai)
5. [Daftar Perintah (Scripts)](#daftar-perintah-scripts)
6. [Struktur Repositori](#struktur-repositori)
7. [Prinsip Non-Negosiasi](#prinsip-non-negosiasi)
8. [Indeks Dokumentasi](#indeks-dokumentasi)

---

## Fitur Utama

| Modul | Deskripsi & Kemampuan |
|---|---|
| **Studio Naskah (TipTap)** | Editor editorial bebas distraksi, autosave lokal ter-debounce, riwayat snapshot versi, mode fokus layar penuh, dan pelacak target kata. |
| **Struktur Cerita** | Hierarki Babak (Acts), Bab (Chapters), dan Adegan (Scenes) dengan drag/reorder dan penanda karakter POV serta lokasi kejadian. |
| **Character Bible** | Profil tokoh mendalam, status POV/Active, arc emosional, motivasi, dan matriks relasi antar-karakter. |
| **World Lore & Rules** | Catatan dunia, faksi, lokasi, dan hukum kausalitas dunia novel bergradasi (Tingkat 1 s.d. 5). |
| **Story Memory Engine** | Memori cerita berbasis fakta teratribusi (sumber bab/adegan), klasifikasi `confirmed` vs `proposed`, dan ekstraksi otomatis tanpa halusinasi. |
| **Context Retrieval Berlapis** | Penyiapan konteks multi-layer (adegan saat ini → bab → karakter → memori → timeline) dengan batasan context budget yang ketat. |
| **Consistency Checker** | Deteksi kontradiksi berbasis bukti (evidence-based observations) tanpa memberi vonis mutlak atau merusak naskah. |
| **Story Doctor** | Diagnosis naratif objektif (ritme pacing, busur karakter, plot thread tak terselesaikan) tanpa skor angka buatan. |
| **Plot & Timeline** | Garis waktu kronologis dengan presisi waktu fleksibel (tanggal pasti, relatif, atau era) serta status thread terbuka/selesai. |
| **Ekspor Naskah** | Kompilasi naskah utuh ke format **Markdown (.md)**, **Teks Polos (.txt)**, dan dokumen **Word (.docx)**. |

---

## Tech Stack

- **Framework:** Next.js 15.1.7 (React 19, TypeScript strict mode)
- **Styling & UI:** Tailwind CSS 3.4, shadcn/ui primitives, Radix UI Dialog, Lucide Icons
- **Editor Naskah:** TipTap 2.11 (StarterKit, Link, Placeholder)
- **Validasi Schema:** Zod 3.24
- **Database & Auth:** Supabase (PostgreSQL 15 + pgvector + Row-Level Security)
- **Ekspor Dokumen:** `docx` 9.7 (kompilasi dokumen Word native server-side)
- **Testing:** Node.js native test runner (`node:test`, tanpa dependensi framework berat)

---

## Mulai Cepat (Demo Lokal)

Aplikasi dapat dijalankan secara instan untuk eksplorasi antarmuka dan penulisan naskah tanpa perlu menghubungkan Supabase eksternal:

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev
```

1. Buka browser di `http://localhost:3000/login`
2. Klik tombol **Masuk Cepat Demo Author (Lokal)**
3. Anda langsung diarahkan ke `/workspace` dengan data naskah simulasi lengkap
4. Seluruh fitur penulisan, navigasi, dan dialog berfungsi penuh.

> [!NOTE]
> Panduan skenario uji lokal tersedia lengkap di [`docs/local-testing.md`](docs/local-testing.md).

---

## Konfigurasi Penuh (Supabase + AI)

Untuk menggunakan database PostgreSQL persisten dan provider AI produksi:

```bash
cp .env.example .env.local
```

Sesuaikan nilai environment di `.env.local`:

| Variabel | Keterangan | Tingkat Keamanan |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL + pgvector | Rahasia (Server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | Publik |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Publik (Client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | **Sangat Rahasia** (Server only) |
| `AI_PROVIDER` | Provider pilihan (`mock`, `openai`, `anthropic`, `gemini`) | Server only |
| `AI_API_KEY` | API Key model AI | **Sangat Rahasia** (Server only) |

Jalankan berkas migrasi SQL di folder `src/db/migrations/` secara berurutan, lalu restart server.

---

## Daftar Perintah (Scripts)

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server lokal Next.js di `http://localhost:3000` |
| `npm run build` | Melakukan build produksi teroptimasi (validasi route, typecheck, lint) |
| `npm run start` | Menjalankan aplikasi produksi hasil build |
| `npm run test` | Menjalankan 187 automated test suites |
| `npm run typecheck` | Menjalankan pemeriksaan tipe TypeScript (`tsc --noEmit`) |
| `npm run lint` | Menjalankan analisis statis kode via ESLint |

---

## Struktur Repositori

```text
src/
├── app/                          # App Router (Next.js 15)
│   ├── (auth)/                   # Alur otentikasi (login, signup, password)
│   ├── (workspace)/              # Ruang kerja penulisan utama (10 rute studio)
│   └── api/                      # Endpoint auth demo, logout, ekspor naskah
├── components/                   # Komponen UI modular
│   ├── ui/                       # Primitif desain (button, dialog, card, badge)
│   ├── editor/                   # Editor TipTap, workspace, navigator, history
│   └── outline/                  # Dialog struktur babak, bab, dan adegan
├── features/                     # Domain logika per-fitur
│   ├── novels/                   # Manajemen perpustakaan novel & statistik
│   ├── structure/                # Manajemen babak, bab, adegan
│   ├── scenes/                   # Konten naskah & versi snapshot
│   ├── characters/               # Tokoh & matriks relasi
│   ├── world/                    # Lore dunia, faksi, aturan kausalitas
│   ├── memories/                 # Memori cerita & klasifikasi fakta
│   ├── ai/                       # Provider agnostic & context builder
│   ├── consistency/              # Mesin validasi konsistensi naskah
│   ├── plot/                     # Alur plot & linimasa kronologis
│   ├── doctor/                   # Diagnosis naratif editorial
│   └── summaries/                # Sintesis ringkasan hierarkis
├── server/actions/               # Server Actions aman dengan boundary validation
├── lib/                          # Helper (kata, format, shorcuts, palette)
└── types/                        # Skema Zod & tipe domain terpusat
```

---

## Prinsip Non-Negosiasi

> [!IMPORTANT]
> **Pedoman Integritas Naskah & AI:**
> 1. **Keselamatan Naskah:** AI tidak pernah menimpa teks naskah secara sepihak. Seluruh modifikasi wajib melalui alur `Tinjau` → `Terima / Sisipkan / Ganti / Tolak` yang dapat dibatalkan.
> 2. **Otoritas Penulis:** Fakta yang dihasilkan AI berstatus `proposed` hingga dikonfirmasi penulis (`confirmed`).
> 3. **Atribusi Sumber:** Setiap klaim memori atau inkonsistensi harus menyertakan rujukan bab atau adegan asalnya.
> 4. **Konteks Berlapis:** AI hanya menerima konteks yang relevan sesuai context budget, bukan seluruh isi novel sekaligus.

---

## Indeks Dokumentasi

Untuk pemahaman mendalam tentang visi, aturan, dan arsitektur sistem, baca dokumen terkait berikut:

- [`SOUL.md`](SOUL.md) — Karakter, filosofi, dan prinsip dasar produk.
- [`AGENTS.md`](AGENTS.md) — Panduan operasional wajib bagi AI coding agent.
- [`docs/prd.md`](docs/prd.md) — Product Requirements Document (kebutuhan fungsional).
- [`docs/design.md`](docs/design.md) — Pedoman desain, tipografi, dan pengalaman pengguna (UX).
- [`docs/architecture.md`](docs/architecture.md) — Spesifikasi arsitektur sistem dan batas server/klien.
- [`docs/database-schema.md`](docs/database-schema.md) — Skema database relasional dan strategi indexing.
- [`docs/local-testing.md`](docs/local-testing.md) — Panduan verifikasi dan skenario pengujian lokal.
- [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) — Rencana tahapan implementasi teknis.
