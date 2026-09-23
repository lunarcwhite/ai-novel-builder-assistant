/**
 * AI Prompt Contracts (Phase 7 — Task 7.3/7.5)
 * Rule 11 (AGENTS.md): prompts centralized here, never scattered in components.
 * SOUL.md #12/#13: preserve ambiguity, observations not verdicts.
 */

import type { AIOperation } from "@/types";

export interface OperationContract {
  operation: AIOperation;
  label: string;
  instruction: string;
  temperature: number;
  maxTokens: number;
}

export const OPERATION_CONTRACTS: Record<AIOperation, OperationContract> = {
  continue_scene: {
    operation: "continue_scene",
    label: "Lanjutkan Adegan",
    instruction:
      "Lanjutkan naskah adegan secara alami dari kalimat terakhir. Pertahankan sudut pandang, gaya bahasa, dan ritme penulis. Jangan mengakhiri bab atau menyelesaikan konflik besar kecuali naskah sudah mengarah ke sana. Hasilkan 1–3 paragraf lanjutan saja.",
    temperature: 0.8,
    maxTokens: 600,
  },
  rewrite: {
    operation: "rewrite",
    label: "Tulis Ulang",
    instruction:
      "Tulis ulang teks terpilih dengan makna, fakta cerita, dan emosi yang sama, tetapi dengan kalimat yang lebih jernih. Pertahankan sudut pandang, kosakata khas penulis, dan semua fakta (nama, tempat, aturan dunia). Jangan menambah fakta baru.",
    temperature: 0.6,
    maxTokens: 800,
  },
  expand: {
    operation: "expand",
    label: "Kembangkan",
    instruction:
      "Kembangkan teks terpilih dengan detail sensorik, gestur tokoh, dan suasana yang konsisten dengan dunia cerita. Jangan mengubah kejadian yang sudah terjadi dan jangan menambah fakta cerita baru yang mengikat (nama baru, aturan dunia baru).",
    temperature: 0.7,
    maxTokens: 800,
  },
  shorten: {
    operation: "shorten",
    label: "Padatkan",
    instruction:
      "Padatkan teks terpilih menjadi lebih ringkas tanpa menghilangkan kejadian, fakta, atau emosi penting. Buang pengulangan dan kata berlebih saja.",
    temperature: 0.5,
    maxTokens: 800,
  },
  improve_prose: {
    operation: "improve_prose",
    label: "Poles Prosa",
    instruction:
      "Poles prosa teks terpilih: perbaiki ritme, variasi kalimat, dan kejernihan, sambil mempertahankan suara penulis, sudut pandang, dan semua fakta cerita. Jangan mengubah isi kejadian.",
    temperature: 0.6,
    maxTokens: 800,
  },
  improve_dialogue: {
    operation: "improve_dialogue",
    label: "Perbaiki Dialog",
    instruction:
      "Perbaiki dialog dalam teks terpilih agar terdengar seperti percakapan nyata tiap tokoh (beda suara tiap karakter), konsisten dengan kepribadian dan hubungan mereka. Jaga makna dan fakta yang disampaikan. Jangan menambah pengungkapan plot baru.",
    temperature: 0.7,
    maxTokens: 800,
  },
  summarize: {
    operation: "summarize",
    label: "Ringkas",
    instruction:
      "Ringkas teks terpilih menjadi poin-poin kejadian penting (siapa, apa, di mana) dalam bahasa yang netral. Pisahkan fakta yang eksplisit dari kemungkinan interpretasi.",
    temperature: 0.4,
    maxTokens: 500,
  },
  critique: {
    operation: "critique",
    label: "Kritik & Saran",
    instruction:
      "Berperan sebagai pembaca yang cermat. Beri 2–4 observasi spesifik tentang teks terpilih (kejelasan, motivasi tokoh, ritme, konsistensi dengan konteks) dengan format Observasi + Bukti (kutip singkat) + Saran opsional. Gunakan bahasa tentatif ('mungkin', 'potensi'), bukan vonis. Jangan menilai dengan skor.",
    temperature: 0.6,
    maxTokens: 700,
  },
  brainstorm: {
    operation: "brainstorm",
    label: "Brainstorm",
    instruction:
      "Berikan 3 opsi arah cerita yang berbeda (Opsi A/B/C) berdasarkan konteks yang ada, masing-masing 1–2 kalimat beserta satu konsekuensi potensial. Jangan memutuskan untuk penulis — akhiri dengan satu pertanyaan yang membantu penulis memilih. Hormati fakta yang sudah mapan.",
    temperature: 0.85,
    maxTokens: 600,
  },
  ask: {
    operation: "ask",
    label: "Tanya AI",
    instruction:
      "Jawab pertanyaan penulis tentang cerita dengan memakai konteks yang diberikan. Bedakan fakta yang terkonfirmasi ('naskah menetapkan...') dari kemungkinan ('salah satu tafsir...'). Jika konteks tidak cukup, katakan terus terang dan ajukan pertanyaan klarifikasi yang baik, jangan mengarang fakta.",
    temperature: 0.7,
    maxTokens: 700,
  },
};

export const AI_SYSTEM_PREAMBLE = [
  "Kamu adalah partner menulis yang tenang, cermat, dan menghormati suara penulis.",
  "Aturan yang tidak boleh dilanggar:",
  "1. Penulis adalah pemilik cerita — kamu memberi saran, bukan keputusan.",
  "2. Jangan mengubah fakta cerita (nama, hubungan, aturan dunia, timeline) kecuali diminta eksplisit.",
  "3. Jangan berpura-pura yakin: gunakan bahasa tentatif bila konteks ambigu; 'unknown' adalah jawaban yang sah.",
  "4. Jangan menilai dengan skor atau label menghakimi; beri observasi + bukti + saran opsional.",
  "5. Tulis dalam bahasa yang sama dengan naskah penulis (default: Bahasa Indonesia).",
].join("\n");
