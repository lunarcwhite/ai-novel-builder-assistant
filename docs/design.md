# DESIGN.md: AI Novel Writing Workspace

> **Design System, Visual Direction & User Experience (UX)**  
> **Status:** Version 1.0 (Implemented & Verified)  
> **Related Documents:** [`SOUL.md`](../SOUL.md) • [`AGENTS.md`](../AGENTS.md) • [`docs/prd.md`](prd.md) • [`docs/architecture.md`](architecture.md)

---

## Daftar Isi (Table of Contents)

1. [Visi Desain & Prinsip Utama](#1-visi-desain--prinsip-utama)
2. [Sistem Warna & Dukungan Tema (Dark / Light)](#2-sistem-warna--dukungan-tema-dark--light)
3. [Tipografi Editorial & Hierarki](#3-tipografi-editorial--hierarki)
4. [Sistem Spasi & Layout Shell](#4-sistem-spasi--layout-shell)
5. [Desain Editor Naskah & Focus Mode](#5-desain-editor-naskah--focus-mode)
6. [Desain Interaksi AI (Non-Destruktif)](#6-desain-interaksi-ai-non-destruktif)
7. [Desain Modul Story Bible & Perencanaan](#7-desain-modul-story-bible--perencanaan)
   - [7.1 Character Studio & Matriks Relasi](#71-character-studio--matriks-relasi)
   - [7.2 World Studio (Lokasi, Faksi, Rules)](#72-world-studio-lokasi-faksi-rules)
   - [7.3 Plot Threads & Linimasa Interaktif](#73-plot-threads--linimasa-interaktif)
8. [Desain Analisis & Kecerdasan Cerita](#8-desain-analisis--kecerdasan-cerita)
   - [8.1 Consistency Checker UI](#81-consistency-checker-ui)
   - [8.2 Story Doctor UI](#82-story-doctor-ui)
   - [8.3 Story Memory Studio UI](#83-story-memory-studio-ui)
9. [Aksesibilitas (WCAG AA), Animasi & Responsivitas](#9-aksesibilitas-wcag-aa-animasi--responsivitas)
10. [Daftar Design Tokens & Primitif Komponen](#10-daftar-design-tokens--primitif-komponen)

---

## 1. Visi Desain & Prinsip Utama

Aplikasi harus terasa seperti **studio kreatif pribadi seorang penulis**, bukan dashboard analitik bisnis dan bukan antarmuka chatbot generik.

### 1.1 Karakter Visual
- **Calm & Focused:** Menghilangkan distraksi saat menulis.
- **Editorial & Warm:** Menggunakan latar bernuansa kertas (*paper tone*), tipografi serif sastra, dan aksen hangat.
- **Progressive Complexity:** Menampilkan informasi secara bertingkat; fitur analisis mendalam hanya muncul saat dibutuhkan.

### 1.2 Prinsip Desain
1. **Writing Comes First:** Editor naskah adalah pusat pengalaman. UI tidak boleh menyaingi teks novel.
2. **Contextual AI:** AI hadir sebagai pendamping kontekstual yang senyap, bukan chatbot yang mendominasi layar.
3. **Author Ownership:** Setiap saran AI wajib memiliki alur eksplisit: `Accept`, `Insert`, `Replace`, `Dismiss`.

---

## 2. Sistem Warna & Dukungan Tema (Dark / Light)

Palet warna dirancang dengan kontras tinggi yang ramah mata untuk sesi penulisan panjang (kepatuhan WCAG AA minimal 4.5:1 untuk teks normal).

### 2.1 Mode Terang (Editorial Paper)
| Token | Nilai Hex | Penggunaan | Kontras pada Background |
|---|---|---|---|
| `background` | `#F8F7F4` | Latar utama kanvas penulisan (warm paper) | N/A |
| `surface / card` | `#FFFFFF` | Permukaan kartu dan dialog | 1.05:1 |
| `foreground` | `#1F1F1F` | Teks utama naskah dan heading | **15.2:1** (Lolos AAA) |
| `muted-foreground` | `#6B6964` | Teks sekunder, metadata, placeholder | **4.89:1** (Lolos AA) |
| `border` | `#E7E4DE` | Garis batas tipis pemisah panel | 1.18:1 |
| `accent / primary`| `#6D5A45` | Warna aksen hangat / status aktif | **5.4:1** (Lolos AA) |

### 2.2 Mode Gelap (Midnight Studio)
| Token | Nilai Hex | Penggunaan | Kontras pada Background |
|---|---|---|---|
| `background` | `#151515` | Latar gelap terfokus | N/A |
| `surface / card` | `#1D1D1D` | Permukaan panel editor gelap | 1.08:1 |
| `foreground` | `#F1F0EC` | Teks utama naskah di ruang gelap | **14.8:1** (Lolos AAA) |
| `muted-foreground` | `#A5A29B` | Teks sekunder mode gelap | **7.1:1** (Lolos AAA) |
| `border` | `#30302E` | Garis pemisah panel gelap | 1.4:1 |
| `accent / primary`| `#B49A78` | Aksen emas hangat di latar gelap | **7.3:1** (Lolos AAA) |

---

## 3. Tipografi Editorial & Hierarki

```text
UI & Navigasi  ──> Font Sans-Serif (Inter / Geist)  ──> Bersih, ringkas, fungsional
Naskah Cerita  ──> Font Serif (Lora / Source Serif) ──> Elegan, nyaman dibaca lama
```

| Tingkat Tipografi | Ukuran | Bobot | Line Height | Penggunaan |
|---|---|---|---|---|
| **Manuscript H1** | `2.25rem (36px)` | Normal (400) | `1.25` | Judul bab naskah utama |
| **Manuscript Body** | `1.125rem (18px)` | Normal (400) | `1.8` | Isi teks naskah TipTap |
| **Heading UI H2** | `1.5rem (24px)` | Medium (500) | `1.3` | Judul studio / workspace |
| **Heading UI H3** | `1.125rem (18px)`| Medium (500) | `1.4` | Judul kartu & tab section |
| **Body UI** | `0.875rem (14px)` | Normal (400) | `1.5` | Teks formulir & dialog |
| **Caption / Meta** | `0.75rem (12px)`  | Medium (500) | `1.4` | Metadata kata, POV, status |

---

## 4. Sistem Spasi & Layout Shell

### 4.1 Shell Tiga Panel Terintegrasi
```text
┌──────────────────────────────────────────────────────────┐
│ [Logo] Novel Title          [ThemeToggle] [Search] [User]│
├───────────────┬──────────────────────────────┬───────────┤
│ OUTLINE TREE  │      MANUSCRIPT CANVAS       │ AI STUDIO │
│ Babak & Bab   │                              │           │
│ Adegan & POV  │      Teks Naskah TipTap      │ Saran AI  │
│ [Collapse ◄]  │     (Autosave Debounced)     │ [► Hide]  │
└───────────────┴──────────────────────────────┴───────────┘
```
- **Panel Kiri (Outline):** Navigasi struktur babak, bab, dan adegan. Dapat ditutup (*collapsible*).
- **Panel Tengah (Canvas):** Area penulisan utama dengan lebar maksimal terfokus (maks. 720px untuk ergonomi mata).
- **Panel Kanan (AI Studio):** Bantuan editorial yang dapat disembunyikan kapan saja agar tidak mengganggu konsentrasi.

---

## 5. Desain Editor Naskah & Focus Mode

### 5.1 Editor TipTap Editorial
- Margin dan padding luas untuk menciptakan ruang pernapasan visual (*generous whitespace*).
- Indikator status autosave yang tenang: `Menyimpan...` → `Tersimpan secara lokal`.
- Jika jaringan offline: `Anda offline; draf lokal aman` dengan tombol `Coba Lagi`.

### 5.2 Distraction-Free Focus Mode (`F11`)
- Menyembunyikan sidebar navigasi, header atas, dan panel AI.
- Memusatkan naskah di tengah layar dengan pencahayaan tenang.
- Membuka kembali antarmuka penuh dengan menekan tombol `Esc` atau ikon keluar fokus.

---

## 6. Desain Interaksi AI (Non-Destruktif)

> [!IMPORTANT]
> AI tidak pernah mengubah naskah secara sepihak. Seluruh saran AI ditampilkan di panel kartu tersendiri dengan 4 tombol tindakan yang jelas:

```text
┌──────────────────────────────────────────────────────────┐
│ BrainCircuit  Saran AI: Perluasan Dialog                 │
├──────────────────────────────────────────────────────────┤
│ "Daniel ragu sejenak sebelum meletakkan kuncinya..."     │
├──────────────────────────────────────────────────────────┤
│ [Terima (Insert)]  [Ganti Seleksi]  [Salin]  [Tolak]     │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Desain Modul Story Bible & Perencanaan

### 7.1 Character Studio & Matriks Relasi
- Kartu tokoh dengan badge status peran (`Protagonist`, `Antagonist`, `Supporting`).
- Ark karakter divisualisasikan dengan ikon `Flame` dan deskripsi tujuan emosional.
- Matriks relasi dua arah memperlihatkan dinamika hubungan antar tokoh (misal: *Aliansi rapuh*, *Rival akademis*).

### 7.2 World Studio (Lokasi, Faksi, Rules)
- Pengelompokan tab rapi: Lokasi, Faksi, Aturan Kausalitas (World Rules), dan Lore.
- Badge tingkat kepentingan aturan dunia:
  - `Tingkat 5: Hukum Mutlak Dunia`
  - `Tingkat 4: Hukum Kota / Faksi Utama`
  - `Tingkat 3: Aturan Umum Masyarakat`

### 7.3 Plot Threads & Linimasa Interaktif
- Pelacakan subplot dengan status jelas: `Planned`, `Active`, `Resolved`.
- Linimasa peristiwa dengan penanda waktu fleksibel dan tautan langsung ke bab/lokasi terkait.

---

## 8. Desain Analisis & Kecerdasan Cerita

### 8.1 Consistency Checker UI
- Temuan disajikan sebagai **Observasi Berbasis Bukti**, bukan vonis kesalahan.
- Kartu temuan menyandingkan:
  - Sumber A: *"Bab 4: Daniel anak tunggal"*
  - Sumber B: *"Bab 19: Daniel menemui kakak perempuannya"*
- Tombol tindakan: `Abaikan (Sengaja)` atau `Tandai Selesai`.

### 8.2 Story Doctor UI
- Tampilan wawasan editorial yang mendiagnosis ritme cerita tanpa skor angka fiktif.
- Kategori analisis: Pacing bab, plot thread terbengkalai, dan motivasi karakter.

### 8.3 Story Memory Studio UI
- Menampilkan memori fakta cerita terkonfirmasi (`confirmed`) dan usulan AI (`proposed`).
- Sumber rujukan bab/adegan tertaut secara transparan.

---

## 9. Aksesibilitas (WCAG AA), Animasi & Responsivitas

1. **Aksesibilitas Keyboard:**
   - Tautan lompat langsung (*Skip to content*) di baris pertama sebelum header.
   - Pemicu Command Palette via shortcut `Ctrl+K` di desktop dan tombol ikon `Search` di ponsel.
   - Visible focus ring (`ring-1 ring-ring`) pada setiap elemen interaktif.
2. **Desain Responsif:**
   - **Desktop (> 1024px):** Layout 3-kolom penuh.
   - **Tablet (768px - 1024px):** Panel samping otomatis menjadi drawer slide-over.
   - **Mobile (< 768px):** Navigasi berbasis tab bawah / bottom-sheet dengan target sentuh minimal 36px.
3. **Animasi Halus:** Transisi cepat (150ms-200ms) tanpa efek gerak yang memusingkan (*reduced motion friendly*).

---

## 10. Daftar Design Tokens & Primitif Komponen

- `Button`: Varian `default`, `outline`, `ghost`, `secondary`, `destructive`.
- `Badge`: Varian `default`, `secondary`, `outline`, `accent`.
- `Card`: Background card dengan border tipis dan bayangan kertas lembut (`shadow-subtle` / `shadow-paper`).
- `Dialog`: Modal konfirmasi Radix UI dengan fokus otomatis dan penutupan via tombol `Escape`.
- `Input & Textarea`: Field formulir elegan dengan border netral dan ring fokus jelas.
