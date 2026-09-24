"use client";

import React, { useActionState, useEffect, useState } from "react";
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
  createTimelineEventAction,
  updateTimelineEventAction,
  deleteTimelineEventAction,
  type TimelineActionResult,
} from "@/server/actions/plot";
import type { Location, TimelineEvent, TimelinePrecision } from "@/types";
import { Trash2 } from "lucide-react";

interface ChapterOption {
  id: string;
  title: string;
}

const PRECISION_OPTIONS: { value: TimelinePrecision; label: string }[] = [
  { value: "unknown", label: "Belum pasti" },
  { value: "relative", label: "Relatif (mis: 3 hari setelah...)" },
  { value: "exact", label: "Tepat (tanggal fiksinya jelas)" },
  { value: "day", label: "Hari" },
  { value: "month", label: "Bulan" },
  { value: "year", label: "Tahun" },
];

interface TimelineEventFormDialogProps {
  novelId: string;
  event?: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterOption[];
  locations: Location[];
  onSuccess?: () => void;
}

export function TimelineEventFormDialog({
  novelId,
  event,
  isOpen,
  onClose,
  chapters,
  locations,
  onSuccess,
}: TimelineEventFormDialogProps) {
  const isEditing = Boolean(event);
  const action = isEditing ? updateTimelineEventAction : createTimelineEventAction;
  const [state, formAction, isPending] = useActionState<TimelineActionResult | null, FormData>(
    action,
    null
  );
  const [precision, setPrecision] = useState<TimelinePrecision>(event?.date_precision || "unknown");

  useEffect(() => {
    if (isOpen) setPrecision(event?.date_precision || "unknown");
  }, [isOpen, event?.date_precision]);

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
            {isEditing ? `Edit Peristiwa: ${event?.title}` : "Tambah Peristiwa Timeline"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={event?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Judul Peristiwa *</label>
            <Input
              name="title"
              defaultValue={event?.title || ""}
              placeholder="Mis: Insiden rumah sakit — Hari ke-47"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Deskripsi</label>
            <Textarea
              name="description"
              defaultValue={event?.description || ""}
              placeholder="Apa yang terjadi, siapa yang terlibat, akibatnya..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Presisi Waktu</label>
              <select
                name="date_precision"
                value={precision}
                onChange={(e) => setPrecision(e.target.value as TimelinePrecision)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {PRECISION_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {precision !== "unknown" && precision !== "relative" ? (
              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Nilai Tanggal *</label>
                <Input
                  name="date_value"
                  defaultValue={event?.date_value || ""}
                  placeholder="Mis: Hari ke-47 / 12 Maret Tahun 3"
                  className="h-8 text-xs"
                />
              </div>
            ) : precision === "relative" ? (
              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Waktu Relatif *</label>
                <Input
                  name="relative_time"
                  defaultValue={event?.relative_time || ""}
                  placeholder="Mis: 3 hari setelah insiden rumah sakit"
                  className="h-8 text-xs"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Catatan Waktu</label>
                <Input
                  name="relative_time"
                  defaultValue={event?.relative_time || ""}
                  placeholder="Opsional — mis: sebelum perang"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Tertaut ke Bab</label>
              <select
                name="chapter_id"
                defaultValue={event?.chapter_id || ""}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">— Tidak tertaut —</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Tertaut ke Lokasi</label>
              <select
                name="location_id"
                defaultValue={event?.location_id || ""}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">— Tidak tertaut —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
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
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Peristiwa" : "Simpan Peristiwa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTimelineEventDialogProps {
  novelId: string;
  event?: TimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteTimelineEventDialog({
  novelId,
  event,
  isOpen,
  onClose,
  onSuccess,
}: DeleteTimelineEventDialogProps) {
  const [state, formAction, isPending] = useActionState<TimelineActionResult | null, FormData>(
    deleteTimelineEventAction,
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
          <DialogTitle className="font-serif text-lg">Hapus Peristiwa?</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground pt-2">
          Peristiwa <span className="font-medium text-foreground">“{event?.title}”</span> akan
          dihapus permanen. Naskah tidak ikut berubah.
        </p>
        {state?.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs">
            {state.error}
          </div>
        )}
        <form action={formAction}>
          <input type="hidden" name="novel_id" value={novelId} />
          <input type="hidden" name="id" value={event?.id || ""} />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isPending ? "Menghapus..." : "Hapus Peristiwa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
