import type {
  ChapterWithScenes,
  Character,
  CharacterRelationship,
  ConsistencyFinding,
  PlotThread,
  StoryDoctorEvidence,
  StoryDoctorObservation,
  StoryDoctorSection,
  StoryMemory,
  TimelineEvent,
  WorldLore,
  WorldRule,
} from "@/types";

// ---------------------------------------------------------------
// Deterministic Story Doctor analyzers (Phase 9 — Task 9.3)
// ---------------------------------------------------------------
// SOUL.md #14/#34: observations with evidence, never scores or
// verdicts. Every analyzer is a pure function over data the author
// already owns — no invented facts, no network, no cost. Ambiguity
// is preserved: a slow chapter may be intentional, an abandoned
// thread may be a deliberate loose end.

export interface DoctorInput {
  chapters: ChapterWithScenes[];
  characters: Character[];
  relationships: CharacterRelationship[];
  threads: PlotThread[];
  events: TimelineEvent[];
  memories: StoryMemory[];
  rules: WorldRule[];
  lore: WorldLore[];
  openFindings: ConsistencyFinding[];
}

type Obs = Omit<StoryDoctorObservation, "section">;

function obs(section: StoryDoctorSection, observation: string, rest: Partial<Obs> & { evidence: StoryDoctorEvidence[] }): StoryDoctorObservation {
  return { section, observation, ...rest } as StoryDoctorObservation;
}

function chEvidence(id: string, label: string): StoryDoctorEvidence {
  return { type: "chapter", id, label };
}

// ---------------------------------------------------------------
// 1. Plot — progression, escalation, climax, resolution
// ---------------------------------------------------------------
export function analyzePlot(input: DoctorInput): StoryDoctorObservation[] {
  const out: StoryDoctorObservation[] = [];
  const chapters = [...input.chapters].sort((a, b) => a.position - b.position);
  if (chapters.length === 0) return out;

  const withOutcome = chapters.filter((c) => c.outcome?.trim());
  if (withOutcome.length === 0 && chapters.length >= 3) {
    out.push(
      obs("plot", `Belum ada satu pun dari ${chapters.length} bab yang mencatat hasil (outcome) — arah progresi plot sulit dilacak.`, {
        evidence: chapters.slice(0, 5).map((c) => chEvidence(c.id, c.title)),
        interpretation: "Salah satu tafsir: struktur masih terbentuk dan outcome belum dirumuskan. Bisa juga outcome memang hidup di naskah, bukan di catatan.",
        suggestion: "Opsional: isi outcome untuk 1–2 bab kunci agar busur plot terlihat tanpa harus membaca ulang seluruh naskah.",
      })
    );
  }

  const withConflict = chapters.filter((c) => c.conflict?.trim());
  if (chapters.length >= 3 && withConflict.length < Math.ceil(chapters.length / 2)) {
    out.push(
      obs("plot", `Hanya ${withConflict.length} dari ${chapters.length} bab yang mencatat konflik eksplisit — eskalasi mungkin belum merata.`, {
        evidence: chapters.filter((c) => !c.conflict?.trim()).slice(0, 5).map((c) => chEvidence(c.id, c.title)),
        interpretation: "Mungkin konfliknya implisit di naskah (sah), atau beberapa bab memang berfungsi sebagai jeda.",
        suggestion: "Opsional: tandai konflik tiap bab; bab tanpa konflik berurutan bisa menjadi sinyal jeda yang terlalu panjang.",
      })
    );
  }

  // Climax/resolution: late chapters with no outcome or resolving thread.
  const late = chapters.slice(Math.max(0, chapters.length - 3));
  const lateResolved = late.filter((c) => c.outcome?.trim() || c.status === "completed");
  if (chapters.length >= 5 && lateResolved.length === 0) {
    out.push(
      obs("plot", "Bab-bab akhir belum menunjukkan tanda klimaks atau resolusi (belum ada outcome maupun status selesai).", {
        evidence: late.map((c) => chEvidence(c.id, c.title)),
        interpretation: "Wajar bila naskah masih draf awal; atau klimaks memang belum ditulis.",
        suggestion: "Opsional: tandai bab klimaks yang direncanakan agar pacing menuju akhir bisa dinilai.",
      })
    );
  }
  return out.slice(0, 5);
}

