import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_TOASTS, initialToastState, toastReducer } from "@/lib/toast-store";

describe("toastReducer (Phase 0 design-system primitive)", () => {
  it("pushes toasts with incrementing ids", () => {
    const s1 = toastReducer(initialToastState, { type: "push", title: "Tersimpan" });
    assert.equal(s1.toasts.length, 1);
    assert.equal(s1.toasts[0].title, "Tersimpan");
    assert.equal(s1.toasts[0].variant, "success");
    const s2 = toastReducer(s1, {
      type: "push",
      title: "Gagal",
      variant: "error",
    });
    assert.equal(s2.toasts[1].variant, "error");
    assert.ok(s2.toasts[1].id > s2.toasts[0].id);
  });

  it("caps visible toasts to MAX_TOASTS, keeping the newest", () => {
    let state = initialToastState;
    for (let i = 0; i < MAX_TOASTS + 2; i++) {
      state = toastReducer(state, { type: "push", title: `t${i}` });
    }
    assert.equal(state.toasts.length, MAX_TOASTS);
    assert.equal(state.toasts[state.toasts.length - 1].title, `t${MAX_TOASTS + 1}`);
  });

  it("dismisses and clears", () => {
    let state = toastReducer(initialToastState, { type: "push", title: "a" });
    state = toastReducer(state, { type: "push", title: "b" });
    const id = state.toasts[0].id;
    state = toastReducer(state, { type: "dismiss", id });
    assert.equal(state.toasts.length, 1);
    state = toastReducer(state, { type: "clear" });
    assert.equal(state.toasts.length, 0);
  });
});
