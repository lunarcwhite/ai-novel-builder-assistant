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

// ---------------------------------------------------------------
// Phase 8 — Consistency validation (Task 8.3/8.4/8.6)
// SOUL.md #12/#13: observations, not verdicts — the model confirms or
// drops each local heuristic observation; ambiguity is preserved.
// ---------------------------------------------------------------

export const CONSISTENCY_VALIDATION_SYSTEM = [
  "Kamu adalah pemeriksa konsistensi cerita yang cermat dan rendah hati.",
  "Tugasmu: untuk setiap observasi kandidat di bawah, putuskan apakah ia layak ditunjukkan ke penulis.",
  "Aturan:",
  "1. Gunakan bahasa tentatif ('potensi', 'mungkin', 'salah satu tafsir'); jangan pernah menyatakan cerita salah.",
  "2. Kontradiksi yang disengaja (narator tak andal, misteri, perubahan karakter) adalah SAH — tandai keep=false bila kedua sumber bisa benar bersamaan.",
  "3. Jangan mengarang fakta baru; nilai hanya dari kutipan sumber A/B yang diberikan.",
  "4. Kembalikan JSON valid saja: {\"verdicts\": [{\"fact_key\": \"...\", \"keep\": true|false, \"refined_description\": \"...\"}]}.",
  "5. Bahasa: Bahasa Indonesia.",
].join("\n");

export interface ConsistencyCandidateBrief {
  index: number;
  type: string;
  description: string;
  factKey: string;
  sources: { label: string; excerpt: string }[];
}

export function buildConsistencyValidationPrompt(candidates: ConsistencyCandidateBrief[]): string {
  const blocks = candidates.map((c) => {
    const src = c.sources
      .map((s, i) => `Sumber ${i === 0 ? "A" : "B"} (${s.label}): "${s.excerpt}"`)
      .join("\n");
    return `Kandidat ${c.index} [${c.type}] (fact_key: ${c.factKey})\nObservasi: ${c.description}\n${src}`;
  });
  return [
    "Nilai kandidat observasi berikut. Hanya pertahankan yang memang tampak bertentangan berdasarkan kutipan.",
    "",
    ...blocks,
    "",
    'Jawab HANYA dengan JSON: {"verdicts": [{"fact_key": "...", "keep": true, "refined_description": "..."}]}.',
  ].join("\n");
}

// ---------------------------------------------------------------
// Phase 9 — Story Doctor synthesis (Task 9.3)
// SOUL.md #14: diagnose, don't dictate. The model may only refine
// wording of existing deterministic observations — it must never
// invent new findings, scores, or story facts.
// ---------------------------------------------------------------

export const STORY_DOCTOR_SYSTEM = [
  "Kamu adalah Story Doctor: pembaca yang cermat, tenang, dan rendah hati.",
  "Tugasmu: untuk setiap observasi deterministik di bawah, perbaiki bahasanya bila perlu dan tambah tafsir + saran opsional.",
  "Aturan:",
  "1. JANGAN membuat observasi baru — hanya perkaya yang sudah ada (rujuk via index).",
  "2. JANGAN memberi skor kualitas, peringkat, atau vonis ('cerita salah', 'bab buruk').",
  "3. Gunakan bahasa tentatif ('mungkin', 'salah satu tafsir', 'potensi'); ambiguitas yang disengaja adalah SAH.",
  "4. Jangan mengarang fakta cerita baru; rujuk hanya evidence yang diberikan.",
  "5. Kembalikan JSON valid saja: {\"enrichments\": [{\"index\": 0, \"refined_observation\": \"...\", \"interpretation\": \"...\", \"suggestion\": \"...\"}]}.",
  "6. Bahasa: Bahasa Indonesia.",
].join("\n");

export interface StoryDoctorObservationBrief {
  index: number;
  section: string;
  observation: string;
  evidence: string[];
}

export function buildStoryDoctorPrompt(observations: StoryDoctorObservationBrief[]): string {
  const blocks = observations.map(
    (o) =>
      `Observasi ${o.index} [${o.section}]\nIsi: ${o.observation}\nEvidence: ${o.evidence.join(" | ") || "(tanpa evidence)"}`
  );
  return [
    "Perkaya observasi berikut TANPA menambah temuan baru. Untuk tiap observasi, beri interpretation (satu tafsir alternatif yang sah) dan suggestion (satu saran opsional, diawali 'Opsional:').",
    "",
    ...blocks,
    "",
    'Jawab HANYA dengan JSON: {"enrichments": [{"index": 0, "refined_observation": "...", "interpretation": "...", "suggestion": "..."}]}.',
  ].join("\n");
}
