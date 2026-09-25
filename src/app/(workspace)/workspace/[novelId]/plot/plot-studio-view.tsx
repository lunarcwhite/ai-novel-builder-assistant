"use client";

import React, { useState } from "react";
import type {
  Location,
  PlotThread,
  PlotThreadStatus,
  TimelineEvent,
  TimelinePrecision,
} from "@/types";
import { PlotThreadFormDialog, DeletePlotThreadDialog } from "./plot-dialogs";
import { TimelineEventFormDialog, DeleteTimelineEventDialog } from "./timeline-dialogs";
import { updatePlotThreadStatusAction } from "@/server/actions/plot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Plus,
  Clock,
  Star,
  Check,
  Eye,
  X,
  Archive,
  Edit2,
  Trash2,
  Play,
  Flag,
  MapPin,
  BookOpen,
} from "lucide-react";

interface ChapterOption {
  id: string;
  title: string;
}

interface PlotStudioViewProps {
  novelId: string;
  initialThreads: PlotThread[];
  statusCounts: Record<PlotThreadStatus, number>;
  initialEvents: TimelineEvent[];
  chapters: ChapterOption[];
  locations: Location[];
}

const THREAD_STATUS: { value: PlotThreadStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "planned", label: "Direncanakan" },
  { value: "active", label: "Aktif" },
  { value: "resolved", label: "Selesai" },
  { value: "abandoned", label: "Ditinggalkan" },
];

const PRECISION_LABEL: Record<TimelinePrecision, string> = {
  exact: "Tepat",
  day: "Hari",
  month: "Bulan",
  year: "Tahun",
  relative: "Relatif",
  unknown: "Belum pasti",
};

function statusBadgeClass(s: PlotThreadStatus): string {
  switch (s) {
    case "planned":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
    case "active":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    case "resolved":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20";
    case "abandoned":
      return "bg-muted text-muted-foreground border-border/60";
  }
}

function statusIcon(s: PlotThreadStatus) {
  switch (s) {
    case "planned":
      return <Clock className="w-3 h-3" />;
    case "active":
      return <Play className="w-3 h-3" />;
    case "resolved":
      return <Check className="w-3 h-3" />;
    case "abandoned":
      return <Archive className="w-3 h-3" />;
  }
}

