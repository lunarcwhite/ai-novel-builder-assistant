"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { NovelStructureTree, Chapter } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import SceneDialog from "@/components/outline/scene-dialog";
import {
  ChevronDown,
  ChevronRight,
  Feather,
  BookOpen,
  Layers,
  Plus,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SceneNavigatorProps {
  novelId: string;
  structure: NovelStructureTree;
  activeSceneId: string;
  onCollapse?: () => void;
}

export default function SceneNavigator({
  novelId,
  structure,
  activeSceneId,
  onCollapse,
}: SceneNavigatorProps) {
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const allChapters: Chapter[] = [
    ...structure.acts.flatMap((a) => a.chapters),
    ...structure.unassignedChapters,
  ];

  return (
    <aside className="absolute inset-y-0 left-0 z-40 w-72 border-r border-border/80 bg-background shadow-paper flex flex-col h-full overflow-hidden select-none transition-all lg:static lg:z-auto lg:shadow-none lg:bg-sidebar/50">
      {/* Navigator Header */}
      <div className="p-3.5 border-b border-border/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <span className="font-serif font-medium text-xs text-foreground truncate">
            Navigasi Cerita
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">
            {structure.totalScenes} Adegan
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <SceneDialog
            novelId={novelId}
            chapters={allChapters}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Tambah Adegan Baru"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            }
          />

          {onCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapse}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Sembunyikan Navigasi"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
        {/* Acts with Chapters */}
        {structure.acts.map((act) => (
          <div key={act.id} className="space-y-1.5">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="truncate">{act.title}</span>
              <span className="text-[10px] font-normal">{act.chapters.length} Bab</span>
            </div>

            <div className="space-y-1">
              {act.chapters.map((chapter) => {
                const isCollapsed = !!collapsedChapters[chapter.id];

                return (
                  <div key={chapter.id} className="space-y-0.5">
                    {/* Chapter Header */}
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      aria-expanded={!isCollapsed}
                      aria-label={`${isCollapsed ? "Buka" : "Tutup"} bab ${chapter.title}`}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/60 text-left transition-colors text-xs font-medium text-foreground/90 group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isCollapsed ? (
                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <BookOpen className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="truncate">{chapter.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatNumber(chapter.word_count)} k
                      </span>
                    </button>

                    {/* Chapter's Scenes */}
                    {!isCollapsed && (
                      <div className="pl-4 space-y-0.5 border-l border-border/40 ml-3 my-0.5">
                        {chapter.scenes.length === 0 ? (
                          <div className="py-1 px-2 text-[10px] text-muted-foreground italic">
                            Belum ada adegan
                          </div>
                        ) : (
                          chapter.scenes.map((scene) => {
                            const isActive = scene.id === activeSceneId;

                            return (
                              <Link
                                key={scene.id}
                                href={`/workspace/${novelId}/write/${scene.id}`}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors group ${
                                  isActive
                                    ? "bg-primary/15 text-primary font-medium border-l-2 border-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Feather
                                    className={`w-3 h-3 shrink-0 ${
                                      isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                                  />
                                  <span className="truncate">{scene.title}</span>
                                </div>
                                <span className="text-[10px] shrink-0 opacity-75">
                                  {formatNumber(scene.word_count)}
                                </span>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Unassigned Chapters (Outside Acts) */}
        {structure.unassignedChapters.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border/40">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bab Lainnya
            </div>

            <div className="space-y-1">
              {structure.unassignedChapters.map((chapter) => {
                const isCollapsed = !!collapsedChapters[chapter.id];

                return (
                  <div key={chapter.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter.id)}
                      aria-expanded={!isCollapsed}
                      aria-label={`${isCollapsed ? "Buka" : "Tutup"} bab ${chapter.title}`}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/60 text-left transition-colors text-xs font-medium text-foreground/90 group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isCollapsed ? (
                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <BookOpen className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        <span className="truncate">{chapter.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatNumber(chapter.word_count)} k
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="pl-4 space-y-0.5 border-l border-border/40 ml-3 my-0.5">
                        {chapter.scenes.length === 0 ? (
                          <div className="py-1 px-2 text-[10px] text-muted-foreground italic">
                            Belum ada adegan
                          </div>
                        ) : (
                          chapter.scenes.map((scene) => {
                            const isActive = scene.id === activeSceneId;

                            return (
                              <Link
                                key={scene.id}
                                href={`/workspace/${novelId}/write/${scene.id}`}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors group ${
                                  isActive
                                    ? "bg-primary/15 text-primary font-medium border-l-2 border-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Feather
                                    className={`w-3 h-3 shrink-0 ${
                                      isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                                  />
                                  <span className="truncate">{scene.title}</span>
                                </div>
                                <span className="text-[10px] shrink-0 opacity-75">
                                  {formatNumber(scene.word_count)}
                                </span>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
