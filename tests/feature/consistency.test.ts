import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import { ConsistencyService } from "@/features/consistency/service";
import { resetAIProviderCache, setAIProviderForTests } from "@/server/ai/providers";

function freshUser() {
  return `usr_test_cons_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedNovel(userId: string) {
  const novel = await NovelService.createNovel({ title: "Novel Konsistensi" }, userId);
  const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
  const chapter = await ChapterService.createChapter(
    { title: "Bab 1", act_id: act.id },
    novel.id,
    userId
  );
  const scene = await SceneService.createScene(
    { title: "Adegan 1", chapter_id: chapter.id },
    novel.id,
    userId
  );
  return { novel, act, chapter, scene };
}

describe("ConsistencyService.runCheck", () => {
  it("finds a rule tension in scene scope and never touches the manuscript", async () => {
    resetAIProviderCache(); // local-dev: deterministic, no network
    const userId = freshUser();
    const { novel, chapter, scene } = await seedNovel(userId);

    const ruleRes = await WorldService.createWorldRule(novel.id, userId, {
      title: "Sihir Bulan",
      rule: "Hanya keturunan Moon Blood yang dapat merapal sihir bulan kuno di Oakhaven.",
      importance: 5,
    });
    assert.ok(ruleRes.success);

    const before = "<p>Daniel merapal sihir bulan kuno tanpa garis keturunan Moon Blood untuk membuka segel Oakhaven.</p>";
    await SceneService.updateSceneContent(scene.id, novel.id, userId, before);

    const res = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });

    assert.equal(res.success, true);
    assert.equal(res.checkedScenes, 1);
    assert.equal(res.created, 1);
    assert.equal(res.findings.length, 1);
    assert.equal(res.findings[0].type, "lore_conflict");
    assert.equal(res.findings[0].status, "open");
    assert.equal(res.findings[0].source_ids.length, 2);
    assert.match(res.findings[0].description, /potensi|mungkin/i);

    // Manuscript safety: content unchanged by the read-only check.
    const after = await SceneService.getScene(scene.id, novel.id, userId);
    assert.match(after?.content || "", /Daniel merapal sihir bulan kuno/);
  });

  it("detects character tension between confirmed memory and linked scene", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, chapter, scene } = await seedNovel(userId);

    const char = await CharacterService.createCharacter(novel.id, userId, { name: "Daniel" });
    assert.ok(char.success);
    const charId = char.character!.id;

    const { SceneCharacterRepository } = await import("@/features/characters/repository");
    await SceneCharacterRepository.setForScene(scene.id, novel.id, userId, [charId]);

    const memRes = await MemoryService.createMemory(novel.id, userId, {
      type: "character_fact",
      content: "Daniel belum pernah mengunjungi kawasan dermaga barat sebelum malam penyerangan.",
      status: "confirmed",
    });
    assert.ok(memRes.success);

    await SceneService.updateSceneContent(
      scene.id,
      novel.id,
      userId,
      "<p>Daniel melangkah memasuki kawasan dermaga barat yang sudah sering ia datangi sejak kecil, jauh sebelum malam penyerangan itu tiba.</p>"
    );

    const res = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });

    assert.equal(res.success, true);
    assert.equal(res.created, 1);
    assert.equal(res.findings[0].type, "character_contradiction");
  });

  it("dedupes re-runs via fact_key: no duplicate open findings", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, scene } = await seedNovel(userId);

    await WorldService.createWorldRule(novel.id, userId, {
      title: "Sihir Bulan",
      rule: "Hanya keturunan Moon Blood yang dapat merapal sihir bulan kuno di Oakhaven.",
    });
    await SceneService.updateSceneContent(
      scene.id,
      novel.id,
      userId,
      "<p>Daniel merapal sihir bulan kuno tanpa garis keturunan Moon Blood untuk membuka segel Oakhaven.</p>"
    );

    const first = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });
    assert.equal(first.created, 1);

    const second = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });
    assert.equal(second.success, true);
    assert.equal(second.created, 0, "same facts must not duplicate");
    assert.equal(second.findings.length, 1);
  });

  it("returns empty when nothing conflicts, and checks whole chapter scope", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, chapter, scene } = await seedNovel(userId);

    const scene2 = await SceneService.createScene(
      { title: "Adegan 2", chapter_id: chapter.id },
      novel.id,
      userId
    );
    await SceneService.updateSceneContent(scene.id, novel.id, userId, "<p>Pagi yang tenang di pasar Oakhaven.</p>");
    await SceneService.updateSceneContent(scene2.id, novel.id, userId, "<p>Burung bernyanyi di atas atap jerami.</p>");

    const res = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "chapter",
      chapterId: chapter.id,
    });
    assert.equal(res.success, true);
    assert.equal(res.created, 0);
    assert.equal(res.checkedScenes, 2);
    assert.equal(res.findings.length, 0);
  });

  it("survives a failing remote provider: local drafts are still returned", async () => {
    setAIProviderForTests({
      name: "remote-broken",
      async generateCompletion() {
        throw new Error("provider down");
      },
      async generateStructured() {
        throw new Error("provider down");
      },
      async generateEmbedding() {
        return new Array(1536).fill(0);
      },
    });
    const userId = freshUser();
    const { novel, scene } = await seedNovel(userId);

    await WorldService.createWorldRule(novel.id, userId, {
      title: "Sihir Bulan",
      rule: "Hanya keturunan Moon Blood yang dapat merapal sihir bulan kuno di Oakhaven.",
    });
    await SceneService.updateSceneContent(
      scene.id,
      novel.id,
      userId,
      "<p>Daniel merapal sihir bulan kuno tanpa garis keturunan Moon Blood untuk membuka segel Oakhaven.</p>"
    );

    const res = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });
    assert.equal(res.success, true);
    assert.equal(res.created, 1);
    assert.equal(res.aiValidated, false);

    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("drops drafts the remote validator rejects (keep=false)", async () => {
    setAIProviderForTests({
      name: "remote-strict",
      async generateCompletion() {
        return "{}";
      },
      async generateStructured<T>(messages: { content: string }[]): Promise<T> {
        const text = messages.map((m) => m.content).join("\n");
        const keys = [...text.matchAll(/fact_key: ([^\s)]+)/g)].map((m) => m[1]);
        return {
          verdicts: keys.map((k) => ({ fact_key: k, keep: false })),
        } as unknown as T;
      },
      async generateEmbedding() {
        return new Array(1536).fill(0);
      },
    });
    const userId = freshUser();
    const { novel, scene } = await seedNovel(userId);

    await WorldService.createWorldRule(novel.id, userId, {
      title: "Sihir Bulan",
      rule: "Hanya keturunan Moon Blood yang dapat merapal sihir bulan kuno di Oakhaven.",
    });
    await SceneService.updateSceneContent(
      scene.id,
      novel.id,
      userId,
      "<p>Daniel merapal sihir bulan kuno tanpa garis keturunan Moon Blood untuk membuka segel Oakhaven.</p>"
    );

    // Remote validator rejects every draft: nothing persisted, but the run succeeds.
    const res = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });
    assert.equal(res.success, true);
    assert.equal(res.created, 0, "rejected drafts are dropped");
    assert.equal(res.aiValidated, true);

    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("rejects invalid scope and denies cross-user access", async () => {
    resetAIProviderCache();
    const owner = freshUser();
    const stranger = freshUser();
    const { novel, scene } = await seedNovel(owner);

    const bad = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId: owner,
      scope: "scene",
      sceneId: null,
    });
    assert.equal(bad.success, false);

    const denied = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId: stranger,
      scope: "scene",
      sceneId: scene.id,
    });
    assert.equal(denied.success, false);
    assert.match(denied.error || "", /akses|tidak ditemukan/i);

    const deniedList = await ConsistencyService.listFindings(novel.id, stranger);
    assert.deepEqual(deniedList, []);
  });
});

describe("ConsistencyService review workflow (Review / Dismiss / Resolve)", () => {
  it("transitions open -> reviewed/dismissed/resolved and rejects bad status", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, scene } = await seedNovel(userId);

    await WorldService.createWorldRule(novel.id, userId, {
      title: "Sihir Bulan",
      rule: "Hanya keturunan Moon Blood yang dapat merapal sihir bulan kuno di Oakhaven.",
    });
    await SceneService.updateSceneContent(
      scene.id,
      novel.id,
      userId,
      "<p>Daniel merapal sihir bulan kuno tanpa garis keturunan Moon Blood untuk membuka segel Oakhaven.</p>"
    );
    const run = await ConsistencyService.runCheck({
      novelId: novel.id,
      userId,
      scope: "scene",
      sceneId: scene.id,
    });
    const id = run.findings[0].id;

    const reviewed = await ConsistencyService.review(id, novel.id, userId, "reviewed");
    assert.equal(reviewed.success, true);
    assert.equal(reviewed.finding?.status, "reviewed");

    const dismissed = await ConsistencyService.review(id, novel.id, userId, "dismissed");
    assert.equal(dismissed.finding?.status, "dismissed");

    const resolved = await ConsistencyService.review(id, novel.id, userId, "resolved");
    assert.equal(resolved.finding?.status, "resolved");

    const bad = await ConsistencyService.review(id, novel.id, userId, "open" as never);
    assert.equal(bad.success, false);

    // Stranger cannot review or delete.
    const stranger = freshUser();
    const denied = await ConsistencyService.review(id, novel.id, stranger, "resolved");
    assert.equal(denied.success, false);
    const delDenied = await ConsistencyService.remove(id, novel.id, stranger);
    assert.equal(delDenied.success, false);

    const del = await ConsistencyService.remove(id, novel.id, userId);
    assert.equal(del.success, true);
    assert.deepEqual(await ConsistencyService.listFindings(novel.id, userId), []);
  });
});
