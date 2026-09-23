/**
 * Context Builder (Phase 7 — Task 7.5)
 * Builds the layered prompt sections:
 * SYSTEM / NOVEL / CURRENT CHAPTER / CURRENT SCENE / CHARACTERS /
 * WORLD / MEMORIES / USER REQUEST. Respects a character budget;
 * scene content is the first thing cut, never the operation instruction.
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

  if (operation !== "continue_scene" && ctx.selectedText) {
    parts.push("TEKS TERPILIH (target operasi — jangan ubah naskah di luar ini)");
    parts.push(ctx.selectedText.slice(0, 8000));
  }

  parts.push("PERMINTAAN PENULIS");
  parts.push(userQuery);

  return parts.join("\n\n");
}
