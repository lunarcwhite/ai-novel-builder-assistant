"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteDialogProps {
  title: string;
  itemType: "Babak (Act)" | "Bab (Chapter)" | "Adegan (Scene)";
  itemName: string;
  warningText?: string;
  onConfirm: () => Promise<void>;
  trigger?: React.ReactNode;
}

export default function DeleteDialog({
  title,
  itemType,
  itemName,
  warningText,
  onConfirm,
  trigger,
}: DeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        await onConfirm();
        setIsOpen(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal menghapus.");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          variant="ghost"
          size="sm"
          className="text-xs h-7 text-destructive hover:bg-destructive/10 hover:text-destructive p-1.5"
          title={`Hapus ${itemType}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-destructive/30 rounded-xl shadow-paper overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/60 bg-destructive/5">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h2 className="text-base font-serif font-medium">{title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              <p className="text-foreground leading-relaxed">
                Apakah Anda yakin ingin menghapus {itemType}{" "}
                <strong className="font-semibold text-foreground font-serif">
                  &ldquo;{itemName}&rdquo;
                </strong>
                ?
              </p>

              {warningText && (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="font-medium flex items-center gap-1.5">
                    <span>Peringatan Keamanan Naskah</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{warningText}</p>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Menghapus..." : `Hapus ${itemType}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
