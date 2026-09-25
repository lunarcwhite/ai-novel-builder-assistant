"use client";

import React, { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteNovelAction } from "@/server/actions/novels";

interface DeleteNovelDialogProps {
  novelId: string;
  novelTitle: string;
}

export function DeleteNovelDialog({ novelId, novelTitle }: DeleteNovelDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("id", novelId);

    startTransition(async () => {
      await deleteNovelAction(formData);
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        aria-label={`Hapus novel ${novelTitle}`}
        title={`Hapus novel ${novelTitle}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="sr-only">Hapus novel {novelTitle}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent label="Konfirmasi Hapus Novel" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Hapus Novel
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              Apakah Anda yakin ingin menghapus novel{" "}
              <strong className="text-foreground font-semibold font-serif">
                &ldquo;{novelTitle}&rdquo;
              </strong>
              ?
            </p>
            <p className="bg-destructive/5 border border-destructive/20 text-destructive/90 p-3 rounded-md">
              Seluruh babak, bab, adegan naskah, karakter, dan memori cerita di dalam novel ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <form onSubmit={handleDelete}>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isPending}
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Novel"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
