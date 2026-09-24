import type {
  Character,
  ConsistencyFindingType,
  ConsistencyRelatedEntity,
  ConsistencySourceRef,
  StoryMemory,
  WorldRule,
} from "@/types";
import type { ConsistencyFindingDraft } from "./repository";

// ---------------------------------------------------------------
// Deterministic consistency heuristics (Phase 8 — Task 8.3/8.4)
// ---------------------------------------------------------------
// SOUL.md #13: findings are tentative observations with evidence,
// never verdicts. These checks are recall-oriented on purpose —
// precision is handled by author review + the optional AI pass.
// Timeline/plot checks are intentionally absent: no tables exist
// yet (Phase 9+), so no fake findings are manufactured.

const STOPWORDS = new Set(
  "yang dan dari untuk dengan pada adalah itu ini dalam sebagai oleh atau juga akan telah sudah mereka kami kita dia ia nya nye kamu anda saya aku kami ke di sebuah para setiap tapi namun agar supaya bahwa karena jika kalau ketika saat mana sini sana situ lalu kemudian juga pun kah lah tah pun".split(" ")
);

const NEGATIONS = ["tidak", "bukan", "belum", "jangan", "tanpa", "dilarang", "larangan", "mustahil", "tak", "tiada"];

const EXCLUSIVITY = ["hanya", "dilarang", "larangan", "wajib", "harus", "selalu", "mustahil", "mutlak", "pantang"];

const VIOLATION_MARKERS = ["tanpa", "melanggar", "mengabaikan", "diam-diam", "sembunyi", "nekat", "ilegal", "terlarang"];

