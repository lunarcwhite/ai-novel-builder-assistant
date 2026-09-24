import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMarkdown,
  buildTxt,
  exportFilename,
  htmlToText,
  mimeTypeFor,
} from "@/features/export/formatters";
import { exportQuerySchema } from "@/types";
import type { Novel, NovelStructureTree } from "@/types";

function novel(): Novel {
  return {
    id: "nov_1",
    user_id: "usr_1",
    title: "Bayang Kota Tua",
    slug: "bayang-kota-tua",
    genre: "Fantasi",
    status: "in_progress",
    premise: "Seorang juru arsip memburu segel yang hilang.",
    theme: null,
    tone: null,
    target_audience: null,
    description: null,
    word_count: 0,
    target_word_count: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function structure(scenes: { title: string; content: string }[]): NovelStructureTree {
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
            word_count: scenes.length,
            created_at: t,
            updated_at: t,
            scenes: scenes.map((s, i) => ({
              id: `sc_${i}`,
              novel_id: "nov_1",
              chapter_id: "ch_1",
              title: s.title,
              summary: null,
              purpose: null,
              pov_character_id: null,
              location_id: null,
              position: i + 1,
              status: "draft" as const,
              content: s.content,
              word_count: 1,
              created_at: t,
              updated_at: t,
            })),
          },
        ],
      },
    ],
    unassignedChapters: [],
    totalActs: 1,
    totalChapters: 1,
    totalScenes: scenes.length,
    totalWords: scenes.length,
  };
}

describe("htmlToText (editor HTML -> plain paragraphs)", () => {
  it("preserves paragraph breaks and decodes entities", () => {
    const out = htmlToText("<p>Satu &amp; dua</p><p>Tiga<br>empat</p>");
    assert.equal(out, "Satu & dua\n\nTiga\nempat");
  });

  it("returns empty string for empty content", () => {
    assert.equal(htmlToText(null), "");
    assert.equal(htmlToText(""), "");
    assert.equal(htmlToText("<p><br></p>"), "");
  });
});

describe("export builders (TXT + Markdown MVP)", () => {
  const scenes = [
    { title: "Adegan 1", content: "<p>Kaelen memecahkan kode.</p>" },
    { title: "Adegan 2", content: "<p>Pengejaran dimulai.</p>" },
  ];

  it("txt renders title, babak, bab, adegan in order", () => {
    const out = buildTxt(novel(), structure(scenes), { exportedAt: "2026-09-24" });
    assert.match(out, /Bayang Kota Tua/);
    assert.match(out, /BABAK: Act I/);
    assert.match(out, /Bab 1: Bab 1/);
    const i1 = out.indexOf("Kaelen memecahkan kode.");
    const i2 = out.indexOf("Pengejaran dimulai.");
    assert.ok(i1 >= 0 && i2 > i1);
    assert.ok(!out.includes("<p>"));
  });

  it("markdown uses heading hierarchy", () => {
    const out = buildMarkdown(novel(), structure(scenes), { exportedAt: "2026-09-24" });
    assert.match(out, /^# Bayang Kota Tua/m);
    assert.match(out, /^## Babak: Act I/m);
    assert.match(out, /^### Bab 1: Bab 1/m);
    assert.match(out, /^#### Adegan 1/m);
  });

  it("empty novel states no manuscript instead of inventing prose", () => {
    const empty = structure([]);
    assert.match(buildTxt(novel(), empty, { includeEmpty: false }), /Belum ada naskah/);
    assert.match(buildMarkdown(novel(), empty, { includeEmpty: false }), /Belum ada naskah/);
  });

  it("includeEmpty=false skips empty scenes, true marks them", () => {
    const mixed = structure([
      { title: "Penuh", content: "<p>Ada teks.</p>" },
      { title: "Kosong", content: "" },
    ]);
    const skipped = buildTxt(novel(), mixed, { includeEmpty: false });
    assert.match(skipped, /Ada teks/);
    assert.ok(!skipped.includes("Kosong"));
    const marked = buildTxt(novel(), mixed, { includeEmpty: true });
    assert.match(marked, /Kosong/);
    assert.match(marked, /\[Belum ada naskah pada adegan ini\.\]/);
  });

  it("filename falls back to slugified title; mime types are text kinds", () => {
    assert.equal(exportFilename(novel(), "md"), "bayang-kota-tua.md");
    assert.equal(exportFilename(novel(), "txt"), "bayang-kota-tua.txt");
    assert.equal(mimeTypeFor("txt"), "text/plain; charset=utf-8");
    assert.equal(mimeTypeFor("md"), "text/markdown; charset=utf-8");
  });
});

describe("exportQuerySchema (query validation)", () => {
  it("accepts aliases and includeEmpty flags", () => {
    assert.deepEqual(exportQuerySchema.parse({ format: "markdown" }), {
      format: "md",
      includeEmpty: true,
    });
    assert.deepEqual(exportQuerySchema.parse({ format: "text", includeEmpty: "0" }), {
      format: "txt",
      includeEmpty: false,
    });
  });

  it("defaults to md with empty scenes included", () => {
    assert.deepEqual(exportQuerySchema.parse({}), { format: "md", includeEmpty: true });
  });

  it("rejects unknown formats", () => {
    assert.throws(() => exportQuerySchema.parse({ format: "docx" }));
    assert.throws(() => exportQuerySchema.parse({ format: "pdf" }));
  });
});