// ---------------------------------------------------------------
// 2. Character arcs — motivation, development, presence,
//    distribution, relationship anchors (Task 9.6)
// ---------------------------------------------------------------
// SOUL.md #13/#15: arc absence or clustering may be intentional.
// Every new check is evidence-bound and tentative; "unknown" and
// untracked presence stay valid states, never verdicts.
export function analyzeCharacterArcs(
  input: DoctorInput,
  appearances: Map<string, number>,
  presenceChapters?: Map<string, Set<string>>
): StoryDoctorObservation[] {
  const out: StoryDoctorObservation[] = [];
  if (input.characters.length === 0) return out;

  const mains = input.characters.filter((c) =>
    ["protagonist", "antagonist", "deuteragonist"].includes(c.role)
  );
  for (const c of mains) {
    const missing: string[] = [];
    if (!c.motivation?.trim()) missing.push("motivasi");
    if (!c.goal?.trim()) missing.push("tujuan");
    if (!c.character_arc?.trim()) missing.push("busur karakter");
    if (missing.length >= 2) {
      out.push(
        obs("character_arcs", `Tokoh ${c.role} "${c.name}" belum mencatat ${missing.join(" dan ")} — arknya sulit dinilai.`, {
          evidence: [{ type: "character", id: c.id, label: c.name }],
          interpretation: "Mungkin arknya sudah jelas di kepala penulis dan belum dituliskan; bisa juga tokoh ini memang berkembang secara organik.",
          suggestion: `Opsional: tulis satu kalimat ${missing[0]} untuk "${c.name}" sebagai jangkar revisi.`,
        })
      );
    }
  }

  // Main with no scene presence at all.
  for (const c of mains) {
    if ((appearances.get(c.id) || 0) === 0 && input.chapters.some((ch) => ch.scenes.length > 0)) {
      out.push(
        obs("character_arcs", `Tokoh ${c.role} "${c.name}" belum terhubung ke adegan mana pun — kehadirannya di naskah belum terlacak.`, {
          evidence: [{ type: "character", id: c.id, label: c.name }],
          interpretation: "Mungkin keterlibatannya belum ditautkan di konteks adegan, bukan berarti tokohnya absen dari naskah.",
          suggestion: `Opsional: tautkan "${c.name}" sebagai POV atau tokoh terlibat di adegan yang relevan.`,
        })
      );
    }
  }

  // Task 9.6a: presence clustering — main appears in >=3 chapters but
  // >=70% of those chapters sit in the first or last third of the novel.
  // Needs chapter-ordered presence; degrades silently without it.
  if (presenceChapters && presenceChapters.size > 0) {
    const ordered = [...input.chapters].sort((a, b) => a.position - b.position);
    if (ordered.length >= 6) {
      const rank = new Map(ordered.map((c, i) => [c.id, i]));
      const third = ordered.length / 3;
      for (const c of mains) {
        const present = [...(presenceChapters.get(c.id) || [])].filter((id) => rank.has(id));
        if (present.length < 3) continue;
        const inFirst = present.filter((id) => (rank.get(id) || 0) < third).length;
        const inLast = present.filter((id) => (rank.get(id) || 0) >= ordered.length - third).length;
        const clustered = Math.max(inFirst, inLast);
        if (clustered / present.length >= 0.7) {
          const side = inFirst >= inLast ? "awal" : "akhir";
          const evChapters = present
            .sort((a, b) => (rank.get(a) || 0) - (rank.get(b) || 0))
            .slice(0, 5)
            .map((id) => {
              const ch = ordered.find((x) => x.id === id);
              return chEvidence(id, ch?.title || id);
            });
          out.push(
            obs("character_arcs", `Kehadiran "${c.name}" menumpuk di sepertiga ${side} novel (${clustered} dari ${present.length} bab) — busurnya mungkin timpang.`, {
              evidence: [{ type: "character", id: c.id, label: c.name }, ...evChapters],
              interpretation: "Bisa disengaja (tokoh yang masuk belakangan, atau keluar lebih awal); bisa juga porsi tengah yang belum ditulis.",
              suggestion: `Opsional: periksa apakah "${c.name}" perlu satu kemunculan kecil di sepertiga yang kosong agar busurnya terasa utuh.`,
            })
          );
        }
      }
    }

    // Task 9.6b: middle absence — main present in early AND late chapters
    // but missing from >=2 consecutive middle chapters.
    if (ordered.length >= 5) {
      const midStart = Math.floor(ordered.length / 3);
      const midEnd = Math.ceil((ordered.length * 2) / 3);
      const middle = ordered.slice(midStart, midEnd);
      for (const c of mains) {
        const present = presenceChapters.get(c.id) || new Set<string>();
        if (present.size < 2) continue;
        const early = ordered.slice(0, midStart).some((ch) => present.has(ch.id));
        const late = ordered.slice(midEnd).some((ch) => present.has(ch.id));
        const missingMid = middle.filter((ch) => !present.has(ch.id));
        if (early && late && missingMid.length >= 2 && missingMid.length === middle.length) {
          out.push(
            obs("character_arcs", `"${c.name}" hadir di awal dan akhir tetapi absen di ${missingMid.length} bab tengah berurutan — pembaca mungkin kehilangan jejak busurnya.`, {
              evidence: [
                { type: "character", id: c.id, label: c.name },
                ...missingMid.map((ch) => chEvidence(ch.id, ch.title)),
              ],
              interpretation: "Ketidakhadiran di tengah bisa disengaja (tokoh yang menghilang lalu kembali); risikonya hanya bila kembalinya terasa tiba-tiba.",
              suggestion: `Opsional: selipkan satu penyebutan atau dampak "${c.name}" di bab tengah agar kehadirannya terjaga.`,
            })
          );
        }
      }
    }
  }

  // Task 9.6c: relationship without story anchor — a relation with written
  // history/current_state but no timeline event or character/relationship
  // memory mentioning either party. Only checked when the relation has
  // notes (empty relations are not punished).
  const annotatedRels = input.relationships.filter((r) => r.history?.trim() || r.current_state?.trim());
  if (annotatedRels.length > 0) {
    const nameOf = new Map(input.characters.map((c) => [c.id, c.name.toLowerCase()]));
    const anchorTexts = [
      ...input.events.map((e) => `${e.title} ${e.description || ""}`.toLowerCase()),
      ...input.memories
        .filter((m) => m.type === "character_fact" || m.type === "relationship_fact")
        .map((m) => m.content.toLowerCase()),
    ];
    for (const r of annotatedRels.slice(0, 8)) {
      const a = nameOf.get(r.from_character_id) || "";
      const b = nameOf.get(r.to_character_id) || "";
      if (!a || !b) continue;
      const anchored = anchorTexts.some((t) => t.includes(a) || t.includes(b));
      if (!anchored) {
        const labelA = input.characters.find((c) => c.id === r.from_character_id)?.name || "Tokoh A";
        const labelB = input.characters.find((c) => c.id === r.to_character_id)?.name || "Tokoh B";
        out.push(
          obs("character_arcs", `Relasi ${r.relationship_type} "${labelA} – ${labelB}" punya catatan (${r.current_state?.trim() ? "status kini" : "riwayat"}) tetapi belum berjangkar di peristiwa timeline maupun memori karakter mana pun.`, {
            evidence: [
              { type: "character", id: r.from_character_id, label: labelA },
              { type: "character", id: r.to_character_id, label: labelB },
            ],
            interpretation: "Relasi mungkin berkembang murni lewat dialog naskah (sah); atau peristiwa yang mengubahnya belum dicatat di timeline.",
            suggestion: "Opsional: catat satu peristiwa timeline untuk titik balik relasi tersebut, atau biarkan bila naskah sudah menunjukkannya.",
          })
        );
      }
      if (out.length >= 10) break;
    }
  }

  // Task 9.6d: arc without manuscript anchor — character_arc is written but
  // the character has no character_fact memory (any status except rejected)
  // and appears in at most one chapter. Needs chapter-level presence data;
  // without it the check degrades silently (count unknown, never assumed).
  const hasDistribution = !!presenceChapters && presenceChapters.size > 0;
  for (const c of mains) {
    if (!c.character_arc?.trim()) continue;
    if (!hasDistribution) continue;
    const hasAnchorMemory = input.memories.some(
      (m) =>
        m.type === "character_fact" &&
        m.status !== "rejected" &&
        (m.content.toLowerCase().includes(c.name.toLowerCase()) ||
          (m.metadata.character_ids || []).includes(c.id))
    );
    const chapterCount = presenceChapters!.get(c.id)?.size || 0;
    if (!hasAnchorMemory && chapterCount <= 1) {
      out.push(
        obs("character_arcs", `Busur "${c.name}" tertulis ("${c.character_arc!.slice(0, 60)}${c.character_arc!.length > 60 ? "…" : ""}") tetapi belum berjangkar di memori fakta karakter maupun kehadiran multi-bab.`, {
          evidence: [{ type: "character", id: c.id, label: c.name }],
          interpretation: "Arknya mungkin masih hidup di kepala penulis dan belum turun ke naskah; atau kehadirannya belum ditautkan.",
          suggestion: `Opsional: catat satu fakta karakter pendukung untuk "${c.name}", atau tautkan ia ke adegan yang memajukan busurnya.`,
        })
      );
    }
  }

  return out.slice(0, 8);
}

