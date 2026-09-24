"use client";

import React, { useState } from "react";
import type { StoryDoctorObservation, StoryDoctorReport, StoryDoctorSection } from "@/types";
import { runStoryDoctorAction } from "@/server/actions/doctor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Gauge,
  GitBranch,
  Globe,
  HelpCircle,
} from "lucide-react";

const SECTION_META: Record<StoryDoctorSection, { label: string; icon: React.ReactNode; hint: string }> = {
  plot: {
    label: "Plot",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    hint: "Progresi, eskalasi, klimaks, resolusi",
  },
  character_arcs: {
    label: "Busur Karakter",
    icon: <Users className="w-3.5 h-3.5" />,
    hint: "Motivasi, perkembangan, kehadiran",
  },
  pacing: {
    label: "Pacing",
    icon: <Gauge className="w-3.5 h-3.5" />,
    hint: "Kepadatan bab yang lambat / terburu-buru",
  },
  plot_threads: {
    label: "Plot Threads",
    icon: <GitBranch className="w-3.5 h-3.5" />,
    hint: "Aktif, selesai, berpotensi terbengkalai",
  },
  worldbuilding: {
    label: "Worldbuilding",
    icon: <Globe className="w-3.5 h-3.5" />,
    hint: "Aturan, konsep yang belum dijelaskan",
  },
  unresolved_questions: {
    label: "Pertanyaan Terbuka",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    hint: "Usulan, temuan terbuka, kronologi menggantung",
  },
};

const ORDER: StoryDoctorSection[] = [
  "plot",
  "character_arcs",
  "pacing",
  "plot_threads",
  "worldbuilding",
  "unresolved_questions",
];

function ObservationCard({ obs }: { obs: StoryDoctorObservation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2">
      <p className="text-xs leading-relaxed text-foreground">{obs.observation}</p>
      <div className="flex flex-wrap gap-1">
        {obs.evidence.slice(0, 6).map((e, i) => (
          <Badge key={i} variant="outline" className="text-[10px] font-normal">
            {e.label || e.type}
          </Badge>
        ))}
        {obs.evidence.length > 6 && (
          <Badge variant="outline" className="text-[10px] font-normal">
            +{obs.evidence.length - 6} bukti lain
          </Badge>
        )}
      </div>
      {(obs.interpretation || obs.suggestion) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {open ? "Sembunyikan tafsir & saran" : "Lihat tafsir & saran"}
        </button>
      )}
      {open && (
        <div className="space-y-1.5 pt-1 border-t border-border/40 text-[11px] leading-relaxed">
          {obs.interpretation && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Tafsir: </span>
              {obs.interpretation}
            </p>
          )}
          {obs.suggestion && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Saran: </span>
              {obs.suggestion}
            </p>
          )}
        </div>
      )}
      {obs.ai_enriched && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Sparkles className="w-3 h-3" /> Diperkaya AI
        </div>
      )}
    </div>
  );
}

export default function StoryDoctorView({ novelId }: { novelId: string }) {
  const [report, setReport] = useState<StoryDoctorReport | null>(null);
  const [withAI, setWithAI] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await runStoryDoctorAction(novelId, { withAI });
      if (!res.success || !res.report) {
        setError(res.error || "Diagnosis gagal. Naskah Anda aman.");
        setStatus("error");
        return;
      }
      setReport(res.report);
      setStatus("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Diagnosis gagal. Naskah Anda aman.");
      setStatus("error");
    }
  };

  const total = report ? ORDER.reduce((n, s) => n + (report.counts[s] || 0), 0) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          <h1 className="font-serif text-lg font-medium">Story Doctor</h1>
          {report && (
            <Badge variant="outline" className="text-[10px]">
              {total} observasi
              {report.ai_enriched ? " · diperkaya AI" : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={withAI}
              onChange={(e) => setWithAI(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Perkaya dengan AI
          </label>
          <Button size="sm" onClick={handleRun} disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menganalisis...
              </>
            ) : (
              "Jalankan Diagnosis"
            )}
          </Button>
        </div>
      </div>

      {status === "loading" && (
        <div className="rounded-lg border border-border/60 p-4 text-xs text-muted-foreground space-y-1">
          <p>Menganalisis cerita Anda...</p>
          <p className="opacity-70">Memeriksa plot, karakter, pacing, threads, dunia, dan pertanyaan terbuka.</p>
        </div>
      )}

      {status === "error" && error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
          {error}
        </div>
      )}

      {status === "idle" && !report && (
        <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground space-y-2">
          <p>
            Story Doctor membaca struktur, karakter, plot threads, timeline, memori, dan temuan
            konsistensi Anda — lalu memberi observasi ber-evidence, bukan skor.
          </p>
          <p className="opacity-70">
            Read-only: tidak ada naskah yang diubah. Keputusan selalu di tangan Anda.
          </p>
        </div>
      )}

      {report && status === "done" && (
        <>
          {total === 0 ? (
            <div className="rounded-lg border border-border/60 p-8 text-center text-xs text-muted-foreground">
              Tidak ada observasi saat ini — struktur cerita terlihat tertata. Analisis ulang kapan
              saja setelah naskah bertambah.
            </div>
          ) : (
            <div className="space-y-6">
              {ORDER.map((s) => {
                const items = report.sections[s] || [];
                if (items.length === 0) return null;
                const meta = SECTION_META[s];
                return (
                  <section key={s} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">{meta.icon}</span>
                      <h2 className="font-medium text-sm">{meta.label}</h2>
                      <Badge variant="outline" className="text-[10px] tabular-nums">
                        {items.length}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        {meta.hint}
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {items.map((o, i) => (
                        <ObservationCard key={`${s}-${i}`} obs={o} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
