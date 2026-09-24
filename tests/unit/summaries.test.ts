import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSummaryHierarchy,
  composeDeterministic,
  stripToText,
} from "@/features/summaries/hierarchy";
import {
  buildSummarySynthesisPrompt,
  SUMMARY_SYNTHESIS_SYSTEM,
} from "@/server/ai/prompts";
import {
  applySummarySchema,
  synthesizeSummarySchema,
} from "@/types";
import type { Novel, NovelStructureTree } from "@/types";

function novel(): Novel {
  return {
    id: "nov_1",
    user_id: "usr_1",
    title: "Bayang Kota Tua",
    slug: "bayang-kota-tua",
    genre: null,
    status: "in_progress",
    premise: null,
    theme: null,
    tone: null,
    target_audience: null,
    description: "Sinopsis novel milik penulis.",
    word_count: 0,
    target_word_count: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function structure(): NovelStructureTree {
  const t = new Date().toISOString();
  return {
    acts: [
      {
        id: "act_1",
        novel_id: "nov_1",
        title: "Act I",
        description: null,
        position: 1,
        created_at: t,
        updated_at: t,
        chapters: [
          {
            id: "ch_1",
            novel_id: "nov_1",
            act_id: "act_1",
            title: "Bab 1",
            summary: null,
            objective: null,
            conflict: null,
            emotional_beat: null,
            outcome: null,
            position: 1,
            status: "draft",
            word_count: 10,
            created_at: t,
            updated_at: t,
            scenes: [
              {
                id: "sc_1",
                novel_id: "nov_1",
                chapter_id: "ch_1",
                title: "Adegan 1",
                summary: "Kaelen memecahkan kode.",
                purpose: null,
                pov_character_id: null,
                location_id: null,
                position: 1,
                status: "draft",
                content: "<p>Kaelen memecahkan kode.</p>",
                word_count: 5,
                created_at: t,
                updated_at: t,
              },
              {
                id: "sc_2",
                novel_id: "nov_1",
                chapter_id: "ch_1",
                title: "Adegan 2",
                summary: null,
                purpose: null,
                pov_character_id: null,
                location_id: null,
                position: 2,
                status: "draft",
                content: "<p>Patroli mendekat.</p>",
                word_count: 5,
                created_at: t,
                updated_at: t,
              },
            ],
          },
        ],
      },
    ],
    unassignedChapters: [],
    totalActs: 1,
    totalChapters: 1,
    totalScenes: 2,
    totalWords: 10,
  };
}

describe("stripToText / composeDeterministic", () => {
  it("strips editor HTML without merging words", () => {
    assert.equal(stripToText("<p>Satu</p><p>Dua</p>"), "Satu Dua");
    assert.equal(stripToText(null), "");
  });

  it("returns empty string for empty input — never a fake summary", () => {
    assert.equal(composeDeterministic([]), "");
    assert.equal(composeDeterministic([null, "  "]), "");
  });

  it("joins child texts and caps with an explicit marker", () => {
    assert.equal(composeDeterministic(["a", "b"]), "a b");
    const long = composeDeterministic(["x".repeat(2000)], 100);
    assert.ok(long.length <= 130);
    assert.match(long, /dipadatkan/);
  });
});

describe("buildSummaryHierarchy (author text outranks rollups)", () => {
  it("rolls scene -> chapter -> act -> novel deterministically", () => {
    const h = buildSummaryHierarchy(novel(), structure());
    assert.equal(h.acts.length, 1);
    assert.equal(h.acts[0].chapters[0].scenes.length, 2);
    // Chapter has no author text: derived from the one summarized scene.
    assert.equal(h.acts[0].chapters[0].authorText, null);
    assert.equal(h.acts[0].chapters[0].derivedText, "Kaelen memecahkan kode.");
    // Act has no description: derived from the chapter rollup.
    assert.equal(h.acts[0].authorText, null);
    assert.equal(h.acts[0].derivedText, "Kaelen memecahkan kode.");
    // Novel keeps the author's own description.
    assert.equal(h.novel.authorText, "Sinopsis novel milik penulis.");
    assert.equal(h.coverage.scenes.total, 2);
    assert.equal(h.coverage.scenes.withText, 1);
    assert.equal(h.coverage.chapters.withText, 0);
  });

  it("treats whitespace-only summaries as empty", () => {
    const s = structure();
    s.acts[0].chapters[0].scenes[0].summary = "   ";
    const h = buildSummaryHierarchy(novel(), s);
    assert.equal(h.coverage.scenes.withText, 0);
    assert.equal(h.acts[0].chapters[0].derivedText, "");
  });
});

describe("summary prompt + schemas", () => {
  it("synthesis prompt forbids invention and demands JSON only", () => {
    assert.match(SUMMARY_SYNTHESIS_SYSTEM, /JANGAN mengarang/);
    assert.match(SUMMARY_SYNTHESIS_SYSTEM, /JSON valid/);
    const p = buildSummarySynthesisPrompt({
      level: "chapter",
      title: "Bab 1",
      existing: null,
      sources: [{ label: "Adegan: A1", text: "Kode pecah." }],
    });
    assert.match(p, /Bab 1/);
    assert.match(p, /Kode pecah/);
  });

  it("validates synthesize/apply inputs at the boundary", () => {
    assert.ok(synthesizeSummarySchema.safeParse({ level: "chapter", id: "ch_1" }).success);
    assert.ok(!synthesizeSummarySchema.safeParse({ level: "bogus", id: "x" }).success);
    assert.ok(
      applySummarySchema.safeParse({ level: "scene", id: "sc_1", text: " Ringkas. " }).success
    );
    assert.ok(!applySummarySchema.safeParse({ level: "scene", id: "sc_1", text: "  " }).success);
    assert.ok(
      !applySummarySchema.safeParse({ level: "scene", id: "sc_1", text: "x".repeat(5001) }).success
    );
  });
});
