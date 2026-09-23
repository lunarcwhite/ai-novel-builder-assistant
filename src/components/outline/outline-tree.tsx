"use client";

import React, { useState, useTransition } from "react";
import type { NovelStructureTree, Chapter, Scene } from "@/types";
import {
  deleteActAction,
  deleteChapterAction,
  deleteSceneAction,
  reorderActsAction,
  reorderChaptersAction,
  reorderScenesAction,
} from "@/server/actions/structure";
import ActDialog from "./act-dialog";
import ChapterDialog from "./chapter-dialog";
import SceneDialog from "./scene-dialog";
import DeleteDialog from "./delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  BookOpen,
  Feather,
  MoveUp,
  MoveDown,
  Compass,
  Layers,
} from "lucide-react";

interface OutlineTreeProps {
  novelId: string;
  structure: NovelStructureTree;
}

export default function OutlineTree({ novelId, structure }: OutlineTreeProps) {
  // Collapsed state tracking
  const [collapsedActs, setCollapsedActs] = useState<Record<string, boolean>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const toggleActCollapse = (actId: string) => {
    setCollapsedActs((prev) => ({ ...prev, [actId]: !prev[actId] }));
  };

  const toggleChapterCollapse = (chapterId: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Reorder Handlers
  const handleMoveAct = (index: number, direction: "up" | "down") => {
    const acts = [...structure.acts];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= acts.length) return;

    const [moved] = acts.splice(index, 1);
    acts.splice(targetIndex, 0, moved);

    startTransition(async () => {
      await reorderActsAction(
        novelId,
        acts.map((a) => a.id)
      );
    });
  };

  const handleMoveChapter = (
    actId: string | null,
    chapterList: Chapter[],
    index: number,
    direction: "up" | "down"
  ) => {
    const chapters = [...chapterList];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const [moved] = chapters.splice(index, 1);
    chapters.splice(targetIndex, 0, moved);

    startTransition(async () => {
      await reorderChaptersAction(
        novelId,
        chapters.map((c) => c.id),
        actId
      );
    });
  };

  const handleMoveScene = (
    chapterId: string,
    sceneList: Scene[],
    index: number,
    direction: "up" | "down"
  ) => {
    const scenes = [...sceneList];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const [moved] = scenes.splice(index, 1);
    scenes.splice(targetIndex, 0, moved);

    startTransition(async () => {
      await reorderScenesAction(
        novelId,
        chapterId,
        scenes.map((s) => s.id)
      );
    });
  };

  // All flat chapters for easy selection in dialogs
  const allChapters: Chapter[] = [
    ...structure.acts.flatMap((a) => a.chapters),
    ...structure.unassignedChapters,
  ];

  // Helper for status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Selesai</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Dalam Pengerjaan</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Draf</Badge>;
      case "revising":
        return <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">Revisi</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">Rencana</Badge>;
    }
  };

  const hasContent = structure.acts.length > 0 || structure.unassignedChapters.length > 0;

  return (
    <div className="space-y-6">
      {/* Structure Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="text-base font-serif font-medium text-foreground">
              Outline & Struktur Cerita
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Phase 3 Active
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
            <span>{structure.totalActs} Babak</span>
            <span>•</span>
            <span>{structure.totalChapters} Bab</span>
            <span>•</span>
            <span>{structure.totalScenes} Adegan</span>
            <span>•</span>
            <span className="font-medium text-foreground">
              {formatNumber(structure.totalWords)} Kata Total
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ActDialog novelId={novelId} />
          <ChapterDialog novelId={novelId} acts={structure.acts} />
        </div>
      </div>

      {/* Empty State */}
      {!hasContent && (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card/40 space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-serif font-medium text-foreground">
              Belum Ada Struktur Naskah
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mulai susun alur cerita Anda secara berjenjang. Anda dapat membaginya menjadi Babak (Act I, II, III),
              atau langsung membuat Bab dan Adegan cerita.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <ActDialog novelId={novelId} />
            <ChapterDialog novelId={novelId} acts={structure.acts} />
          </div>
        </div>
      )}

      {/* Acts and Chapters Tree */}
      <div className="space-y-5">
        {structure.acts.map((act, actIndex) => {
          const isActCollapsed = collapsedActs[act.id];
          const actWords = act.chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);

          return (
            <div
              key={act.id}
              className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle transition-all duration-200"
            >
              {/* Act Header */}
              <div className="p-4 md:p-5 bg-muted/20 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleActCollapse(act.id)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors mt-0.5"
                    title={isActCollapsed ? "Buka Babak" : "Tutup Babak"}
                  >
                    {isActCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wider font-mono">
                        Babak {actIndex + 1}
                      </span>
                      <h3 className="text-base font-serif font-semibold text-foreground">
                        {act.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        ({act.chapters.length} Bab • {formatNumber(actWords)} Kata)
                      </span>
                    </div>

                    {act.description && (
                      <p className="text-xs text-muted-foreground italic font-serif leading-relaxed">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Act Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    disabled={actIndex === 0 || isPending}
                    onClick={() => handleMoveAct(actIndex, "up")}
                    title="Pindahkan Babak ke Atas"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    disabled={actIndex === structure.acts.length - 1 || isPending}
                    onClick={() => handleMoveAct(actIndex, "down")}
                    title="Pindahkan Babak ke Bawah"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </Button>

                  <ActDialog novelId={novelId} act={act} />

                  <ChapterDialog
                    novelId={novelId}
                    acts={structure.acts}
                    defaultActId={act.id}
                    trigger={
                      <Button variant="outline" size="sm" className="h-7 text-xs flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        <span>Tambah Bab</span>
                      </Button>
                    }
                  />

                  <DeleteDialog
                    title="Hapus Babak"
                    itemType="Babak (Act)"
                    itemName={act.title}
                    warningText="Bab-bab di dalam babak ini tidak akan dihapus, namun akan berpindah menjadi bab bebas (tanpa babak)."
                    onConfirm={async () => {
                      await deleteActAction(novelId, act.id);
                    }}
                  />
                </div>
              </div>

              {/* Chapters inside Act */}
              {!isActCollapsed && (
                <div className="p-4 md:p-5 space-y-4">
                  {act.chapters.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-border/60 rounded-lg text-xs text-muted-foreground space-y-2">
                      <p>Belum ada bab di dalam babak ini.</p>
                      <ChapterDialog
                        novelId={novelId}
                        acts={structure.acts}
                        defaultActId={act.id}
                        trigger={
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah Bab Pertama
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {act.chapters.map((chapter, chIndex) => {
                        const isChapterCollapsed = collapsedChapters[chapter.id];

                        return (
                          <div
                            key={chapter.id}
                            className="rounded-lg border border-border/70 bg-background/60 hover:bg-muted/10 transition-colors overflow-hidden"
                          >
                            {/* Chapter Row Header */}
                            <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                              <div className="flex items-start gap-2.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleChapterCollapse(chapter.id)}
                                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors mt-0.5"
                                  title={isChapterCollapsed ? "Buka Adegan" : "Tutup Adegan"}
                                >
                                  {isChapterCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-serif font-medium text-foreground">
                                      {chapter.title}
                                    </span>
                                    {getStatusBadge(chapter.status)}
                                    <span className="text-[11px] text-muted-foreground">
                                      {chapter.scenes.length} Adegan • {formatNumber(chapter.word_count)} Kata
                                    </span>
                                  </div>

                                  {chapter.summary && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                      {chapter.summary}
                                    </p>
                                  )}

                                  {/* Story Beats Peek */}
                                  {(chapter.objective || chapter.conflict || chapter.outcome) && (
                                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1">
                                      {chapter.objective && (
                                        <span className="bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                                          🎯 {chapter.objective}
                                        </span>
                                      )}
                                      {chapter.conflict && (
                                        <span className="bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                                          ⚡ {chapter.conflict}
                                        </span>
                                      )}
                                      {chapter.outcome && (
                                        <span className="bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                                          🏁 {chapter.outcome}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Chapter Actions */}
                              <div className="flex items-center gap-1 self-end md:self-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  disabled={chIndex === 0 || isPending}
                                  onClick={() => handleMoveChapter(act.id, act.chapters, chIndex, "up")}
                                  title="Pindahkan Bab ke Atas"
                                >
                                  <MoveUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  disabled={chIndex === act.chapters.length - 1 || isPending}
                                  onClick={() => handleMoveChapter(act.id, act.chapters, chIndex, "down")}
                                  title="Pindahkan Bab ke Bawah"
                                >
                                  <MoveDown className="w-3 h-3" />
                                </Button>

                                <ChapterDialog
                                  novelId={novelId}
                                  acts={structure.acts}
                                  chapter={chapter}
                                />

                                <SceneDialog
                                  novelId={novelId}
                                  chapters={allChapters}
                                  defaultChapterId={chapter.id}
                                  trigger={
                                    <Button variant="outline" size="sm" className="h-6 text-[11px] px-2 flex items-center gap-1">
                                      <Plus className="w-3 h-3" />
                                      <span>Adegan</span>
                                    </Button>
                                  }
                                />

                                <DeleteDialog
                                  title="Hapus Bab"
                                  itemType="Bab (Chapter)"
                                  itemName={chapter.title}
                                  warningText="Menghapus bab ini juga akan menghapus seluruh adegan dan draf naskah yang tersimpan di dalamnya."
                                  onConfirm={async () => {
                                    await deleteChapterAction(novelId, chapter.id);
                                  }}
                                />
                              </div>
                            </div>

                            {/* Scenes List inside Chapter */}
                            {!isChapterCollapsed && (
                              <div className="px-4 pb-3 pt-1 border-t border-border/40 bg-muted/10 space-y-2">
                                {chapter.scenes.length === 0 ? (
                                  <div className="py-2.5 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-2">
                                    <span>Belum ada adegan dalam bab ini.</span>
                                    <SceneDialog
                                      novelId={novelId}
                                      chapters={allChapters}
                                      defaultChapterId={chapter.id}
                                      trigger={
                                        <button className="text-primary hover:underline font-medium">
                                          + Tambah Adegan
                                        </button>
                                      }
                                    />
                                  </div>
                                ) : (
                                  chapter.scenes.map((scene, scIndex) => (
                                    <div
                                      key={scene.id}
                                      className="p-2.5 rounded-md border border-border/50 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-border transition-colors"
                                    >
                                      <div className="space-y-0.5 flex-1">
                                        <div className="flex items-center gap-2">
                                          <Feather className="w-3 h-3 text-primary shrink-0" />
                                          <span className="font-medium text-foreground">
                                            {scene.title}
                                          </span>
                                          {getStatusBadge(scene.status)}
                                          <span className="text-[10px] text-muted-foreground">
                                            {formatNumber(scene.word_count)} Kata
                                          </span>
                                        </div>

                                        {scene.summary && (
                                          <p className="text-[11px] text-muted-foreground line-clamp-1 pl-5">
                                            {scene.summary}
                                          </p>
                                        )}
                                      </div>

                                      {/* Scene Actions */}
                                      <div className="flex items-center gap-1 self-end sm:self-auto pl-5 sm:pl-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                          disabled={scIndex === 0 || isPending}
                                          onClick={() =>
                                            handleMoveScene(chapter.id, chapter.scenes, scIndex, "up")
                                          }
                                          title="Pindahkan Adegan ke Atas"
                                        >
                                          <MoveUp className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                          disabled={scIndex === chapter.scenes.length - 1 || isPending}
                                          onClick={() =>
                                            handleMoveScene(chapter.id, chapter.scenes, scIndex, "down")
                                          }
                                          title="Pindahkan Adegan ke Bawah"
                                        >
                                          <MoveDown className="w-3 h-3" />
                                        </Button>

                                        <SceneDialog
                                          novelId={novelId}
                                          chapters={allChapters}
                                          scene={scene}
                                        />

                                        <DeleteDialog
                                          title="Hapus Adegan"
                                          itemType="Adegan (Scene)"
                                          itemName={scene.title}
                                          warningText="Naskah teks adegan ini akan dihapus secara permanen."
                                          onConfirm={async () => {
                                            await deleteSceneAction(novelId, scene.id);
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Chapters (if any) */}
        {structure.unassignedChapters.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle">
            <div className="p-4 bg-muted/20 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-serif font-medium text-foreground">
                  Bab Bebas (Tanpa Babak)
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({structure.unassignedChapters.length} Bab)
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {structure.unassignedChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="rounded-lg border border-border/70 bg-background/60 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-medium text-foreground">
                        {chapter.title}
                      </span>
                      {getStatusBadge(chapter.status)}
                      <span className="text-[11px] text-muted-foreground">
                        {chapter.scenes.length} Adegan • {formatNumber(chapter.word_count)} Kata
                      </span>
                    </div>
                    {chapter.summary && (
                      <p className="text-xs text-muted-foreground">{chapter.summary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 self-end md:self-auto">
                    <ChapterDialog
                      novelId={novelId}
                      acts={structure.acts}
                      chapter={chapter}
                    />
                    <DeleteDialog
                      title="Hapus Bab"
                      itemType="Bab (Chapter)"
                      itemName={chapter.title}
                      warningText="Menghapus bab ini juga akan menghapus seluruh adegan di dalamnya."
                      onConfirm={async () => {
                        await deleteChapterAction(novelId, chapter.id);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
