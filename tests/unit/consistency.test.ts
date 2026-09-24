import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectMemoryConflicts,
  detectRuleTensions,
  detectSceneMemoryTensions,
  excerptAround,
  factKeyFor,
  hasNegation,
  sharedWords,
  tokenizeSignificant,
} from "@/features/consistency/checks";
import {
  buildConsistencyValidationPrompt,
  CONSISTENCY_VALIDATION_SYSTEM,
} from "@/server/ai/prompts";
import {
  runConsistencyCheckSchema,
  updateConsistencyFindingSchema,
  type StoryMemory,
  type WorldRule,
} from "@/types";

function mem(partial: Partial<StoryMemory> & { content: string }): StoryMemory {
  return {
    id: `mem_${Math.random().toString(36).slice(2, 8)}`,
    novel_id: "nov_1",
    type: "character_fact",
    importance: 3,
    status: "confirmed",
    source_type: "manual",
    source_id: null,
    metadata: {},
    embedding: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

function rule(partial: Partial<WorldRule> & { title: string; rule: string }): WorldRule {
  return {
    id: `rule_${Math.random().toString(36).slice(2, 8)}`,
    novel_id: "nov_1",
    description: null,
    importance: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

describe("tokenizeSignificant / hasNegation / sharedWords", () => {
  it("strips HTML, stopwords, short words, and dedupes", () => {
    const toks = tokenizeSignificant("<p>Daniel dan Daniel pergi ke dermaga di malam hari</p>");
    assert.ok(toks.includes("daniel"));
    assert.ok(toks.includes("dermaga"));
    assert.ok(!toks.includes("dan")); // stopword
    assert.ok(!toks.includes("di")); // too short
    assert.equal(toks.filter((t) => t === "daniel").length, 1);
  });

  it("detects Indonesian negation markers", () => {
    assert.equal(hasNegation("Daniel belum pernah ke dermaga."), true);
    assert.equal(hasNegation("Tidak ada sihir di sini."), true);
    assert.equal(hasNegation("Daniel sering ke dermaga."), false);
  });

  it("finds shared significant vocabulary", () => {
    const shared = sharedWords("Daniel pergi ke dermaga barat", "dermaga barat yang gelap menanti Daniel");
    assert.ok(shared.includes("daniel"));
    assert.ok(shared.includes("dermaga"));
    assert.ok(shared.includes("barat"));
  });
});

describe("excerptAround", () => {
  it("returns empty for blank text and full text when short", () => {
    assert.equal(excerptAround("", ["x"]), "");
    assert.equal(excerptAround("pendek saja", ["pendek"]), "pendek saja");
  });

  it("windows around the keyword and clips long text", () => {
    const long = `pembuka ${"kata ".repeat(100)}dermaga ${"kata ".repeat(100)}penutup`;
    const ex = excerptAround(long, ["dermaga"], 120);
    assert.ok(ex.includes("dermaga"));
    assert.ok(ex.length <= 125);
  });
});

describe("factKeyFor", () => {
  it("is stable for identical claims and distinct otherwise", () => {
    const a = factKeyFor("character_contradiction", "c1", "Daniel anak tunggal");
    assert.equal(a, factKeyFor("character_contradiction", "c1", "Daniel anak tunggal"));
    assert.notEqual(a, factKeyFor("character_contradiction", "c1", "Daniel punya kakak"));
    assert.notEqual(a, factKeyFor("lore_conflict", "c1", "Daniel anak tunggal"));
  });
});

describe("detectMemoryConflicts (memory vs memory)", () => {
  const a = () =>
    mem({ id: "m_a", content: "Daniel adalah anak tunggal, tidak memiliki saudara kandung dalam keluarga Hartono di Oakhaven.", metadata: { character_ids: ["c_daniel"] } });
  const b = () =>
    mem({ id: "m_b", content: "Daniel memiliki kakak perempuan dalam keluarga Hartono yang tinggal di Oakhaven.", metadata: { character_ids: ["c_daniel"] } });

  it("flags flipped-polarity facts about the same subject with source A/B", () => {
    const drafts = detectMemoryConflicts([a(), b()], "scene");
    assert.equal(drafts.length, 1);
    const d = drafts[0];
    assert.equal(d.type, "character_contradiction");
    assert.equal(d.severity, "potential");
    assert.equal(d.source_ids?.length, 2);
    assert.equal(d.source_ids?.[0].type, "memory");
    assert.equal(d.source_ids?.[1].type, "memory");
    assert.match(d.description, /potensi|mungkin/i); // tentative language (SOUL.md #13)
    assert.ok(String(d.metadata?.fact_key || "").length > 0);
  });

  it("ignores same-polarity pairs, non-confirmed status, and unrelated subjects", () => {
    const sameDir = mem({ content: "Daniel memiliki kakak perempuan di Oakhaven Hartono keluarga.", metadata: { character_ids: ["c_daniel"] } });
    assert.equal(detectMemoryConflicts([b(), sameDir], "scene").length, 0);
    assert.equal(detectMemoryConflicts([a(), { ...b(), status: "proposed" }], "scene").length, 0);
    const unrelated1 = mem({ content: "Kaelen tidak suka cahaya terang menara utara." });
    const unrelated2 = mem({ content: "Vane menyukai kegelapan gua selatan." });
    assert.equal(detectMemoryConflicts([unrelated1, unrelated2], "scene").length, 0);
  });
});

describe("detectSceneMemoryTensions (manuscript vs confirmed fact)", () => {
  const memory = () =>
    mem({
      id: "m_fact",
      content: "Daniel belum pernah mengunjungi kawasan dermaga barat sebelum malam penyerangan.",
    });

  it("flags scene text that flips an established fact, with scene excerpt evidence", () => {
    const drafts = detectSceneMemoryTensions(
      "<p>Daniel melangkah memasuki kawasan dermaga barat yang sudah sering ia datangi sejak kecil, jauh sebelum malam penyerangan itu tiba.</p>",
      { id: "sc_1", title: "Adegan 1" },
      [memory()],
      ["c_daniel"],
      "scene"
    );
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].type, "character_contradiction");
    const types = (drafts[0].source_ids || []).map((s) => s.type).sort();
    assert.deepEqual(types, ["memory", "scene"]);
    assert.match(drafts[0].description, /mungkin|potensi/i);
  });

  it("stays silent on short, aligned, or unlinked text", () => {
    assert.equal(detectSceneMemoryTensions("<p>Hai.</p>", { id: "s", title: "t" }, [memory()], [], "scene").length, 0);
    const aligned =
      "Daniel belum pernah melihat kawasan dermaga barat sebelum malam penyerangan yang dingin itu.";
    assert.equal(detectSceneMemoryTensions(aligned, { id: "s", title: "t" }, [memory()], [], "scene").length, 0);
    const linkedElsewhere = mem({
      content: "Vane tidak pernah mengunjungi kawasan dermaga barat sebelum malam penyerangan.",
      metadata: { character_ids: ["c_vane"] },
    });
    const neutral = "Daniel melangkah memasuki kawasan dermaga barat yang sudah sering ia datangi sejak kecil.";
    assert.equal(detectSceneMemoryTensions(neutral, { id: "s", title: "t" }, [linkedElsewhere], ["c_daniel"], "scene").length, 0);
  });
});

describe("detectRuleTensions (manuscript vs world rule)", () => {
  const exclusive = () =>
    rule({ id: "r_1", title: "Sihir Bulan", rule: "Hanya keturunan Moon Blood yang dapat merapal sihir bulan kuno di Oakhaven." });

  it("flags scene text that may violate an exclusivity rule", () => {
    const drafts = detectRuleTensions(
      "Daniel merapal sihir bulan kuno tanpa garis keturunan Moon Blood untuk membuka segel.",
      { id: "sc_1", title: "Adegan 1" },
      [exclusive()],
      "scene"
    );
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0].type, "lore_conflict");
    assert.match(drafts[0].description, /mungkin|potensi|disengaja/i);
  });

  it("stays silent for neutral rules with neutral scenes, or empty scenes", () => {
    const soft = rule({ title: "Cuaca", rule: "Kota tua sering berkabut pada pagi hari." });
    assert.equal(
      detectRuleTensions("Pagi itu cerah dan burung bernyanyi.", { id: "s", title: "t" }, [soft], "scene").length,
      0
    );
    assert.equal(detectRuleTensions("", { id: "s", title: "t" }, [exclusive()], "scene").length, 0);
  });
});

