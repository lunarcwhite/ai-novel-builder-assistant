import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { CharacterService } from "@/features/characters/service";
import { MemoryService } from "@/features/memories/service";

function freshUser() {
  return `usr_test_memory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("story memory: lifecycle, status, dedup, retrieval", () => {
  it("creates a memory as confirmed by default only when input omits status", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Memori" }, userId);
    const res = await MemoryService.createMemory(novel.id, userId, {
      type: "character_fact",
      content: "Anna kidal sejak kecil.",
    });
    assert.equal(res.success, true);
    assert.equal(res.memory?.status, "confirmed");
    assert.equal(res.memory?.importance, 3);
  });

  it("rejects empty content and invalid types before embedding", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Validasi" }, userId);
    const empty = await MemoryService.createMemory(novel.id, userId, {
      type: "story_fact",
      content: "",
    });
    assert.equal(empty.success, false);
    const badType = await MemoryService.createMemory(novel.id, userId, {
      type: "bukan_tipe",
      content: "sesuatu",
    });
    assert.equal(badType.success, false);
  });

  it("denies memory creation for a different user", async () => {
    const owner = freshUser();
    const stranger = freshUser();
    const novel = await NovelService.createNovel({ title: "Privat" }, owner);
    const res = await MemoryService.createMemory(novel.id, stranger, {
      type: "story_fact",
      content: "upaya menyusup",
    });
    assert.equal(res.success, false);
    assert.match(res.error || "", /Akses/);
  });

  it("flags near-duplicate facts with a warning message", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Dedup" }, userId);
    const first = await MemoryService.createMemory(novel.id, userId, {
      type: "character_fact",
      content: "Daniel belum pernah mengunjungi kota tua sebelum malam penyerangan.",
    });
    assert.equal(first.success, true);

    const dup = await MemoryService.createMemory(novel.id, userId, {
      type: "character_fact",
      content: "Daniel belum pernah mengunjungi kota tua sebelum malam penyerangan.",
    });
    assert.equal(dup.success, true); // stored, but flagged
    assert.ok(dup.duplicateWarning, "expected duplicateWarning on identical fact");
    assert.match(dup.duplicateWarning!, /kemiripan/);
  });

  it("short text skips duplicate detection", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Pendek" }, userId);
    const check = await MemoryService.checkDuplicateCandidate(novel.id, userId, "ok");
    assert.equal(check.isDuplicate, false);
  });

  it("filters search by status and type", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Saring" }, userId);
    await MemoryService.createMemory(novel.id, userId, {
      type: "character_fact",
      content: "Kaelen memiliki bekas luka bakar di bahu kanan.",
      status: "confirmed",
    });
    await MemoryService.createMemory(novel.id, userId, {
      type: "world_fact",
      content: "Sihir membutuhkan Moon Blood dari gua utara.",
      status: "confirmed",
    });

    const charOnly = await MemoryService.searchSimilarMemories(
      novel.id,
      userId,
      "bekas luka bakar Kaelen di bahu",
      { types: ["character_fact"], threshold: 0.1, limit: 10 }
    );
    assert.ok(charOnly.length >= 1);
    assert.ok(charOnly.every((r) => r.memory.type === "character_fact"));

    const rejected = await MemoryService.searchSimilarMemories(
      novel.id,
      userId,
      "bekas luka bakar Kaelen di bahu",
      { statuses: ["rejected"], threshold: 0.1, limit: 10 }
    );
    assert.equal(rejected.length, 0);
  });

  it("status transitions and deletion work, stats stay consistent", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Status" }, userId);
    const created = await MemoryService.createMemory(novel.id, userId, {
      type: "story_fact",
      content: "Cincin itu milik ibu Anna.",
      status: "proposed",
    });
    const id = created.memory!.id;

    const confirmed = await MemoryService.updateStatus(id, novel.id, userId, "confirmed");
    assert.equal(confirmed.success, true);

    const stats = await MemoryService.getStats(novel.id, userId);
    assert.equal(stats.total, 1);
    assert.equal(stats.confirmed, 1);
    assert.equal(stats.proposed, 0);

    const del = await MemoryService.deleteMemory(id, novel.id, userId);
    assert.equal(del.success, true);
    const statsAfter = await MemoryService.getStats(novel.id, userId);
    assert.equal(statsAfter.total, 0);

    // Deleting a missing ID reports failure instead of silent success.
    const missing = await MemoryService.deleteMemory("mem_missing", novel.id, userId);
    assert.equal(missing.success, false);
  });

  it("scene-relevant retrieval merges direct links with semantic context", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Relevan" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
    const chapter = await ChapterService.createChapter(
      { title: "Bab 1", act_id: act.id },
      novel.id,
      userId
    );
    const scene = await SceneService.createScene(
      {
        title: "Malam Penyerangan",
        chapter_id: chapter.id,
        summary: "Daniel tiba di dermaga barat saat penyerangan dimulai.",
        purpose: "Mempertemukan Daniel dengan masa lalunya.",
      },
      novel.id,
      userId
    );
    const char = await CharacterService.createCharacter(novel.id, userId, { name: "Daniel" });
    const { SceneCharacterRepository } = await import(
      "@/features/characters/repository"
    );
    await SceneCharacterRepository.setForScene(scene.id, novel.id, userId, [char.character!.id]);

    await MemoryService.createMemory(novel.id, userId, {
      type: "character_fact",
      content: "Daniel belum pernah menginjakkan kaki di dermaga barat sebelum malam penyerangan.",
      status: "confirmed",
      character_ids: [],
    });

    const relevant = await MemoryService.getSceneRelevantMemories(
      novel.id,
      userId,
      scene.id
    );
    assert.ok(relevant.length >= 1, "expected at least the semantic fallback match");
  });
});
