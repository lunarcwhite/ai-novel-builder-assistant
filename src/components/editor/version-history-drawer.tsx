"use client";

import React, { useState, useTransition } from "react";
import type { SceneVersion } from "@/types";
import {
  createSceneVersionAction,
  restoreSceneVersionAction,
} from "@/server/actions/editor";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  History,
  Clock,
  RotateCcw,
  Plus,
  X,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
  sceneId: string;
  versions: SceneVersion[];
  onVersionsUpdated: (newVersions: SceneVersion[]) => void;
  onVersionRestored: (restoredContent: string) => void;
}

export default function VersionHistoryDrawer({
  isOpen,
  onClose,
  novelId,
  sceneId,
  versions,
  onVersionsUpdated,
  onVersionRestored,
}: VersionHistoryDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await createSceneVersionAction(
          novelId,
          sceneId,
          newTitle.trim() || undefined,
          newNotes.trim() || undefined
        );

        if (res.success && res.version) {
          onVersionsUpdated([res.version, ...versions]);
          setNewTitle("");
          setNewNotes("");
          toast({ title: `Versi #${res.version.version_number} berhasil disimpan.` });
        } else {
          setError(res.error || "Gagal membuat versi.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  };

  const handleRestore = (versionId: string) => {
    setError(null);

    startTransition(async () => {
      try {
        const res = await restoreSceneVersionAction(novelId, sceneId, versionId);

        if (res.success && res.restoredContent !== undefined && res.version) {
          onVersionRestored(res.restoredContent || "");
          onVersionsUpdated([res.version, ...versions]);
          setConfirmRestoreId(null);
          toast({ title: `Naskah dipulihkan dari Versi #${res.version.version_number}.` });
        } else {
          setError(res.error || "Gagal memulihkan versi.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memulihkan versi.");
      }
    });
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case "restore":
        return <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">Pemulihan</Badge>;
      case "checkpoint":
        return <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Auto-Checkpoint</Badge>;
      case "ai_replace":
      case "ai_insert":
        return <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">AI Edit</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">Manual</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-serif font-medium text-sm text-foreground">
                Riwayat & Snapshot Versi
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {versions.length} versi tersimpan untuk adegan ini
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Feedback alerts (errors stay inline; success goes to toast) */}
        {error && (
          <div className="m-4 mb-0 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form to Create Explicit Snapshot */}
        <div className="p-4 border-b border-border/80 bg-card">
          <form onSubmit={handleCreateSnapshot} className="space-y-2.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary" />
              Simpan Snapshot Versi Baru
            </span>

            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Label versi (misal: Selesai Draf Babak 1)..."
              className="text-xs h-8"
              disabled={isPending}
            />

            <Input
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Catatan perubahan (opsional)..."
              className="text-xs h-8"
              disabled={isPending}
            />

            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="w-full text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {isPending ? "Menyimpan Snapshot..." : "Simpan Snapshot Versi"}
            </Button>
          </form>

          {/* Manuscript Safety Guarantee */}
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/80 bg-muted/40 p-2 rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Setiap pemulihan versi otomatis mencadangkan naskah saat ini.</span>
          </div>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {versions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-serif italic">
              Belum ada riwayat versi untuk adegan ini.
            </div>
          ) : (
            versions.map((ver) => {
              const isPreviewing = previewVersionId === ver.id;
              const isConfirming = confirmRestoreId === ver.id;

              return (
                <div
                  key={ver.id}
                  className="rounded-lg border border-border/80 bg-card p-3 space-y-2.5 shadow-2xs hover:border-border transition-colors"
                >
                  {/* Version header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {ver.title || `Versi #${ver.version_number}`}
                        </span>
                        {getChangeTypeBadge(ver.change_type)}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ver.created_at).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {formatNumber(ver.word_count)} kata
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50 shrink-0">
                      #{ver.version_number}
                    </span>
                  </div>

                  {/* Notes if available */}
                  {ver.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded border border-border/40">
                      &ldquo;{ver.notes}&rdquo;
                    </p>
                  )}

                  {/* Preview Content Accordion */}
                  {isPreviewing && (
                    <div className="mt-2 p-2.5 rounded bg-muted/30 border border-border/60 text-xs font-serif text-foreground/90 max-h-48 overflow-y-auto leading-relaxed select-text">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: ver.content.startsWith("<")
                            ? ver.content
                            : `<p>${ver.content.replace(/\n/g, "<br/>")}</p>`,
                        }}
                      />
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => setPreviewVersionId(isPreviewing ? null : ver.id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                    >
                      {isPreviewing ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Tutup Pratinjau
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" /> Pratinjau Teks
                        </>
                      )}
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRestore(ver.id)}
                          disabled={isPending}
                          className="h-6 px-2 text-[10px]"
                        >
                          {isPending ? "Memulihkan..." : "Ya, Pulihkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmRestoreId(null)}
                          className="h-6 px-2 text-[10px]"
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestoreId(ver.id)}
                        className="h-6 px-2 text-[11px] text-primary hover:text-primary gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Pulihkan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
