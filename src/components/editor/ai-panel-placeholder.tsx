"use client";

import React, { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import type { Scene, Chapter, Novel, StoryMemory, MemoryType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/utils";
import { quickAddSceneMemoryAction, proposeSceneMemoriesAction, type MemoryActionResult, type ProposeSceneMemoriesActionResult } from "@/server/actions/memories";
import AIAssistant from "./ai-assistant";
import ConsistencyPanel from "./consistency-panel";
import {
  Sparkles,
  PanelRightClose,
  Compass,
  CheckCircle2,
  BrainCircuit,
  Plus,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AIPanelPlaceholderProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
  currentWordCount: number;
  relevantMemories?: StoryMemory[];
  onCollapse?: () => void;
  /** Live editor HTML — forwarded to AIAssistant for Insert/Replace. */
  editorHtml: string;
  /** Called after the server persists applied AI content. */
  onApplyContent: (finalHtml: string) => void;
}

export default function AIPanelPlaceholder({
  novel,
  chapter,
  scene,
  currentWordCount,
  relevantMemories = [],
  onCollapse,
  editorHtml,
  onApplyContent,
}: AIPanelPlaceholderProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickFactContent, setQuickFactContent] = useState<string>("");
  const [quickFactType, setQuickFactType] = useState<MemoryType>("story_fact");
  const quickFactImportance = 3;

  const [state, formAction, isPending] = useActionState<MemoryActionResult | null, FormData>(
    quickAddSceneMemoryAction,
    null
  );

  // Task 9.5: manual "Usulkan Memori" — extraction on explicit author
  // trigger only (never on autosave). Candidates are stored as
  // "proposed" and reviewed in the Memory Studio.
  const [proposeState, setProposeState] = useState<ProposeSceneMemoriesActionResult | null>(null);
  const [isProposing, setIsProposing] = useState<boolean>(false);

  const handleProposeMemories = async () => {
    setIsProposing(true);
    setProposeState(null);
    try {
      const res = await proposeSceneMemoriesAction(novel.id, scene.id);
      setProposeState(res);
    } catch {
      setProposeState({ error: "Ekstraksi memori gagal. Naskah Anda aman — coba lagi." });
    } finally {
      setIsProposing(false);
    }
  };

  useEffect(() => {
    if (state?.success) {
      setQuickFactContent("");
      setIsQuickAddOpen(false);
    }
  }, [state]);

  return (
    <aside className="w-80 shrink-0 border-l border-border/80 bg-sidebar/40 flex flex-col h-full overflow-hidden select-none transition-all">
      {/* Header */}
      <div className="p-3.5 border-b border-border/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="font-serif font-medium text-xs text-foreground truncate">
            Konteks & AI Assistant
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
            Phase 6/7
          </Badge>
        </div>

        {onCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapse}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            title="Sembunyikan Panel"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Story Context Inspector Card */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-muted-foreground">
              <Compass className="w-3.5 h-3.5 text-primary" />
              Konteks Adegan
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {scene.status.replace("_", " ")}
            </span>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/40">
            <div>
              <span className="text-[11px] text-muted-foreground">Novel / Genre:</span>
              <p className="font-medium text-foreground truncate">
                {novel.title} {novel.genre ? `• ${novel.genre}` : ""}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground">Bab Terkait:</span>
              <p className="font-medium text-foreground truncate">{chapter.title}</p>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground">Fokus / Tujuan Adegan:</span>
              <p className="text-muted-foreground leading-relaxed italic">
                {scene.purpose || "Belum ada catatan tujuan adegan."}
              </p>
            </div>

            {scene.summary && (
              <div>
                <span className="text-[11px] text-muted-foreground">Ringkasan Intrik:</span>
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {scene.summary}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Panjang Naskah Saat Ini:</span>
              <span className="font-semibold text-foreground">
                {formatNumber(currentWordCount)} kata
              </span>
            </div>
          </div>
        </div>

        {/* Phase 6 Feature: Scene Relevant Story Memories */}
        <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-muted-foreground">
              <BrainCircuit className="w-3.5 h-3.5 text-primary" />
              Memori Relevan Adegan
            </span>
            <Link
              href={`/workspace/${novel.id}/memories`}
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
            >
              <span>Studio</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/40">
            {relevantMemories.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                Belum ada memori terkonfirmasi yang terkait langsung dengan karakter atau lokasi adegan ini.
              </p>
            ) : (
              <div className="space-y-2">
                {relevantMemories.slice(0, 4).map((mem) => (
                  <div
                    key={mem.id}
                    className="p-2 rounded-md bg-muted/40 border border-border/60 space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <Badge variant="outline" className="text-[9px] py-0 px-1">
                        {mem.type.replace("_fact", "")}
                      </Badge>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: mem.importance }).map((_, i) => (
                          <Star key={i} className="w-2 h-2 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed line-clamp-2">
                      {mem.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Fact Accordion */}
            <div className="pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleProposeMemories}
                disabled={isProposing}
                className="w-full h-7 text-[11px] flex items-center justify-center gap-1.5"
                title="Ekstrak kandidat memori dari naskah adegan ini. Hasil tersimpan sebagai usulan — tidak otomatis menjadi kanon."
              >
                <Sparkles className="w-3 h-3" />
                {isProposing ? "Mengekstrak..." : "Usulkan Memori dari Adegan"}
              </Button>

              {proposeState?.error && (
                <div className="mt-2 text-[10px] text-destructive leading-relaxed">
                  {proposeState.error}
                </div>
              )}
              {proposeState?.success && (
                <div className="mt-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-[10px] leading-relaxed space-y-1">
                  <p className="text-foreground font-medium">
                    {(proposeState.created?.length || 0) > 0
                      ? `${proposeState.created!.length} usulan tersimpan sebagai Proposed.`
                      : "Tidak ada usulan baru."}
                    {(proposeState.skippedDuplicates || 0) > 0 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}{proposeState.skippedDuplicates} duplikat dilewati.
                      </span>
                    )}
                  </p>
                  {(proposeState.created?.length || 0) > 0 && (
                    <ul className="space-y-1 text-muted-foreground">
                      {proposeState.created!.slice(0, 3).map((m) => (
                        <li key={m.id} className="line-clamp-2">• {m.content}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/workspace/${novel.id}/memories`}
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Tinjau di Memory Studio</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsQuickAddOpen((prev) => !prev)}
                className="w-full py-1 text-[11px] text-primary font-medium flex items-center justify-between hover:underline"
              >
                <span className="flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Catat Fakta Baru dari Adegan
                </span>
                {isQuickAddOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {isQuickAddOpen && (
                <form action={formAction} className="mt-2 space-y-2 p-2.5 rounded-lg bg-muted/30 border border-border/70">
                  <input type="hidden" name="novel_id" value={novel.id} />
                  <input type="hidden" name="scene_id" value={scene.id} />
                  <input type="hidden" name="type" value={quickFactType} />
                  <input type="hidden" name="importance" value={quickFactImportance} />

                  {state?.error && (
                    <div className="text-[10px] text-destructive">{state.error}</div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block">Isi Fakta Baru:</span>
                    <Textarea
                      name="content"
                      value={quickFactContent}
                      onChange={(e) => setQuickFactContent(e.target.value)}
                      placeholder="Contoh: Kaelen menemukan segel rahasia ordo di balik tumpukan buku tua..."
                      rows={2}
                      required
                      className="text-xs resize-none h-16"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={quickFactType}
                      onChange={(e) => setQuickFactType(e.target.value as MemoryType)}
                      className="h-7 text-[10px] rounded border border-input bg-background px-2"
                    >
                      <option value="story_fact">Fakta Cerita</option>
                      <option value="character_fact">Fakta Karakter</option>
                      <option value="world_fact">Fakta Dunia</option>
                      <option value="plot_fact">Fakta Plot</option>
                    </select>

                    <Button type="submit" size="sm" className="h-7 text-[11px] px-2.5" disabled={isPending}>
                      {isPending ? "Menyimpan..." : "Simpan Fakta"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Consistency (Phase 8) */}
        <ConsistencyPanel novel={novel} chapter={chapter} scene={scene} />

        {/* AI Assistant (Phase 7 — live) */}
        <AIAssistant
          novel={novel}
          chapter={chapter}
          scene={scene}
          editorHtml={editorHtml}
          onApplyContent={onApplyContent}
        />

        {/* Manuscript Safety Note */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Naskah Adalah Otoritas Utama</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            AI tidak akan pernah mengubah naskah Anda tanpa persetujuan eksplisit (Accept / Insert / Dismiss).
          </p>
        </div>
      </div>
    </aside>
  );
}
