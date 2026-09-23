/**
 * AIService (Phase 7 — Task 7.3)
 * Orchestrates: resolve context -> build prompt -> provider -> persist
 * conversation messages -> log usage. Never writes to scenes directly;
 * suggestion application is a separate, explicit, versioned user action.
 */

import { NovelRepository } from "@/features/novels/repository";
import { resolveStoryContext } from "@/server/ai/context-resolver";
import { buildPrompt } from "@/server/ai/context-builder";
import { OPERATION_CONTRACTS } from "@/server/ai/prompts";
import {
  estimateCostUSD,
  estimateTokens,
  resolveAIProvider,
  type TokenUsage,
} from "@/server/ai/providers";
import type { AIMessage, AIProvider } from "@/server/ai/provider";
import { AIConversationRepository, AIMessageRepository, AIUsageRepository } from "./repository";
import type {
  AIOperation,
  AIConversation,
  AIMessageRow,
  AISuggestionResult,
  AIUsageStats,
} from "@/types";

export interface AskOptions {
  novelId: string;
  userId: string;
  sceneId?: string | null;
  chapterId?: string | null;
  operation: AIOperation;
  userQuery: string;
  selectedText?: string | null;
  conversationId?: string | null;
}

export interface AskResult {
  success: boolean;
  error?: string;
  suggestion?: AISuggestionResult;
  conversation?: AIConversation | null;
  history?: AIMessageRow[];
  contentClipped?: boolean;
  fromCache?: boolean;
}

const TITLE_WORDS = 6;

function titleFrom(query: string): string {
  const words = query.trim().split(/\s+/).slice(0, TITLE_WORDS).join(" ");
  return words.length > 60 ? words.slice(0, 60) + "…" : words || "Percakapan AI";
}

function readUsage(provider: AIProvider, system: string, user: string, text: string): TokenUsage {
  const reported = (provider as { getLastUsage?: () => TokenUsage | null }).getLastUsage?.() ?? null;
  if (reported) return reported;
  return { inputTokens: estimateTokens(system + "\n" + user), outputTokens: estimateTokens(text) };
}

export class AIService {
  static async ask(opts: AskOptions): Promise<AskResult> {
    const operation = OPERATION_CONTRACTS[opts.operation] ? opts.operation : null;
    if (!operation) return { success: false, error: "Operasi AI tidak dikenal." };
    const userQuery = (opts.userQuery || "").trim();
    if (!userQuery) return { success: false, error: "Pertanyaan atau instruksi wajib diisi." };
    if (userQuery.length > 2000) return { success: false, error: "Instruksi maksimal 2.000 karakter." };
    if ((opts.selectedText || "").length > 8000) {
      return { success: false, error: "Teks terpilih maksimal 8.000 karakter." };
    }

    const novel = await NovelRepository.findById(opts.novelId, opts.userId);
    if (!novel) return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };

    const ctx = await resolveStoryContext({
      novelId: opts.novelId,
      userId: opts.userId,
      chapterId: opts.chapterId,
      sceneId: opts.sceneId,
      selectedText: opts.selectedText,
      userQuery,
    });
    if (!ctx) return { success: false, error: "Gagal memuat konteks cerita." };

    const built = buildPrompt(ctx, operation, userQuery);

    // Reuse the caller's conversation when it belongs to this novel; else create one.
    let conversation: AIConversation | null = null;
    if (opts.conversationId) {
      conversation = await AIConversationRepository.findById(opts.conversationId, opts.novelId, opts.userId);
    }
    if (!conversation) {
      conversation = await AIConversationRepository.create(opts.novelId, opts.userId, {
        title: titleFrom(userQuery),
        context: {
          chapter_id: ctx.chapter?.id,
          scene_id: ctx.scene?.id,
          selected_text: Boolean(ctx.selectedText),
          operation,
        },
      });
      if (!conversation) return { success: false, error: "Gagal membuat percakapan AI." };
    }

    // Persist history (user turn) before generation so failures stay explainable.
    await AIMessageRepository.create(conversation.id, opts.novelId, opts.userId, {
      role: "user",
      content: userQuery,
      metadata: { operation, scene_id: ctx.scene?.id, chapter_id: ctx.chapter?.id },
    });

    const provider = resolveAIProvider();
    const model =
      (provider as { model?: string }).model ||
      process.env.AI_MODEL ||
      (provider.name === "openai" ? "gpt-4o-mini" : provider.name === "anthropic" ? "claude-3-5-haiku-latest" : "local-dev-draft-1");

    const messages: AIMessage[] = [
      { role: "system", content: built.system },
      { role: "user", content: built.userPrompt },
    ];
    const contract = OPERATION_CONTRACTS[operation];
    const started = Date.now();
    try {
      const text = await provider.generateCompletion(messages, {
        model,
        temperature: contract.temperature,
        maxTokens: contract.maxTokens,
      });
      const latencyMs = Date.now() - started;
      const usage = readUsage(provider, built.system, built.userPrompt, text);
      const cost = estimateCostUSD(model, usage.inputTokens, usage.outputTokens);

      const assistantMsg = await AIMessageRepository.create(conversation.id, opts.novelId, opts.userId, {
        role: "assistant",
        content: text,
        metadata: {
          operation,
          model,
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
          scene_id: ctx.scene?.id,
          chapter_id: ctx.chapter?.id,
        },
      });
      await AIConversationRepository.touch(conversation.id, opts.novelId, opts.userId);
      await AIUsageRepository.log(opts.userId, {
        novelId: opts.novelId,
        provider: provider.name,
        model,
        operation,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        estimatedCost: cost,
        latencyMs,
        status: "success",
      });

      const history = await AIMessageRepository.listByConversation(conversation.id, opts.novelId, opts.userId);
      return {
        success: true,
        suggestion: {
          text,
          operation,
          provider: provider.name,
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          latencyMs,
          conversationId: conversation.id,
          messageId: assistantMsg?.id || "",
        },
        conversation,
        history,
        contentClipped: built.contentClipped,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - started;
      const message = err instanceof Error ? err.message : "Permintaan AI gagal.";
      await AIMessageRepository.create(conversation.id, opts.novelId, opts.userId, {
        role: "assistant",
        content: `AI request failed. Your writing is safe. (${message})`,
        metadata: { operation, model, scene_id: ctx.scene?.id, chapter_id: ctx.chapter?.id, error: true },
      });
      await AIUsageRepository.log(opts.userId, {
        novelId: opts.novelId,
        provider: provider.name,
        model,
        operation,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCost: 0,
        latencyMs,
        status: "error",
      });
      return { success: false, error: `AI request failed. Your writing is safe. ${message}`.slice(0, 500) };
    }
  }

  static async history(
    novelId: string,
    userId: string,
    conversationId: string
  ): Promise<{ conversation: AIConversation | null; messages: AIMessageRow[] }> {
    const conversation = await AIConversationRepository.findById(conversationId, novelId, userId);
    if (!conversation) return { conversation: null, messages: [] };
    const messages = await AIMessageRepository.listByConversation(conversationId, novelId, userId);
    return { conversation, messages };
  }

  static async conversations(novelId: string, userId: string): Promise<AIConversation[]> {
    return AIConversationRepository.findByNovel(novelId, userId);
  }

  static async usage(novelId: string, userId: string): Promise<AIUsageStats> {
    return AIUsageRepository.statsByUser(userId, novelId);
  }
}
