import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, suggestionToHtml } from "@/lib/ai-text";
import { OPERATION_CONTRACTS } from "@/server/ai/prompts";
import { buildPrompt } from "@/server/ai/context-builder";
import {
  LocalDevAIProvider,
  estimateCostUSD,
  estimateTokens,
  parseJsonLoose,
  resetAIProviderCache,
  resolveAIProvider,
  setAIProviderForTests,
} from "@/server/ai/providers";
import type { ResolvedStoryContext } from "@/server/ai/context-resolver";

describe("escapeHtml / suggestionToHtml (AI suggestion -> editor HTML)", () => {
  it("escapes markup so AI text can never inject tags", () => {
    assert.equal(escapeHtml("<script>alert(1)</script>"), "&lt;script&gt;alert(1)&lt;/script&gt;");
    assert.equal(suggestionToHtml("<b>x</b>"), "<p>&lt;b&gt;x&lt;/b&gt;</p>");
  });

  it("splits blank-line paragraphs and folds single newlines to <br>", () => {
    assert.equal(suggestionToHtml("A\n\nB"), "<p>A</p><p>B</p>");
    assert.equal(suggestionToHtml("A\nB"), "<p>A<br>B</p>");
  });

  it("returns empty string for blank input", () => {
    assert.equal(suggestionToHtml(""), "");
    assert.equal(suggestionToHtml("   \n  "), "");
  });
});

describe("OPERATION_CONTRACTS (one prompt contract per operation)", () => {
  it("covers all ten operations with label + instruction + sane sampling params", () => {
    const ops = [
      "brainstorm",
      "continue_scene",
      "rewrite",
      "expand",
      "shorten",
      "improve_prose",
      "improve_dialogue",
      "summarize",
      "critique",
      "ask",
    ] as const;
    for (const op of ops) {
      const c = OPERATION_CONTRACTS[op];
      assert.ok(c.label, `${op} needs a label`);
      assert.ok(c.instruction.length > 20, `${op} needs a real instruction`);
      assert.ok(c.temperature >= 0 && c.temperature <= 1, `${op} temperature range`);
      assert.ok(c.maxTokens > 0, `${op} maxTokens`);
    }
  });
});

