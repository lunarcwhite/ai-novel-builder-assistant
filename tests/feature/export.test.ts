import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { ExportService } from "@/features/export/service";

function freshUser() {
  return `usr_test_export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seed(userId: string) {
  const novel = await NovelService.createNovel({ title: "Novel Ekspor Uji Coba!" }, userId);
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
  return { novel, chapter, scene };
}

describe("ExportService end-to-end (in-memory stores)", () => {
  it("md export renders owned manuscript with headers and filename", async () => {
    const userId = freshUser();
    const { novel } = await seed(userId);

    const res = await ExportService.exportNovel(novel.id, userId, { format: "md" });
    assert.equal(res.success, true);
    assert.equal(res.format, "md");
    assert.equal(res.filename, "novel-ekspor-uji-coba.md");
    assert.equal(res.mimeType, "text/markdown; charset=utf-8");
    assert.match(res.body || "", /^# Novel Ekspor Uji Coba!/m);
    assert.match(res.body || "", /Kaelen memecahkan kode/);
    assert.ok(!(res.body || "").includes("<p>"));
  });

  it("txt export renders plain text without markdown headings", async () => {
    const userId = freshUser();
    const { novel } = await seed(userId);

    const res = await ExportService.exportNovel(novel.id, userId, { format: "txt" });
    assert.equal(res.success, true);
    assert.equal(res.filename, "novel-ekspor-uji-coba.txt");
    assert.equal(res.mimeType, "text/plain; charset=utf-8");
    assert.ok(!(res.body || "").startsWith("# "));
    assert.match(res.body || "", /Kaelen memecahkan kode/);
  });

  it("denies cross-user access (AGENTS.md #5.3)", async () => {
    const owner = freshUser();
    const { novel } = await seed(owner);

    const denied = await ExportService.exportNovel(novel.id, freshUser(), {
      format: "md",
    });
    assert.equal(denied.success, false);
    assert.match(denied.error || "", /akses ditolak/);
  });

  it("rejects unknown formats and never touches the manuscript", async () => {
    const userId = freshUser();
    const { novel, scene } = await seed(userId);
    const before = (await SceneService.getScene(scene.id, novel.id, userId))?.content;

    const bad = await ExportService.exportNovel(novel.id, userId, { format: "epub" });
    assert.equal(bad.success, false);

    const after = (await SceneService.getScene(scene.id, novel.id, userId))?.content;
    assert.equal(after, before);
    assert.match(before || "", /<p>/);
  });

  it("empty novel reports no manuscript instead of empty body", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Novel Hampa" }, userId);

    const res = await ExportService.exportNovel(novel.id, userId, {
      format: "md",
      includeEmpty: false,
    });
    assert.equal(res.success, true);
    assert.match(res.body || "", /Belum ada naskah/);
  });
});
