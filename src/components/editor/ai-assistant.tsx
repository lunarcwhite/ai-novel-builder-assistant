"use client";

import React, { useCallback, useEffect, useState } from "react";
import type {
  AIConversation,
  AIMessageRow,
  AIOperation,
  AISuggestionResult,
  AIUsageStats,
  Chapter,
  Novel,
  Scene,
} from "@/types";
import { OPERATION_CONTRACTS } from "@/server/ai/prompts";
import {
  applySuggestionAction,
  askAIAction,
  getAIHistoryAction,
  getAIUsageAction,
  listAIConversationsAction,
} from "@/server/actions/ai";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

interface AIAssistantProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
  /** Current editor HTML — used to compute final content on Insert/Replace. */
  editorHtml: string;
  /** Called after the server persists applied content (parent syncs editor + autosave). */
  onApplyContent: (finalHtml: string) => void;
}

const OP_ORDER: AIOperation[] = [
  "continue_scene",
  "brainstorm",
  "rewrite",
  "expand",
  "improve_prose",
  "improve_dialogue",
  "shorten",
  "summarize",
  "critique",
  "ask",
];

const DEFAULT_QUERY: Record<AIOperation, string> = {
  continue_scene: "Lanjutkan naskah dari kalimat terakhir.",
  brainstorm: "Berikan tiga arah kelanjutan yang berbeda untuk adegan ini.",
  rewrite: "Tulis ulang agar lebih jernih tanpa mengubah fakta.",
  expand: "Kembangkan dengan detail sensorik yang konsisten.",
  shorten: "Padatkan tanpa menghilangkan kejadian penting.",
  improve_prose: "Poles ritme dan kejernihan prosa.",
  improve_dialogue: "Perbaiki dialog agar tiap tokoh bersuara beda.",
  summarize: "Ringkas kejadian penting adegan ini.",
  critique: "Beri observasi dan saran perbaikan.",
  ask: "",
};

/** Plain-text suggestion -> minimal editor HTML (paragraphs preserved). */
import { suggestionToHtml } from "@/lib/ai-text";