describe("consistency validation prompt contract", () => {
  it("renders candidates with fact_key and source A/B, demanding JSON only", () => {
    const prompt = buildConsistencyValidationPrompt([
      {
        index: 0,
        type: "character_contradiction",
        description: "Potensi kontradiksi.",
        factKey: "character_contradiction_abc123",
        sources: [
          { label: "Memori", excerpt: "Daniel anak tunggal." },
          { label: "Adegan: X", excerpt: "Daniel dan kakaknya." },
        ],
      },
    ]);
    assert.match(prompt, /character_contradiction_abc123/);
    assert.match(prompt, /Sumber A/);
    assert.match(prompt, /Sumber B/);
    assert.match(prompt, /JSON/);
    assert.match(CONSISTENCY_VALIDATION_SYSTEM, /tentatif|potensi/i);
    assert.match(CONSISTENCY_VALIDATION_SYSTEM, /keep=false/);
  });
});

describe("consistency zod schemas", () => {
  it("accepts scene/chapter scopes and rejects the rest", () => {
    assert.ok(runConsistencyCheckSchema.safeParse({ scope: "scene", sceneId: "s1" }).success);
    assert.ok(runConsistencyCheckSchema.safeParse({ scope: "chapter", chapterId: "c1" }).success);
    assert.equal(runConsistencyCheckSchema.safeParse({ scope: "novel" }).success, false);
    assert.equal(runConsistencyCheckSchema.safeParse({}).success, false);
  });

  it("allows reviewed/dismissed/resolved but never open via update", () => {
    assert.ok(updateConsistencyFindingSchema.safeParse({ status: "dismissed" }).success);
    assert.ok(updateConsistencyFindingSchema.safeParse({ status: "resolved" }).success);
    assert.equal(updateConsistencyFindingSchema.safeParse({ status: "open" }).success, false);
  });
});