// ---------------------------------------------------------------
// 3. Pacing — chapter density outliers
// ---------------------------------------------------------------
export function analyzePacing(input: DoctorInput): StoryDoctorObservation[] {
  const out: StoryDoctorObservation[] = [];
  const chapters = [...input.chapters].sort((a, b) => a.position - b.position);
  const withWords = chapters.filter((c) => c.word_count > 0);
  if (withWords.length < 4) return out; // too little data: stay silent

  const counts = withWords.map((c) => c.word_count);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  if (mean <= 0) return out;

  const thin = withWords.filter((c) => c.word_count < mean * 0.4);
  if (thin.length >= 2) {
    out.push(
      obs("pacing", `${thin.length} bab memiliki kepadatan kata jauh di bawah rata-rata (${Math.round(mean)} kata/bab) — kemungkinan bagian yang lambat atau belum ditulis.`, {
        evidence: thin.slice(0, 6).map((c) => chEvidence(c.id, `${c.title} (${c.word_count} kata)`)),
        interpretation: "Bisa disengaja (jeda napas, bab transisi) atau memang draf yang belum diisi.",
        suggestion: "Opsional: periksa bab-bab tersebut — bila jeda disengaja, tidak ada yang perlu diubah.",
      })
    );
  }

  const dense = withWords.filter((c) => c.word_count > mean * 2.2);
  if (dense.length >= 1 && withWords.length >= 5) {
    out.push(
      obs("pacing", `${dense.length} bab jauh lebih padat dari rata-rata — kemungkinan bagian yang terburu-buru atau memuat terlalu banyak kejadian.`, {
        evidence: dense.slice(0, 4).map((c) => chEvidence(c.id, `${c.title} (${c.word_count} kata)`)),
        interpretation: "Mungkin bab klimaks yang memang padat (sah), atau beberapa kejadian yang bisa dipecah.",
        suggestion: "Opsional: tinjau apakah bab padat tersebut memuat lebih dari satu titik balik besar.",
      })
    );
  }
  return out.slice(0, 4);
}