export default function AIAssistant({ novel, chapter, scene, editorHtml, onApplyContent }: AIAssistantProps) {
  const [operation, setOperation] = useState<AIOperation>("continue_scene");
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AISuggestionResult | null>(null);
  const [history, setHistory] = useState<AIMessageRow[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pastConversations, setPastConversations] = useState<AIConversation[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [usage, setUsage] = useState<AIUsageStats | null>(null);
  const [applying, setApplying] = useState<"insert" | "replace" | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const refreshMeta = useCallback(async () => {
    try {
      const [convs, stats] = await Promise.all([
        listAIConversationsAction(novel.id),
        getAIUsageAction(novel.id),
      ]);
      if (convs.conversations) setPastConversations(convs.conversations);
      if (stats.stats) setUsage(stats.stats);
    } catch {
      // Metadata is best-effort; the assistant still works without it.
    }
  }, [novel.id]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  const handleAsk = async () => {
    const effectiveQuery = (query.trim() || DEFAULT_QUERY[operation]).trim();
    if (!effectiveQuery) {
      setError("Tulis pertanyaan atau instruksi terlebih dahulu.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    setAppliedNotice(null);
    try {
      const res = await askAIAction(novel.id, scene.id, chapter.id, {
        operation,
        userQuery: effectiveQuery,
        selectedText: null,
        conversationId,
      });
      if (!res.success || !res.suggestion) {
        setError(res.error || "Permintaan AI gagal. Naskah Anda aman.");
        setStatus("error");
        return;
      }
      setSuggestion(res.suggestion);
      if (res.conversation) setConversationId(res.conversation.id);
      if (res.history) setHistory(res.history);
      setStatus("done");
      refreshMeta();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Permintaan AI gagal. Naskah Anda aman.");
      setStatus("error");
    }
  };

  const handleApply = async (mode: "insert" | "replace") => {
    if (!suggestion || applying) return;
    setApplying(mode);
    setError(null);
    try {
      const insertHtml = suggestionToHtml(suggestion.text);
      const finalHtml = mode === "insert" ? `${editorHtml}${insertHtml}` : insertHtml;
      const res = await applySuggestionAction(novel.id, scene.id, {
        mode,
        finalContent: finalHtml,
        operation: suggestion.operation,
      });
      if (!res.success) {
        setError(res.error || "Gagal menerapkan saran.");
        return;
      }
      onApplyContent(finalHtml);
      setAppliedNotice(
        mode === "insert"
          ? "Saran disisipkan di akhir adegan. Versi sebelumnya tersimpan dan dapat dipulihkan."
          : "Naskah diganti dengan saran AI. Versi sebelumnya tersimpan dan dapat dipulihkan."
      );
      setSuggestion(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menerapkan saran.");
    } finally {
      setApplying(null);
    }
  };

  const handleCopy = async () => {
    if (!suggestion) return;
    try {
      await navigator.clipboard.writeText(suggestion.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Gagal menyalin ke clipboard.");
    }
  };

  const handleOpenConversation = async (id: string) => {
    try {
      const res = await getAIHistoryAction(novel.id, id);
      if (res.messages) {
        setHistory(res.messages);
        setConversationId(id);
        setSuggestion(null);
        setShowHistory(true);
      }
    } catch {
      // ignore — history panel keeps previous state
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setHistory([]);
    setSuggestion(null);
    setStatus("idle");
    setError(null);
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-primary font-medium">
          <Wand2 className="w-4 h-4" />
          <span>AI Writing Companion</span>
        </div>
        <div className="flex items-center gap-1">
          {usage && usage.totalRequests > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {usage.totalRequests} permintaan • {(usage.totalInputTokens + usage.totalOutputTokens).toLocaleString("id-ID")} token
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            title="Mulai percakapan baru"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Operation picker */}
      <div className="flex flex-wrap gap-1.5">
        {OP_ORDER.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => setOperation(op)}
            disabled={status === "loading"}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
              operation === op
                ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                : "bg-background/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-background"
            }`}
          >
            {OPERATION_CONTRACTS[op].label}
          </button>
        ))}
      </div>

      {/* Query input */}
      <div className="space-y-1.5">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${DEFAULT_QUERY[operation]}${operation === "ask" ? " Tanya apa saja tentang cerita ini…" : " (opsional — tambahkan arahan spesifik)"}`}
          rows={2}
          disabled={status === "loading"}
          className="text-xs resize-none bg-background/70"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAsk();
          }}
        />
        <Button
          onClick={handleAsk}
          disabled={status === "loading"}
          size="sm"
          className="w-full h-7 text-xs gap-1.5"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Meminta saran dengan konteks cerita…
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              {OPERATION_CONTRACTS[operation].label} dengan Konteks
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {status === "error" && error && (
        <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-[11px] text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </div>
      )}

      {/* Applied notice */}
      {appliedNotice && (
        <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
          <Check className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Suggestion card — review before anything touches the manuscript */}
      {suggestion && (
        <div className="rounded-md border border-border/70 bg-background/80 overflow-hidden">
          <div className="px-2.5 py-1.5 border-b border-border/50 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Saran AI — {OPERATION_CONTRACTS[suggestion.operation].label}
            </span>
            <Badge variant="outline" className="text-[9px] py-0 px-1">
              {suggestion.provider} • {suggestion.model}
            </Badge>
          </div>
          <p className="px-2.5 py-2 text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {suggestion.text}
          </p>
          <div className="px-2.5 py-2 border-t border-border/50 grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              onClick={() => handleApply("insert")}
              disabled={!!applying}
              className="h-7 text-[11px] gap-1"
              title="Sisipkan di akhir adegan (naskah lama tetap, versi dicadangkan)"
            >
              {applying === "insert" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Sisipkan
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleApply("replace")}
              disabled={!!applying}
              className="h-7 text-[11px] gap-1"
              title="Ganti seluruh naskah adegan (versi lama dicadangkan otomatis)"
            >
              {applying === "replace" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Ganti
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-[11px] gap-1">
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? "Tersalin" : "Salin"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSuggestion(null);
                setStatus("idle");
              }}
              className="h-7 text-[11px] gap-1 text-muted-foreground"
            >
              <X className="w-3 h-3" />
              Abaikan
            </Button>
          </div>
        </div>
      )}

      {/* Conversation history */}
      <div className="pt-1 border-t border-border/40">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="w-full py-1 text-[11px] text-muted-foreground font-medium flex items-center justify-between hover:text-foreground"
        >
          <span className="flex items-center gap-1">
            <History className="w-3 h-3" />
            Riwayat Percakapan ({history.length || pastConversations.length})
          </span>
          {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showHistory && (
          <div className="mt-1.5 space-y-1.5 max-h-56 overflow-y-auto">
            {history.length === 0 && pastConversations.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Belum ada percakapan untuk novel ini.</p>
            )}
            {history.length > 0
              ? history.slice(-8).map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-md text-[11px] leading-relaxed border ${
                      m.role === "user"
                        ? "bg-muted/40 border-border/60 text-foreground"
                        : "bg-background/70 border-border/50 text-foreground/90"
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                      {m.role === "user" ? "Anda" : `AI${m.metadata?.operation ? ` • ${m.metadata.operation}` : ""}`}
                    </span>
                    <span className="line-clamp-4">{m.content}</span>
                  </div>
                ))
              : pastConversations.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleOpenConversation(c.id)}
                    className="w-full text-left p-2 rounded-md bg-background/60 border border-border/50 text-[11px] hover:border-primary/40 transition-colors"
                  >
                    <span className="font-medium text-foreground line-clamp-1">{c.title || "Percakapan tanpa judul"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
