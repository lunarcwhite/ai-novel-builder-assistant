/**
 * AI Provider Implementations (Phase 7 — Task 7.2)
 * Rule 7.1 (AGENTS.md): application code uses AIProvider, never SDKs directly.
 *
 * Resolution order: explicit AI_PROVIDER=openai|anthropic with AI_API_KEY
 * (OPENAI_API_KEY accepted as fallback) -> remote provider.
 * No key configured -> LocalDevAIProvider: deterministic offline drafts that
 * still consume real story context, so the full pipeline is testable without
 * network, credentials, or cost.
 */

import type { AIMessage, AICompletionOptions, AIProvider } from "./provider";
import { EmbeddingService } from "./embeddings";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Server-safe token estimate (chars/4). Used when a provider omits usage. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function countMessagesTokens(messages: AIMessage[]): number {
  return messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
}

function withTimeout(ms = 60000): AbortSignal {
  return AbortSignal.timeout(ms);
}

// ---------------------------------------------------------------
// OpenAI (Chat Completions, provider-isolated)
// ---------------------------------------------------------------

export class OpenAIChatProvider implements AIProvider {
  name = "openai";
  readonly model: string;
  private apiKey: string;
  private lastUsage: TokenUsage | null = null;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  getLastUsage(): TokenUsage | null {
    return this.lastUsage;
  }

