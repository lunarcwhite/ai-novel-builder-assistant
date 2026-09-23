import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { NovelRepository } from "@/features/novels/repository";
import type {
  AIConversation,
  AIMessageRole,
  AIMessageRow,
  AIUsageLog,
  AIUsageStats,
} from "@/types";

// In-memory stores for local dev mode (no Supabase credentials).
// Keyed by novelId / conversationId / userId, mirroring sibling repositories.
export const localDevConversationsStore: Map<string, AIConversation[]> = new Map();
export const localDevMessagesStore: Map<string, AIMessageRow[]> = new Map();
export const localDevUsageStore: Map<string, AIUsageLog[]> = new Map();

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const now = () => new Date().toISOString();

async function ownsNovel(novelId: string, userId: string): Promise<boolean> {
  return Boolean(await NovelRepository.findById(novelId, userId));
}

export class AIConversationRepository {
  static async findByNovel(novelId: string, userId: string): Promise<AIConversation[]> {
    if (!(await ownsNovel(novelId, userId))) return [];
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("novel_id", novelId)
        .order("updated_at", { ascending: false })
        .limit(30);
      return (data ?? []) as AIConversation[];
    }
    return [...(localDevConversationsStore.get(novelId) || [])].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at)
    );
  }

  static async findById(id: string, novelId: string, userId: string): Promise<AIConversation | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("id", id)
        .eq("novel_id", novelId)
        .single();
      return (data ?? null) as AIConversation | null;
    }
    return (localDevConversationsStore.get(novelId) || []).find((c) => c.id === id) || null;
  }

  static async create(
    novelId: string,
    userId: string,
    input: { title?: string | null; context?: AIConversation["context"] }
  ): Promise<AIConversation | null> {
    if (!(await ownsNovel(novelId, userId))) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({ novel_id: novelId, user_id: userId, title: input.title || null, context: input.context || {} })
        .select()
        .single();
      if (error || !data) return null;
      return data as AIConversation;
    }
    const convo: AIConversation = {
      id: uid("conv"),
      novel_id: novelId,
      user_id: userId,
      title: input.title || null,
      context: input.context || {},
      created_at: now(),
      updated_at: now(),
    };
    localDevConversationsStore.set(novelId, [convo, ...(localDevConversationsStore.get(novelId) || [])]);
    return convo;
  }

  static async touch(id: string, novelId: string, userId: string): Promise<void> {
    const convo = await this.findById(id, novelId, userId);
    if (!convo) return;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      await supabase.from("ai_conversations").update({ updated_at: now() }).eq("id", id);
      return;
    }
    convo.updated_at = now();
  }
}

export class AIMessageRepository {
  static async listByConversation(
    conversationId: string,
    novelId: string,
    userId: string,
    limit = 50
  ): Promise<AIMessageRow[]> {
    const convo = await AIConversationRepository.findById(conversationId, novelId, userId);
    if (!convo) return [];
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(limit);
      return (data ?? []) as AIMessageRow[];
    }
    return (localDevMessagesStore.get(conversationId) || []).slice(-limit);
  }

  static async create(
    conversationId: string,
    novelId: string,
    userId: string,
    input: { role: AIMessageRole; content: string; metadata?: AIMessageRow["metadata"] }
  ): Promise<AIMessageRow | null> {
    const convo = await AIConversationRepository.findById(conversationId, novelId, userId);
    if (!convo) return null;
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ai_messages")
        .insert({
          conversation_id: conversationId,
          role: input.role,
          content: input.content,
          metadata: input.metadata || {},
        })
        .select()
        .single();
      if (error || !data) return null;
      return data as AIMessageRow;
    }
    const msg: AIMessageRow = {
      id: uid("msg"),
      conversation_id: conversationId,
      role: input.role,
      content: input.content,
      metadata: input.metadata || {},
      created_at: now(),
    };
    localDevMessagesStore.set(conversationId, [...(localDevMessagesStore.get(conversationId) || []), msg]);
    return msg;
  }
}

export interface UsageLogInput {
  novelId?: string | null;
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost?: number | null;
  latencyMs?: number | null;
  status: string;
}

export class AIUsageRepository {
  static async log(userId: string, input: UsageLogInput): Promise<AIUsageLog | null> {
    const supabase = await createClient();
    if (supabase && isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .insert({
          user_id: userId,
          novel_id: input.novelId || null,
          provider: input.provider,
          model: input.model,
          operation: input.operation,
          input_tokens: input.inputTokens,
          output_tokens: input.outputTokens,
          estimated_cost: input.estimatedCost ?? null,
          latency_ms: input.latencyMs ?? null,
          status: input.status,
        })
        .select()
        .single();
      if (error || !data) return null;
      return data as AIUsageLog;
    }
    const entry: AIUsageLog = {
      id: uid("use"),
      user_id: userId,
      novel_id: input.novelId || null,
      provider: input.provider,
      model: input.model,
      operation: input.operation,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      estimated_cost: input.estimatedCost ?? null,
      latency_ms: input.latencyMs ?? null,
      status: input.status,
      created_at: now(),
    };
    localDevUsageStore.set(userId, [entry, ...(localDevUsageStore.get(userId) || [])]);
    return entry;
  }

  static async statsByUser(userId: string, novelId?: string | null): Promise<AIUsageStats> {
    const empty: AIUsageStats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalEstimatedCost: 0,
      byOperation: {},
    };
    const supabase = await createClient();
    let rows: AIUsageLog[] = [];
    if (supabase && isSupabaseConfigured) {
      let query = supabase.from("ai_usage_logs").select("*").eq("user_id", userId).limit(500);
      if (novelId) query = query.eq("novel_id", novelId);
      const { data } = await query;
      rows = (data ?? []) as AIUsageLog[];
    } else {
      rows = localDevUsageStore.get(userId) || [];
      if (novelId) rows = rows.filter((r) => r.novel_id === novelId);
    }
    for (const r of rows) {
      empty.totalRequests += 1;
      empty.totalInputTokens += r.input_tokens;
      empty.totalOutputTokens += r.output_tokens;
      empty.totalEstimatedCost += Number(r.estimated_cost || 0);
      empty.byOperation[r.operation] = (empty.byOperation[r.operation] || 0) + 1;
    }
    empty.totalEstimatedCost = Number(empty.totalEstimatedCost.toFixed(6));
    return empty;
  }
}
