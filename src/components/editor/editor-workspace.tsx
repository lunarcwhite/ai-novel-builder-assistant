"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  Scene,
  Chapter,
  Novel,
  NovelStructureTree,
  SceneVersion,
  Character,
  Location,
  SceneContextData,
  StoryMemory,
} from "@/types";
import { saveSceneContentAction, getSceneVersionsAction } from "@/server/actions/editor";
import { updateSceneContextAction } from "@/server/actions/characters";
import TipTapEditor from "./tiptap-editor";
import SceneNavigator from "./scene-navigator";
import AIPanelPlaceholder from "./ai-panel-placeholder";
import EditorHeader, { SaveStatus } from "./editor-header";
import VersionHistoryDrawer from "./version-history-drawer";
import { formatNumber, cn } from "@/lib/utils";
import { countWords } from "@/lib/words";
import {
  Minimize2,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Users,
  MapPin,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PALETTE_ACTION_EVENT } from "@/components/command-palette";
import { isFocusShortcut, isSaveShortcut } from "@/lib/shortcuts";

interface EditorWorkspaceProps {
  novel: Novel;
  chapter: Chapter;
  scene: Scene;
  structure: NovelStructureTree;
  initialVersions: SceneVersion[];
  characters?: Character[];
  locations?: Location[];
  initialContext?: SceneContextData;
  relevantMemories?: StoryMemory[];
}

