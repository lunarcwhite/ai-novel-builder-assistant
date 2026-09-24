import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { SummaryService } from "@/features/summaries/service";
import { resetAIProviderCache } from "@/server/ai/providers";

function freshUser() {
  return `usr_test_sum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seed(userId: string) {
  const novel = await NovelService.createNovel({ title: "Novel Ringkas" }, userId);
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
  await SceneService.updateSceneContent(
    scene.id,
    novel.id,
    userId,
    "<p>Kaelen memecahkan kode sebelum patroli lewat.</p>"
  );
  return { novel, act, chapter, scene };
}

describe("SummaryService hierarchy + synthesize + apply", () => {
  it("builds the hierarchy from owned data and honors ownership", async () => {
    resetAIProviderCache(); // local-dev: deterministic, no network
    const userId = freshUser();
    const { novel, chapter } = await seed(userId);

    const res = await SummaryService.getHierarchy(novel.id, userId);
    assert.equal(res.success, true);
    assert.ok(res.hierarchy);
    assert.equal(res.hierarchy.acts.length, 1);
    assert.equal(res.hierarchy.coverage.scenes.total, 1);
    assert.equal(res.hierarchy.coverage.scenes.withText, 0);

    // Stranger sees nothing (AGENTS.md #5.3).
    const denied = await SummaryService.getHierarchy(novel.id, freshUser());
    assert.equal(denied.success, false);

    // Scene with no author summary synthesizes from manuscript excerpt.
    const syn = await SummaryService.synthesize(novel.id, userId, {
      level: "scene",
      id: chapter.id, // wrong id on purpose
    });
    assert.equal(syn.success, false);

    const scenes = await SceneService.getScenesByChapter(chapter.id, novel.id, userId);
    const ok = await SummaryService.synthesize(novel.id, userId, {
      level: "scene",
      id: scenes[0].id,
    });
    assert.equal(ok.success, true);
    assert.ok(ok.candidate);
    assert.match(ok.candidate, /Kaelen/);
    assert.equal(ok.aiEnriched, false);
  });

  it("chapter synthesis rolls up scene summaries; apply writes only summary columns", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, chapter } = await seed(userId);
    const scenes = await SceneService.getScenesByChapter(chapter.id, novel.id, userId);

    const applied = await SummaryService.apply(novel.id, userId, {
      level: "scene",
      id: scenes[0].id,
      text: "Kaelen memecahkan kode katalog.",
    });
    assert.equal(applied.success, true);

    // Manuscript body untouched by the apply path.
    const after = await SceneService.getScene(scenes[0].id, novel.id, userId);
    assert.match(after?.content || "", /patroli/);
    assert.equal(after?.summary, "Kaelen memecahkan kode katalog.");

    const chSyn = await SummaryService.synthesize(novel.id, userId, {
      level: "chapter",
      id: chapter.id,
    });
    assert.equal(chSyn.success, true);
    assert.match(chSyn.candidate || "", /katalog/);

    const chApply = await SummaryService.apply(novel.id, userId, {
      level: "chapter",
      id: chapter.id,
      text: chSyn.candidate || "Ringkasan bab.",
    });
    assert.equal(chApply.success, true);
    assert.equal(
      (await ChapterService.getChapter(chapter.id, novel.id, userId))?.summary,
      chSyn.candidate
    );

    // Chapter with no material at all refuses to invent.
    const emptyNovel = await NovelService.createNovel({ title: "Novel Kosong" }, userId);
    const emptyAct = await ActService.createAct({ title: "Act I" }, emptyNovel.id, userId);
    const emptyCh = await ChapterService.createChapter(
      { title: "Bab Kosong", act_id: emptyAct.id },
      emptyNovel.id,
      userId
    );
    const refused = await SummaryService.synthesize(emptyNovel.id, userId, {
      level: "chapter",
      id: emptyCh.id,
    });
    assert.equal(refused.success, false);
    assert.match(refused.error || "", /Belum ada materi/);
  });

  it("act + novel apply reuse the description column (no migration)", async () => {
    resetAIProviderCache();
    const userId = freshUser();
    const { novel, act } = await seed(userId);

    const actApply = await SummaryService.apply(novel.id, userId, {
      level: "act",
      id: act.id,
      text: "Babak pembuka: kode pecah, pelarian dimulai.",
    });
    assert.equal(actApply.success, true);
    assert.equal(
      (await ActService.getAct(act.id, novel.id, userId))?.description,
      "Babak pembuka: kode pecah, pelarian dimulai."
    );

    const novApply = await SummaryService.apply(novel.id, userId, {
      level: "novel",
      id: novel.id,
      text: "Sinopsis: sarjana muda membawa segel rahasia.",
    });
    assert.equal(novApply.success, true);
    assert.equal(
      (await NovelService.getNovel(novel.id, userId))?.description,
      "Sinopsis: sarjana muda membawa segel rahasia."
    );

    // Novel id mismatch is rejected.
    const bad = await SummaryService.apply(novel.id, userId, {
      level: "novel",
      id: "nov_lain",
      text: "x",
    });
    assert.equal(bad.success, false);
  });
});
