import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NovelService } from "@/features/novels/service";
import { requireNovelAccess } from "@/server/auth/guards";

function freshUser(prefix = "guard") {
  return `usr_test_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

describe("requireNovelAccess (Phase 1 Task 1.3)", () => {
  it("grants the novel owner access", async () => {
    const userId = freshUser();
    const novel = await NovelService.createNovel({ title: "Kota Sunyi" }, userId);

    const res = await requireNovelAccess(novel.id, { currentUserId: userId });
    assert.equal(res.novelId, novel.id);
    assert.equal(res.userId, userId);
  });

  it("denies cross-user access (AGENTS.md #5.3)", async () => {
    const owner = freshUser();
    const novel = await NovelService.createNovel({ title: "Arsip Terlarang" }, owner);

    await assert.rejects(
      requireNovelAccess(novel.id, { currentUserId: freshUser("intruder") }),
      /Unauthorized/
    );
  });

  it("denies access to missing novels", async () => {
    await assert.rejects(
      requireNovelAccess("nov_does_not_exist", { currentUserId: freshUser() }),
      /Unauthorized/
    );
  });
});
