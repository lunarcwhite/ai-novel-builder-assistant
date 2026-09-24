import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeCharacterArcs,
  analyzePacing,
  analyzePlot,
  analyzePlotThreads,
  analyzeUnresolved,
  analyzeWorldbuilding,
  type DoctorInput,
} from "@/features/doctor/analyzers";
import { buildStoryDoctorPrompt, STORY_DOCTOR_SYSTEM } from "@/server/ai/prompts";
import { runStoryDoctorSchema } from "@/types";
import type {
  ChapterWithScenes,
  Character,
  PlotThread,
  StoryMemory,
  WorldRule,
} from "@/types";

function chapter(partial: Partial<ChapterWithScenes> & { id: string; title: string }): ChapterWithScenes {
  return {
    novel_id: "nov_1",
    act_id: null,
    summary: null,
    objective: null,
    conflict: null,
    emotional_beat: null,
    outcome: null,
    position: 1,
    status: "draft",
    word_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    scenes: [],
    ...partial,
  };
}

function char(partial: Partial<Character> & { id: string; name: string }): Character {
  return {
    novel_id: "nov_1",
    role: "supporting",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

function base(): DoctorInput {
  return {
    chapters: [],
    characters: [],
    relationships: [],
    threads: [],
    events: [],
    memories: [],
    rules: [],
    lore: [],
    openFindings: [],
  };
}

describe("analyzePlot", () => {
  it("stays silent on empty novels", () => {
    assert.equal(analyzePlot(base()).length, 0);
  });

  it("flags missing outcomes and conflicts with chapter evidence", () => {
    const input = base();
    input.chapters = [1, 2, 3, 4].map((n) =>
      chapter({ id: `ch_${n}`, title: `Bab ${n}`, position: n })
    );
    const out = analyzePlot(input);
    assert.ok(out.length >= 1);
    assert.ok(out.every((o) => o.section === "plot"));
    assert.ok(out[0].evidence.length > 0);
    assert.ok(out[0].evidence.every((e) => e.type === "chapter"));
    assert.match(out[0].observation, /outcome/i);
  });

  it("stays silent when outcomes and conflicts are recorded", () => {
    const input = base();
    input.chapters = [1, 2, 3].map((n) =>
      chapter({
        id: `ch_${n}`,
        title: `Bab ${n}`,
        position: n,
        outcome: `Hasil bab ${n}`,
        conflict: `Konflik bab ${n}`,
        status: "completed",
      })
    );
    assert.equal(analyzePlot(input).length, 0);
  });
});

describe("analyzeCharacterArcs", () => {
  it("flags mains missing motivation/goal/arc", () => {
    const input = base();
    input.characters = [char({ id: "c1", name: "Anna", role: "protagonist" })];
    const out = analyzeCharacterArcs(input, new Map());
    assert.equal(out.length, 1);
    assert.equal(out[0].evidence[0].type, "character");
    assert.match(out[0].observation, /Anna/);
  });

  it("flags mains with zero scene presence", () => {
    const input = base();
    input.characters = [
      char({
        id: "c1",
        name: "Daniel",
        role: "antagonist",
        motivation: "Kuasa",
        goal: "Takhta",
        character_arc: "Jatuh lalu sadar",
      }),
    ];
    input.chapters = [
      chapter({
        id: "ch_1",
        title: "Bab 1",
        scenes: [
          {
            id: "sc_dummy",
            novel_id: "nov_1",
            chapter_id: "ch_1",
            title: "Adegan pembuka",
            position: 1,
            status: "draft",
            word_count: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    ];
    const out = analyzeCharacterArcs(input, new Map());
    assert.ok(out.some((o) => /belum terhubung ke adegan/i.test(o.observation)));
  });

  it("stays silent for complete, present mains", () => {
    const input = base();
    input.characters = [
      char({
        id: "c1",
        name: "Anna",
        role: "protagonist",
        motivation: "Kebenaran",
        goal: "Bebas",
        character_arc: "Berani",
      }),
    ];
    const out = analyzeCharacterArcs(input, new Map([["c1", 3]]));
    assert.equal(out.length, 0);
  });
});

describe("analyzePacing", () => {
  it("stays silent with too little data", () => {
    const input = base();
    input.chapters = [chapter({ id: "ch_1", title: "Bab 1", word_count: 500 })];
    assert.equal(analyzePacing(input).length, 0);
  });

  it("flags thin chapters against the mean", () => {
    const input = base();
    input.chapters = [2000, 2100, 1900, 2000, 200, 150].map((w, i) =>
      chapter({ id: `ch_${i}`, title: `Bab ${i + 1}`, position: i + 1, word_count: w })
    );
    const out = analyzePacing(input);
    assert.ok(out.length >= 1);
    assert.ok(out.every((o) => o.section === "pacing"));
  });
});

describe("analyzePlotThreads", () => {
  it("flags dangling chapter links and unlinked actives", () => {
    const input = base();
    input.chapters = [chapter({ id: "ch_1", title: "Bab 1" })];
    const t = (id: string, title: string, extra: Partial<PlotThread> = {}): PlotThread => ({
      id,
      novel_id: "nov_1",
      title,
      description: null,
      status: "active",
      importance: 3,
      introduced_chapter_id: null,
      resolved_chapter_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...extra,
    });
    input.threads = [
      t("t1", "Misteri Segel", { introduced_chapter_id: "ch_gone" }),
      t("t2", "Utang Ordo"),
      t("t3", "Cinta Terlarang"),
    ];
    const out = analyzePlotThreads(input);
    assert.ok(out.length >= 2);
    assert.ok(out.some((o) => /terputus/i.test(o.observation)));
    assert.ok(out.some((o) => /belum tertaut/i.test(o.observation)));
  });
});

describe("analyzeWorldbuilding", () => {
  it("flags bare rules and missing lore", () => {
    const input = base();
    const r = (id: string, title: string): WorldRule => ({
      id,
      novel_id: "nov_1",
      title,
      rule: "Hanya pewaris bisa membuka segel.",
      description: null,
      importance: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    input.rules = [r("r1", "Segel A"), r("r2", "Segel B"), r("r3", "Segel C")];
    const out = analyzeWorldbuilding(input);
    assert.ok(out.length >= 2);
    assert.ok(out.some((o) => /tanpa penjelasan/i.test(o.observation)));
    assert.ok(out.some((o) => /belum ada lore/i.test(o.observation)));
  });
});

describe("analyzeUnresolved", () => {
  it("flags proposed-memory pileups with memory evidence", () => {
    const input = base();
    const m = (id: string): StoryMemory => ({
      id,
      novel_id: "nov_1",
      type: "story_fact",
      content: `Fakta usulan ${id} yang cukup panjang untuk dianalisis`,
      importance: 2,
      status: "proposed",
      source_type: "manual",
      source_id: null,
      metadata: {},
      embedding: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    input.memories = [m("m1"), m("m2"), m("m3")];
    const out = analyzeUnresolved(input);
    assert.equal(out.length, 1);
    assert.ok(out[0].evidence.every((e) => e.type === "memory"));
  });
});

describe("story doctor prompt + schema", () => {
  it("prompt forbids new findings and scores", () => {
    assert.match(STORY_DOCTOR_SYSTEM, /JANGAN membuat observasi baru/);
    assert.match(STORY_DOCTOR_SYSTEM, /JANGAN memberi skor/);
    const prompt = buildStoryDoctorPrompt([
      { index: 0, section: "plot", observation: "X", evidence: ["Bab 1"] },
    ]);
    assert.match(prompt, /TANPA menambah temuan baru/);
    assert.match(prompt, /enrichments/);
  });

  it("runStoryDoctorSchema validates section filters", () => {
    assert.equal(runStoryDoctorSchema.safeParse({}).success, true);
    assert.equal(
      runStoryDoctorSchema.safeParse({ sections: ["plot", "pacing"], withAI: true }).success,
      true
    );
    assert.equal(runStoryDoctorSchema.safeParse({ sections: ["bogus"] }).success, false);
  });
});
