import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import { PlotThreadService } from "@/features/plot/service";
import { StoryDoctorService } from "@/features/doctor/service";
import { resetAIProviderCache } from "@/server/ai/providers";

function freshUser() {
  return `usr_test_doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("StoryDoctorService.runDiagnosis", () => {
  it("returns an empty report for a well-structured novel", async () => {
    resetAIProviderCache(); // local-dev: deterministic, no network
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Rapi" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);

    for (let n = 1; n <= 3; n++) {
      await ChapterService.createChapter(
        {
          title: `Bab ${n}`,
          act_id: act.id,
          outcome: `Hasil bab ${n}`,
          conflict: `Konflik bab ${n}`,
          status: "completed",
        },
        novel.id,
        userId
      );
    }
    const charRes = await CharacterService.createCharacter(novel.id, userId, {
      name: "Anna",
      role: "protagonist",
      motivation: "Kebenaran",
      goal: "Bebas",
      character_arc: "Berani",
    });
    assert.ok(charRes.success);

    const res = await StoryDoctorService.runDiagnosis({ novelId: novel.id, userId });
    assert.equal(res.success, true);
    assert.ok(res.report);
    assert.equal(res.report.novel_id, novel.id);
    assert.equal(res.report.ai_enriched, false);
    const total = Object.values(res.report.counts).reduce((a, b) => a + b, 0);
    assert.equal(total, 0);
  });

  it("surfaces plot + arc + pacing observations with evidence, read-only", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Bermasalah" }, userId);
    const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);

    // 5 thin chapters with no outcome/conflict.
    for (let n = 1; n <= 5; n++) {
      const ch = await ChapterService.createChapter(
        { title: `Bab ${n}`, act_id: act.id },
        novel.id,
        userId
      );
      const sc = await SceneService.createScene(
        { title: `Adegan ${n}`, chapter_id: ch.id },
        novel.id,
        userId
      );
      await SceneService.updateSceneContent(sc.id, novel.id, userId, "<p>Halo dunia.</p>");
    }
    // One dense chapter to trigger the dense-side pacing observation.
    const big = await ChapterService.createChapter({ title: "Bab Klimaks", act_id: act.id }, novel.id, userId);
    const bigScene = await SceneService.createScene(
      { title: "Adegan klimaks", chapter_id: big.id },
      novel.id,
      userId
    );
    await SceneService.updateSceneContent(
      bigScene.id,
      novel.id,
      userId,
      `<p>${"Kata penting berulang. ".repeat(400)}</p>`
    );

    const charRes = await CharacterService.createCharacter(novel.id, userId, {
      name: "Daniel",
      role: "protagonist",
    });
    assert.ok(charRes.success);

    const before = await SceneService.getScene(bigScene.id, novel.id, userId);
    const res = await StoryDoctorService.runDiagnosis({ novelId: novel.id, userId });

    assert.equal(res.success, true);
    assert.ok(res.report);
    assert.ok((res.report.counts.plot || 0) >= 1);
    assert.ok((res.report.counts.character_arcs || 0) >= 1);
    assert.ok((res.report.counts.pacing || 0) >= 1);
    for (const items of Object.values(res.report.sections)) {
      for (const o of items) {
        assert.ok(o.observation.length > 0);
        assert.ok(Array.isArray(o.evidence));
      }
    }
    // Manuscript safety: content untouched by the read-only diagnosis.
    const after = await SceneService.getScene(bigScene.id, novel.id, userId);
    assert.equal(after?.content, before?.content);
  });

  it("flags unlinked threads, bare rules, and proposed memories", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Terbengkalai" }, userId);

    await PlotThreadService.createThread(novel.id, userId, { title: "Misteri A", status: "active" });
    await PlotThreadService.createThread(novel.id, userId, { title: "Misteri B", status: "active" });

    for (const t of ["R1", "R2", "R3"]) {
      const ruleRes = await WorldService.createWorldRule(novel.id, userId, {
        title: `Aturan ${t}`,
        rule: `Kaidah ${t} berlaku mutlak.`,
      });
      assert.ok(ruleRes.success);
    }

    for (let i = 1; i <= 3; i++) {
      const memRes = await MemoryService.createMemory(novel.id, userId, {
        type: "story_fact",
        content: `Fakta usulan nomor ${i} yang cukup panjang untuk validasi`,
        status: "proposed",
      });
      assert.ok(memRes.success);
    }

    const res = await StoryDoctorService.runDiagnosis({ novelId: novel.id, userId });
    assert.equal(res.success, true);
    assert.ok((res.report!.counts.plot_threads || 0) >= 1);
    assert.ok((res.report!.counts.worldbuilding || 0) >= 1);
    assert.ok((res.report!.counts.unresolved_questions || 0) >= 1);
  });

  it("honors section filters and rejects strangers", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Filter" }, userId);

    const res = await StoryDoctorService.runDiagnosis({
      novelId: novel.id,
      userId,
      sections: ["pacing"],
    });
    assert.equal(res.success, true);
    assert.deepEqual(Object.keys(res.report!.sections).filter((s) => res.report!.sections[s as "pacing"].length > 0), []);

    const stranger = await StoryDoctorService.runDiagnosis({ novelId: novel.id, userId: freshUser() });
    assert.equal(stranger.success, false);
    assert.match(stranger.error || "", /akses ditolak/);
  });
});