  async generateCompletion(messages: AIMessage[], options: AICompletionOptions = {}): Promise<string> {
    const model = options.model || this.model;
    const body: Record<string, unknown> = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
    };
    if (options.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: withTimeout(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`OpenAI API error (${response.status}): ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const usage = data?.usage;
    this.lastUsage =
      usage && typeof usage.prompt_tokens === "number"
        ? { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens ?? 0 }
        : { inputTokens: countMessagesTokens(messages), outputTokens: estimateTokens(text) };
    if (!text.trim()) throw new Error("OpenAI mengembalikan respons kosong.");
    return text;
  }

  async generateStructured<T>(messages: AIMessage[], schema: unknown, options: AICompletionOptions = {}): Promise<T> {
    void schema;
    const raw = await this.generateCompletion(messages, { ...options, responseFormat: "json" });
    return parseJsonLoose<T>(raw);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return EmbeddingService.generateEmbedding(text);
  }
}

// ---------------------------------------------------------------
// Anthropic (Messages API, provider-isolated)
// ---------------------------------------------------------------

export class AnthropicMessagesProvider implements AIProvider {
  name = "anthropic";
  readonly model: string;
  private apiKey: string;
  private lastUsage: TokenUsage | null = null;

  constructor(apiKey: string, model = "claude-3-5-haiku-latest") {
    this.apiKey = apiKey;
    this.model = model;
  }

  getLastUsage(): TokenUsage | null {
    return this.lastUsage;
  }

  async generateCompletion(messages: AIMessage[], options: AICompletionOptions = {}): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const turns = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || this.model,
        max_tokens: options.maxTokens ?? 800,
        temperature: options.temperature ?? 0.7,
        ...(system ? { system } : {}),
        messages: turns.length > 0 ? turns : [{ role: "user", content: "(lanjutkan)" }],
      }),
      signal: withTimeout(),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Anthropic API error (${response.status}): ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const text: string =
      Array.isArray(data?.content)
        ? data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n")
        : "";
    const usage = data?.usage;
    this.lastUsage =
      usage && typeof usage.input_tokens === "number"
        ? { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens ?? 0 }
        : { inputTokens: countMessagesTokens(messages), outputTokens: estimateTokens(text) };
    if (!text.trim()) throw new Error("Anthropic mengembalikan respons kosong.");
    return text;
  }

  async generateStructured<T>(messages: AIMessage[], schema: unknown, options: AICompletionOptions = {}): Promise<T> {
    void schema;
    const raw = await this.generateCompletion(messages, { ...options, responseFormat: "json" });
    return parseJsonLoose<T>(raw);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return EmbeddingService.generateEmbedding(text);
  }
}

// ---------------------------------------------------------------
// Local deterministic fallback (offline, zero-cost, test-friendly)
// ---------------------------------------------------------------

export class LocalDevAIProvider implements AIProvider {
  name = "local-dev-draft";
  readonly model = "local-dev-draft-1";

  getLastUsage(): TokenUsage | null {
    return null; // caller falls back to estimateTokens
  }

  async generateCompletion(messages: AIMessage[], _options: AICompletionOptions = {}): Promise<string> {
    void _options;
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const op = /OPERASI:\s*(\S+)/.exec(system)?.[1] ?? "ask";
    const sceneLine = /ADEGAN SAAT INI \(([^)]+)\)/.exec(system)?.[1] ?? "";
    const lastSentence = extractLastSentence(system);
    return [
      `[Draf lokal — operasi ${op}]`,
      sceneLine ? `Melanjutkan "${sceneLine}".` : "",
      lastSentence ? `Naskah terakhir berhenti pada: "${lastSentence}"` : "",
      "",
      "Sambungan yang menghormati konteks di atas (ganti dengan tulisan Anda sendiri — AI lokal hanya memberi pijakan, bukan suara final):",
      "",
      lastUser.length > 400 ? lastUser.slice(0, 400) + "…" : lastUser,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async generateStructured<T>(messages: AIMessage[], _schema: unknown, _options: AICompletionOptions = {}): Promise<T> {
    void _schema;
    void _options;
    const text = await this.generateCompletion(messages);
    return { draft: text, provider: this.name } as unknown as T;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return EmbeddingService.generateEmbedding(text);
  }
}

function extractLastSentence(system: string): string {
  const m = /ISI NASKAH ADEGAN \(dipotong\):\s*([\s\S]{1,400})/.exec(system);
  const body = (m?.[1] ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!body) return "";
  const sentences = body.split(/(?<=[.!?…])\s+/);
  return sentences[sentences.length - 1]?.slice(0, 200) ?? "";
}

/** Strict JSON.parse with one fallback: unwrap the largest {...} span. */
export function parseJsonLoose<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    }
    throw new Error("AI mengembalikan JSON yang tidak valid.");
  }
}

// ---------------------------------------------------------------
// Factory (Task 7.2: provider-specific code stays isolated here)
// ---------------------------------------------------------------

export type SupportedAIProviderName = "openai" | "anthropic" | "local";

let cachedProvider: AIProvider | null = null;

export function resolveAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const name = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  const looksPlaceholder = !key || key.includes("your-") || key.includes("«redacted");

  if (!looksPlaceholder && name === "anthropic") {
    cachedProvider = new AnthropicMessagesProvider(key, process.env.AI_MODEL || undefined);
  } else if (!looksPlaceholder && (name === "openai" || !!process.env.OPENAI_API_KEY)) {
    cachedProvider = new OpenAIChatProvider(key, process.env.AI_MODEL || undefined);
  } else {
    cachedProvider = new LocalDevAIProvider();
  }
  return cachedProvider;
}

/** Test-only escape hatch: reset the cached singleton between cases. */
export function resetAIProviderCache(): void {
  cachedProvider = null;
}

/** Test-only escape hatch: pin a provider instance (e.g. a failing stub). */
export function setAIProviderForTests(provider: AIProvider | null): void {
  cachedProvider = provider;
}

// ---------------------------------------------------------------
// Cost control (AGENTS.md Rule 13: metadata only; architecture #41)
// ---------------------------------------------------------------

const PRICE_PER_1K_TOKENS_USD: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "claude-3-5-haiku-latest": { input: 0.0008, output: 0.004 },
  "local-dev-draft-1": { input: 0, output: 0 },
};

export function estimateCostUSD(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICE_PER_1K_TOKENS_USD[model] ?? { input: 0.001, output: 0.003 };
  return Number((((inputTokens / 1000) * rate.input + (outputTokens / 1000) * rate.output).toFixed(6)));
}
