"use server";

import { requireAuth } from "@/server/auth/guards";
import { AIService } from "@/features/ai/service";
import { SceneService } from "@/features/scenes/service";
import {
  applySuggestionSchema,
  askAISchema,
  type AIConversation,
  type AIMessageRow,
  type AISuggestionResult,
  type AIUsageStats,
} from "@/types";

export interface AskAIActionResult {
  success?: boolean;
  error?: string;
  suggestion?: AISuggestionResult;
  conversation?: AIConversation | null;
  history?: AIMessageRow[];
  contentClipped?: boolean;
}

export interface ApplyAIActionResult {
  success?: boolean;
  error?: string;
  wordCount?: number;
  updatedAt?: string;
}

/**
 * Ask the AI assistant. Resolves story context server-side, generates a
 * suggestion, persists conversation history, logs usage. Never writes to
 * the manuscript — the author applies the suggestion explicitly.
 */
export async function askAIAction(
  novelId: string,
  sceneId: string | null,
  chapterId: string | null,
  rawInput: unknown
): Promise<AskAIActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId) return { error: "ID novel tidak valid." };

    const parsed = askAISchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Input AI tidak valid." };
    }

    const res = await AIService.ask({
      novelId,
      userId: user.id,
      sceneId,
      chapterId,
      operation: parsed.data.operation,
      userQuery: parsed.data.userQuery,
      selectedText: parsed.data.selectedText,
      conversationId: parsed.data.conversationId,
    });

    if (!res.success) return { error: res.error || "Permintaan AI gagal." };
    return {
      success: true,
      suggestion: res.suggestion,
      conversation: res.conversation,
      history: res.history,
      contentClipped: res.contentClipped,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Permintaan AI gagal.";
    return { error: message };
  }
}

/**
 * Apply an AI suggestion to the manuscript. Manuscript safety (AGENTS.md
 * Rule 6): the current draft is checkpointed as a scene version
 * (ai_insert / ai_replace) before the new content is saved, so every AI
 * edit is reversible via version restore.
 */
export async function applySuggestionAction(
  novelId: string,
  sceneId: string,
  rawInput: unknown
): Promise<ApplyAIActionResult> {
  try {
    const user = await requireAuth();
    if (!novelId || !sceneId) return { error: "ID novel atau adegan tidak valid." };

    const parsed = applySuggestionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Saran AI tidak valid." };
    }

    const scene = await SceneService.getScene(sceneId, novelId, user.id);
    if (!scene) return { error: "Adegan tidak ditemukan atau akses ditolak." };

    const changeType = parsed.data.mode === "insert" ? "ai_insert" : "ai_replace";
    const opLabel = parsed.data.operation ? ` (${parsed.data.operation})` : "";

    // 1. Checkpoint current draft (reversible).
    await SceneService.createSceneVersion(sceneId, novelId, user.id, {
      content: scene.content || "",
      title: `Sebelum AI ${parsed.data.mode === "insert" ? "Insert" : "Replace"}`,
      change_type: changeType,
      notes: `Checkpoint otomatis sebelum menerapkan saran AI${opLabel}.`,
    });

    // 2. Apply the author's approved content.
    const updated = await SceneService.updateSceneContent(sceneId, novelId, user.id, parsed.data.finalContent);
    if (!updated) return { error: "Gagal menerapkan saran AI." };

    return { success: true, wordCount: updated.word_count, updatedAt: updated.updated_at };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menerapkan saran AI.";
    return { error: message };
  }
}

export async function listAIConversationsAction(
  novelId: string
): Promise<{ conversations?: AIConversation[]; error?: string }> {
  try {
    const user = await requireAuth();
    return { conversations: await AIService.conversations(novelId, user.id) };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Gagal memuat percakapan." };
  }
}

export async function getAIHistoryAction(
  novelId: string,
  conversationId: string
): Promise<{ conversation?: AIConversation | null; messages?: AIMessageRow[]; error?: string }> {
  try {
    const user = await requireAuth();
    const { conversation, messages } = await AIService.history(novelId, user.id, conversationId);
    return { conversation, messages };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Gagal memuat riwayat." };
  }
}

export async function getAIUsageAction(
  novelId: string
): Promise<{ stats?: AIUsageStats; error?: string }> {
  try {
    const user = await requireAuth();
    return { stats: await AIService.usage(novelId, user.id) };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Gagal memuat statistik." };
  }
}
