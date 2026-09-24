"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional count badge (e.g. memory status tabs). */
  count?: number;
}

interface TabsProps {
  value: string;
  onValueChange: (id: string) => void;
  items: TabItem[];
  variant?: "accent" | "primary";
  /** Accessible name for the tab list. */
  ariaLabel: string;
  className?: string;
}

const baseButtonClass =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const variantClass = {
  accent: {
    active: "bg-accent/20 text-accent font-semibold border border-accent/40",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/40",
  },
  primary: {
    active: "bg-primary text-primary-foreground shadow-subtle",
    inactive: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  },
} as const;

/**
 * Shared tab bar (Phase 0 design-system primitive).
 * Unifies the studio tab patterns with tablist semantics + arrow-key navigation.
 */
export function Tabs({
  value,
  onValueChange,
  items,
  variant = "accent",
  ariaLabel,
  className,
}: TabsProps) {
  const styles = variantClass[variant];
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number) => {
    if (items.length === 0) return;
    const next = (index + items.length) % items.length;
    buttonRefs.current[next]?.focus();
    onValueChange(items[next].id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusTab(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusTab(index - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTab(items.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1.5 overflow-x-auto py-1", className)}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(baseButtonClass, selected ? styles.active : styles.inactive)}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  // ponytail: badge tuned for the primary variant (only count user today);
                  // add per-variant badge tones when accent tabs need counts.
                  selected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
