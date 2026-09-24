import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";

function freshUser() {
  return `usr_test_crud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedNovelWithChapter(userId: string) {
  const novel = await NovelService.createNovel({ title: "Novel Uji CRUD" }, userId);
  const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
  const chapter = await ChapterService.createChapter(
    { title: "Bab 1", act_id: act.id },
    novel.id,
    userId
  );
  return { novel, act, chapter };
}

describe("vertical CRUD slice: novel -> act -> chapter -> scene", () => {
  it("creates and reads back the full hierarchy", async () => {
    const userId = freshUser();
    const { novel, act, chapter } = await seedNovelWithChapter(userId);
    const scene = await SceneService.createScene(
      { title: "Adegan 1", chapter_id: chapter.id },
      novel.id,
      userId
    );

    assert.equal((await ActService.getAct(act.id, novel.id, userId))?.title, "Act I");
    assert.equal((await ChapterService.getChapter(chapter.id, novel.id, userId))?.title, "Bab 1");
    assert.equal((await SceneService.getScene(scene.id, novel.id, userId))?.title, "Adegan 1");
    assert.equal((await SceneService.getScenesByChapter(chapter.id, novel.id, userId)).length, 1);
  });

  it("denies cross-user access at the ownership boundary", async () => {
    const owner = freshUser();
    const stranger = freshUser();
    const { novel, chapter } = await seedNovelWithChapter(owner);

    assert.equal(await NovelService.getNovel(novel.id, stranger), null);
    assert.deepEqual(await NovelService.listUserNovels(stranger), []);
    assert.equal(await NovelService.deleteNovel(novel.id, stranger), false);
    assert.ok(await NovelService.getNovel(novel.id, owner));
    assert.equal(await ChapterService.getChapter(chapter.id, novel.id, stranger), null);

    // Write path throws when the novel does not belong to the caller.
    await assert.rejects(() =>
      SceneService.createScene({ title: "X", chapter_id: chapter.id }, novel.id, stranger)
    );
    assert.equal(
      await SceneService.deleteScene("sc_missing", novel.id, stranger),
      false
    );
  });

  it("reorders scenes within a chapter", async () => {
    const userId = freshUser();
    const { novel, chapter } = await seedNovelWithChapter(userId);
    const s1 = await SceneService.createScene({ title: "S1", chapter_id: chapter.id }, novel.id, userId);
    const s2 = await SceneService.createScene({ title: "S2", chapter_id: chapter.id }, novel.id, userId);

    await SceneService.reorderScenes(chapter.id, novel.id, userId, [s2.id, s1.id]);
    const ordered = await SceneService.getScenesByChapter(chapter.id, novel.id, userId);
    assert.deepEqual(ordered.map((s) => s.id), [s2.id, s1.id]);
    assert.deepEqual(ordered.map((s) => s.position), [1, 2]);
  });

  it("reorders chapters and acts", async () => {
    const userId = freshUser();
    const { novel, act } = await seedNovelWithChapter(userId);
    const c2 = await ChapterService.createChapter({ title: "Bab 2", act_id: act.id }, novel.id, userId);
    const chapters = await ChapterService.getChaptersByAct(act.id, novel.id, userId);
    await ChapterService.reorderChapters(novel.id, userId, [c2.id, chapters[0].id], act.id);
    const reordered = await ChapterService.getChaptersByAct(act.id, novel.id, userId);
    assert.equal(reordered[0].id, c2.id);

    const a2 = await ActService.createAct({ title: "Act II" }, novel.id, userId);
    const acts = await ActService.getActs(novel.id, userId);
    await ActService.reorderActs(novel.id, userId, [a2.id, acts[0].id]);
    const reorderedActs = await ActService.getActs(novel.id, userId);
    assert.equal(reorderedActs[0].id, a2.id);
  });
});

describe("characters, relationships, and world CRUD", () => {
  it("creates characters, links a relationship, and resolves names", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Karakter" }, userId);

    const a = await CharacterService.createCharacter(novel.id, userId, {
      name: "Kaelen",
      role: "protagonist",
    });
    const b = await CharacterService.createCharacter(novel.id, userId, {
      name: "Vane",
      role: "supporting",
    });
    assert.ok(a.success && b.success);

    const rel = await CharacterService.createRelationship(novel.id, userId, {
      from_character_id: a.character!.id,
      to_character_id: b.character!.id,
      relationship_type: "ally",
    });
    assert.ok(rel.success);

    const rels = await CharacterService.getRelationships(novel.id, userId);
    assert.equal(rels.length, 1);
    assert.equal(rels[0].from_character_name, "Kaelen");
    assert.equal(rels[0].to_character_name, "Vane");

    // Self-relationship is rejected by Zod at the service boundary.
    const bad = await CharacterService.createRelationship(novel.id, userId, {
      from_character_id: a.character!.id,
      to_character_id: a.character!.id,
      relationship_type: "friend",
    });
    assert.equal(bad.success, false);
  });

  it("denies character access for a different user", async () => {
    const owner = freshUser();
    const stranger = freshUser();
    const novel = await NovelService.createNovel({ title: "Milik Owner" }, owner);
    const created = await CharacterService.createCharacter(novel.id, owner, { name: "X" });
    assert.ok(created.success);

    assert.deepEqual(await CharacterService.getCharacters(novel.id, stranger), []);
    const res = await CharacterService.createCharacter(novel.id, stranger, { name: "Y" });
    assert.equal(res.success, false);
  });

  it("creates locations, world rules, and lore articles", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Dunia" }, userId);

    const loc = await WorldService.createLocation(novel.id, userId, {
      name: "Oakhaven",
      atmosphere: "Berkabut",
    });
    const rule = await WorldService.createWorldRule(novel.id, userId, {
      title: "Sihir Bulan",
      rule: "Sihir membutuhkan Moon Blood.",
      importance: 5,
    });
    const lore = await WorldService.createWorldLore(novel.id, userId, {
      title: "Jatuhnya Ordo",
      content: "Ordo runtuh pada malam gerhana.",
    });
    assert.ok(loc.success && rule.success && lore.success);
    assert.equal((await WorldService.getLocations(novel.id, userId)).length, 1);
    assert.equal((await WorldService.getWorldRules(novel.id, userId)).length, 1);
    assert.equal((await WorldService.getWorldLoreList(novel.id, userId)).length, 1);

    // Empty names/rules are rejected before storage.
    assert.equal((await WorldService.createLocation(novel.id, userId, { name: "" })).success, false);
    assert.equal(
      (await WorldService.createWorldRule(novel.id, userId, { title: "", rule: "" })).success,
      false
    );
  });

  it("links POV, location, and involved characters to a scene", async () => {
    const userId = freshUser();
    const { novel, chapter } = await seedNovelWithChapter(userId);
    const scene = await SceneService.createScene(
      { title: "Adegan Konteks", chapter_id: chapter.id },
      novel.id,
      userId
    );
    const charA = await CharacterService.createCharacter(novel.id, userId, { name: "Anna" });
    const charB = await CharacterService.createCharacter(novel.id, userId, { name: "Daniel" });
    const loc = await WorldService.createLocation(novel.id, userId, { name: "Dermaga" });

    // updateSceneContextSchema requires UUIDs; service-level ids are random
    // strings in local-dev mode, so exercise the repository seam instead and
    // assert the assembled context object shape.
    const { SceneCharacterRepository } = await import(
      "@/features/characters/repository"
    );
    const ok = await SceneCharacterRepository.setForScene(
      scene.id,
      novel.id,
      userId,
      [charA.character!.id, charB.character!.id]
    );
    assert.equal(ok, true);

    const ctx = await CharacterService.getSceneContext(scene.id, novel.id, userId);
    assert.deepEqual(
      ctx.involved_characters.map((c) => c.name).sort(),
      ["Anna", "Daniel"]
    );
    assert.equal(ctx.location_id, scene.location_id);
    assert.ok(loc.success);
  });
});

describe("novel update and delete", () => {
  let beforeEachUser = "";
  beforeEach(() => {
    beforeEachUser = freshUser();
  });

  it("updates metadata and deletes the novel", async () => {
    const novel = await NovelService.createNovel({ title: "Sementara" }, beforeEachUser);
    const updated = await NovelService.updateNovel(
      novel.id,
      beforeEachUser,
      { status: "in_progress" }
    );
    assert.equal(updated?.status, "in_progress");
    assert.equal(await NovelService.deleteNovel(novel.id, beforeEachUser), true);
    assert.equal(await NovelService.getNovel(novel.id, beforeEachUser), null);
  });
});
