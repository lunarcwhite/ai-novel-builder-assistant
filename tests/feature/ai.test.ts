import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { AIService } from "@/features/ai/service";
import { setAIProviderForTests, resetAIProviderCache } from "@/server/ai/providers";
import type { AIProvider } from "@/server/ai/provider";

function freshUser() {
  return `usr_test_ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedScene(userId: string, content = "<p>Lilin kedua hampir padam.</p>") {
  const novel = await NovelService.createNovel({ title: "Novel AI" }, userId);
  const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
  const chapter = await ChapterService.createChapter({ title: "Bab 1", act_id: act.id }, novel.id, userId);
  const scene = await SceneService.createScene({ title: "Adegan 1", chapter_id: chapter.id }, novel.id, userId);
  await SceneService.updateSceneContent(scene.id, novel.id, userId, content);
  return { novel, act, chapter, scene };
}

function stubProvider(behaviour: { fail?: boolean; text?: string } = {}): AIProvider {
  return {
    name: "test-stub",
    async generateCompletion() {
      if (behaviour.fail) throw new Error("provider down");
      return behaviour.text || "Saran draf untuk adegan.";
    },
    async generateStructured() {
      throw new Error("not used");
    },
    async generateEmbedding() {
      return new Array(1536).fill(0);
    },
  };
}

describe("AIService.ask (context -> suggestion -> conversation -> usage)", () => {
  it("persists user + assistant messages and logs success usage (local provider, no network)", async () => {
    resetAIProviderCache(); // local-dev: reads seeded context, zero cost
    const userId = freshUser();
    const { novel, chapter, scene } = await seedScene(userId);

    const res = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "continue_scene",
      userQuery: "Lanjutkan dari kalimat terakhir.",
    });

    assert.equal(res.success, true);
    assert.ok(res.suggestion, "expected a suggestion");
    assert.equal(res.suggestion?.operation, "continue_scene");
    assert.equal(res.suggestion?.provider, "local-dev-draft");
    assert.ok((res.history?.length || 0) >= 2, "user + assistant turns persisted");

    const stats = await AIService.usage(novel.id, userId);
    assert.equal(stats.totalRequests, 1);
    assert.equal(stats.byOperation["continue_scene"], 1);
    assert.ok(stats.totalInputTokens > 0);
    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("never writes to the manuscript — scene content is untouched by ask", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, chapter, scene } = await seedScene(userId, "<p>Naskah asli penulis.</p>");

    await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "brainstorm",
      userQuery: "Opsi kelanjutan.",
    });

    const after = await SceneService.getScene(scene.id, novel.id, userId);
    assert.match(after?.content || "", /Naskah asli penulis/);
    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("denies cross-user access at the ownership boundary", async () => {
    resetAIProviderCache();
    const owner = freshUser();
    const stranger = freshUser();
    const { novel, chapter, scene } = await seedScene(owner);

    const res = await AIService.ask({
      novelId: novel.id,
      userId: stranger,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "ask",
      userQuery: "Apa isi novel ini?",
    });
    assert.equal(res.success, false);
    assert.match(res.error || "", /akses|tidak ditemukan/i);
    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("rejects empty queries and oversized selections before touching the provider", async () => {
    setAIProviderForTests(stubProvider({ text: "should never be called" }));
    const userId = freshUser();
    const { novel, chapter, scene } = await seedScene(userId);

    const empty = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "ask",
      userQuery: "   ",
    });
    assert.equal(empty.success, false);

    const huge = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "rewrite",
      userQuery: "Poles.",
      selectedText: "x".repeat(8001),
    });
    assert.equal(huge.success, false);
    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("records error usage and keeps the manuscript safe when the provider fails", async () => {
    setAIProviderForTests(stubProvider({ fail: true }));
    const userId = freshUser();
    const { novel, chapter, scene } = await seedScene(userId, "<p>Draf aman.</p>");

    const res = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "expand",
      userQuery: "Kembangkan.",
    });
    assert.equal(res.success, false);
    assert.match(res.error || "", /writing is safe/i);

    const after = await SceneService.getScene(scene.id, novel.id, userId);
    assert.match(after?.content || "", /Draf aman/);

    const stats = await AIService.usage(novel.id, userId);
    assert.equal(stats.totalRequests, 1);
    assert.equal(stats.totalInputTokens, 0);
    setAIProviderForTests(null);
    resetAIProviderCache();
  });

  it("reuses the caller's conversation thread across turns", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, chapter, scene } = await seedScene(userId);

    const first = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "ask",
      userQuery: "Siapa tokoh utama?",
    });
    assert.equal(first.success, true);
    const convId = first.conversation?.id;
    assert.ok(convId);

    const second = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "ask",
      userQuery: "Di mana lokasinya?",
      conversationId: convId,
    });
    assert.equal(second.success, true);
    assert.equal(second.conversation?.id, convId);
    assert.ok((second.history?.length || 0) >= 4, "both turns in one thread");
    setAIProviderForTests(null);
    resetAIProviderCache();
  });
});

describe("AI suggestion application (explicit, versioned, reversible)", () => {
  it("checkpoints the draft as ai_insert before saving the author's approved content", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, chapter, scene } = await seedScene(userId, "<p>Draf asli.</p>");

    const ask = await AIService.ask({
      novelId: novel.id,
      userId,
      sceneId: scene.id,
      chapterId: chapter.id,
      operation: "continue_scene",
      userQuery: "Lanjutkan.",
    });
    assert.equal(ask.success, true);

    // Simulate the server action's safety contract without Next.js headers:
    // 1. checkpoint, 2. apply — mirroring applySuggestionAction.
    const before = await SceneService.getScene(scene.id, novel.id, userId);
    await SceneService.createSceneVersion(scene.id, novel.id, userId, {
      content: before?.content || "",
      title: "Sebelum AI Insert",
      change_type: "ai_insert",
      notes: "Checkpoint otomatis (test).",
    });
    const finalContent = `${before?.content || ""}<p>Lanjutan yang disetujui penulis.</p>`;
    const updated = await SceneService.updateSceneContent(scene.id, novel.id, userId, finalContent);

    assert.match(updated?.content || "", /Draf asli/);
    assert.match(updated?.content || "", /Lanjutan yang disetujui penulis/);

    const versions = await SceneService.getSceneVersions(scene.id, novel.id, userId);
    assert.ok(versions.some((v) => v.change_type === "ai_insert"), "ai_insert checkpoint recorded");

    // Reversible: restore returns the pre-AI draft.
    const checkpoint = versions.find((v) => v.change_type === "ai_insert");
    assert.ok(checkpoint);
    const restored = await SceneService.restoreSceneVersion(scene.id, novel.id, userId, checkpoint.id);
    assert.match(restored.scene.content || "", /Draf asli/);
    assert.doesNotMatch(restored.scene.content || "", /Lanjutan yang disetujui/);
    setAIProviderForTests(null);
    resetAIProviderCache();
  });
});