export default function PlotStudioView({
  novelId,
  initialThreads,
  statusCounts,
  initialEvents,
  chapters,
  locations,
}: PlotStudioViewProps) {
  const [view, setView] = useState<"threads" | "timeline">("threads");
  const [activeStatus, setActiveStatus] = useState<PlotThreadStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isThreadFormOpen, setIsThreadFormOpen] = useState(false);
  const [editingThread, setEditingThread] = useState<PlotThread | null>(null);
  const [deletingThread, setDeletingThread] = useState<PlotThread | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<TimelineEvent | null>(null);
  const [busyThreadId, setBusyThreadId] = useState<string | null>(null);

  const chapterTitle = (id?: string | null) =>
    chapters.find((c) => c.id === id)?.title || null;
  const locationName = (id?: string | null) =>
    locations.find((l) => l.id === id)?.name || null;

  const filteredThreads = initialThreads.filter((t) => {
    if (activeStatus !== "all" && t.status !== activeStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAddThread = () => {
    setEditingThread(null);
    setIsThreadFormOpen(true);
  };
  const openEditThread = (t: PlotThread) => {
    setEditingThread(t);
    setIsThreadFormOpen(true);
  };
  const openAddEvent = () => {
    setEditingEvent(null);
    setIsEventFormOpen(true);
  };
  const openEditEvent = (e: TimelineEvent) => {
    setEditingEvent(e);
    setIsEventFormOpen(true);
  };

  const handleQuickStatus = async (thread: PlotThread, next: PlotThreadStatus) => {
    setBusyThreadId(thread.id);
    try {
      const formData = new FormData();
      formData.set("novel_id", novelId);
      formData.set("id", thread.id);
      formData.set("status", next);
      await updatePlotThreadStatusAction(formData);
    } finally {
      setBusyThreadId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + view switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <h1 className="font-serif text-lg font-medium">Plot & Timeline</h1>
          <Badge variant="outline" className="text-[10px]">
            {initialThreads.length} thread · {initialEvents.length} peristiwa
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {(["threads", "timeline"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                view === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground"
              }`}
            >
              {v === "threads" ? "Plot Threads" : "Timeline"}
            </button>
          ))}
        </div>
      </div>

      {view === "threads" ? (
        <>
          {/* Status summary — calm counts, never a score (SOUL.md #31) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {THREAD_STATUS.map((s) => {
              const count =
                s.value === "all"
                  ? initialThreads.length
                  : statusCounts[s.value] || 0;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setActiveStatus(s.value)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                    activeStatus === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
                >
                  {s.label}
                  <span className="tabular-nums opacity-80">{count}</span>
                </button>
              );
            })}
            <div className="flex-1" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari thread..."
              className="h-8 w-44 text-xs"
            />
            <Button size="sm" onClick={openAddThread}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Thread Baru
            </Button>
          </div>

          {filteredThreads.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
              {initialThreads.length === 0
                ? "Belum ada plot thread. Catat misteri, konflik, atau janji cerita yang ingin Anda bayar lunas nanti."
                : "Tidak ada thread yang cocok dengan filter."}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredThreads.map((t) => (
                <div key={t.id} className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{t.title}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(t.status)}`}>
                          <span className="inline-flex items-center gap-1">
                            {statusIcon(t.status)}
                            {THREAD_STATUS.find((s) => s.value === t.status)?.label}
                          </span>
                        </Badge>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {t.importance}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditThread(t)} title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeletingThread(t)} title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3">{t.description}</p>
                  )}
                  {(t.introduced_chapter_id || t.resolved_chapter_id) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {t.introduced_chapter_id && (
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Mulai: {chapterTitle(t.introduced_chapter_id) || "-"}
                        </span>
                      )}
                      {t.resolved_chapter_id && (
                        <span className="inline-flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          Selesai: {chapterTitle(t.resolved_chapter_id) || "-"}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Author-decided transitions (SOUL.md #13): quick actions, never auto */}
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
                    {t.status === "planned" && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" disabled={busyThreadId === t.id} onClick={() => handleQuickStatus(t, "active")}>
                        <Play className="w-3 h-3 mr-1" /> Aktifkan
                      </Button>
                    )}
                    {t.status === "active" && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" disabled={busyThreadId === t.id} onClick={() => handleQuickStatus(t, "resolved")}>
                        <Check className="w-3 h-3 mr-1" /> Tandai selesai
                      </Button>
                    )}
                    {t.status === "resolved" && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" disabled={busyThreadId === t.id} onClick={() => handleQuickStatus(t, "active")}>
                        <Eye className="w-3 h-3 mr-1" /> Buka kembali
                      </Button>
                    )}
                    {(t.status === "planned" || t.status === "active") && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground" disabled={busyThreadId === t.id} onClick={() => handleQuickStatus(t, "abandoned")}>
                        <X className="w-3 h-3 mr-1" /> Tinggalkan
                      </Button>
                    )}
                    {t.status === "abandoned" && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" disabled={busyThreadId === t.id} onClick={() => handleQuickStatus(t, "planned")}>
                        <Clock className="w-3 h-3 mr-1" /> Rencanakan ulang
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Urutan kronologi cerita: status belum pasti adalah hal yang wajar.
            </p>
            <Button size="sm" onClick={openAddEvent}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Peristiwa Baru
            </Button>
          </div>

          {initialEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
              Belum ada peristiwa timeline. Catat kejadian penting agar urutan cerita tetap terlacak.
            </div>
          ) : (
            <ol className="relative ml-2 border-l border-border/60 space-y-3 pl-5">
              {initialEvents.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-primary/70 ring-4 ring-background" />
                  <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{e.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {PRECISION_LABEL[e.date_precision]}
                          </Badge>
                          {e.date_value && <span className="tabular-nums">{e.date_value}</span>}
                          {e.relative_time && <span>· {e.relative_time}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditEvent(e)} title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeletingEvent(e)} title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{e.description}</p>
                    )}
                    {(e.chapter_id || e.location_id) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {e.chapter_id && (
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {chapterTitle(e.chapter_id) || "-"}
                          </span>
                        )}
                        {e.location_id && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {locationName(e.location_id) || "-"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      <PlotThreadFormDialog
        novelId={novelId}
        thread={editingThread}
        isOpen={isThreadFormOpen}
        onClose={() => {
          setIsThreadFormOpen(false);
          setEditingThread(null);
        }}
        chapters={chapters}
      />
      <DeletePlotThreadDialog
        novelId={novelId}
        thread={deletingThread}
        isOpen={Boolean(deletingThread)}
        onClose={() => setDeletingThread(null)}
      />
      <TimelineEventFormDialog
        novelId={novelId}
        event={editingEvent}
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEditingEvent(null);
        }}
        chapters={chapters}
        locations={locations}
      />
      <DeleteTimelineEventDialog
        novelId={novelId}
        event={deletingEvent}
        isOpen={Boolean(deletingEvent)}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );
}