"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ActSummaryNode,
  ChapterSummaryNode,
  SummaryHierarchy,
  SummaryLevel,
  SummaryNode,
} from "@/types";
import {
  applySummaryAction,
  synthesizeSummaryAction,
} from "@/server/actions/summaries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Layers,
  Loader2,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  Bookmark,
  BookMarked,
  Check,
  X,
  Wand2,
} from "lucide-react";

interface SummaryStudioViewProps {
  novelId: string;
  initial: SummaryHierarchy;
}

const LEVEL_META: Record<
  SummaryLevel,
  { label: string; icon: React.ReactNode; hint: string; column: string }
> = {
  scene: {
    label: "Adegan",
    icon: <FileText className="w-3.5 h-3.5" />,
    hint: "Teks penulis sendiri",
    column: "summary",
  },
  chapter: {
    label: "Bab",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    hint: "Dari ringkasan adegan",
    column: "summary",
  },
  act: {
    label: "Babak",
    icon: <Bookmark className="w-3.5 h-3.5" />,
    hint: "Dari ringkasan bab",
    column: "description",
  },
  novel: {
    label: "Novel",
    icon: <BookMarked className="w-3.5 h-3.5" />,
    hint: "Dari ringkasan babak",
    column: "description",
  },
};

interface Pending {
  level: SummaryLevel;
  id: string;
  title: string;
  candidate: string;
  deterministic: string;
  aiEnriched: boolean;
}

function CoveragePill({ node }: { node: SummaryNode }) {
  const has = Boolean(node.authorText);
  const derived = !has && Boolean(node.derivedText);
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge
        variant="outline"
        className={
          has
            ? "text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            : derived
              ? "text-[10px] border-sky-500/30 text-sky-700 dark:text-sky-300"
              : "text-[10px] text-muted-foreground"
        }
      >
        {has ? "Ditulis" : derived ? "Turunan" : "Kosong"}
      </Badge>
      {node.childrenTotal > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {node.childrenWithText}/{node.childrenTotal}
        </span>
      )}
    </span>
  );
}

function NodeBlock({
  node,
  level,
  onSynthesize,
  busyKey,
}: {
  node: SummaryNode;
  level: SummaryLevel;
  onSynthesize: (level: SummaryLevel, id: string) => void;
  busyKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const meta = LEVEL_META[level];
  const key = `${level}:${node.id}`;
  const busy = busyKey === key;
  const display = node.authorText || node.derivedText;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{meta.icon}</span>
          <p className="text-xs font-medium truncate">{node.title}</p>
        </div>
        <CoveragePill node={node} />
      </div>

      {display ? (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {display}
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? "Sembunyikan" : "Lihat penuh"}
          </button>
          {open && (
            <p className="text-xs leading-relaxed text-foreground pt-1 border-t border-border/40">
              {display}
            </p>
          )}
        </>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">
          Belum ada ringkasan: buat sintesis dari level bawah atau tulis manual.
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="text-[11px] h-7"
          disabled={busy || node.childrenTotal === 0}
          onClick={() => onSynthesize(level, node.id)}
          title={
            node.childrenTotal === 0
              ? "Tidak ada materi anak untuk disintesis"
              : "Susun usulan ringkasan dari level bawah (tidak langsung menimpa)"
          }
        >
          {busy ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Wand2 className="w-3 h-3 mr-1" />
          )}
          {busy ? "Menyusun..." : "Sintesis"}
        </Button>
        {node.wordCount > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
            {node.wordCount.toLocaleString("id-ID")} kata
          </span>
        )}
      </div>
    </div>
  );
}

