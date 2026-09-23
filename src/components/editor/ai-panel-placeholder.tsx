"use client";

import React from "react";
import type { Scene, Chapter, Novel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import {
  Sparkles,
  PanelRightClose,
  Compass,
  Wand2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIPanelPlaceholderProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
  currentWordCount: number;
  onCollapse?: () => void;
}

export default function AIPanelPlaceholder({
  novel,
  chapter,
  scene,
  currentWordCount,
  onCollapse,
}: AIPanelPlaceholderProps) {
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
            Phase 7
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

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
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

        {/* AI Assistant Teaser (Phase 7 Blueprint) */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Wand2 className="w-4 h-4" />
              <span>AI Writing Companion</span>
            </div>
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            AI Assistant akan diaktifkan di <strong>Phase 7</strong> setelah Story Memory dan Character Bible siap, sehingga setiap saran memahami konteks naskah secara utuh.
          </p>

          {/* Action teasers (disabled) */}
          <div className="space-y-1.5 pt-2">
            <div className="p-2 rounded bg-background/60 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between opacity-75">
              <span>Lanjutkan Adegan</span>
              <Badge variant="outline" className="text-[9px]">Soon</Badge>
            </div>

            <div className="p-2 rounded bg-background/60 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between opacity-75">
              <span>Tingkatkan Dialog & Ketegangan</span>
              <Badge variant="outline" className="text-[9px]">Soon</Badge>
            </div>

            <div className="p-2 rounded bg-background/60 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between opacity-75">
              <span>Audit Konsistensi Karakter</span>
              <Badge variant="outline" className="text-[9px]">Phase 8</Badge>
            </div>
          </div>
        </div>

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
