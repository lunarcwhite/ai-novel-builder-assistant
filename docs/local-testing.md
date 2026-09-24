# Panduan Testing Lokal — Novel Builder (Phase 11)

Uji seluruh alur di laptop sendiri sebelum deploy. Tidak perlu Supabase,
tidak perlu AI key — mode demo lokal sudah cukup untuk semua skenario UI.

## 1. Persiapan (sekali saja)

```bash
cd D:\aplikasi\novel-builder
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 2. Masuk mode demo

1. Buka `/login`.
2. Klik **Masuk Cepat Demo Author (Lokal)** — tanpa password.
3. Anda masuk sebagai Demo Author, dialihkan ke `/workspace`.

> Tanpa cookie demo, `/workspace/*` otomatis redirect ke `/login`
> (middleware + `requireAuth` fallback dev-session).

## 3. Checklist alur utama

| # | Skenario | Langkah | Hasil benar |
|---|----------|---------|-------------|
| 1 | Buat novel | `/workspace/new` → isi judul + premise → simpan | Kartu novel muncul di `/workspace` |
| 2 | Struktur | Tab Garis Besar → tambah babak → bab → adegan | Outline tree tampil hierarkis |
| 3 | Tulis | Klik adegan → editor TipTap terbuka | Mengetik → status "Menyimpan draf…" → "Tersimpan" |
| 4 | Autosave | Ketik, tunggu ±2 dtk, reload halaman | Teks tetap ada (atau banner draf lokal muncul) |
| 5 | Palet | Tekan `Ctrl+K` di halaman mana pun | Palet terbuka; ketik "ekspor" → Enter pindah halaman |
| 6 | Shortcut editor | Di editor: `Ctrl+S` simpan, `F11` fokus, `Esc` keluar | Simpan manual jalan; fokus full-kanvas |
| 7 | Versi | Tombol Versi → buat snapshot → ubah teks → pulihkan | Teks kembali ke snapshot |
| 8 | Karakter | Tab Karakter → tambah tokoh + relasi | Kartu karakter + badge POV |
| 9 | Dunia | Tab Dunia → tambah lokasi + aturan | Lokasi bisa dipilih di Detail Adegan |
| 10 | Memori | Tab Memori → tambah fakta cepat | Fakta muncul; status `proposed`/`confirmed` jelas |
| 11 | Plot | Tab Plot → tambah thread + event timeline | Thread & timeline tampil |
| 12 | Doctor | Tab Story Doctor → jalankan diagnosis | Observasi + bukti + saran, bukan skor |
| 13 | Ekspor | Tab Ekspor → unduh `.md`, `.txt`, `.docx` | Berkas terunduh, heading rapi |
| 14 | Search library | Buat 2 novel → ketik di kotak cari `/workspace?q=…` | Daftar terfilter judul/genre/premis |
| 15 | Boundary | Buka URL novel asal (`/workspace/xxx`) | Halaman 404 ramah, tombol kembali |
| 16 | Mobile | DevTools → viewport 390px → buka editor | Panel kiri/kanan jadi overlay + scrim, kanvas lega |

## 4. Checklist aksesibilitas (keyboard saja, tanpa mouse)

1. `Tab` dari header → skip link "Lewati ke konten utama" muncul saat fokus.
2. `Ctrl+K` → `↑`/`↓` → `Enter` → navigasi tanpa mouse.
3. Tab novel → tab aktif terbaca screen reader (`aria-current="page"`).
4. Outline → tombol buka/tutup umumkan status (`aria-expanded`).
5. Dialog mana pun → `Esc` menutup, fokus kembali ke pemicu.
6. Toggle panel editor → status tekan terbaca (`aria-pressed`).

## 5. Perintah verifikasi otomatis

```bash
npm run test       # 180 test, harus 0 fail
npm run typecheck  # tsc bersih
npm run lint       # ESLint bersih
npm run build      # semua 19 rute ter-render
```

## 6. Batasan mode demo (wajar, bukan bug)

- Data tersimpan di store lokal dev, bukan Postgres/Supabase.
- Fitur AI (saran, ekstraksi memori, doctor otomatis) butuh `AI_API_KEY`
  dan Supabase asli — tombolnya tampil tapi mengembalikan pesan gagal
  yang aman, naskah tidak berubah.
- Login email/password butuh Supabase asli (lihat `.env.example`).

## 7. Naik ke Supabase asli (saat siap deploy)

1. Salin `.env.example` → `.env.local`, isi URL + anon key + service role.
2. Jalankan migrasi di `src/db/migrations/` ke Postgres + aktifkan `pgvector`.
3. Restart `npm run dev`, daftar akun baru via `/signup`.
4. Ulangi checklist #1–#16 dengan akun Supabase sungguhan.
