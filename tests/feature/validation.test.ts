import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createNovelSchema,
  createActSchema,
  createChapterSchema,
  createSceneSchema,
  createCharacterSchema,
  createRelationshipSchema,
  createLocationSchema,
  createWorldRuleSchema,
  createWorldLoreSchema,
  createStoryMemorySchema,
  createSceneVersionSchema,
  updateSceneContextSchema,
} from "@/types";

describe("Zod boundaries: invalid input is rejected before storage", () => {
  it("novel requires a non-empty title", () => {
    assert.equal(createNovelSchema.safeParse({ title: "" }).success, false);
    assert.equal(
      createNovelSchema.safeParse({ title: "A".repeat(151) }).success,
      false
    );
    assert.equal(createNovelSchema.safeParse({ title: "OK" }).success, true);
  });

  it("act / chapter / scene require titles and chapter linkage", () => {
    assert.equal(createActSchema.safeParse({ title: "" }).success, false);
    assert.equal(createChapterSchema.safeParse({ title: "Bab tanpa status" }).success, true);
    assert.equal(
      createSceneSchema.safeParse({ title: "Tanpa bab", chapter_id: "" }).success,
      false
    );
    assert.equal(
      createSceneSchema.safeParse({ title: "Adegan", chapter_id: "ch_1" }).success,
      true
    );
  });

  it("character requires a name and rejects self-relationships", () => {
    assert.equal(createCharacterSchema.safeParse({ name: "" }).success, false);
    assert.equal(
      createRelationshipSchema.safeParse({
        from_character_id: "same",
        to_character_id: "same",
      }).success,
      false
    );
  });

  it("world entities require names, rules, and content", () => {
    assert.equal(createLocationSchema.safeParse({ name: "" }).success, false);
    assert.equal(
      createWorldRuleSchema.safeParse({ title: "T", rule: "", importance: 9 }).success,
      false
    );
    assert.equal(
      createWorldLoreSchema.safeParse({ title: "T", content: "" }).success,
      false
    );
  });

  it("memories require content, valid type, and importance within 1..5", () => {
    assert.equal(
      createStoryMemorySchema.safeParse({ type: "story_fact", content: "" }).success,
      false
    );
    assert.equal(
      createStoryMemorySchema.safeParse({ type: " tahayul", content: "x" }).success,
      false
    );
    assert.equal(
      createStoryMemorySchema.safeParse({
        type: "story_fact",
        content: "fakta",
        importance: 9,
      }).success,
      false
    );
  });

  it("scene versions require content; context update defaults character list", () => {
    assert.equal(
      createSceneVersionSchema.safeParse({ content: "draf" }).success,
      true
    );
    const ctx = updateSceneContextSchema.safeParse({});
    assert.equal(ctx.success, true);
    if (ctx.success) assert.deepEqual(ctx.data.character_ids, []);
  });
});
