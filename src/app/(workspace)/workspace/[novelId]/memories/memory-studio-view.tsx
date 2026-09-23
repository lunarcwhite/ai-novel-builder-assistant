"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  StoryMemory,
  MemoryStats,
  MemoryType,
  MemoryStatus,
  Character,
  Location,
  NovelStructureTree,
  MemorySearchResult,
} from "@/types";
import {
  updateMemoryStatusAction,
  searchMemoriesAction,
} from "@/server/actions/memories";
import { MemoryFormDialog, DeleteMemoryDialog } from "./memory-dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Archive,
  XCircle,
  Star,
  Users,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  X,
  Edit2,
  Trash2,
} from "lucide-react";

interface MemoryStudioViewProps {
  novelId: string;
  initialMemories: StoryMemory[];
  stats: MemoryStats;
  characters: Character[];
  locations: Location[];
  structure: NovelStructureTree;
}

export default function MemoryStudioView({
  novelId,
  initialMemories,
  stats,
  characters,
  locations,
  structure,
}: MemoryStudioViewProps) {
  // Navigation & Filter states
  const [activeStatus, setActiveStatus] = useState<MemoryStatus | "all">("all");
  const [activeType, setActiveType] = useState<MemoryType | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Semantic Retrieval Sandbox state
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [sandboxQuery, setSandboxQuery] = useState<string>("");
  const [sandboxResults, setSandboxResults] = useState<MemorySearchResult[] | null>(null);
  const [isSearchingSemantic, startSemanticSearch] = useTransition();

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingMemory, setEditingMemory] = useState<StoryMemory | null>(null);
  const [deletingMemory, setDeletingMemory] = useState<StoryMemory | null>(null);

  // Flatten scenes for source picker and scene link badges
  const flatScenes = [
    ...structure.acts.flatMap((a) =>
      a.chapters.flatMap((c) =>
        c.scenes.map((s) => ({
          id: s.id,
          title: s.title,
          chapterTitle: c.title,
        }))
      )
    ),
    ...structure.unassignedChapters.flatMap((c) =>
      c.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        chapterTitle: c.title,
      }))
    ),
  ];

  // Client filtering
  const filteredMemories = initialMemories.filter((m) => {
    if (activeStatus !== "all" && m.status !== activeStatus) return false;
    if (activeType !== "all" && m.type !== activeType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const contentMatch = m.content.toLowerCase().includes(q);
      const tagMatch = m.metadata.tags?.some((t) => t.toLowerCase().includes(q));
      return contentMatch || tagMatch;
    }
    return true;
  });

  // Semantic search runner
  const handleRunSemanticSearch = () => {
    if (!sandboxQuery.trim()) {
      setSandboxResults(null);
      return;
    }

    startSemanticSearch(async () => {
      try {
        const results = await searchMemoriesAction(novelId, sandboxQuery, {
          threshold: 0.45,
          limit: 8,
        });
        setSandboxResults(results);
      } catch {
        setSandboxResults([]);
      }
    });
  };

  const handleClearSemantic = () => {
    setSandboxQuery("");
    setSandboxResults(null);
  };

  const handleUpdateStatus = async (formData: FormData) => {
    await updateMemoryStatusAction(formData);
  };

  const getTypeName = (t: MemoryType) => {
    switch (t) {
      case "character_fact":
        return "Fakta Karakter";
      case "relationship_fact":
        return "Hubungan";
      case "world_fact":
        return "Dunia & Aturan";
      case "timeline_fact":
        return "Kronologi";
      case "plot_fact":
        return "Plot & Intrik";
      case "story_fact":
        return "Fakta Cerita";
    }
  };

  const getTypeBadgeClass = (t: MemoryType) => {
    switch (t) {
      case "character_fact":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
      case "relationship_fact":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20";
      case "world_fact":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "timeline_fact":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20";
      case "plot_fact":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "story_fact":
        return "bg-muted text-muted-foreground border-border/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <span>Story Memory Studio</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
            Basis pengetahuan kanon dan retrieval semantik cerita. Fakta yang terkonfirmasi menjadi sumber kebenaran (ground truth) bagi konsistensi naskah dan AI Writing Companion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditingMemory(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Memori Cerita</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            Total Fakta
          </span>
          <div className="text-2xl font-serif font-bold text-foreground mt-1">
            {stats.total}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Tersimpan dalam basis data</span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Terkonfirmasi (Kanon)
          </span>
          <div className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.confirmed}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Otoritas mutlak penulis</span>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Usulan (Proposed)
          </span>
          <div className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.proposed}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Kandidat dari naskah & ekstraksi</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
            <Archive className="w-3 h-3" />
            Arsip & Ditolak
          </span>
          <div className="text-2xl font-serif font-bold text-foreground mt-1">
            {stats.archived + stats.rejected}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Kondisi lampau / bukan kanon</span>
        </div>
      </div>

      {/* Semantic Retrieval Sandbox Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-xs text-foreground">
              Uji Retrieval Semantik (Vector Search Sandbox)
            </span>
            <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
              Embedding 1536-dim
            </Badge>
          </div>

          <button
            onClick={() => setIsSandboxOpen((prev) => !prev)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span>{isSandboxOpen ? "Tutup Sandbox" : "Buka Sandbox Pencarian"}</span>
            {isSandboxOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Uji bagaimana sistem menemukan fakta relevan berdasarkan makna kata (semantic similarity), bukan hanya sekadar kecocokan kata persis.
        </p>

        {isSandboxOpen && (
          <div className="pt-2 space-y-3 border-t border-primary/10">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={sandboxQuery}
                  onChange={(e) => setSandboxQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunSemanticSearch()}
                  placeholder="Ketik pertanyaan atau konteks (misal: 'trauma fisik Kaelen', 'cara buka segel perunggu')..."
                  className="pl-8 text-xs h-9 bg-background/90"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={handleRunSemanticSearch}
                  disabled={isSearchingSemantic || !sandboxQuery.trim()}
                  className="h-9 text-xs"
                >
                  {isSearchingSemantic ? "Mencari Vektor..." : "Cari Semantik"}
                </Button>
                {sandboxResults && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSemantic}
                    className="h-9 text-xs"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Sandbox Results Display */}
            {sandboxResults && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Hasil Pencarian Semantik ({sandboxResults.length} fakta ditemukan):</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Diurutkan berdasarkan Cosine Similarity
                  </span>
                </span>

                {sandboxResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground bg-background/50 rounded-lg">
                    Tidak ditemukan memori yang memiliki kemiripan semantik di atas ambang batas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sandboxResults.map(({ memory, similarity }) => (
                      <div
                        key={memory.id}
                        className="p-3 rounded-lg border border-border/80 bg-background/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] py-0 px-1.5 border ${getTypeBadgeClass(memory.type)}`}
                            >
                              {getTypeName(memory.type)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Kepentingan Lvl {memory.importance}
                            </span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] capitalize text-muted-foreground">
                              {memory.status}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed italic">
                            &quot;{memory.content}&quot;
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <div className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary font-semibold text-xs">
                            {(similarity * 100).toFixed(0)}% Match
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Navigation Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: "all", label: "Semua Memori", count: stats.total },
              { id: "confirmed", label: "Terkonfirmasi (Kanon)", count: stats.confirmed },
              { id: "proposed", label: "Usulan Naskah / AI", count: stats.proposed },
              { id: "archived", label: "Diarsipkan", count: stats.archived },
              { id: "rejected", label: "Ditolak", count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id as MemoryStatus | "all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  activeStatus === tab.id
                    ? "bg-primary text-primary-foreground shadow-subtle"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeStatus === tab.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>

          {/* Quick text search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam memori..."
              className="pl-8 text-xs h-8 bg-card"
            />
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" />
            Kategori:
          </span>
          {[
            { id: "all", label: "Semua Kategori" },
            { id: "character_fact", label: "Karakter" },
            { id: "relationship_fact", label: "Hubungan" },
            { id: "world_fact", label: "Dunia & Aturan" },
            { id: "timeline_fact", label: "Kronologi" },
            { id: "plot_fact", label: "Plot" },
            { id: "story_fact", label: "Fakta Cerita" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveType(pill.id as MemoryType | "all")}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors shrink-0 ${
                activeType === pill.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memories List Grid */}
      {filteredMemories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-medium text-sm text-foreground">
            Tidak ada memori cerita yang sesuai
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || activeStatus !== "all" || activeType !== "all"
              ? "Coba ubah filter atau kata kunci pencarian Anda."
              : "Mulai bangun Story Memory dengan menambahkan fakta kanon karakter, aturan semesta, atau peristiwa cerita."}
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditingMemory(null);
              setIsFormOpen(true);
            }}
            className="mt-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Memori Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMemories.map((mem) => {
            // Find linked characters and locations
            const linkedChars = characters.filter((c) =>
              mem.metadata.character_ids?.includes(c.id)
            );
            const linkedLocs = locations.filter((l) =>
              mem.metadata.location_ids?.includes(l.id)
            );

            // Find source scene if source_type is scene
            const sourceScene =
              mem.source_type === "scene" && mem.source_id
                ? flatScenes.find((s) => s.id === mem.source_id)
                : null;

            return (
              <div
                key={mem.id}
                className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs hover:border-border transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Type Badge, Importance, Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-2 border ${getTypeBadgeClass(mem.type)}`}
                      >
                        {getTypeName(mem.type)}
                      </Badge>

                      {/* Importance Stars */}
                      <div className="flex items-center text-amber-500" title={`Penting Level ${mem.importance}`}>
                        {Array.from({ length: mem.importance }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-500" />
                        ))}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {mem.status === "confirmed" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Kanon
                        </span>
                      )}
                      {mem.status === "proposed" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3 h-3" />
                          Usulan
                        </span>
                      )}
                      {mem.status === "archived" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <Archive className="w-3 h-3" />
                          Arsip
                        </span>
                      )}
                      {mem.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-medium">
                          <XCircle className="w-3 h-3" />
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fact Content */}
                  <p className="text-xs text-foreground font-sans leading-relaxed">
                    {mem.content}
                  </p>

                  {/* Linked Entities (Characters & Locations) */}
                  {(linkedChars.length > 0 || linkedLocs.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {linkedChars.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[10px]"
                        >
                          <Users className="w-2.5 h-2.5" />
                          {c.name}
                        </span>
                      ))}
                      {linkedLocs.map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px]"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          {l.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Source Attribution */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span>Sumber:</span>
                      {sourceScene ? (
                        <Link
                          href={`/workspace/${novelId}/write/${sourceScene.id}`}
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                          title="Buka adegan naskah"
                        >
                          <span>{sourceScene.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ) : mem.source_type === "manual" ? (
                        <span className="font-medium text-foreground">Manual oleh Penulis</span>
                      ) : mem.source_type === "world_rule" ? (
                        <span className="font-medium text-foreground">Aturan Dunia</span>
                      ) : mem.source_type === "chapter" ? (
                        <span className="font-medium text-foreground">Bab Naskah</span>
                      ) : mem.source_type === "timeline_event" ? (
                        <span className="font-medium text-foreground">Kronologi Cerita</span>
                      ) : (
                        <span className="font-medium text-foreground">Ekstraksi Naskah</span>
                      )}
                    </span>

                    {/* Embedding Indicator */}
                    <span className="text-[9px] text-muted-foreground/80">
                      Vector Indexed ✓
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                  {/* Status transitions */}
                  <div className="flex items-center gap-1">
                    {mem.status === "proposed" && (
                      <>
                        <form action={handleUpdateStatus}>
                          <input type="hidden" name="novel_id" value={novelId} />
                          <input type="hidden" name="id" value={mem.id} />
                          <input type="hidden" name="status" value="confirmed" />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Konfirmasi Kanon
                          </Button>
                        </form>

                        <form action={handleUpdateStatus}>
                          <input type="hidden" name="novel_id" value={novelId} />
                          <input type="hidden" name="id" value={mem.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Tolak
                          </Button>
                        </form>
                      </>
                    )}

                    {mem.status === "confirmed" && (
                      <form action={handleUpdateStatus}>
                        <input type="hidden" name="novel_id" value={novelId} />
                        <input type="hidden" name="id" value={mem.id} />
                        <input type="hidden" name="status" value="archived" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          title="Arsipkan jika fakta ini tidak lagi berlaku di masa kini cerita"
                        >
                          <Archive className="w-3 h-3 mr-1" />
                          Arsipkan
                        </Button>
                      </form>
                    )}

                    {mem.status === "archived" && (
                      <form action={handleUpdateStatus}>
                        <input type="hidden" name="novel_id" value={novelId} />
                        <input type="hidden" name="id" value={mem.id} />
                        <input type="hidden" name="status" value="confirmed" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                        >
                          Pulihkan ke Kanon
                        </Button>
                      </form>
                    )}
                  </div>

                  {/* Edit & Delete actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMemory(mem);
                        setIsFormOpen(true);
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Edit Memori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingMemory(mem)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      title="Hapus Memori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Memory Form Dialog (Create / Edit) */}
      <MemoryFormDialog
        novelId={novelId}
        memory={editingMemory}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMemory(null);
        }}
        characters={characters}
        locations={locations}
        scenes={flatScenes}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMemoryDialog
        novelId={novelId}
        memory={deletingMemory}
        isOpen={Boolean(deletingMemory)}
        onClose={() => setDeletingMemory(null)}
      />
    </div>
  );
}
