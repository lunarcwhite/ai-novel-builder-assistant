"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  buildEditorActionCommands,
  buildGlobalCommands,
  buildNovelCommands,
  filterCommands,
  parseNovelIdFromPath,
  type PaletteCommand,
  type PaletteGroup,
} from "@/lib/palette";
import { isPaletteShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

export const OPEN_PALETTE_EVENT = "novel-builder:open-palette";
export const PALETTE_ACTION_EVENT = "novel-builder:palette-action";

const GROUP_ORDER: PaletteGroup[] = ["Navigasi", "Adegan", "Aksi"];

/** Button for the workspace header: dispatches an event the host listens to. */
export function PaletteTriggerButton() {
  const open = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
  }, []);

  return (
    <>
      {/* Mobile icon trigger */}
      <button
        type="button"
        onClick={open}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Buka palet perintah dan pencarian"
        title="Buka palet perintah"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="sr-only">Buka palet perintah</span>
      </button>

      {/* Desktop expanded trigger */}
      <button
        type="button"
        onClick={open}
        className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-md border border-border/70 bg-muted/40 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors min-w-44 justify-between focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Buka palet perintah (Ctrl K)"
        title="Palet perintah (Ctrl+K)"
      >
        <span className="inline-flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" />
          <span>Cari / perintah…</span>
        </span>
        <kbd className="text-[10px] font-sans px-1 py-0.5 rounded border border-border/70 bg-background">
          Ctrl K
        </kbd>
      </button>
    </>
  );
}

export default function CommandPaletteHost() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);

  const novelId = parseNovelIdFromPath(pathname);
  const isEditorPage = Boolean(pathname?.includes("/write/"));

  const commands = React.useMemo<PaletteCommand[]>(() => {
    const base = buildGlobalCommands();
    if (!novelId) return base;
    const tabs = buildNovelCommands(novelId);
    // ponytail: scene jump commands deferred — needs structure without prop drilling;
    // add when a lightweight client store for structure exists.
    const actions = isEditorPage ? buildEditorActionCommands() : [];
    return [...base, ...tabs, ...actions];
  }, [novelId, isEditorPage]);

  const results = React.useMemo(() => filterCommands(commands, query), [commands, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, commands]);

  // Global Ctrl+K + trigger-button event
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isPaletteShortcut(e)) {
        e.preventDefault();
        lastFocusedRef.current = document.activeElement as HTMLElement | null;
        setQuery("");
        setActiveIndex(0);
        setOpen(true);
      }
    };
    const onOpenEvent = () => {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setActiveIndex(0);
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpenEvent);
    };
  }, []);

  // Focus input on open, restore focus on close
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      lastFocusedRef.current?.focus?.();
      lastFocusedRef.current = null;
    }
  }, [open ]);

  const close = React.useCallback(() => setOpen(false), []);

  const activate = React.useCallback(
    (cmd: PaletteCommand) => {
      setOpen(false);
      setQuery("");
      if (cmd.href) {
        router.push(cmd.href);
      } else if (cmd.actionId) {
        window.dispatchEvent(new CustomEvent(PALETTE_ACTION_EVENT, { detail: cmd.actionId }));
      }
    },
    [router]
  );

  const onInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = results[activeIndex];
        if (cmd) activate(cmd);
      }
    },
    [results, activeIndex, activate, close]
  );

  if (!open) return null;

  const activeId = results[activeIndex] ? `palette-option-${results[activeIndex].id}` : undefined;
  let seenCount = 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-24 px-4">
      <button
        type="button"
        onClick={close}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm cursor-default"
        aria-label="Tutup palet perintah"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Palet perintah"
        className="relative w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-paper overflow-hidden animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center gap-2 px-4 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-activedescendant={activeId}
            aria-label="Cari perintah atau halaman"
            placeholder="Ketik perintah atau cari halaman…"
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <kbd className="text-[10px] font-sans px-1.5 py-0.5 rounded border border-border/70 bg-muted/50 text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div id="palette-listbox" role="listbox" aria-label="Hasil perintah" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              Tidak ada perintah yang cocok dengan “{query}”.
            </p>
          ) : (
            GROUP_ORDER.map((group) => {
              const items = results.filter((c) => c.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} role="presentation" className="mb-1 last:mb-0">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </div>
                  {items.map((cmd) => {
                    const flatIndex = seenCount++;
                    const isActive = flatIndex === activeIndex;
                    return (
                      <div
                        key={cmd.id}
                        id={`palette-option-${cmd.id}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => activate(cmd)}
                        onMouseMove={() => {
                          if (!isActive) setActiveIndex(flatIndex);
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 rounded-md text-xs cursor-pointer transition-colors",
                          isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                        )}
                      >
                        <span className="font-medium truncate">{cmd.label}</span>
                        {cmd.hint && (
                          <span className="text-[10px] text-muted-foreground/80 shrink-0 truncate">
                            {cmd.hint}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-border/60 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border/70 bg-muted/50 font-sans">↑↓</kbd>
            navigasi
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border/70 bg-muted/50 font-sans">Enter</kbd>
            buka
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-border/70 bg-muted/50 font-sans">Esc</kbd>
            tutup
          </span>
        </div>
      </div>
    </div>
  );
}