// ---------------------------------------------------------------
// 4. Plot threads — active, resolved, potentially abandoned
// ---------------------------------------------------------------
export function analyzePlotThreads(input: DoctorInput): StoryDoctorObservation[] {
  const out: StoryDoctorObservation[] = [];
  if (input.threads.length === 0) return out;

  const active = input.threads.filter((t) => t.status === "active");
  const abandoned = input.threads.filter((t) => t.status === "abandoned");
  const resolved = input.threads.filter((t) => t.status === "resolved");

  const chapterIds = new Set(input.chapters.map((c) => c.id));
  const dangling = active.filter(
    (t) => t.introduced_chapter_id && !chapterIds.has(t.introduced_chapter_id)
  );
  for (const t of dangling.slice(0, 3)) {
    out.push(
      obs("plot_threads", `Thread aktif "${t.title}" menunjuk ke bab pengantar yang sudah tidak ada — jejaknya terputus.`, {
        evidence: [{ type: "plot_thread", id: t.id, label: t.title }],
        interpretation: "Kemungkinan babnya dihapus atau dipindah setelah thread dicatat.",
        suggestion: `Opsional: tautkan ulang "${t.title}" ke bab yang benar, atau tandai selesai bila sudah terbayar.`,
      })
    );
  }

  const unlinked = active.filter((t) => !t.introduced_chapter_id && !t.resolved_chapter_id);
  if (unlinked.length >= 2) {
    out.push(
      obs("plot_threads", `${unlinked.length} thread aktif belum tertaut ke bab mana pun — sulit melihat di mana mereka hidup di naskah.`, {
        evidence: unlinked.slice(0, 5).map((t) => ({ type: "plot_thread", id: t.id, label: t.title }) as StoryDoctorEvidence),
        interpretation: "Mungkin thread tingkat tema yang memang lintas-bab, atau tautannya belum dicatat.",
        suggestion: "Opsional: tautkan tiap thread ke bab pengantar agar keterbayarannya terlacak.",
      })
    );
  }

  if (abandoned.length > 0 && resolved.length === 0 && active.length >= 3) {
    out.push(
      obs("plot_threads", `${abandoned.length} thread ditandai ditinggalkan sementara ${active.length} masih aktif dan belum ada yang selesai — periksa apakah ada yang sebenarnya perlu ditutup.`, {
        evidence: abandoned.slice(0, 4).map((t) => ({ type: "plot_thread", id: t.id, label: t.title }) as StoryDoctorEvidence),
        interpretation: "Thread yang ditinggalkan bisa jadi keputusan sadar (ujung longgar yang disengaja) — hanya penulis yang tahu.",
        suggestion: "Opsional: tinjau daftar thread yang ditinggalkan; yang disengaja tidak perlu diubah.",
      })
    );
  }
  return out.slice(0, 5);
}

