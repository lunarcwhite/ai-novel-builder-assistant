"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { Chapter, ConsistencyFinding, ConsistencyScope, Novel, Scene } from "@/types";
import {
  deleteConsistencyFindingAction,
  listConsistencyFindingsAction,
  reviewConsistencyFindingAction,
  runConsistencyCheckAction,
} from "@/server/actions/consistency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Eye, Loader2, ShieldCheck, Trash2, X } from "lucide-react";

interface ConsistencyPanelProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
}

const TYPE_LABEL: Record<ConsistencyFinding["type"], string> = {
  character_contradiction: "Karakter",
  timeline_inconsistency: "Timeline",
  lore_conflict: "Aturan dunia",
  plot_hole: "Plot",
};

const SEVERITY_LABEL: Record<ConsistencyFinding["severity"], string> = {
  potential: "Potensi",
  notable: "Perhatian",
  high_attention: "Perlu perhatian",
};

const STATUS_LABEL: Record<ConsistencyFinding["status"], string> = {
  open: "Terbuka",
  reviewed: "Ditinjau",
  dismissed: "Diabaikan",
  resolved: "Selesai",
};

export default function ConsistencyPanel({ novel, chapter, scene }: ConsistencyPanelProps) {
  const [scope, setScope] = useState<ConsistencyScope>("scene");
  const [findings, setFindings] = useState<ConsistencyFinding[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<{ created: number; checked: number } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await listConsistencyFindingsAction(novel.id, { status: "open" });
      if (res.success && res.findings) setFindings(res.findings);
    } catch {
      // Best-effort; panel tetap bisa menjalankan check baru.
    }
  }, [novel.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRun = async () => {
    setStatus("loading");
    setError(null);
    setNotice(null);
    try {
      const res = await runConsistencyCheckAction(novel.id, {
        scope,
        sceneId: scope === "scene" ? scene.id : null,
        chapterId: scope === "scene" ? null : chapter.id,
      });
      if (!res.success) {
        setError(res.error || "Pemeriksaan gagal. Naskah Anda aman.");
        setStatus("error");
        return;
      }
      setFindings(res.findings || []);
      setLastRun({ created: res.created || 0, checked: res.checkedScenes || 0 });
      setStatus("done");
      if ((res.created || 0) === 0) {
        setNotice("Tidak ada potensi masalah baru. Temuan yang sudah terbuka tidak diduplikasi.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Pemeriksaan gagal. Naskah Anda aman.");
      setStatus("error");
    }
  };

  const handleStatus = async (id: string, next: "reviewed" | "dismissed" | "resolved") => {
    setBusyId(id);
    setError(null);
    try {
      const res = await reviewConsistencyFindingAction(novel.id, id, { status: next });
      if (!res.success) {
        setError(res.error || "Gagal memperbarui temuan.");
        return;
      }
      setFindings((prev) => prev.filter((f) => f.id !== id));
      setNotice(
        next === "resolved"
          ? "Temuan ditandai selesai. Naskah tidak diubah otomatis."
          : next === "dismissed"
            ? "Temuan diabaikan. Anda dapat menjalankannya ulang kapan saja."
            : "Temuan ditandai sudah ditinjau."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui temuan.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await deleteConsistencyFindingAction(novel.id, id);
      if (res.success) setFindings((prev) => prev.filter((f) => f.id !== id));
      else setError(res.error || "Gagal menghapus temuan.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Cek Konsistensi
        </span>
        <Badge variant="outline" className="text-[9px] py-0 px-1">
          {findings.length} terbuka
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
        {(["scene", "chapter"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            disabled={status === "loading"}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
              scope === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            {s === "scene" ? "Adegan ini" : "Bab ini"}
          </button>
        ))}
        <Button
          onClick={handleRun}
          disabled={status === "loading"}
          size="sm"
          className="h-7 text-[11px] px-2.5 ml-auto gap-1"
        >
          {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
          {status === "loading" ? "Memeriksa…" : "Jalankan"}
        </Button>
      </div>

      {error && <p className="text-[11px] text-destructive leading-relaxed">{error}</p>}
      {notice && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 leading-relaxed">{notice}</p>}
      {lastRun && status === "done" && !notice && (
        <p className="text-[10px] text-muted-foreground">
          {lastRun.created} temuan baru dari {lastRun.checked} adegan diperiksa.
        </p>
      )}

      <div className="space-y-2">
        {findings.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic leading-relaxed">
            Belum ada potensi masalah terbuka. Jalankan pemeriksaan pada adegan atau bab ini. Temuan bersifat
            observasi tentatif, bukan vonis.
          </p>
        ) : (
          findings.slice(0, 8).map((f) => (
            <div key={f.id} className="p-2.5 rounded-md bg-muted/40 border border-border/60 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[9px] py-0 px-1">
                  {TYPE_LABEL[f.type]}
                </Badge>
                <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {SEVERITY_LABEL[f.severity]} • {STATUS_LABEL[f.status]}
                </span>
              </div>
              <p className="text-foreground leading-relaxed">{f.description}</p>
              {f.source_ids.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-border/40">
                  {f.source_ids.slice(0, 2).map((s, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">
                        Sumber {i === 0 ? "A" : "B"}
                      </span>{" "}
                      {s.label ? `(${s.label}) ` : ""}“{s.excerpt || "-"}”
                    </p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 pt-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === f.id}
                  onClick={() => handleStatus(f.id, "reviewed")}
                  className="h-6 px-2 text-[10px] gap-1"
                  title="Tandai sudah ditinjau"
                >
                  <Eye className="w-3 h-3" /> Tinjau
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === f.id}
                  onClick={() => handleStatus(f.id, "dismissed")}
                  className="h-6 px-2 text-[10px] gap-1"
                  title="Abaikan temuan ini"
                >
                  <X className="w-3 h-3" /> Abaikan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === f.id}
                  onClick={() => handleStatus(f.id, "resolved")}
                  className="h-6 px-2 text-[10px] gap-1 text-emerald-600"
                  title="Tandai selesai"
                >
                  <Check className="w-3 h-3" /> Selesai
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === f.id}
                  onClick={() => handleDelete(f.id)}
                  className="h-6 w-6 p-0 ml-auto text-muted-foreground hover:text-destructive"
                  title="Hapus temuan"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