export function tokenizeSignificant(text: string): string[] {
  const words = (text || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-zà-ž0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return [...new Set(words)];
}

export function hasNegation(text: string): boolean {
  const lower = ` ${(text || "").toLowerCase()} `;
  return NEGATIONS.some((n) => lower.includes(` ${n} `) || lower.includes(` ${n}-`));
}

export function hasAnyMarker(text: string, markers: string[]): boolean {
  const lower = (text || "").toLowerCase();
  return markers.some((m) => lower.includes(m));
}

export function sharedWords(a: string, b: string): string[] {
  const setB = new Set(tokenizeSignificant(b));
  return tokenizeSignificant(a).filter((w) => setB.has(w));
}

/** First sentence-ish window containing any keyword, clipped. Never the whole text. */
export function excerptAround(text: string, keywords: string[], maxLen = 220): string {
  const plain = (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  const lower = plain.toLowerCase();
  let idx = -1;
  for (const k of keywords) {
    const i = lower.indexOf(k.toLowerCase());
    if (i >= 0) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
  const start = Math.max(0, idx - 60);
  const end = Math.min(plain.length, idx + maxLen - 60);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < plain.length ? "…" : "";
  return prefix + plain.slice(start, end).trim() + suffix;
}

/** Stable dedupe key: same claim pair reported twice collapses to one finding. */
export function factKeyFor(type: ConsistencyFindingType, entityRef: string, claim: string): string {
  const norm = `${type}:${entityRef}:${claim.toLowerCase().replace(/[^a-z0-9]+/gi, " ").trim().slice(0, 120)}`;
  let hash = 5381;
  for (let i = 0; i < norm.length; i++) hash = ((hash << 5) + hash + norm.charCodeAt(i)) | 0;
  return `${type}_${(hash >>> 0).toString(16)}`;
}

function memoryLabel(m: StoryMemory): string {
  const src = m.source_type === "manual" ? "catatan penulis" : `sumber ${m.source_type}`;
  return `Memori (${m.type}, ${m.status}, ${src})`;
}

// ---------------------------------------------------------------
// Check 1 — memory vs memory: two confirmed facts about the same
// subject sharing vocabulary but with flipped polarity.
// ---------------------------------------------------------------
export function detectMemoryConflicts(memories: StoryMemory[], scope: "scene" | "chapter"): ConsistencyFindingDraft[] {
  const confirmed = memories.filter((m) => m.status === "confirmed" && m.content.trim().length >= 10);
  const drafts: ConsistencyFindingDraft[] = [];
  for (let i = 0; i < confirmed.length; i++) {
    for (let j = i + 1; j < confirmed.length; j++) {
      const a = confirmed[i];
      const b = confirmed[j];
      if (hasNegation(a.content) === hasNegation(b.content)) continue; // same polarity: no conflict
      const aChars = new Set(a.metadata?.character_ids || []);
      const bChars = new Set(b.metadata?.character_ids || []);
      const sameSubject = [...aChars].some((c) => bChars.has(c));
      const shared = sharedWords(a.content, b.content);
      if (!sameSubject && shared.length < 4) continue;
      const keyClaim = shared.slice(0, 4).join(" ");
      drafts.push({
        type: "character_contradiction",
        severity: "potential",
        description:
          `Potensi kontradiksi fakta karakter: satu memori menetapkan "${a.content.slice(0, 120)}" ` +
          `sementara memori lain menyebutkan "${b.content.slice(0, 120)}". ` +
          `Salah satu tafsir yang mungkin adalah keduanya sulit benar bersamaan — namun bisa juga disengaja ` +
          `(mis. sudut pandang tak andal atau fakta yang berubah). Silakan tinjau.`,
        source_ids: [
          { type: "memory", id: a.id, label: memoryLabel(a), excerpt: a.content.slice(0, 220) },
          { type: "memory", id: b.id, label: memoryLabel(b), excerpt: b.content.slice(0, 220) },
        ],
        related_entity_ids: [...aChars, ...[...bChars].filter((c) => !aChars.has(c))].map((id) => ({
          type: "character",
          id,
        })),
        metadata: { scope, fact_key: factKeyFor("character_contradiction", [...aChars].join(",") || shared.slice(0, 2).join(","), keyClaim) },
      });
    }
  }
  return drafts;
}

// ---------------------------------------------------------------
// Check 2 — scene text vs confirmed memory: the manuscript seems
// to say the opposite of an established fact for an involved char.
// ---------------------------------------------------------------
export function detectSceneMemoryTensions(
  sceneText: string,
  sceneRef: { id: string; title: string },
  memories: StoryMemory[],
  involvedCharacterIds: string[],
  scope: "scene" | "chapter"
): ConsistencyFindingDraft[] {
  const plain = (sceneText || "").replace(/<[^>]*>/g, " ");
  if (plain.trim().length < 20) return [];
  const involved = new Set(involvedCharacterIds);
  const drafts: ConsistencyFindingDraft[] = [];
  for (const m of memories) {
    if (m.status !== "confirmed" || m.content.trim().length < 10) continue;
    const mChars = m.metadata?.character_ids || [];
    const linked = mChars.some((c) => involved.has(c)) || m.source_id === sceneRef.id;
    if (!linked && mChars.length > 0) continue;
    if (hasNegation(m.content) === hasNegation(plain)) continue;
    const shared = sharedWords(m.content, plain);
    if (shared.length < 3) continue;
    const excerpt = excerptAround(plain, shared, 220);
    drafts.push({
      type: "character_contradiction",
      severity: "potential",
      description:
        `Potensi ketidaksesuaian naskah dengan fakta mapan: memori menetapkan "${m.content.slice(0, 120)}" ` +
        `sementara adegan "${sceneRef.title}" memuat kutipan yang mungkin bertentangan. ` +
        `Ini mungkin perubahan karakter yang disengaja — pertimbangkan memberi satu momen transisi bagi pembaca bila begitu.`,
      source_ids: [
        { type: "memory", id: m.id, label: memoryLabel(m), excerpt: m.content.slice(0, 220) },
        { type: "scene", id: sceneRef.id, label: `Adegan: ${sceneRef.title}`, excerpt },
      ],
      related_entity_ids: mChars.map((id) => ({ type: "character", id })),
      metadata: {
        scope,
        fact_key: factKeyFor("character_contradiction", m.id, shared.slice(0, 4).join(" ")),
      },
    });
  }
  return drafts;
}

// ---------------------------------------------------------------
// Check 3 — scene text vs world rule: the manuscript may violate
// an author-defined rule (exclusivity constraint + shared subject).
// ---------------------------------------------------------------
export function detectRuleTensions(
  sceneText: string,
  sceneRef: { id: string; title: string },
  rules: WorldRule[],
  scope: "scene" | "chapter"
): ConsistencyFindingDraft[] {
  const plain = (sceneText || "").replace(/<[^>]*>/g, " ");
  if (plain.trim().length < 20) return [];
  const drafts: ConsistencyFindingDraft[] = [];
  for (const r of rules) {
    const ruleText = `${r.title} ${r.rule} ${r.description || ""}`;
    const shared = sharedWords(ruleText, plain);
    if (shared.length < 2) continue;
    const ruleExclusive = hasAnyMarker(ruleText, EXCLUSIVITY);
    const sceneSuspicious = hasNegation(plain) || hasAnyMarker(plain, VIOLATION_MARKERS);
    if (!ruleExclusive && !sceneSuspicious) continue;
    const excerpt = excerptAround(plain, shared, 220);
    drafts.push({
      type: "lore_conflict",
      severity: "potential",
      description:
        `Potensi pelanggaran aturan dunia "${r.title}": aturan menetapkan "${r.rule.slice(0, 140)}" ` +
        `sementara adegan "${sceneRef.title}" memuat bagian yang mungkin menyimpang. ` +
        `Naskah tidak selalu harus patuh — pengecualian bisa disengaja — namun pastikan pembaca diberi alasan yang cukup.`,
      source_ids: [
        { type: "world_rule", id: r.id, label: `Aturan: ${r.title}`, excerpt: r.rule.slice(0, 220) },
        { type: "scene", id: sceneRef.id, label: `Adegan: ${sceneRef.title}`, excerpt },
      ],
      related_entity_ids: [{ type: "world_rule", id: r.id }],
      metadata: { scope, fact_key: factKeyFor("lore_conflict", r.id, shared.slice(0, 4).join(" ")) },
    });
  }
  return drafts;
}

/** Character name mention helper for evidence labels. */
export function involvedNames(characters: Character[], ids: string[]): string[] {
  const byId = new Map(characters.map((c) => [c.id, c.name]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as string[];
}

export type { ConsistencySourceRef, ConsistencyRelatedEntity };
