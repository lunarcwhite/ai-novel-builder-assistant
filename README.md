# Novel Builder — AI Novel Writing Workspace

Ruang kerja kreatif untuk novelis: berpikir, membangun, menulis, mengingat,
mempertanyakan, dan merevisi — dari ide hingga naskah jadi.

> **The author owns the story.** AI membantu; penulis yang memutuskan.
> Lihat `SOUL.md` untuk filosofi produk.

## Status

Phase 0–11 selesai: auth, novel library, struktur (acts/chapters/scenes),
editor TipTap + autosave + versi + focus mode, karakter & relasi, world
studio, story memory + embeddings, AI assistant, consistency engine, plot +
timeline + Story Doctor, ekspor TXT/Markdown/DOCX, dan polish (command
palette, shortcuts, search, loading/error boundary, a11y, responsif).

## Tech Stack

- **Next.js 15.1.7** + React 19 + TypeScript strict
- **Tailwind CSS 3.4** + shadcn-style `src/components/ui`
- **TipTap 2.11** (editor naskah), **Zod** (validasi), **Lucide** (ikon)
- **Supabase** (Postgres + pgvector + Auth) — opsional saat dev lokal
- **`docx` 9.7** (ekspor Word), tanpa dependensi AI wajib

## Mulai Cepat (mode demo, tanpa Supabase)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/login` → klik **Masuk Cepat Demo Author
(Lokal)**. Semua fitur UI bisa diuji; fitur AI mengembalikan pesan gagal
yang aman tanpa mengubah naskah.

Panduan lengkap: [`docs/local-testing.md`](docs/local-testing.md)
(16 skenario + 6 cek keyboard + batasan mode demo).

## Perintah

| Perintah          | Fungsi                                      |
|-------------------|---------------------------------------------|
| `npm run dev`     | Dev server (`localhost:3000`)               |
| `npm run build`   | Production build (19 rute)                  |
| `npm run start`   | Jalankan hasil build                        |
| `npm run test`    | 180 unit + feature test (node:test stdlib)  |
| `npm run typecheck` | `tsc --noEmit`                            |
| `npm run lint`    | ESLint (Next)                               |

## Konfigurasi Penuh (Supabase + AI)

```bash
cp .env.example .env.local
```

Isi variabel di [`.env.example`](.env.example):

| Variabel | Fungsi |
|----------|--------|
| `DATABASE_URL` | Postgres + pgvector |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth client |
| `SUPABASE_SERVICE_ROLE_KEY` | Akses server (jangan awali `NEXT_PUBLIC_`) |
| `AI_PROVIDER` / `AI_API_KEY` | Provider AI (key hanya server-side) |

Jalankan migrasi `src/db/migrations/*.sql` berurutan ke database, lalu
restart dev server dan daftar akun via `/signup`.

## Struktur Proyek

```text
src/
├── app/                    # Routes (auth, workspace, API, boundaries)
│   ├── (auth)/             # login, signup, forgot-password
│   ├── (workspace)/        # layout + command palette + 10 halaman novel
│   └── api/                # auth demo/logout, novel export
├── components/
│   ├── ui/                 # Button, dialog, input, card, badge…
│   ├── editor/             # TipTap, workspace, navigator, AI panel, versi
│   └── outline/            # Outline tree + dialog babak/bab/adegan
├── features/               # Domain: novels, structure, scenes, characters,
│                           # world, memories, ai, consistency, plot,
│                           # timeline, doctor, summaries, export
├── lib/                    # palette, shortcuts, library-search, words, utils
├── server/actions/         # Server actions per domain + auth guards
└── types/                  # Skema Zod + tipe domain terpusat
docs/                       # prd, design, architecture, database-schema,
                            # local-testing
tests/                      # unit + feature (node:test, tanpa framework)
```

## Prinsip Kunci (AGENTS.md + SOUL.md)

- AI tidak pernah diam-diam mengubah naskah — selalu via
  Tinjau → Terima/Sisipkan/Ganti/Tolak, bisa dibatalkan.
- Fakta AI = `proposed` sampai penulis konfirmasi (`confirmed`).
- Setiap ingatan penting punya sumber (bab/adegan).
- Konteks AI berlapis (adegan → bab → karakter → memori → dunia),
  bukan seluruh novel sekaligus.
- Satu commit per fase (`feat: …`), tanpa secret di repo.

## Dokumentasi

- `SOUL.md` — filosofi & prinsip non-negosiasi
- `AGENTS.md` — aturan operasional coding agent
- `docs/prd.md` — kebutuhan produk
- `docs/design.md` — bahasa visual & UX
- `docs/architecture.md` — arsitektur sistem
- `docs/database-schema.md` — skema database
- `docs/local-testing.md` — panduan testing lokal
