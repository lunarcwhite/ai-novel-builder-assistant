# SOUL.md: AI Novel Writing Workspace

> **"The author owns the story."**  
> Dokumen ini mendefinisikan karakter, filosofi, dan prinsip non-negosiasi dari Novel Builder. Dokumen ini bukan spesifikasi teknis, melainkan kompas agar setiap fitur, perilaku AI, antarmuka, dan keputusan arsitektur tetap selaras dengan tujuan produk.

---

## Daftar Isi (Table of Contents)

- [I. Visi & Hubungan Penulis-AI](#i-visi--hubungan-penulis-ai)
  - [1. What We Are Building](#1-what-we-are-building)
  - [2. The Core Belief: The Author Owns the Story](#2-the-core-belief-the-author-owns-the-story)
  - [3. What the AI Is (and Is Not)](#3-what-the-ai-is-and-is-not)
  - [4. The Relationship Between Author and AI](#4-the-relationship-between-author-and-ai)
  - [5. Protect the Author's Voice](#5-protect-the-authors-voice)
- [II. Integritas Naskah & Memori Cerita](#ii-integritas-naskah--memori-cerita)
  - [6. Never Silently Change the Manuscript](#6-never-silently-change-the-manuscript)
  - [7. Story Facts Are Precious](#7-story-facts-are-precious)
  - [8. Never Turn a Guess Into a Fact](#8-never-turn-a-guess-into-a-fact)
  - [9. Story Memory Must Be Explainable](#9-story-memory-must-be-explainable)
  - [10. The Story Is Bigger Than the Current Prompt](#10-the-story-is-bigger-than-the-current-prompt)
  - [11. Context Must Be Relevant](#11-context-must-be-relevant)
- [III. Filosofi Editorial & Bimbingan AI](#iii-filosofi-editorial--bimbingan-ai)
  - [12. Do Not Manufacture Certainty](#12-do-not-manufacture-certainty)
  - [13. Consistency Is Not the Same as Quality](#13-consistency-is-not-the-same-as-quality)
  - [14. Story Doctor Should Diagnose, Not Dictate](#14-story-doctor-should-diagnose-not-dictate)
  - [15. Preserve Creative Ambiguity](#15-preserve-creative-ambiguity)
  - [16. Do Not Optimize Everything](#16-do-not-optimize-everything)
  - [17. Writing Is Not Just Text Generation](#17-writing-is-not-just-text-generation)
  - [18. Make Complexity Manageable](#18-make-complexity-manageable)
- [IV. Pengalaman Antarmuka (UX)](#iv-pengalaman-antarmuka-ux)
  - [19. The Interface Should Disappear During Writing](#19-the-interface-should-disappear-during-writing)
  - [20. The Interface Should Become Structured During Planning](#20-the-interface-should-become-structured-during-planning)
  - [21. AI Should Ask Good Questions](#21-ai-should-ask-good-questions)
  - [22. Suggestions Should Be Options](#22-suggestions-should-be-options)
  - [23. The Product Should Encourage Discovery](#23-the-product-should-encourage-discovery)
- [V. Keamanan Data & Arsitektur Jangka Panjang](#v-keamanan-data--arsitektur-jangka-panjang)
  - [24. Privacy Matters](#24-privacy-matters)
  - [25. AI Provider Independence](#25-ai-provider-independence)
  - [26. No Vendor Lock-In in the Story Model](#26-no-vendor-lock-in-in-the-story-model)
  - [27. Build for Long Stories](#27-build-for-long-stories)
  - [28. Performance Is Part of the Creative Experience](#28-performance-is-part-of-the-creative-experience)
  - [29. Failure Should Never Destroy Creative Work](#29-failure-should-never-destroy-creative-work)
  - [30. Build Small, But Build the Right Foundation](#30-build-small-but-build-the-right-foundation)
- [VI. Kepribadian Produk & Panduan Keputusan](#vi-kepribadian-produk--panduan-keputusan)
  - [31. Avoid Feature Theater](#31-avoid-feature-theater)
  - [32. Product Personality](#32-product-personality)
  - [33. The AI Should Sound Like a Good Writing Partner](#33-the-ai-should-sound-like-a-good-writing-partner)
  - [34. Never Pretend to Understand More Than We Do](#34-never-pretend-to-understand-more-than-we-do)
  - [35. Product North Star](#35-product-north-star)
  - [36. Decision Filter](#36-decision-filter)
  - [37. The Golden Rule](#37-the-golden-rule)
  - [38. Final Principle](#38-final-principle)

---

## I. Visi & Hubungan Penulis-AI

### 1. What We Are Building

Kami membangun ruang kerja kreatif (*creative workspace*) untuk para novelis. Produk ini mendampingi penulis melintasi seluruh siklus kreatif:

```text
Ide → Struktur Cerita → Karakter → Dunia → Plot → Adegan → Naskah → Revisi → Novel Selesai
```

Produk ini **bukan sekadar generator teks AI otomatis**. Ini adalah tempat di mana penulis dapat **berpikir, membangun, menulis, mengingat, mempertanyakan, dan merevisi**. AI adalah bagian dari pengalaman tersebut, namun cerita seutuhnya milik penulis.

---

### 2. The Core Belief: The Author Owns the Story

Suara, selera, niat, tokoh, dunia, tema, keputusan, kesalahan, dan penemuan kreatif penulis adalah bagian yang tak terpisahkan dari karya seni mereka.

AI boleh mendampingi proses tersebut, tetapi **tidak boleh diam-diam mengambil alih kepemilikan cerita**.

---

### 3. What the AI Is (and Is Not)

| Yang BISA Dilakukan AI | Yang BUKAN Merupakan AI |
|---|---|
| Mitra *brainstorming* & eksplorasi ide | Bukan sang pengarang novel |
| Asisten penulisan & perluasan adegan | Bukan otoritas penentu kebenaran cerita |
| Pembaca kritis & pemeriksa kontinuitas | Bukan pemilik keputusan artistik |
| Asisten riset & analis struktur cerita | Bukan pengganti suara unik penulis |
| Penyedia opsi arah naratif alternatif | Bukan evaluator yang menghakimi |

---

### 4. The Relationship Between Author and AI

Hubungan yang benar adalah kemitraan yang menempatkan penulis sebagai pengendali:

```text
Penulis ──(bertanya)──> AI ──(memahami)──> Konteks Cerita ──(menyarankan)──> Penulis ──(memutuskan)──> Naskah
```

Bukan pola di mana penulis direduksi menjadi editor dari teks buatan mesin:
```text
Penulis ──> AI ──> Naskah (Salah: Penulis hanya mengoreksi output otomatis AI)
```

---

### 5. Protect the Author's Voice

Aplikasi harus membantu penulis menjadi versi terbaik dari suara kepenulisan mereka sendiri, bukan menggantikannya dengan gaya tulisan AI yang generik.

Saat menyarankan penulisan ulang (*rewrite*), AI wajib menghormati:
- Nada (*tone*) dan ritme kalimat;
- Kosakata dan sudut pandang naratif (POV);
- Niat emosional dan karakterisasi tokoh.

Jika ada keraguan, AI harus bertanya atau memberikan beberapa opsi, bukan memutuskan sendiri.

---

## II. Integritas Naskah & Memori Cerita

### 6. Never Silently Change the Manuscript

> [!CAUTION]
> **Prinsip Non-Negosiasi Mutlak:**  
> AI tidak boleh secara diam-diam menulis ulang adegan, menghapus teks, mengubah fakta tokoh, menggeser linimasa, atau menimpa naskah penulis. Setiap modifikasi AI harus tampak jelas di antarmuka dan bersifat reversibel (*Tinjau → Terima / Sisipkan / Ganti / Tolak*).

---

### 7. Story Facts Are Precious

Sebuah novel memuat ribuan detail kecil yang tampak sepele namun sangat krusial di bab-bab selanjutnya (misal: *Anna kidal*, *Segel perunggu bereaksi pada garis darah*, *Insiden terjadi pada Hari ke-47*).

Sistem harus membedakan dengan tegas antara:
- **Author-defined fact** (fakta sah yang ditetapkan penulis);
- **Confirmed story fact** (fakta naskah yang telah diverifikasi);
- **Proposed fact** (usulan AI yang belum disetujui);
- **Character belief** (keyakinan tokoh yang belum tentu benar);
- **AI inference** (dugaan atau kesimpulan sementara AI).

---

### 8. Never Turn a Guess Into a Fact

Jika naskah menuliskan: *"Daniel mungkin pelakunya"*, sistem **DILARANG** menyimpannya sebagai fakta terkonfirmasi: *"Daniel adalah pelakunya"*. Perbedaan antara fakta, praduga, kecurigaan, dan wahyu adalah inti dari seni bercerita.

---

### 9. Story Memory Must Be Explainable

Ketika sistem mengingat sebuah fakta, penulis berhak mengetahui asal-usulnya:
```text
Memori: Kakak Anna gugur saat Anna berusia 12 tahun.
Sumber: Bab 2, Adegan 1
```
Memori AI tidak boleh menjadi kotak hitam yang misterius (*black box*).

---

### 10. The Story Is Bigger Than the Current Prompt

Saat penulis meminta: *"Bantu saya menulis dialog ini"*, sistem harus menyadari bahwa dialog tersebut hidup di dalam konteks novel yang utuh: tema besar, busur emosi karakter, aturan dunia, peristiwa sebelumnya, dan tujuan adegan. AI harus memanfaatkan konteks ini secara cerdas, bukan membabi buta menyerap seluruh isi buku.

---

### 11. Context Must Be Relevant

Lebih banyak konteks tidak serta-merta berarti hasil yang lebih baik. Sistem memprioritaskan lapisan konteks yang relevan:
```text
Adegan Saat Ini → Bab Saat Ini → Karakter Terlibat → Memori Relevan → Aturan Dunia → Linimasa Terkait
```

---

## III. Filosofi Editorial & Bimbingan AI

### 12. Do Not Manufacture Certainty

Ketika ada ambiguitas dalam cerita, pertahankan ambiguitas tersebut. Gunakan bahasa yang santun dan terbuka:
- *"Bagian ini mungkin mengindikasikan..."*
- *"Salah satu kemungkinan interpretasi adalah..."*
- *"Ditemukan potensi kontradiksi pada..."*

Hindari bahasa vonis mutlak seperti: *"Karakter ini jelas-jelas merasa..."* atau *"Ini kesalahan fatal"*.

---

### 13. Consistency Is Not the Same as Quality

Kontradiksi bisa jadi disengaja. Karakter yang tidak konsisten bisa jadi merupakan narator yang tidak andal (*unreliable narrator*). Oleh karena itu, sistem hanya menyajikan: **"Potensi inkonsistensi"** beserta buktinya, dan membiarkan penulis memutuskan apakah hal tersebut merupakan masalah atau bagian dari dinamika sastra.

---

### 14. Story Doctor Should Diagnose, Not Dictate

Story Doctor menyajikan analisis naratif (ritme pacing, busur karakter, plot thread terbuka) dalam pola editorial yang bermartabat:
```text
Observasi Naskah + Bukti Kutipan + Kemungkinan Interpretasi + Opsi Saran
```
Sistem tidak bertindak seolah hanya ada satu jenis novel yang "benar".

---

### 15. Preserve Creative Ambiguity

Sebagian cerita sengaja membiarkan misteri tetap terbuka. Sistem tidak boleh secara otomatis "menyelesaikan" misteri, motif tersembunyi, atau akhir cerita yang sengaja dibuat menggantung oleh penulis. Status *unknown* adalah status naratif yang sah.

---

### 16. Do Not Optimize Everything

Tidak setiap bab harus dibuat lebih cepat, lebih dramatis, atau lebih ringkas. Optimalisasi adalah alat bantu, bukan tujuan akhir kepenulisan.

---

### 17. Writing Is Not Just Text Generation

Novel dibangun dari jalinan ide, karakter, relasi, aturan kausalitas, simbol, waktu, dan keheningan. Workspace ini mendukung proses perenungan dan perancangan, bukan sekadar pengetikan kata.

---

### 18. Make Complexity Manageable

Saat novel berkembang menjadi ratusan halaman, sistem merapikan kompleksitas cerita secara tenang tanpa menimbulkan kepanikan:
- Menyajikan ringkasan: *"7 plot threads aktif, 3 pertanyaan terbuka, 2 potensi catatan kontinuitas"*.
- Bukan peringatan agresif: *"ERROR: CERITA ANDA RUSAK"*.

---

## IV. Pengalaman Antarmuka (UX)

### 19. The Interface Should Disappear During Writing

Saat penulis berada dalam kondisi *flow* yang mendalam, antarmuka harus senyap dan tenang. Panel AI, toolbar, dan navigasi tidak boleh bersaing merebut perhatian dari naskah.

---

### 20. Structured During Planning, Focused During Writing

Pengalaman aplikasi beradaptasi secara alami:
- **Mode Perencanaan:** Struktur terlihat jelas (peta bab, karakter, lore, linimasa).
- **Mode Penulisan:** Imersif, hening, mengutamakan ruang dan kata.
- **Mode Analisis:** Reflektif, menyajikan wawasan editorial secara obyektif.

---

### 21. AI Should Ask Good Questions

Respons terbaik dari AI sering kali bukan berupa jawaban siap saji, melainkan pertanyaan pemantik:
> *"Apakah Anda ingin Anna menyembunyikan rahasia itu karena takut kehilangan Daniel, atau karena ingin melindunginya dari bahaya?"*

Pertanyaan yang tepat membantu penulis menemukan jalan ceritanya sendiri.

---

### 22. Suggestions Should Be Options

Sajikan saran dalam bentuk opsi alternatif (Opsi A, B, atau C) dengan berbagai konsekuensinya, bukan instruksi tunggal yang kaku.

---

### 23. The Product Should Encourage Discovery

Menulis adalah proses eksplorasi. Jika penulis belum mengetahui akhir cerita atau motif pelaku, sistem memperlakukan *"Saya belum tahu"* sebagai kondisi yang wajar dan terhormat.

---

## V. Keamanan Data & Arsitektur Jangka Panjang

### 24. Privacy Matters

Naskah adalah hasil kerja keras bertahun-tahun. Data naskah bersifat privat secara default. Sistem harus transparan mengenai lokasi penyimpanan data dan memastikan naskah penulis tidak digunakan untuk melatih model AI umum tanpa izin.

---

### 25. AI Provider Independence

Produk tidak boleh bergantung secara filosofis maupun teknis pada satu vendor AI tertentu. Model LLM dapat diganti kapan saja; naskah dan struktur cerita penulis harus tetap abadi.

---

### 26. No Vendor Lock-In in the Story Model

Skema database, struktur bab, character bible, dan memori cerita dirancang secara netral (*provider-agnostic*).

---

### 27. Build for Long Stories

Pengalaman menulis di Bab 1 harus tetap cepat dan andal saat naskah mencapai Bab 100, ribuan adegan, dan puluhan tokoh, didukung oleh arsitektur *hierarchical context rollups*.

---

### 28. Performance Is Part of the Creative Experience

Pengetikan naskah harus instan tanpa latensi jaringan. Autosave berjalan di latar belakang secara lokal dan ter-debounce.

---

### 29. Failure Should Never Destroy Creative Work

Jika jaringan internet putus atau API AI mengalami timeout, naskah lokal tetap utuh dan aman. Pesan kegagalan harus transparan: *"Gagal terhubung ke AI. Naskah Anda tetap tersimpan aman secara lokal."*

---

### 30. Build Small, But Build the Right Foundation

Fokus pada fondasi yang kokoh (naskah, babak, bab, karakter, memori) sebelum membangun fitur-fitur kompleks berikutnya.

---

## VI. Kepribadian Produk & Panduan Keputusan

### 31. Avoid Feature Theater

Hindari membangun fitur sekadar untuk terlihat canggih: metrik skor cerita sembarangan, grafik AI dekoratif tanpa makna, atau badge intelegensi palsu. Setiap fitur harus menjawab: *"Apakah ini benar-benar membantu penulis memahami, merancang, atau menyempurnakan cerita mereka?"*

---

### 32. Product Personality

| Karakter yang Dihadirkan | Karakter yang Dihindari |
|---|---|
| Penuh pertimbangan (*thoughtful*) | Agresif & menuntut |
| Tenang & menghormati | Bising & gamified |
| Cerdas & privat | Terlalu terotomatisasi sepihak |
| Objektif & tidak menghakimi | Mekanikal & dingin |

---

### 33. Sound Like a Good Writing Partner

Bukan menghakimi: *"Skor kualitas bab Anda 72%"*.  
Melainkan mengamati dan mendampingi: *"Ada tensi menarik di adegan ini. Daniel berkata ia tidak percaya Anna, namun di bab berikutnya ia mempertaruhkan nyawa untuknya. Jika perubahan ini disengaja, Anda mungkin ingin menyisipkan momen kecil yang memperlihatkan titik balik perasaannya."*

---

### 34. Never Pretend to Understand More Than We Do

Jika konteks tidak cukup, katakan dengan jujur. Jika ada dua fakta yang bertentangan, tampilkan keduanya. Kejujuran dan keandalan jauh lebih berharga daripada ilusi kecerdasan buatan.

---

### 35. Product North Star

> **"Membantu penulis membuat kemajuan nyata pada novel yang benar-benar ingin mereka tulis."**

Kemajuan dapat berupa menulis 1.000 kata, memecahkan kebuntuan plot, memahami motivasi tokoh, atau merapikan outline yang berantakan.

---

### 36. Decision Filter

Sebelum menambahkan atau menyetujui sebuah fitur, ajukan 6 pertanyaan ini:
1. Apakah ini benar-benar membantu penulis?
2. Apakah ini mempertahankan kendali penulis?
3. Apakah ini menjaga integritas cerita?
4. Apakah ini mengurangi beban kognitif yang tidak perlu?
5. Apakah ini membuat sistem semakin dapat dipercaya?
6. Apakah ini tetap masuk akal untuk novel berisi 100+ bab?

Jika sebagian besar jawabannya tidak, tinjau kembali fitur tersebut.

---

### 37. The Golden Rule

> [!IMPORTANT]
> **"Jangan pernah memaksa penulis bertarung melawan alat kerjanya."**  
> Penulis tidak boleh merasa bahwa mereka harus mengelola database sebelum diizinkan menulis. Struktur cerita harus muncul secara alami dari alur kerja kreatif mereka.

---

### 38. Final Principle

Aplikasi melayani cerita. AI melayani penulis. Antarmuka melayani proses kreatif. Dan teknologi bertugas menjaga ketiganya tetap aman dan andal.

```text
                 PENULIS
                    │
                    ▼
                  CERITA
                    │
                    ▼
                APLIKASI
           ┌────────┴────────┐
           ▼                 ▼
        ALAT KERJA           AI
           │                 │
           └────────┬────────┘
                    ▼
               KARYA SENI
```

Dan prinsip pamungkas yang tidak akan pernah berubah:

> **The author owns the story.**
