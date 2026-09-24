import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { MemoryService } from "@/features/memories/service";
import { resetAIProviderCache } from "@/server/ai/providers";
import {
  MEMORY_EXTRACTION_SYSTEM,
  buildMemoryExtractionPrompt,
} from "@/server/ai/prompts";
import { proposeSceneMemoriesSchema } from "@/types";

function freshUser() {
  return `usr_test_propose_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const LONG_SCENE =
  "<p>Kaelen memecahkan kode katalog tersembunyi di balik rak manuskrip kuno sebelum patroli malam lewat. " +
  "Ia menyembunyikan fragmen plat perunggu di balik lapisan jaket wolnya. " +
  "Vane menunggu di lorong gelap dengan lentera redup di tangannya.</p>";

async function seedScene(userId: string, content: string = LONG_SCENE) {
  const novel = await NovelService.createNovel({ title: "Novel Usulan" }, userId);
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
  await SceneService.updateSceneContent(scene.id, novel.id, userId, content);
  return { novel, scene };
}

describe("Task 9.5 — proposeFromScene (local-dev deterministic)", () => {
  it("stores candidates as proposed, never auto-confirmed", async () => {
    resetAIProviderCache(); // local-dev-draft: deterministic fallback
    const userId = freshUser();
    const { novel, scene } = await seedScene(userId);

    const res = await MemoryService.proposeFromScene(novel.id, userId, {
      sceneId: scene.id,
    });
    assert.equal(res.success, true);
    assert.ok((res.created?.length || 0) >= 1);
    assert.equal(res.aiEnriched, false);
    for (const m of res.created || []) {
      assert.equal(m.status, "proposed");
      assert.equal(m.source_type, "ai_extraction");
      assert.equal(m.source_id, scene.id);
    }

    // Manuscript body untouched.
    const after = await SceneService.getScene(scene.id, novel.id, userId);
    assert.match(after?.content || "", /Kaelen/);
  });

  it("dedups within batch and against stored memories on second run", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, scene } = await seedScene(userId);

    const first = await MemoryService.proposeFromScene(novel.id, userId, {
      sceneId: scene.id,
    });
    assert.equal(first.success, true);
    const firstCount = first.created?.length || 0;
    assert.ok(firstCount >= 1);

    const second = await MemoryService.proposeFromScene(novel.id, userId, {
      sceneId: scene.id,
    });
    assert.equal(second.success, true);
    assert.equal(second.created?.length || 0, 0);
    assert.ok((second.skippedDuplicates || 0) >= firstCount);
  });

  it("refuses too-short scenes and enforces ownership", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, scene } = await seedScene(userId, "<p>Halo.</p>");

    const short = await MemoryService.proposeFromScene(novel.id, userId, {
      sceneId: scene.id,
    });
    assert.equal(short.success, false);
    assert.match(short.error || "", /terlalu pendek/);

    const stranger = await MemoryService.proposeFromScene(novel.id, freshUser(), {
      sceneId: scene.id,
    });
    assert.equal(stranger.success, false);

    const badScene = await MemoryService.proposeFromScene(novel.id, userId, {
      sceneId: "sc_tidak_ada",
    });
    assert.equal(badScene.success, false);

    const badInput = await MemoryService.proposeFromScene(novel.id, userId, {});
    assert.equal(badInput.success, false);
  });
});

describe("Task 9.5 — prompt contract", () => {
  it("extraction prompt forbids fabrication and returns JSON-only shape", () => {
    assert.match(MEMORY_EXTRACTION_SYSTEM, /JANGAN mengarang/);
    assert.match(MEMORY_EXTRACTION_SYSTEM, /BUKAN fakta/);
    const p = buildMemoryExtractionPrompt({
      sceneTitle: "Adegan 1",
      sceneText: "Kaelen memecahkan kode.",
    });
    assert.match(p, /Adegan 1/);
    assert.match(p, /JSON/);
    assert.ok(proposeSceneMemoriesSchema.safeParse({ sceneId: "sc_1" }).success);
    assert.ok(!proposeSceneMemoriesSchema.safeParse({}).success);
  });
});
