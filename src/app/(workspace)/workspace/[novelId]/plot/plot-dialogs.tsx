"use client";

import React, { useActionState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlotThreadAction,
  updatePlotThreadAction,
  deletePlotThreadAction,
  type PlotActionResult,
} from "@/server/actions/plot";
import type { PlotThread, PlotThreadStatus } from "@/types";
import { Trash2 } from "lucide-react";

interface ChapterOption {
  id: string;
  title: string;
}

const STATUS_OPTIONS: { value: PlotThreadStatus; label: string }[] = [
  { value: "planned", label: "Direncanakan" },
  { value: "active", label: "Aktif" },
  { value: "resolved", label: "Selesai" },
  { value: "abandoned", label: "Ditinggalkan" },
];

interface PlotThreadFormDialogProps {
  novelId: string;
  thread?: PlotThread | null;
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterOption[];
  onSuccess?: () => void;
}

export function PlotThreadFormDialog({
  novelId,
  thread,
  isOpen,
  onClose,
  chapters,
  onSuccess,
}: PlotThreadFormDialogProps) {
  const isEditing = Boolean(thread);
  const action = isEditing ? updatePlotThreadAction : createPlotThreadAction;
  const [state, formAction, isPending] = useActionState<PlotActionResult | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
      onSuccess?.();
    }
  }, [state, onClose, onSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {isEditing ? `Edit Thread: ${thread?.title}` : "Tambah Plot Thread Baru"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={thread?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Judul Thread *</label>
            <Input
              name="title"
              defaultValue={thread?.title || ""}
              placeholder="Mis: Misteri segel keempat Perjanjian Tiga Segel"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Deskripsi / Taruhan Cerita</label>
            <Textarea
              name="description"
              defaultValue={thread?.description || ""}
              placeholder="Apa yang dipertaruhkan, siapa yang terlibat, janji apa yang harus dibayar lunas..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Status</label>
              <select
                name="status"
                defaultValue={thread?.status || "planned"}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Penting (1–5)</label>
              <Input
                name="importance"
                type="number"
                min={1}
                max={5}
                defaultValue={thread?.importance ?? 3}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Diperkenalkan di Bab</label>
              <select
                name="introduced_chapter_id"
                defaultValue={thread?.introduced_chapter_id || ""}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">— Belum ditentukan —</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Diselesaikan di Bab</label>
              <select
                name="resolved_chapter_id"
                defaultValue={thread?.resolved_chapter_id || ""}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">— Belum ditentukan —</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Thread" : "Simpan Thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeletePlotThreadDialogProps {
  novelId: string;
  thread?: PlotThread | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletePlotThreadDialog({
  novelId,
  thread,
  isOpen,
  onClose,
  onSuccess,
}: DeletePlotThreadDialogProps) {
  const [state, formAction, isPending] = useActionState<PlotActionResult | null, FormData>(
    deletePlotThreadAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
      onSuccess?.();
    }
  }, [state, onClose, onSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Hapus Plot Thread?</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground pt-2">
          Thread <span className="font-medium text-foreground">“{thread?.title}”</span> akan
          dihapus permanen. Naskah tidak ikut berubah — hanya catatan thread yang hilang.
        </p>
        {state?.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
            {state.error}
          </div>
        )}
        <form action={formAction}>
          <input type="hidden" name="novel_id" value={novelId} />
          <input type="hidden" name="id" value={thread?.id || ""} />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isPending ? "Menghapus..." : "Hapus Thread"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
