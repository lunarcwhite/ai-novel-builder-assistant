import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";

function freshUser() {
  return `usr_test_manuscript_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("manuscript safety: autosave path, versions, restore", () => {
  it("updateContent counts words and syncs the chapter aggregate", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Naskah" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
    const chapter = await ChapterService.createChapter(
      { title: "Bab 1", act_id: act.id },
      novel.id,
      userId
    );
    const s1 = await SceneService.createScene(
      { title: "S1", chapter_id: chapter.id },
      novel.id,
      userId
    );
    const s2 = await SceneService.createScene(
      { title: "S2", chapter_id: chapter.id },
      novel.id,
      userId
    );

    const updated = await SceneService.updateSceneContent(
      s1.id,
      novel.id,
      userId,
      "<p>Dua kata nyata</p>"
    );
    assert.equal(updated?.word_count, 3);

    const chapterAfter = await ChapterService.getChapter(chapter.id, novel.id, userId);
    assert.equal(chapterAfter?.word_count, 3);

    await SceneService.updateSceneContent(s2.id, novel.id, userId, "satu dua tiga empat");
    const chapterAfter2 = await ChapterService.getChapter(chapter.id, novel.id, userId);
    assert.equal(chapterAfter2?.word_count, 7);
  });

  it("snapshot numbering auto-increments from 1", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Versi" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
    const chapter = await ChapterService.createChapter(
      { title: "Bab 1", act_id: act.id },
      novel.id,
      userId
    );
    const scene = await SceneService.createScene(
      { title: "S1", chapter_id: chapter.id },
      novel.id,
      userId
    );
    await SceneService.updateSceneContent(scene.id, novel.id, userId, "draf awal");

    const v1 = await SceneService.createSceneVersion(scene.id, novel.id, userId, {
      content: "draf awal",
      change_type: "manual",
    });
    const v2 = await SceneService.createSceneVersion(scene.id, novel.id, userId, {
      content: "draf awal revisi kecil",
      change_type: "manual",
    });
    assert.equal(v1.version_number, 1);
    assert.equal(v2.version_number, 2);

    const history = await SceneService.getSceneVersions(scene.id, novel.id, userId);
    assert.equal(history.length, 2);
    assert.equal(history[0].version_number, 2); // newest first
  });

  it("restore checkpoints the current draft and records a restore event", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Pulih" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
    const chapter = await ChapterService.createChapter(
      { title: "Bab 1", act_id: act.id },
      novel.id,
      userId
    );
    const scene = await SceneService.createScene(
      { title: "S1", chapter_id: chapter.id },
      novel.id,
      userId
    );
    await SceneService.updateSceneContent(scene.id, novel.id, userId, "teks versi satu");
    const v1 = await SceneService.createSceneVersion(scene.id, novel.id, userId, {
      content: "teks versi satu",
      change_type: "manual",
    });
    await SceneService.updateSceneContent(scene.id, novel.id, userId, "teks versi dua yang berbeda");

    const { scene: restored, restoredVersion } = await SceneService.restoreSceneVersion(
      scene.id,
      novel.id,
      userId,
      v1.id
    );
    assert.match(restored.content || "", /teks versi satu/);
    assert.equal(restoredVersion.change_type, "restore");

    const history = await SceneService.getSceneVersions(scene.id, novel.id, userId);
    const types = history.map((v) => v.change_type);
    assert.ok(types.includes("checkpoint"), `expected checkpoint, got: ${types.join(",")}`);
    assert.ok(types.includes("restore"), `expected restore, got: ${types.join(",")}`);
    // v1 + checkpoint + restore = 3 entries minimum
    assert.ok(history.length >= 3);
  });

  it("restore of a missing version throws instead of touching the manuscript", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Aman" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
    const chapter = await ChapterService.createChapter(
      { title: "Bab 1", act_id: act.id },
      novel.id,
      userId
    );
    const scene = await SceneService.createScene(
      { title: "S1", chapter_id: chapter.id },
      novel.id,
      userId
    );
    await SceneService.updateSceneContent(scene.id, novel.id, userId, "jangan sentuh");

    await assert.rejects(() =>
      SceneService.restoreSceneVersion(scene.id, novel.id, userId, "ver_missing")
    );
    const after = await SceneService.getScene(scene.id, novel.id, userId);
    assert.equal(after?.content, "jangan sentuh");
  });

  it("updateSceneContent on missing scene returns null (autosave 404 path)", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Kosong" }, userId);
    const res = await SceneService.updateSceneContent(
      "sc_missing",
      novel.id,
      userId,
      "teks"
    );
    assert.equal(res, null);
  });
});
