"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  /** Static trigger element (e.g. a button). Toggle is handled internally. */
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  /** Accessible name for the menu. */
  label: string;
  className?: string;
}

/**
 * Minimal dropdown primitive (Phase 0 design-system foundation).
 * No new dependency: plain React + close on outside click / Escape.
 */
export function DropdownMenu({
  trigger,
  children,
  align = "end",
  label,
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          aria-label={label}
          // Any item click closes the menu; the item's own action still runs.
          onClick={() => setOpen(false)}
          className={cn(
            "absolute top-full z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-paper",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("my-1 h-px bg-border/70", className)} />;
}

export function DropdownMenuLink({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60",
        className
      )}
      {...props}
    />
  );
}