function fixtureCtx(overrides: Partial<ResolvedStoryContext> = {}): ResolvedStoryContext {
  return {
    novel: {
      id: "nov_1",
      user_id: "usr_1",
      title: "Bayang Kota Tua",
      slug: "bayang-kota-tua",
      genre: "Dark Fantasy",
      status: "in_progress",
      premise: "Segel perunggu kuno.",
      theme: "Kebenaran",
      tone: "Misterius",
      target_audience: null,
      description: null,
      word_count: 0,
      target_word_count: 50000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    chapter: {
      id: "ch_1",
      novel_id: "nov_1",
      act_id: null,
      title: "Bab 1: Arsip Terlarang",
      summary: "Kaelen memecahkan kode.",
      objective: "Perkenalkan ancaman.",
      conflict: "Patroli mendekat.",
      emotional_beat: null,
      outcome: null,
      position: 1,
      status: "draft",
      word_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    scene: {
      id: "sc_1",
      novel_id: "nov_1",
      chapter_id: "ch_1",
      title: "Adegan 1: Penemuan",
      summary: null,
      purpose: "Buka misteri.",
      pov_character_id: null,
      location_id: null,
      position: 1,
      status: "draft",
      content: "<p>Lilin kedua hampir padam.</p>",
      word_count: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    povCharacter: null,
    location: null,
    involvedCharacters: [],
    relevantMemories: [
      {
        id: "mem_1",
        novel_id: "nov_1",
        type: "world_fact",
        content: "Pintu Segel Perunggu butuh dua kunci.",
        importance: 5,
        status: "confirmed",
        source_type: "world_rule",
        source_id: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    worldRules: [{ id: "wr_1", novel_id: "nov_1", title: "Aturan Segel", rule: "Dua kunci serentak.", description: null, importance: 5, created_at: "", updated_at: "" }],
    worldLore: [],
    timeline: [],
    plotThreads: [],
    selectedText: null,
    truncated: {},
    ...overrides,
  };
}

describe("buildPrompt (layered context, budget-respecting)", () => {
  it("includes novel, chapter, scene, memory, world rule, and the user query", () => {
    const built = buildPrompt(fixtureCtx(), "continue_scene", "Lanjutkan dari kalimat terakhir.");
    assert.match(built.system, /OPERASI: continue_scene/);
    assert.match(built.system, /pemilik cerita/);
    assert.match(built.userPrompt, /Bayang Kota Tua/);
    assert.match(built.userPrompt, /Adegan 1: Penemuan/);
    assert.match(built.userPrompt, /Lilin kedua hampir padam/);
    assert.match(built.userPrompt, /Pintu Segel Perunggu butuh dua kunci/);
    assert.match(built.userPrompt, /Dua kunci serentak/);
    assert.match(built.userPrompt, /Lanjutkan dari kalimat terakhir/);
  });

  it("sends selected text only for targeted operations, never for continue_scene", () => {
    const sel = "kalimat yang dipilih penulis";
    const rewrite = buildPrompt(fixtureCtx({ selectedText: sel }), "rewrite", "Poles.");
    assert.match(rewrite.userPrompt, /kalimat yang dipilih penulis/);
    const cont = buildPrompt(fixtureCtx({ selectedText: sel }), "continue_scene", "Lanjut.");
    assert.doesNotMatch(cont.userPrompt, /kalimat yang dipilih penulis/);
  });

  it("clips scene content (never the instruction) when over budget", () => {
    const big = fixtureCtx();
    if (big.scene) big.scene.content = "<p>" + "kata ".repeat(30000) + "</p>";
    const built = buildPrompt(big, "ask", "Apa yang terjadi?", 4000);
    assert.equal(built.contentClipped, true);
    assert.match(built.userPrompt, /\[dipotong\]/);
    assert.ok(built.system.length + built.userPrompt.length <= 4000 + 2000);
    assert.match(built.system, /OPERASI: ask/);
  });
});

describe("providers (offline-first, cost math, JSON safety)", () => {
  it("resolves the local deterministic provider when no API key is configured", () => {
    const savedProvider = process.env.AI_PROVIDER;
    const savedKey = process.env.AI_API_KEY;
    const savedOpenAI = process.env.OPENAI_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      resetAIProviderCache();
      assert.equal(resolveAIProvider().name, "local-dev-draft");
    } finally {
      if (savedProvider !== undefined) process.env.AI_PROVIDER = savedProvider;
      if (savedKey !== undefined) process.env.AI_API_KEY = savedKey;
      if (savedOpenAI !== undefined) process.env.OPENAI_API_KEY = savedOpenAI;
      setAIProviderForTests(null);
      resetAIProviderCache();
    }
  });

  it("local provider output is deterministic and names the operation + scene", async () => {
    const p = new LocalDevAIProvider();
    const msgs = [
      { role: "system" as const, content: "OPERASI: brainstorm\nADEGAN SAAT INI (Penemuan)\nISI NASKAH ADEGAN (dipotong): Lilin padam. Kaelen berlari." },
      { role: "user" as const, content: "NOVEL\nBeri opsi." },
    ];
    const a = await p.generateCompletion(msgs);
    const b = await p.generateCompletion(msgs);
    assert.equal(a, b);
    assert.match(a, /operasi brainstorm/);
    assert.match(a, /Penemuan/);
  });

  it("estimates USD cost per model and zero for local drafts", () => {
    assert.equal(estimateCostUSD("gpt-4o-mini", 1000, 1000), 0.00075);
    assert.equal(estimateCostUSD("local-dev-draft-1", 99999, 99999), 0);
    assert.ok(estimateCostUSD("unknown-model", 1000, 0) > 0);
  });

  it("estimates tokens ~chars/4 with a floor of 1", () => {
    assert.equal(estimateTokens(""), 0);
    assert.equal(estimateTokens("abcd"), 1);
    assert.equal(estimateTokens("a".repeat(400)), 100);
  });

  it("parseJsonLoose unwraps prose-wrapped JSON and rejects garbage", () => {
    assert.deepEqual(parseJsonLoose('{"a":1}'), { a: 1 });
    assert.deepEqual(parseJsonLoose('Here is the result:\n{"a":2}\nDone.'), { a: 2 });
    assert.throws(() => parseJsonLoose("no braces here"));
  });
});