// ---------------------------------------------------------------
// 5. Worldbuilding — rule consistency, unexplained concepts
// ---------------------------------------------------------------
export function analyzeWorldbuilding(input: DoctorInput): StoryDoctorObservation[] {
  const out: StoryDoctorObservation[] = [];
  if (input.rules.length === 0 && input.lore.length === 0) return out;

  const bareRules = input.rules.filter((r) => !r.description?.trim());
  if (bareRules.length >= 3) {
    out.push(
      obs("worldbuilding", `${bareRules.length} aturan dunia hanya berupa judul/kaidah tanpa penjelasan — konsepnya mungkin belum terpikirkan tuntas.`, {
        evidence: bareRules.slice(0, 5).map((r) => ({ type: "world_rule", id: r.id, label: r.title }) as StoryDoctorEvidence),
        interpretation: "Aturan singkat bisa cukup bila penerapannya jelas di naskah; kekosongan deskripsi bukan otomatis masalah.",
        suggestion: "Opsional: tambahkan satu kalimat batasan/pengecualian untuk aturan paling penting.",
      })
    );
  }

  if (input.rules.length >= 1 && input.lore.length === 0) {
    out.push(
      obs("worldbuilding", `${input.rules.length} aturan dunia tercatat tetapi belum ada lore sama sekali — dunia mungkin terasa seperti daftar hukum tanpa sejarah.`, {
        evidence: input.rules.slice(0, 4).map((r) => ({ type: "world_rule", id: r.id, label: r.title }) as StoryDoctorEvidence),
        interpretation: "Mungkin lore memang hidup di naskah dan belum dipindah ke catatan; atau genre cerita tidak membutuhkannya.",
        suggestion: "Opsional: catat 1–2 lore asal-usul untuk aturan yang paling sering dilanggar/dipakai.",
      })
    );
  }

  const openLore = input.openFindings.filter((f) => f.type === "lore_conflict");
  if (openLore.length > 0) {
    out.push(
      obs("worldbuilding", `${openLore.length} temuan konflik aturan dunia masih terbuka di Consistency Engine — layak ditinjau sebelum analisis ini dianggap selesai.`, {
        evidence: openLore.slice(0, 4).map((f) => ({ type: "finding", id: f.id, label: f.description.slice(0, 80) }) as StoryDoctorEvidence),
        interpretation: "Temuan tersebut mungkin disengaja (pengecualian dramatis) — statusnya menunggu keputusan penulis.",
        suggestion: "Opsional: selesaikan atau abaikan temuan lore_conflict yang terbuka, lalu jalankan Story Doctor ulang.",
      })
    );
  }
  return out.slice(0, 4);
}

