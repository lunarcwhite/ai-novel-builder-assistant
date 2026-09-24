import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { ActService } from "@/features/acts/service";
import { ChapterService } from "@/features/chapters/service";
import { PlotThreadService } from "@/features/plot/service";
import { TimelineService } from "@/features/timeline/service";

function freshUser() {
  return `usr_test_plot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedNovel(userId: string) {
  const novel = await NovelService.createNovel({ title: "Novel Plot" }, userId);
  const act = await ActService.createAct({ title: "Act I" }, novel.id, userId);
  const chapter = await ChapterService.createChapter(
    { title: "Bab 1", act_id: act.id },
    novel.id,
    userId
  );
  return { novel, act, chapter };
}

describe("PlotThreadService", () => {
  it("creates, lists, filters, and counts threads by status", async () => {
    const userId = freshUser();
    const { novel } = await seedNovel(userId);

    const a = await PlotThreadService.createThread(novel.id, userId, {
      title: "Misteri Segel Keempat",
      importance: 5,
    });
    assert.equal(a.success, true);

    const b = await PlotThreadService.createThread(novel.id, userId, {
      title: "Cinta Anna & Daniel",
      status: "active",
    });
    assert.equal(b.success, true);

    const all = await PlotThreadService.listThreads(novel.id, userId);
    assert.equal(all.length, 2);

    const active = await PlotThreadService.listThreads(novel.id, userId, { status: "active" });
    assert.equal(active.length, 1);
    assert.equal(active[0].title, "Cinta Anna & Daniel");

    const counts = await PlotThreadService.getStatusCounts(novel.id, userId);
    assert.equal(counts.planned, 1);
    assert.equal(counts.active, 1);
    assert.equal(counts.resolved, 0);
    assert.equal(counts.abandoned, 0);
  });

  it("guards invalid status jumps and allows gradual transitions", async () => {
    const userId = freshUser();
    const { novel } = await seedNovel(userId);

    const created = await PlotThreadService.createThread(novel.id, userId, { title: "Utang Ordo" });
    assert.ok(created.success);
    const id = created.thread!.id;

    // planned -> resolved directly is rejected; author must go via active.
    const jump = await PlotThreadService.updateThread(id, novel.id, userId, { status: "resolved" });
    assert.equal(jump.success, false);
    assert.match(jump.error || "", /tidak didukung/);

    const activate = await PlotThreadService.updateThread(id, novel.id, userId, { status: "active" });
    assert.equal(activate.success, true);

    const resolve = await PlotThreadService.updateThread(id, novel.id, userId, { status: "resolved" });
    assert.equal(resolve.success, true);
    assert.equal(resolve.thread!.status, "resolved");
  });

  it("rejects chapter links from another novel and enforces ownership", async () => {
    const userId = freshUser();
    const { novel, chapter } = await seedNovel(userId);
    const otherNovel = await NovelService.createNovel({ title: "Novel Lain" }, userId);

    const bad = await PlotThreadService.createThread(otherNovel.id, userId, {
      title: "Thread Siluman",
      introduced_chapter_id: chapter.id,
    });
    assert.equal(bad.success, false);
    assert.match(bad.error || "", /tidak ditemukan/);

    const ok = await PlotThreadService.createThread(novel.id, userId, {
      title: "Thread Sah",
      introduced_chapter_id: chapter.id,
    });
    assert.equal(ok.success, true);

    // Another user cannot see or delete the thread.
    const stranger = freshUser();
    assert.equal((await PlotThreadService.listThreads(novel.id, stranger)).length, 0);
    assert.equal((await PlotThreadService.deleteThread(ok.thread!.id, novel.id, stranger)).success, false);

    const del = await PlotThreadService.deleteThread(ok.thread!.id, novel.id, userId);
    assert.equal(del.success, true);
  });

  it("rejects invalid input without touching the store", async () => {
    const userId = freshUser();
    const { novel } = await seedNovel(userId);
    const res = await PlotThreadService.createThread(novel.id, userId, { title: "" });
    assert.equal(res.success, false);
    assert.equal((await PlotThreadService.listThreads(novel.id, userId)).length, 0);
  });
});

describe("TimelineService", () => {
  it("creates events with flexible precision and lists them chronologically", async () => {
    const userId = freshUser();
    const { novel, chapter } = await seedNovel(userId);

    const a = await TimelineService.createEvent(novel.id, userId, {
      title: "Insiden rumah sakit",
      date_precision: "relative",
      relative_time: "Hari ke-47",
      chapter_id: chapter.id,
    });
    assert.equal(a.success, true);

    const b = await TimelineService.createEvent(novel.id, userId, {
      title: "Perang Alkimia",
    });
    assert.equal(b.success, true);
    assert.equal(b.event!.date_precision, "unknown");

    const events = await TimelineService.listEvents(novel.id, userId);
    assert.equal(events.length, 2);
    assert.equal(events[0].title, "Insiden rumah sakit");
  });

  it("requires a date for dated precisions and relative_time for relative", async () => {
    const userId = freshUser();
    const { novel } = await seedNovel(userId);

    const missing = await TimelineService.createEvent(novel.id, userId, {
      title: "Tanpa tanggal",
      date_precision: "exact",
    });
    assert.equal(missing.success, false);
    assert.match(missing.error || "", /membutuhkan nilai tanggal/);

    const missingRel = await TimelineService.createEvent(novel.id, userId, {
      title: "Relatif hampa",
      date_precision: "relative",
    });
    assert.equal(missingRel.success, false);
    assert.match(missingRel.error || "", /waktu relatif/);
  });

  it("rejects foreign chapter links and enforces ownership on update/delete", async () => {
    const userId = freshUser();
    const { novel } = await seedNovel(userId);
    const otherNovel = await NovelService.createNovel({ title: "Novel Lain" }, userId);
    const otherAct = await ActService.createAct({ title: "A" }, otherNovel.id, userId);
    const otherChapter = await ChapterService.createChapter(
      { title: "Bab X", act_id: otherAct.id },
      otherNovel.id,
      userId
    );

    const bad = await TimelineService.createEvent(novel.id, userId, {
      title: "Siluman",
      chapter_id: otherChapter.id,
    });
    assert.equal(bad.success, false);

    const ok = await TimelineService.createEvent(novel.id, userId, { title: "Sah" });
    assert.ok(ok.success);

    const stranger = freshUser();
    assert.equal(
      (await TimelineService.updateEvent(ok.event!.id, novel.id, stranger, { title: "Hack" })).success,
      false
    );
    assert.equal((await TimelineService.deleteEvent(ok.event!.id, novel.id, stranger)).success, false);

    const upd = await TimelineService.updateEvent(ok.event!.id, novel.id, userId, {
      title: "Diperbarui",
      date_precision: "year",
      date_value: "Tahun 3",
    });
    assert.equal(upd.success, true);
    assert.equal(upd.event!.title, "Diperbarui");

    const del = await TimelineService.deleteEvent(ok.event!.id, novel.id, userId);
    assert.equal(del.success, true);
    assert.equal((await TimelineService.listEvents(novel.id, userId)).length, 0);
  });
});