export default function EditorWorkspace({
  novel,
  chapter,
  scene,
  structure,
  initialVersions,
  characters = [],
  locations = [],
  initialContext,
  relevantMemories = [],
}: EditorWorkspaceProps) {
  // Manuscript Content & Metrics State
  const [content, setContent] = useState<string>(scene.content || "");
  const [sceneWordCount, setSceneWordCount] = useState<number>(scene.word_count || 0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(scene.updated_at));

  // Scene Context Linking State (Phase 5)
  const [povCharId, setPovCharId] = useState<string>(
    initialContext?.pov_character_id || scene.pov_character_id || ""
  );
  const [locationId, setLocationId] = useState<string>(
    initialContext?.location_id || scene.location_id || ""
  );
  const [involvedCharIds, setInvolvedCharIds] = useState<string[]>(
    initialContext?.involved_characters.map((c) => c.id) || []
  );
  const [isSavingContext, setIsSavingContext] = useState<boolean>(false);
  const [contextSavedNotice, setContextSavedNotice] = useState<boolean>(false);

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

  // Autosave execution. Distinguishes honest states (SOUL.md #34):
  // "offline" = browser reports no network; "error" = server save failed.
  const executeSave = useCallback(
    async (textToSave: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSaveStatus("offline");
        return;
      }
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
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setSaveStatus("offline");
        } else {
          setSaveStatus("error");
        }
      }
    },
    [novel.id, scene.id, storageKey]
  );

  // Honest connectivity tracking: browser online/offline events drive the
  // "offline" badge; reconnecting retries the latest draft automatically.
  useEffect(() => {
    const handleOffline = () => setSaveStatus("offline");
    const handleOnline = () => {
      executeSave(latestContentRef.current);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [executeSave]);

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

  // Phase 5: Scene Context Linking Handler
  const handleSaveSceneContext = async (
    newPov: string,
    newLoc: string,
    newInvolved: string[]
  ) => {
    setIsSavingContext(true);
    try {
      const res = await updateSceneContextAction(novel.id, scene.id, {
        pov_character_id: newPov || null,
        location_id: newLoc || null,
        character_ids: newInvolved,
      });
      if (res.success) {
        setContextSavedNotice(true);
        setTimeout(() => setContextSavedNotice(false), 2500);
      }
    } catch {
      // ignore
    } finally {
      setIsSavingContext(false);
    }
  };

  // Keyboard shortcuts: Escape exits focus, Ctrl+S saves now, F11 toggles focus.
  // Palette actions (save-now / toggle-focus / open-versions) arrive as events.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
        return;
      }
      if (isSaveShortcut(e)) {
        e.preventDefault();
        executeSave(latestContentRef.current);
        return;
      }
      if (isFocusShortcut(e)) {
        e.preventDefault();
        setIsFocusMode((v) => !v);
      }
    };
    const handlePaletteAction = (e: Event) => {
      const actionId = (e as CustomEvent<string>).detail;
      if (actionId === "save-now") executeSave(latestContentRef.current);
      else if (actionId === "toggle-focus") setIsFocusMode((v) => !v);
      else if (actionId === "open-versions") setIsVersionsOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(PALETTE_ACTION_EVENT, handlePaletteAction);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(PALETTE_ACTION_EVENT, handlePaletteAction);
    };
  }, [isFocusMode, executeSave]);

  // Aggregate word count calculations
  const chapterEffectiveWords = Math.max(
    0,
    chapter.word_count - (scene.word_count || 0) + sceneWordCount
  );
  const novelEffectiveWords = Math.max(
    0,
    (structure.totalWords || novel.word_count) - (scene.word_count || 0) + sceneWordCount
  );

  const currentPovChar = characters.find((c) => c.id === povCharId);
  const currentLoc = locations.find((l) => l.id === locationId);

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
        {/* Mobile scrim when either side panel overlays the canvas */}
        {!isFocusMode && (showLeftPanel || showRightPanel) && (
          <button
            type="button"
            aria-label="Tutup panel samping"
            onClick={() => {
              setShowLeftPanel(false);
              setShowRightPanel(false);
            }}
            className="absolute inset-0 z-30 bg-background/60 backdrop-blur-[1px] lg:hidden"
          />
        )}
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
                  <div className="space-y-1.5">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                      {chapter.title}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
                      {scene.title}
                    </h1>

                    {/* Context Badges (POV & Location) */}
                    {(currentPovChar || currentLoc || involvedCharIds.length > 0) && (
                      <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                        {currentPovChar && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-medium border border-accent/30">
                            <Users className="w-3 h-3" />
                            <span>POV: {currentPovChar.name}</span>
                          </span>
                        )}
                        {currentLoc && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground text-[11px] font-medium border border-border/60">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span>{currentLoc.name}</span>
                          </span>
                        )}
                        {involvedCharIds.length > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            • {involvedCharIds.length} karakter terlibat
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSceneDetails(!showSceneDetails)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 self-start sm:self-auto shrink-0"
                  >
                    <span>Detail Adegan</span>
                    {showSceneDetails ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Collapsible Scene Info & Context Linking Card */}
                {showSceneDetails && (
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-4 text-xs text-muted-foreground animate-in fade-in">
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

                    {/* Phase 5: Scene Context Linking Controls */}
                    <div className="pt-3 border-t border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>Konteks Adegan (Tautan Karakter & Lokasi)</span>
                        </div>
                        {contextSavedNotice && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                            <Check className="w-3 h-3" />
                            Konteks diperbarui
                          </span>
                        )}
                        {isSavingContext && (
                          <span className="text-[10px] text-muted-foreground">Menyimpan...</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* POV Selector */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground">
                            Karakter Sudut Pandang (POV)
                          </label>
                          <select
                            value={povCharId}
                            disabled={isSavingContext}
                            onChange={(e) => {
                              const newPov = e.target.value;
                              setPovCharId(newPov);
                              handleSaveSceneContext(newPov, locationId, involvedCharIds);
                            }}
                            className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="">— Belum Ditentukan —</option>
                            {characters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Location Selector */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground">
                            Lokasi Kejadian
                          </label>
                          <select
                            value={locationId}
                            disabled={isSavingContext}
                            onChange={(e) => {
                              const newLoc = e.target.value;
                              setLocationId(newLoc);
                              handleSaveSceneContext(povCharId, newLoc, involvedCharIds);
                            }}
                            className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="">— Belum Ditentukan —</option>
                            {locations.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Involved Characters Multi-Toggle */}
                      {characters.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-medium text-foreground">
                            Karakter yang Terlibat / Hadir di Adegan Ini:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {characters.map((c) => {
                              const isPresent = involvedCharIds.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  disabled={isSavingContext}
                                  onClick={() => {
                                    const nextInvolved = isPresent
                                      ? involvedCharIds.filter((id) => id !== c.id)
                                      : [...involvedCharIds, c.id];
                                    setInvolvedCharIds(nextInvolved);
                                    handleSaveSceneContext(povCharId, locationId, nextInvolved);
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border",
                                    isPresent
                                      ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                                      : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/70"
                                  )}
                                >
                                  {isPresent && <Check className="w-3 h-3" />}
                                  <span>{c.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

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
            relevantMemories={relevantMemories}
            onCollapse={() => setShowRightPanel(false)}
            editorHtml={content}
            onApplyContent={(finalHtml) => {
              setContent(finalHtml);
              setSceneWordCount(countWords(finalHtml));
              handleEditorChange(finalHtml, countWords(finalHtml));
              // Refresh version list so the auto-checkpoint (ai_insert/ai_replace)
              // created by applySuggestionAction appears in the drawer.
              getSceneVersionsAction(novel.id, scene.id).then((res) => {
                if (res.success && res.versions) setVersions(res.versions);
              });
            }}
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
