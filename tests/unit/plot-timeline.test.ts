import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createPlotThreadSchema,
  updatePlotThreadSchema,
  createTimelineEventSchema,
  updateTimelineEventSchema,
} from "@/types";

describe("createPlotThreadSchema", () => {
  it("accepts a minimal valid thread", () => {
    const res = createPlotThreadSchema.safeParse({ title: "Misteri Segel" });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.status, "planned");
      assert.equal(res.data.importance, 3);
    }
  });

  it("rejects empty title and out-of-range importance", () => {
    assert.equal(createPlotThreadSchema.safeParse({ title: "" }).success, false);
    assert.equal(
      createPlotThreadSchema.safeParse({ title: "X", importance: 9 }).success,
      false
    );
    assert.equal(
      createPlotThreadSchema.safeParse({ title: "X", importance: 0 }).success,
      false
    );
  });

  it("rejects unknown status values", () => {
    assert.equal(
      createPlotThreadSchema.safeParse({ title: "X", status: "finished" }).success,
      false
    );
  });

  it("update schema allows partial patch", () => {
    const res = updatePlotThreadSchema.safeParse({ status: "active" });
    assert.equal(res.success, true);
  });
});

describe("createTimelineEventSchema", () => {
  it("accepts unknown precision without a date (SOUL.md #15)", () => {
    const res = createTimelineEventSchema.safeParse({ title: "Insiden RS" });
    assert.equal(res.success, true);
    if (res.success) assert.equal(res.data.date_precision, "unknown");
  });

  it("rejects empty title", () => {
    assert.equal(createTimelineEventSchema.safeParse({ title: "" }).success, false);
  });

  it("rejects unknown precision values", () => {
    assert.equal(
      createTimelineEventSchema.safeParse({ title: "X", date_precision: "eon" }).success,
      false
    );
  });

  it("update schema allows partial patch", () => {
    const res = updateTimelineEventSchema.safeParse({ relative_time: "3 hari setelah" });
    assert.equal(res.success, true);
  });
});