export default function SummaryStudioView({
  novelId,
  initial,
}: SummaryStudioViewProps) {
  const router = useRouter();
  const [hierarchy] = useState<SummaryHierarchy>(initial);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [edited, setEdited] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSynthesize = async (level: SummaryLevel, id: string) => {
    setBusyKey(`${level}:${id}`);
    setError(null);
    setNotice(null);
    try {
      const res = await synthesizeSummaryAction(novelId, { level, id });
      if (!res.success || !res.candidate) {
        setError(res.error || "Sintesis gagal. Naskah Anda aman.");
        return;
      }
      setPending({
        level: res.level || level,
        id: res.id || id,
        title: res.title || "",
        candidate: res.candidate,
        deterministic: res.deterministic || "",
        aiEnriched: res.aiEnriched || false,
      });
      setEdited(res.candidate);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sintesis gagal. Naskah Anda aman.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleApply = async () => {
    if (!pending) return;
    const text = edited.trim();
    if (!text) {
      setError("Ringkasan tidak boleh kosong.");
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const res = await applySummaryAction(novelId, {
        level: pending.level,
        id: pending.id,
        text,
      });
      if (!res.success) {
        setError(res.error || "Gagal menyimpan ringkasan.");
        return;
      }
      setPending(null);
      setNotice(`Ringkasan "${pending.title}" tersimpan.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan ringkasan.");
    } finally {
      setApplying(false);
    }
  };

  const cov = hierarchy.coverage;
  const allChapters: ChapterSummaryNode[] = [
    ...hierarchy.acts.flatMap((a: ActSummaryNode) => a.chapters),
    ...hierarchy.unassignedChapters,
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h1 className="font-serif text-lg font-medium">Ringkasan Hierarkis</h1>
          <Badge variant="outline" className="text-[10px] tabular-nums">
            {cov.scenes.withText}/{cov.scenes.total} adegan ·{" "}
            {cov.chapters.withText}/{cov.chapters.total} bab
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
        Lapisan konteks untuk novel panjang: ringkasan adegan mengalir ke bab,
        lalu babak, lalu novel. Sintesis hanya memberi{" "}
        <span className="text-foreground font-medium">usulan</span>: tidak ada
        yang tersimpan sebelum Anda meninjau dan menerapkan.
      </p>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {/* Novel layer */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-primary">{LEVEL_META.novel.icon}</span>
          <h2 className="font-medium text-sm">Novel</h2>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {LEVEL_META.novel.hint}
          </span>
        </div>
        <NodeBlock
          node={hierarchy.novel}
          level="novel"
          onSynthesize={handleSynthesize}
          busyKey={busyKey}
        />
      </section>

      {/* Act layers */}
      {hierarchy.acts.map((act: ActSummaryNode) => (
        <section key={act.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-primary">{LEVEL_META.act.icon}</span>
            <h2 className="font-medium text-sm truncate">{act.title}</h2>
            <Badge variant="outline" className="text-[10px] tabular-nums">
              {act.chapters.length} bab
            </Badge>
          </div>
          <NodeBlock
            node={act}
            level="act"
            onSynthesize={handleSynthesize}
            busyKey={busyKey}
          />
          <div className="grid gap-3 md:grid-cols-2 pl-0 sm:pl-4 border-l-0 sm:border-l border-border/40">
            {act.chapters.map((ch: ChapterSummaryNode) => (
              <div key={ch.id} className="space-y-2">
                <NodeBlock
                  node={ch}
                  level="chapter"
                  onSynthesize={handleSynthesize}
                  busyKey={busyKey}
                />
                {ch.scenes.length > 0 && (
                  <div className="grid gap-2 pl-0 sm:pl-3">
                    {ch.scenes.map((s) => (
                      <NodeBlock
                        key={s.id}
                        node={s}
                        level="scene"
                        onSynthesize={handleSynthesize}
                        busyKey={busyKey}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Unassigned chapters */}
      {hierarchy.unassignedChapters.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-primary">{LEVEL_META.chapter.icon}</span>
            <h2 className="font-medium text-sm">Bab tanpa babak</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {hierarchy.unassignedChapters.map((ch: ChapterSummaryNode) => (
              <div key={ch.id} className="space-y-2">
                <NodeBlock
                  node={ch}
                  level="chapter"
                  onSynthesize={handleSynthesize}
                  busyKey={busyKey}
                />
                {ch.scenes.length > 0 && (
                  <div className="grid gap-2 pl-0 sm:pl-3">
                    {ch.scenes.map((s) => (
                      <NodeBlock
                        key={s.id}
                        node={s}
                        level="scene"
                        onSynthesize={handleSynthesize}
                        busyKey={busyKey}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {allChapters.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
          Belum ada struktur: buat babak, bab, dan adegan terlebih dahulu di
          halaman Garis Besar & Naskah.
        </div>
      )}

      {/* Review dialog: candidate is a proposal until applied (SOUL.md #6) */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-paper overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div className="space-y-0.5">
                <h2 className="text-base font-serif font-medium">
                  Tinjau usulan ringkasan
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {LEVEL_META[pending.level].label} · {pending.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto">
              {pending.aiEnriched && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <BrainCircuit className="w-3 h-3 text-primary" /> Diperkaya AI: tetap periksa
                  sebelum menerapkan
                </div>
              )}
              <Textarea
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
                rows={6}
                className="text-sm"
                aria-label="Usulan ringkasan (dapat diedit)"
              />
              {pending.deterministic &&
                pending.deterministic !== pending.candidate && (
                  <details className="text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Lihat draf deterministik (tanpa AI)
                    </summary>
                    <p className="mt-1 leading-relaxed">
                      {pending.deterministic}
                    </p>
                  </details>
                )}
              <p className="text-[11px] text-muted-foreground">
                Menerapkan menyimpan ke kolom{" "}
                <span className="font-medium text-foreground">
                  {LEVEL_META[pending.level].column}
                </span>{" "}
                (naskah tidak disentuh).
              </p>
            </div>

            <div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPending(null)}
                disabled={applying}
                className="text-xs"
              >
                Abaikan
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={applying || !edited.trim()}
                className="text-xs"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Terapkan ringkasan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
