/**
 * Shared word-count helper.
 * Single source of truth for manuscript word counts.
 *
 * TipTap stores HTML, so tags are stripped (replaced with a space so a tag
 * boundary never merges two words) before splitting on whitespace.
 *
 * ponytail: regex tag strip is enough for editor HTML; upgrade to a real
 * parser only if nested/complex markup appears.
 */
export function countWords(input: string | null | undefined): number {
  if (!input) return 0;
  const withoutTags = input.replace(/<[^>]*>/g, " ");
  const decoded = withoutTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  const trimmed = decoded.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}