// ---------------------------------------------------------------
// 6. Unresolved questions — proposed memories, open findings,
//    unlinked timeline events
// ---------------------------------------------------------------
export function analyzeUnresolved(input: DoctorInput): StoryDoctorObservation[] {
  const out: StoryDoctorObservation[] = [];

  const proposed = input.memories.filter((m) => m.status === "proposed");
  if (proposed.length >= 3) {
    out.push(
      obs("unresolved_questions", `${proposed.length} memori cerita masih berstatus usulan — tumpukan pertanyaan yang belum dikonfirmasi penulis.`, {
        evidence: proposed.slice(0, 5).map((m) => ({ type: "memory", id: m.id, label: m.content.slice(0, 80) }) as StoryDoctorEvidence),
        interpretation: "Usulan menumpuk wajar bila ekstraksi otomatis baru berjalan; risikonya hanya bila usulan basi mengendap.",
        suggestion: "Opsional: luangkan satu sesi untuk mengonfirmasi atau menolak usulan tertua.",
      })
    );
  }

  if (input.openFindings.length >= 3) {
    const byType = new Map<string, number>();
    for (const f of input.openFindings) byType.set(f.type, (byType.get(f.type) || 0) + 1);
    const summary = [...byType.entries()].map(([t, n]) => `${n} ${t}`).join(", ");
    out.push(
      obs("unresolved_questions", `${input.openFindings.length} temuan konsistensi masih terbuka (${summary}) — daftar pertanyaan terbesar sebelum revisi.`, {
        evidence: input.openFindings.slice(0, 5).map((f) => ({ type: "finding", id: f.id, label: f.description.slice(0, 80) }) as StoryDoctorEvidence),
        interpretation: "Temuan terbuka bukan vonis — sebagian mungkin disengaja dan tinggal ditandai ditinjau/diabaikan.",
        suggestion: "Opsional: triase temuan terbuka; yang disengaja cukup ditandai agar tidak muncul lagi di analisis.",
      })
    );
  }

  const chapterIds = new Set(input.chapters.map((c) => c.id));
  const orphanEvents = input.events.filter((e) => e.chapter_id && !chapterIds.has(e.chapter_id));
  if (orphanEvents.length > 0) {
    out.push(
      obs("unresolved_questions", `${orphanEvents.length} peristiwa timeline menunjuk ke bab yang sudah tidak ada — kronologi menggantung.`, {
        evidence: orphanEvents.slice(0, 4).map((e) => ({ type: "timeline_event", id: e.id, label: e.title }) as StoryDoctorEvidence),
        interpretation: "Kemungkinan babnya dihapus setelah peristiwa dicatat.",
        suggestion: "Opsional: tautkan ulang peristiwa tersebut atau hapus bila kejadiannya ikut dibuang.",
      })
    );
  }
  return out.slice(0, 5);
}
