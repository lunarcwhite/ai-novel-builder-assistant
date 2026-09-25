"use client";

import React from "react";
import Link from "next/link";
import type { Scene, Chapter, Novel } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  FileText,
  RotateCw,
} from "lucide-react";

export type SaveStatus = "saved" | "saving" | "error" | "offline";

interface EditorHeaderProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
  sceneWordCount: number;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  onRetrySave: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenVersions: () => void;
  versionsCount: number;
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
}

export default function EditorHeader({
  novel,
  chapter,
  scene,
  sceneWordCount,
  saveStatus,
  lastSavedAt,
  onRetrySave,
  isFocusMode,
  onToggleFocusMode,
  onOpenVersions,
  versionsCount,
  showLeftPanel,
  onToggleLeftPanel,
  showRightPanel,
  onToggleRightPanel,
}: EditorHeaderProps) {
  const readingTime = Math.max(1, Math.ceil(sceneWordCount / 220));

  return (
    <header className="h-14 shrink-0 border-b border-border/80 bg-background/90 backdrop-blur-md px-4 flex items-center justify-between gap-4 select-none z-30 transition-all">
      {/* Left: Navigation and Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={`/workspace/${novel.id}`}
          className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Kembali ke Struktur Novel"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Panel Toggles */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLeftPanel}
          aria-pressed={showLeftPanel}
          className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground ${
            !showLeftPanel ? "opacity-50" : ""
          }`}
          title={showLeftPanel ? "Sembunyikan Navigasi" : "Tampilkan Navigasi"}
        >
          <PanelLeft className="w-4 h-4" />
          <span className="sr-only">{showLeftPanel ? "Sembunyikan Navigasi" : "Tampilkan Navigasi"}</span>
        </Button>

        {/* Breadcrumb Info */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <span className="truncate max-w-[120px]">{novel.title}</span>
          <span>/</span>
          <span className="truncate max-w-[120px]">{chapter.title}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[160px] font-serif">
            {scene.title}
          </span>
        </div>
      </div>

      {/* Center: Live Autosave Status */}
      <div className="flex items-center gap-2 text-xs">
        {saveStatus === "saving" && (
          <div className="flex items-center gap-1.5 text-muted-foreground animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="hidden sm:inline">Menyimpan draf...</span>
          </div>
        )}

        {saveStatus === "saved" && (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Tersimpan {lastSavedAt ? `• ${lastSavedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </span>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Gagal menyimpan</span>
            <button
              onClick={onRetrySave}
              className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-300 ml-1 inline-flex items-center gap-1"
              title="Coba Simpan ke Server Sekarang"
            >
              <RotateCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        )}

        {saveStatus === "offline" && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Anda offline; draf lokal aman</span>
            <button
              onClick={onRetrySave}
              className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-300 ml-1 inline-flex items-center gap-1"
              title="Coba Simpan ke Server Sekarang"
            >
              <RotateCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        )}
      </div>

      {/* Right: Word Count, Version History, Focus Mode, AI toggle */}
      <div className="flex items-center gap-2">
        {/* Word count pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-foreground">
            {formatNumber(sceneWordCount)}
          </span>
          <span>kata</span>
          <span className="opacity-60">•</span>
          <span>±{readingTime} mnt</span>
        </div>

        {/* Version History Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenVersions}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 border-border/80"
          title="Riwayat Versi & Snapshot"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Versi</span>
          {versionsCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1 py-0 ml-0.5">
              {versionsCount}
            </Badge>
          )}
        </Button>

        {/* Focus Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFocusMode}
          aria-pressed={isFocusMode}
          className={`h-8 px-2.5 text-xs gap-1.5 border-border/80 ${
            isFocusMode
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Mode Fokus Menulis (F11 / Esc)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Fokus</span>
        </Button>

        {/* Right AI Panel Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRightPanel}
          aria-pressed={showRightPanel}
          className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground ${
            !showRightPanel ? "opacity-50" : ""
          }`}
          title={showRightPanel ? "Sembunyikan Panel AI" : "Tampilkan Panel AI"}
        >
          <PanelRight className="w-4 h-4" />
          <span className="sr-only">{showRightPanel ? "Sembunyikan Panel AI" : "Tampilkan Panel AI"}</span>
        </Button>
      </div>
    </header>
  );
}
