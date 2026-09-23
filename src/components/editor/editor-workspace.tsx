"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Scene, Chapter, Novel, NovelStructureTree, SceneVersion } from "@/types";
import { saveSceneContentAction } from "@/server/actions/editor";
import TipTapEditor from "./tiptap-editor";
import SceneNavigator from "./scene-navigator";
import AIPanelPlaceholder from "./ai-panel-placeholder";
import EditorHeader, { SaveStatus } from "./editor-header";
import VersionHistoryDrawer from "./version-history-drawer";
import { formatNumber } from "@/lib/utils";
import {
  Minimize2,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorWorkspaceProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
  structure: NovelStructureTree;
  initialVersions: SceneVersion[];
}

export default function EditorWorkspace({
  novel,
  chapter,
  scene,
  structure,
  initialVersions,
}: EditorWorkspaceProps) {
  // Manuscript Content & Metrics State
  const [content, setContent] = useState<string>(scene.content || "");
  const [sceneWordCount, setSceneWordCount] = useState<number>(scene.word_count || 0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(scene.updated_at));

  // Local draft recovery state
  const [recoveredDraft, setRecoveredDraft] = useState<string | null>(null);

  // Panels & Mode State
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState<boolean>(false);
  const [versions, setVersions] = useState<SceneVersion[]>(initialVersions);
  const [showSceneDetails, setShowSceneDetails] = useState<boolean>(false);

  // Debounce Timer Ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>(content);
  latestContentRef.current = content;

  // LocalStorage storage key
  const storageKey = `novel_builder_draft_${scene.id}`;

  // Check for local draft on initial mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached && cached.trim() !== (scene.content || "").trim()) {
        setRecoveredDraft(cached);
      }
    } catch {
      // Ignore localStorage errors (e.g. private browsing)
    }
  }, [scene.id, scene.content, storageKey]);

  // Autosave execution
  const executeSave = useCallback(
    async (textToSave: string) => {
      setSaveStatus("saving");
      try {
        const res = await saveSceneContentAction(novel.id, scene.id, textToSave);
        if (res.success) {
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          try {
            localStorage.removeItem(storageKey);
          } catch {
            // ignore
          }
        } else {
          setSaveStatus("error");
        }
      } catch {
        setSaveStatus("error");
      }
    },
    [novel.id, scene.id, storageKey]
  );

  // Trigger debounced autosave upon editor changes
  const handleEditorChange = useCallback(
    (newContent: string, newWordCount: number) => {
      setContent(newContent);
      setSceneWordCount(newWordCount);
      setSaveStatus("saving");

      // Save locally to localStorage immediately for instant crash protection
      try {
        localStorage.setItem(storageKey, newContent);
      } catch {
        // ignore
      }

      // Debounce server call by 1500ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        executeSave(newContent);
      }, 1500);
    },
    [executeSave, storageKey]
  );

  // Manual save retry button in header
  const handleRetrySave = () => {
    executeSave(latestContentRef.current);
  };

  // Keyboard shortcut for Focus Mode (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode]);

  // Aggregate word count calculations
  const chapterEffectiveWords = Math.max(
    0,
    chapter.word_count - (scene.word_count || 0) + sceneWordCount
  );
  const novelEffectiveWords = Math.max(
    0,
    (structure.totalWords || novel.word_count) - (scene.word_count || 0) + sceneWordCount
  );

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-8 bg-background overflow-hidden">
      {/* Top Application Header for Editor (hidden in Focus Mode) */}
      {!isFocusMode && (
        <EditorHeader
          novel={novel}
          chapter={chapter}
          scene={scene}
          sceneWordCount={sceneWordCount}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onRetrySave={handleRetrySave}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(true)}
          onOpenVersions={() => setIsVersionsOpen(true)}
          versionsCount={versions.length}
          showLeftPanel={showLeftPanel}
          onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
          showRightPanel={showRightPanel}
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
        />
      )}

      {/* Local Draft Recovery Notification Banner */}
      {recoveredDraft && (
        <div className="z-40 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-4 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              Terdapat draf lokal tersimpan di browser Anda yang berbeda dari naskah server.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border-amber-500/40"
              onClick={() => {
                setContent(recoveredDraft);
                setRecoveredDraft(null);
                handleEditorChange(recoveredDraft, recoveredDraft.split(/\s+/).filter(Boolean).length);
              }}
            >
              Pulihkan Draf Lokal
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs hover:bg-amber-500/10"
              onClick={() => {
                try {
                  localStorage.removeItem(storageKey);
                } catch {
                  // ignore
                }
                setRecoveredDraft(null);
              }}
            >
              Abaikan
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout (3-Column Architecture) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Scene Navigator */}
        {!isFocusMode && showLeftPanel && (
          <SceneNavigator
            novelId={novel.id}
            structure={structure}
            activeSceneId={scene.id}
            onCollapse={() => setShowLeftPanel(false)}
          />
        )}

        {/* 2. Center Manuscript Writing Canvas */}
        <main className="flex-1 overflow-y-auto bg-background flex flex-col items-center select-text relative">
          {/* Distraction-Free Focus Mode Floating Control */}
          {isFocusMode && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3 p-1.5 px-3 rounded-full bg-card/80 backdrop-blur-md border border-border/80 shadow-card text-xs text-muted-foreground animate-in fade-in">
              <span className="font-serif font-medium text-foreground">
                {formatNumber(sceneWordCount)} kata
              </span>
              <span>•</span>
              <span className="text-[11px]">
                {saveStatus === "saving" ? "Menyimpan..." : "Tersimpan"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFocusMode(false)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 ml-1"
                title="Keluar dari Mode Fokus (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          )}

          {/* Editorial Manuscript Column Container */}
          <div className="w-full max-w-3xl px-6 sm:px-12 py-8 sm:py-12 space-y-6">
            {/* Scene Header & Metadata */}
            {!isFocusMode && (
              <div className="space-y-3 pb-6 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                      {chapter.title}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
                      {scene.title}
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSceneDetails(!showSceneDetails)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Detail Adegan</span>
                    {showSceneDetails ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Collapsible Scene Info / Purpose Card */}
                {showSceneDetails && (
                  <div className="p-3.5 rounded-lg bg-muted/30 border border-border/60 space-y-2 text-xs text-muted-foreground animate-in fade-in">
                    {scene.purpose && (
                      <div>
                        <span className="font-semibold text-foreground">Tujuan Adegan:</span>
                        <p className="mt-0.5 leading-relaxed">{scene.purpose}</p>
                      </div>
                    )}
                    {scene.summary && (
                      <div>
                        <span className="font-semibold text-foreground">Ringkasan Naratif:</span>
                        <p className="mt-0.5 leading-relaxed italic">{scene.summary}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/40 flex flex-wrap gap-4 text-[11px]">
                      <span>Status: <strong className="capitalize text-foreground">{scene.status}</strong></span>
                      <span>Total Bab: <strong className="text-foreground">{formatNumber(chapterEffectiveWords)} kata</strong></span>
                      <span>Total Novel: <strong className="text-foreground">{formatNumber(novelEffectiveWords)} kata</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TipTap Rich Text Manuscript Canvas */}
            <TipTapEditor
              initialContent={content}
              onChange={handleEditorChange}
              placeholder="Tuliskan baris pembuka adegan Anda di sini..."
            />

            {/* Bottom Subtle Status & Word Stats */}
            {!isFocusMode && (
              <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-serif">
                <div className="flex items-center gap-2">
                  <span>Adegan: <strong>{formatNumber(sceneWordCount)}</strong> kata</span>
                  <span>•</span>
                  <span>Bab: <strong>{formatNumber(chapterEffectiveWords)}</strong> kata</span>
                  <span>•</span>
                  <span>Novel: <strong>{formatNumber(novelEffectiveWords)}</strong> kata</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Draf tersimpan otomatis</span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 3. Right AI Assistant & Context Placeholder */}
        {!isFocusMode && showRightPanel && (
          <AIPanelPlaceholder
            novel={novel}
            chapter={chapter}
            scene={scene}
            currentWordCount={sceneWordCount}
            onCollapse={() => setShowRightPanel(false)}
          />
        )}
      </div>

      {/* Version History Drawer Modal */}
      <VersionHistoryDrawer
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        novelId={novel.id}
        sceneId={scene.id}
        versions={versions}
        onVersionsUpdated={(newVersions) => setVersions(newVersions)}
        onVersionRestored={(restoredContent) => {
          setContent(restoredContent);
          const words = restoredContent.trim() ? restoredContent.trim().split(/\s+/).length : 0;
          setSceneWordCount(words);
          handleEditorChange(restoredContent, words);
        }}
      />
    </div>
  );
}
