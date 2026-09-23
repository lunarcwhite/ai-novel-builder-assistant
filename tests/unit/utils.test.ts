import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatNumber } from "@/lib/utils";
import { slugify, NovelService } from "@/features/novels/service";

describe("formatNumber (SSR-safe locale guard)", () => {
  it("groups thousands with dots", () => {
    assert.equal(formatNumber(0), "0");
    assert.equal(formatNumber(42), "42");
    assert.equal(formatNumber(1000), "1.000");
    assert.equal(formatNumber(50000), "50.000");
  });

  it("returns 0 for non-number / NaN input", () => {
    assert.equal(formatNumber(NaN), "0");
  });
});

describe("slugify + generateUniqueSlug (novel identity)", () => {
  it("lowercases, trims, and strips non-word chars", () => {
    assert.equal(slugify("Bayang Kota Tua"), "bayang-kota-tua");
    assert.equal(slugify("  Untukmu, yang Kucari! "), "untukmu-yang-kucari");
  });

  it("generates a suffixed slug on collision", async () => {
    const userId = `usr_test_slug_${Date.now()}`;
    const first = await NovelService.createNovel({ title: "Kisah Sama" }, userId);
    const second = await NovelService.createNovel({ title: "Kisah Sama" }, userId);
    assert.equal(first.slug, "kisah-sama");
    assert.equal(second.slug, "kisah-sama-2");
  });

  it("rejects empty titles via Zod before touching storage", async () => {
    await assert.rejects(() =>
      NovelService.createNovel({ title: "" } as never, "usr_test_slug_reject")
    );
  });
});

describe("NovelService.calculateStats (progress + reading time)", () => {
  it("computes percent capped at 100", () => {
    assert.deepEqual(NovelService.calculateStats(0, 50000), {
      progressPercent: 0,
      readingTimeMinutes: 1,
    });
    assert.deepEqual(NovelService.calculateStats(25000, 50000), {
      progressPercent: 50,
      readingTimeMinutes: 114,
    });
    assert.deepEqual(NovelService.calculateStats(99999, 50000), {
      progressPercent: 100,
      readingTimeMinutes: 455,
    });
  });
});
