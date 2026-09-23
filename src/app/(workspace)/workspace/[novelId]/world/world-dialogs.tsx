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
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  createWorldRuleAction,
  updateWorldRuleAction,
  deleteWorldRuleAction,
  createWorldLoreAction,
  updateWorldLoreAction,
  deleteWorldLoreAction,
  type WorldActionResult,
} from "@/server/actions/world";
import type { Location, WorldRule, WorldLore } from "@/types";
import { Trash2 } from "lucide-react";

// ==========================================
// 1. LOCATION FORM DIALOG
// ==========================================

interface LocationDialogProps {
  novelId: string;
  location?: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LocationFormDialog({
  novelId,
  location,
  isOpen,
  onClose,
  onSuccess,
}: LocationDialogProps) {
  const isEditing = Boolean(location);
  const action = isEditing ? updateLocationAction : createLocationAction;
  const [state, formAction, isPending] = useActionState<WorldActionResult | null, FormData>(
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
            {isEditing ? `Edit Lokasi: ${location?.name}` : "Tambah Lokasi Cerita Baru"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={location?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Nama Lokasi *</label>
            <Input
              name="name"
              defaultValue={location?.name || ""}
              placeholder="Mis: Arsip Terlarang Oakhaven"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Posisi Geografis / Letak</label>
            <Input
              name="geography"
              defaultValue={location?.geography || ""}
              placeholder="Mis: Tiga lantai di bawah Biara Santo Valen, Distrik Utara"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Suasana & Atmosfer Indrawi</label>
            <Textarea
              name="atmosphere"
              defaultValue={location?.atmosphere || ""}
              placeholder="Aroma lilin lebah dan debu kuno, dingin lembap, gema tetesan air..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Deskripsi Fisik</label>
            <Textarea
              name="description"
              defaultValue={location?.description || ""}
              placeholder="Langit-langit kubah batu andesit, rak buku menjulang hingga gelap..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Catatan Penulis / Pentingnya Lokasi</label>
            <Input
              name="notes"
              defaultValue={location?.notes || ""}
              placeholder="Hanya pejabat ordo dan kurator yang memiliki akses segel..."
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Lokasi" : "Simpan Lokasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 2. WORLD RULE FORM DIALOG
// ==========================================

interface WorldRuleDialogProps {
  novelId: string;
  rule?: WorldRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WorldRuleFormDialog({
  novelId,
  rule,
  isOpen,
  onClose,
  onSuccess,
}: WorldRuleDialogProps) {
  const isEditing = Boolean(rule);
  const action = isEditing ? updateWorldRuleAction : createWorldRuleAction;
  const [state, formAction, isPending] = useActionState<WorldActionResult | null, FormData>(
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
            {isEditing ? `Edit Aturan Dunia: ${rule?.title}` : "Tambah Aturan Dunia (World Rule)"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={rule?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Judul Aturan / Kaidah *</label>
            <Input
              name="title"
              defaultValue={rule?.title || ""}
              placeholder="Mis: Segel Perunggu Alkimia"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Kaidah Hukum / Batasan Cerita *</label>
            <Textarea
              name="rule"
              defaultValue={rule?.rule || ""}
              placeholder="Kaidah mutlak dalam dunia novel. Mis: Setiap dokumen hanya mencair jika disentuhkan intisari darah pewaris sah..."
              rows={3}
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Konsekuensi Pelanggaran & Catatan</label>
            <Textarea
              name="description"
              defaultValue={rule?.description || ""}
              placeholder="Jika dibuka secara paksa, serbuk asam akan membakar habis perkamen..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Tingkat Kepentingan Naratif (1 - 5)</label>
            <select
              name="importance"
              defaultValue={rule?.importance ?? 3}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
            >
              <option value="5">Tingkat 5 — Hukum Mutlak Dunia (Sangat Kritis)</option>
              <option value="4">Tingkat 4 — Hukum Kota / Faksi Utama</option>
              <option value="3">Tingkat 3 — Aturan Umum Masyarakat</option>
              <option value="2">Tingkat 2 — Norma / Kebiasaan Lokal</option>
              <option value="1">Tingkat 1 — Catatan Minor</option>
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Aturan" : "Simpan Aturan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 3. WORLD LORE FORM DIALOG
// ==========================================

interface WorldLoreDialogProps {
  novelId: string;
  lore?: WorldLore | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WorldLoreFormDialog({
  novelId,
  lore,
  isOpen,
  onClose,
  onSuccess,
}: WorldLoreDialogProps) {
  const isEditing = Boolean(lore);
  const action = isEditing ? updateWorldLoreAction : createWorldLoreAction;
  const [state, formAction, isPending] = useActionState<WorldActionResult | null, FormData>(
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
            {isEditing ? `Edit Lore: ${lore?.title}` : "Tambah Catatan Lore & Ensiklopedia"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={lore?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Kategori Lore *</label>
              <select
                name="category"
                defaultValue={lore?.category || "Sejarah & Politik"}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
              >
                <option value="Sejarah & Politik">Sejarah & Politik</option>
                <option value="Sistem Alkimia / Sihir">Sistem Alkimia / Sihir</option>
                <option value="Geografi & Kota">Geografi & Kota</option>
                <option value="Budaya & Agama">Budaya & Agama</option>
                <option value="Misteri & Mitologi">Misteri & Mitologi</option>
                <option value="Faksi & Organisasi">Faksi & Organisasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Judul Artikel Lore *</label>
              <Input
                name="title"
                defaultValue={lore?.title || ""}
                placeholder="Mis: Asal-Usul Tiga Segel"
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Isi Artikel Lore & Fakta Cerita *</label>
            <Textarea
              name="content"
              defaultValue={lore?.content || ""}
              placeholder="Tuliskan pengetahuan, sejarah masa lalu, atau rincian dunia yang mendasari latar novel..."
              rows={6}
              required
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Lore" : "Simpan Lore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 4. WORLD DELETE CONFIRMATION DIALOG
// ==========================================

interface WorldDeleteDialogProps {
  novelId: string;
  targetId: string;
  targetName: string;
  type: "location" | "rule" | "lore";
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WorldDeleteConfirmDialog({
  novelId,
  targetId,
  targetName,
  type,
  isOpen,
  onClose,
  onSuccess,
}: WorldDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("novel_id", novelId);
      formData.set("id", targetId);

      let res: WorldActionResult;
      if (type === "location") {
        res = await deleteLocationAction(formData);
      } else if (type === "rule") {
        res = await deleteWorldRuleAction(formData);
      } else {
        res = await deleteWorldLoreAction(formData);
      }

      if (res.success) {
        onClose();
        onSuccess?.();
      } else {
        setError(res.error || "Gagal menghapus.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getLabel = () => {
    if (type === "location") return "Lokasi";
    if (type === "rule") return "Aturan Dunia";
    return "Artikel Lore";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Hapus {getLabel()}?</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground">
          <p>
            Apakah Anda yakin ingin menghapus {getLabel().toLowerCase()}{" "}
            <strong className="text-foreground">{targetName}</strong>?
          </p>
          {type === "location" && (
            <p className="text-[11px] bg-muted/60 p-2.5 rounded-lg border border-border/60">
              Catatan: Adegan naskah yang menggunakan lokasi ini tidak akan terhapus. Referensi lokasi adegan akan dikosongkan secara aman.
            </p>
          )}
          {error && <div className="text-destructive font-medium">{error}</div>}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
