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
  createCharacterAction,
  updateCharacterAction,
  deleteCharacterAction,
  createRelationshipAction,
  updateRelationshipAction,
  deleteRelationshipAction,
  type CharacterActionResult,
} from "@/server/actions/characters";
import type { Character, CharacterRelationship } from "@/types";
import { Trash2 } from "lucide-react";

// ==========================================
// 1. CHARACTER FORM DIALOG (ADD / EDIT)
// ==========================================

interface CharacterDialogProps {
  novelId: string;
  character?: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CharacterFormDialog({
  novelId,
  character,
  isOpen,
  onClose,
  onSuccess,
}: CharacterDialogProps) {
  const isEditing = Boolean(character);
  const action = isEditing ? updateCharacterAction : createCharacterAction;
  const [state, formAction, isPending] = useActionState<CharacterActionResult | null, FormData>(
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEditing ? `Edit Karakter: ${character?.name}` : "Tambah Karakter Baru"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-6 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={character?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          {/* Bagian 1: Identitas & Peran */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground uppercase tracking-wider text-[11px] border-b border-border/60 pb-1">
              1. Identitas & Peran Cerita
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Nama Karakter *</label>
                <Input
                  name="name"
                  defaultValue={character?.name || ""}
                  placeholder="Mis: Kaelen Voss"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Peran Naratif</label>
                <select
                  name="role"
                  defaultValue={character?.role || "supporting"}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="protagonist">Protagonis (Tokoh Utama)</option>
                  <option value="antagonist">Antagonis (Konflik Utama)</option>
                  <option value="deuteragonist">Deuteragonis (Sekutu Kunci)</option>
                  <option value="supporting">Karakter Pendukung</option>
                  <option value="minor">Karakter Minor / Figuran</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Usia / Rentang Usia</label>
                <Input
                  name="age"
                  defaultValue={character?.age || ""}
                  placeholder="Mis: 23 tahun, remaja akhir"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Profesi / Keahlian</label>
                <Input
                  name="occupation"
                  defaultValue={character?.occupation || ""}
                  placeholder="Mis: Peneliti Arsip, Kurir Bayangan"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Ciri Fisik & Penampilan</label>
              <Textarea
                name="description"
                defaultValue={character?.description || ""}
                placeholder="Rambut, postur tubuh, pakaian khas, atau bekas luka yang mudah dikenali..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Bagian 2: Psikologi & Motivasi */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground uppercase tracking-wider text-[11px] border-b border-border/60 pb-1">
              2. Psikologi, Nilai & Motivasi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Tujuan Utama (Goal)</label>
                <Input
                  name="goal"
                  defaultValue={character?.goal || ""}
                  placeholder="Apa yang paling ingin dicapai?"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Motivasi Emosional</label>
                <Input
                  name="motivation"
                  defaultValue={character?.motivation || ""}
                  placeholder="Mengapa tujuan itu sangat berarti baginya?"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Ketakutan Terbesar (Fear)</label>
                <Input
                  name="fear"
                  defaultValue={character?.fear || ""}
                  placeholder="Hal terburuk yang ia hindari..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Rahasia Terpendam (Secret)</label>
                <Input
                  name="secret"
                  defaultValue={character?.secret || ""}
                  placeholder="Fakta masa lalu yang ia sembunyikan..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Kekuatan Utama</label>
                <Input
                  name="strengths"
                  defaultValue={character?.strengths || ""}
                  placeholder="Keahlian, kecerdasan deduksi, dll."
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-muted-foreground">Kelemahan / Cacat Fatal</label>
                <Input
                  name="weaknesses"
                  defaultValue={character?.weaknesses || ""}
                  placeholder="Gegabah, keras kepala, dll."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Kepribadian & Perilaku Khas</label>
              <Textarea
                name="personality"
                defaultValue={character?.personality || ""}
                placeholder="Cara bertutur kata, kebiasaan gugup, temperamen emosional..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Bagian 3: Latar Belakang & Busur */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground uppercase tracking-wider text-[11px] border-b border-border/60 pb-1">
              3. Latar Belakang & Busur Karakter (Arc)
            </h3>
            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">Latar Belakang Masa Lalu (Backstory)</label>
              <Textarea
                name="backstory"
                defaultValue={character?.backstory || ""}
                placeholder="Peristiwa penting sebelum cerita novel dimulai..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-muted-foreground">
                Busur Karakter (Perjalanan Perubahan)
              </label>
              <Textarea
                name="character_arc"
                defaultValue={character?.character_arc || ""}
                placeholder="Awal: Keadaan mula-mula -> Tengah: Ujian krisis -> Akhir: Transformasi diri..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Karakter" : "Simpan Karakter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 2. RELATIONSHIP FORM DIALOG (ADD / EDIT)
// ==========================================

interface RelationshipDialogProps {
  novelId: string;
  characters: Character[];
  relationship?: CharacterRelationship | null;
  defaultFromCharacterId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RelationshipFormDialog({
  novelId,
  characters,
  relationship,
  defaultFromCharacterId,
  isOpen,
  onClose,
  onSuccess,
}: RelationshipDialogProps) {
  const isEditing = Boolean(relationship);
  const action = isEditing ? updateRelationshipAction : createRelationshipAction;
  const [state, formAction, isPending] = useActionState<CharacterActionResult | null, FormData>(
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">
            {isEditing ? "Edit Relasi Antar Karakter" : "Tambah Relasi Karakter"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={relationship?.id} />}

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {state.error}
            </div>
          )}

          {!isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Karakter Asal *</label>
                <select
                  name="from_character_id"
                  defaultValue={relationship?.from_character_id || defaultFromCharacterId || ""}
                  required
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="" disabled>Pilih Karakter</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Karakter Target *</label>
                <select
                  name="to_character_id"
                  defaultValue={relationship?.to_character_id || ""}
                  required
                  className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="" disabled>Pilih Karakter</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
              <span className="text-muted-foreground">Relasi antara:</span>
              <div className="font-semibold text-foreground mt-0.5">
                {relationship?.from_character_name} &rarr; {relationship?.to_character_name}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Tipe Hubungan</label>
            <select
              name="relationship_type"
              defaultValue={relationship?.relationship_type || "friend"}
              className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs"
            >
              <option value="ally">Sekutu (Ally)</option>
              <option value="friend">Sahabat (Friend)</option>
              <option value="mentor">Guru / Mentor</option>
              <option value="family">Keluarga / Saudara</option>
              <option value="love_interest">Kisah Romansa (Love Interest)</option>
              <option value="rival">Rival / Pesaing</option>
              <option value="enemy">Musuh Bebuyutan (Enemy)</option>
              <option value="custom">Lainnya / Khusus</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Deskripsi Relasi</label>
            <Input
              name="description"
              defaultValue={relationship?.description || ""}
              placeholder="Mis: Kemitraan darurat di tengah pelarian"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Sejarah Masa Lalu Relasi</label>
            <Textarea
              name="history"
              defaultValue={relationship?.history || ""}
              placeholder="Bagaimana mereka pertama kali bertemu atau bagaimana ikatan ini terbentuk?"
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-muted-foreground">Keadaan Saat Ini (Tensi)</label>
            <Input
              name="current_state"
              defaultValue={relationship?.current_state || ""}
              placeholder="Mis: Saling waspada, mulai tumbuh rasa percaya"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan..." : isEditing ? "Perbarui Relasi" : "Simpan Relasi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 3. DELETE CONFIRMATION DIALOG
// ==========================================

interface DeleteDialogProps {
  novelId: string;
  targetId: string;
  targetName: string;
  type: "character" | "relationship";
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteConfirmDialog({
  novelId,
  targetId,
  targetName,
  type,
  isOpen,
  onClose,
  onSuccess,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("novel_id", novelId);
      formData.set("id", targetId);

      const res =
        type === "character"
          ? await deleteCharacterAction(formData)
          : await deleteRelationshipAction(formData);

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

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Hapus {type === "character" ? "Karakter" : "Relasi"}?</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground">
          <p>
            Apakah Anda yakin ingin menghapus{" "}
            <strong className="text-foreground">{targetName}</strong>?
          </p>
          {type === "character" && (
            <p className="text-[11px] bg-muted/60 p-2.5 rounded-lg border border-border/60">
              Catatan: Adegan naskah tidak akan terhapus. Referensi POV pada adegan terkait akan
              dikosongkan secara aman.
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
