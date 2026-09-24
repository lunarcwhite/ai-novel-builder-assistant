// ---------------------------------------------------------------
// Keyboard shortcut matchers (Phase 11 — Polish)
// ---------------------------------------------------------------
// Pure helpers over a minimal key-combo shape so they are unit
// testable without DOM KeyboardEvent. Components pass the real
// event (it structurally matches KeyCombo).

export interface KeyCombo {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/** Ctrl+K / Cmd+K — opens the command palette. */
export function isPaletteShortcut(e: KeyCombo): boolean {
  return Boolean(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k";
}

/** Ctrl+S / Cmd+S — manual save in the editor. */
export function isSaveShortcut(e: KeyCombo): boolean {
  return Boolean(e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s";
}

/** F11 — toggles editor focus mode (matches the header button title). */
export function isFocusShortcut(e: KeyCombo): boolean {
  return e.key === "F11" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
}
