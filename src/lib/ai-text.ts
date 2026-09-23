/**
 * Pure text helpers for AI suggestions (client + test safe — no imports).
 * Single source of truth; ai-assistant.tsx re-exports these.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain-text suggestion -> minimal editor HTML (paragraphs preserved). */
export function suggestionToHtml(text: string): string {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length === 0) return "";
  return paras.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
}
