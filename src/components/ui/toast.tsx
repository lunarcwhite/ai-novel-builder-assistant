"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialToastState, toastReducer, type ToastVariant } from "@/lib/toast-store";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

const ToastContext = React.createContext<{ toast: (opts: ToastOptions) => void } | undefined>(
  undefined
);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_DURATION_MS = 4000;

const variantStyle: Record<ToastVariant, { box: string; icon: React.ReactNode }> = {
  success: {
    box: "border-emerald-500/30 bg-card",
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />,
  },
  error: {
    box: "border-destructive/30 bg-card",
    icon: <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />,
  },
  info: {
    box: "border-border bg-card",
    icon: <Info className="w-4 h-4 shrink-0 text-primary" />,
  },
};

/**
 * Toast provider + viewport (Phase 0 design-system primitive).
 * Mount once near the app root; call `toast()` from any client component below it.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, initialToastState);

  const toast = React.useCallback((opts: ToastOptions) => {
    dispatch({
      type: "push",
      title: opts.title,
      description: opts.description,
      variant: opts.variant ?? "success",
    });
  }, []);

  // Auto-dismiss each toast after a fixed duration.
  React.useEffect(() => {
    if (state.toasts.length === 0) return;
    const timers = state.toasts.map((t) =>
      setTimeout(() => dispatch({ type: "dismiss", id: t.id }), TOAST_DURATION_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [state.toasts]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {state.toasts.map((t) => {
          const style = variantStyle[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-paper",
                style.box
              )}
            >
              {style.icon}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "dismiss", id: t.id })}
                aria-label="Tutup notifikasi"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
