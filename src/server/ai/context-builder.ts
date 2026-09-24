/**
 * Context Builder (Phase 7 — Task 7.5, extended Task 9.4)
 * Builds the layered prompt sections:
 * SYSTEM / NOVEL / CURRENT ACT / CURRENT CHAPTER / CURRENT SCENE /
 * CHARACTERS / WORLD / MEMORIES / PLOT THREADS / TIMELINE / USER REQUEST.
 * Respects a character budget; scene content is the first thing cut,
 * never the operation instruction.
 */

import type { AIOperation } from "@/types";
import type { ResolvedStoryContext } from "./context-resolver";
import { AI_SYSTEM_PREAMBLE, OPERATION_CONTRACTS } from "./prompts";

export interface BuiltPrompt {
  system: string;
  userPrompt: string;
  operation: AIOperation;
  /** True when scene content was clipped to fit the budget. */
  contentClipped: boolean;
}

/** Total prompt budget in characters (~8k tokens). */
export const PROMPT_CHAR_BUDGET = 32000;
const SCENE_CLIP_STEP = 2000;
const MIN_SCENE_CHARS = 500;

function line(label: string, value: string | null | undefined): string {
  if (!value) return "";
  return `${label}: ${value}\n`;
}

/** Clip one context layer to a fixed budget (whitespace-folded). */
function clipLayer(text: string | null | undefined, max: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

export function buildPrompt(
  ctx: ResolvedStoryContext,
  operation: AIOperation,
  userQuery: string,
  budget: number = PROMPT_CHAR_BUDGET
): BuiltPrompt {
  const contract = OPERATION_CONTRACTS[operation];
  const system = [AI_SYSTEM_PREAMBLE, "", `OPERASI: ${operation} (${contract.label})`, contract.instruction].join("\n");

  let sceneChars = Math.min((ctx.scene?.content || "").replace(/<[^>]*>/g, " ").length, 6000);
  if (sceneChars < MIN_SCENE_CHARS) sceneChars = Math.max((ctx.scene?.content || "").length, MIN_SCENE_CHARS);

  // Shrink scene excerpt until the whole prompt fits the budget.
  let userPrompt = "";
  let contentClipped = false;
  for (;;) {
    userPrompt = renderUser(ctx, userQuery, operation, sceneChars);
    if (system.length + userPrompt.length <= budget || sceneChars <= MIN_SCENE_CHARS) {
      contentClipped = sceneChars < (ctx.scene?.content || "").replace(/<[^>]*>/g, " ").length;
      break;
    }
    sceneChars = Math.max(MIN_SCENE_CHARS, sceneChars - SCENE_CLIP_STEP);
  }

  return { system, userPrompt, operation, contentClipped };
}

function renderUser(ctx: ResolvedStoryContext, userQuery: string, operation: AIOperation, sceneChars: number): string {
  const parts: string[] = [];
  const n = ctx.novel;

  parts.push("NOVEL");
  parts.push(`${line("Judul", n.title)}${line("Genre", n.genre)}${line("Premis", n.premise)}${line("Tema", n.theme)}${line("Nada", n.tone)}`);

  if (ctx.chapter) {
    parts.push("CURRENT CHAPTER");
    parts.push(`${line("Bab", ctx.chapter.title)}${line("Ringkasan", ctx.chapter.summary)}${line("Tujuan", ctx.chapter.objective)}${line("Konflik", ctx.chapter.conflict)}`);
  }

  // Task 9.4: the owning act layer (description doubles as act summary).
  if (ctx.act) {
    const actText = clipLayer(ctx.act.description, 500);
    if (actText) {
      parts.push("CURRENT ACT");
      parts.push(`${line("Babak", ctx.act.title)}${line("Gambaran", actText)}`);
    }
  }

  if (ctx.scene) {
    const s = ctx.scene;
    const plain = (s.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const excerpt = plain.length > sceneChars ? plain.slice(0, sceneChars) + "… [dipotong]" : plain;
    parts.push(`ADEGAN SAAT INI (${s.title})`);
    if (s.purpose) parts.push(`Tujuan adegan: ${s.purpose}`);
    if (s.summary) parts.push(`Ringkasan: ${s.summary}`);
    parts.push(`ISI NASKAH ADEGAN (dipotong):\n${excerpt || "(adegan masih kosong)"}`);
  }

  const charLines = [
    ctx.povCharacter ? `POV: ${ctx.povCharacter.name} (${ctx.povCharacter.role}) — ${ctx.povCharacter.description || ctx.povCharacter.motivation || ""}` : "",
    ...ctx.involvedCharacters
      .filter((c) => c.id !== ctx.povCharacter?.id)
      .map((c) => `- ${c.name} (${c.role}): ${[c.motivation, c.fear].filter(Boolean).join(" | ") || c.description || ""}`),
  ].filter(Boolean);
  if (ctx.location) charLines.push(`Lokasi: ${ctx.location.name} — ${ctx.location.atmosphere || ctx.location.description || ""}`);
  if (charLines.length > 0) {
    parts.push("CHARACTERS & TEMPAT");
    parts.push(charLines.join("\n"));
  }

  if (ctx.worldRules.length > 0) {
    parts.push("ATURAN DUNIA (jangan dilanggar)");
    parts.push(ctx.worldRules.map((r) => `- ${r.title}: ${r.rule}`).join("\n"));
  }

  if (ctx.worldLore.length > 0) {
    parts.push("LORE TERKAIT");
    parts.push(ctx.worldLore.map((l) => `- [${l.category}] ${l.title}: ${l.content.slice(0, 300)}`).join("\n"));
  }

  if (ctx.relevantMemories.length > 0) {
    parts.push("MEMORI CERITA TERKONFIRMASI (fakta mapan — hormati; status: confirmed)");
    parts.push(ctx.relevantMemories.map((m) => `- [${m.type}] ${m.content}`).join("\n"));
  }

  // Task 9.4: long-novel context layers — plot threads + timeline, capped.
  if (ctx.plotThreads.length > 0) {
    parts.push("PLOT THREADS AKTIF (jangan selesaikan diam-diam)");
    parts.push(
      ctx.plotThreads
        .map((t) => `- [${t.status}] ${t.title}${t.description ? `: ${clipLayer(t.description, 160)}` : ""}`)
        .join("\n")
    );
  }

  if (ctx.timeline.length > 0) {
    parts.push("TIMELINE (urutan kejadian — hormati)");
    parts.push(
      ctx.timeline
        .map((e) => {
          const when =
            e.date_precision === "relative"
              ? e.relative_time || "waktu relatif"
              : e.date_precision === "unknown"
                ? "waktu belum pasti"
                : e.date_value || e.date_precision;
          return `- ${e.title} (${when})`;
        })
        .join("\n")
    );
  }

  if (operation !== "continue_scene" && ctx.selectedText) {
    parts.push("TEKS TERPILIH (target operasi — jangan ubah naskah di luar ini)");
    parts.push(ctx.selectedText.slice(0, 8000));
  }

  parts.push("PERMINTAAN PENULIS");
  parts.push(userQuery);

  return parts.join("\n\n");
}
