import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildStructureTree } from "@/features/structure/tree";
import type { Act, Chapter, Scene } from "@/types";

function makeAct(id: string, position: number): Act {
  return {
    id,
    novel_id: "nov_1",
    title: `Act ${id}`,
    description: null,
    position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeChapter(id: string, actId: string | null, position: number, words: number): Chapter {
  return {
    id,
    novel_id: "nov_1",
    act_id: actId,
    title: `Chapter ${id}`,
    summary: null,
    objective: null,
    conflict: null,
    emotional_beat: null,
    outcome: null,
    position,
    status: "draft",
    word_count: words,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeScene(id: string, chapterId: string, position: number, words: number): Scene {
  return {
    id,
    novel_id: "nov_1",
    chapter_id: chapterId,
    title: `Scene ${id}`,
    summary: null,
    purpose: null,
    pov_character_id: null,
    location_id: null,
    position,
    status: "draft",
    content: "",
    word_count: words,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("buildStructureTree (pure outline assembly)", () => {
  it("groups scenes under chapters and chapters under acts, sorted by position", () => {
    const tree = buildStructureTree(
      [makeAct("a1", 1)],
      [makeChapter("c1", "a1", 2, 0), makeChapter("c2", "a1", 1, 0)],
      [makeScene("s2", "c1", 2, 100), makeScene("s1", "c1", 1, 200)]
    );
    assert.equal(tree.totalActs, 1);
    assert.equal(tree.totalChapters, 2);
    assert.equal(tree.totalScenes, 2);
    assert.equal(tree.acts[0].chapters[0].id, "c2");
    assert.deepEqual(
      tree.acts[0].chapters.find((c) => c.id === "c1")!.scenes.map((s) => s.id),
      ["s1", "s2"]
    );
  });

  it("places chapters without act_id in unassignedChapters", () => {
    const tree = buildStructureTree(
      [makeAct("a1", 1)],
      [makeChapter("c1", null, 1, 50)],
      []
    );
    assert.equal(tree.acts[0].chapters.length, 0);
    assert.equal(tree.unassignedChapters.length, 1);
    assert.equal(tree.unassignedChapters[0].id, "c1");
  });

  it("derives chapter word count from scenes when scenes exist", () => {
    const tree = buildStructureTree(
      [],
      [makeChapter("c1", null, 1, 9999)],
      [makeScene("s1", "c1", 1, 300), makeScene("s2", "c1", 2, 700)]
    );
    assert.equal(tree.unassignedChapters[0].word_count, 1000);
    assert.equal(tree.totalWords, 1000);
  });

  it("keeps chapter word count when no scenes exist", () => {
    const tree = buildStructureTree([], [makeChapter("c1", null, 1, 250)], []);
    assert.equal(tree.unassignedChapters[0].word_count, 250);
    assert.equal(tree.totalWords, 250);
  });

  it("ignores orphan scenes whose chapter_id matches nothing", () => {
    const tree = buildStructureTree(
      [],
      [makeChapter("c1", null, 1, 10)],
      [makeScene("orphan", "missing", 1, 5000)]
    );
    assert.equal(tree.totalScenes, 1);
    assert.equal(tree.totalWords, 10);
    assert.equal(tree.unassignedChapters[0].scenes.length, 0);
  });
});
