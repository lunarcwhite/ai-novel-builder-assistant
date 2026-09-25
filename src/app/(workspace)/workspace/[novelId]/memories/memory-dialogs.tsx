"use client";

import React, { useActionState, useEffect, useState, useRef } from "react";
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
  createMemoryAction,
  updateMemoryAction,
  deleteMemoryAction,
  checkDuplicateMemoryAction,
  type MemoryActionResult,
} from "@/server/actions/memories";
import type {
  StoryMemory,
  MemoryType,
  MemoryStatus,
  MemorySourceType,
  Character,
  Location,
} from "@/types";
import { AlertCircle, Trash2, Star, BrainCircuit, Check, Link as LinkIcon } from "lucide-react";

interface SceneOption {
  id: string;
  title: string;
  chapterTitle?: string;
}

interface MemoryFormDialogProps {
  novelId: string;
  memory?: StoryMemory | null;
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  locations: Location[];
  scenes: SceneOption[];
  onSuccess?: () => void;
}

const MEMORY_TYPES: { value: MemoryType; label: string; desc: string }[] = [
  { value: "character_fact", label: "Fakta Karakter", desc: "Sifat, trauma, ciri fisik, rahasia personal" },
  { value: "relationship_fact", label: "Fakta Hubungan", desc: "Ikatan emosional, dendam, janji, hutang budi" },
  { value: "world_fact", label: "Fakta Dunia & Hukum", desc: "Sihir, teknologi, geografi, pantangan semesta" },
  { value: "timeline_fact", label: "Kronologi & Waktu", desc: "Urutan kejadian, masa lalu, jarak waktu" },
  { value: "plot_fact", label: "Plot & Konspirasi", desc: "Motif rahasia, intrik faksi, petunjuk misteri" },
  { value: "story_fact", label: "Fakta Cerita Umum", desc: "Keadaan naskah, keputusan adegan, detail umum" },
];

export function MemoryFormDialog({
  novelId,
  memory,
  isOpen,
  onClose,
  characters,
  locations,
  scenes,
  onSuccess,
}: MemoryFormDialogProps) {
  const isEditing = Boolean(memory);
  const action = isEditing ? updateMemoryAction : createMemoryAction;
  const [state, formAction, isPending] = useActionState<MemoryActionResult | null, FormData>(
    action,
    null
  );

  // Form interactive state
  const [content, setContent] = useState<string>(memory?.content || "");
  const [type, setType] = useState<MemoryType>(memory?.type || "story_fact");
  const [importance, setImportance] = useState<number>(memory?.importance || 3);
  const [status, setStatus] = useState<MemoryStatus>(memory?.status || "confirmed");
  const [sourceType, setSourceType] = useState<MemorySourceType>(memory?.source_type || "manual");
  const [sourceId, setSourceId] = useState<string>(memory?.source_id || "");
  const [selectedChars, setSelectedChars] = useState<string[]>(
    memory?.metadata?.character_ids || []
  );
  const [selectedLocs, setSelectedLocs] = useState<string[]>(
    memory?.metadata?.location_ids || []
  );
  const [tags, setTags] = useState<string>(
    memory?.metadata?.tags?.join(", ") || ""
  );

  // Live duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset or initialize when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setContent(memory?.content || "");
      setType(memory?.type || "story_fact");
      setImportance(memory?.importance || 3);
      setStatus(memory?.status || "confirmed");
      setSourceType(memory?.source_type || "manual");
      setSourceId(memory?.source_id || "");
      setSelectedChars(memory?.metadata?.character_ids || []);
      setSelectedLocs(memory?.metadata?.location_ids || []);
      setTags(memory?.metadata?.tags?.join(", ") || "");
      setDuplicateWarning(null);
    }
  }, [isOpen, memory]);

  useEffect(() => {
    if (state?.success) {
      onClose();
      onSuccess?.();
    }
  }, [state, onClose, onSuccess]);

  // Handle live content change and duplicate check
  const handleContentChange = (val: string) => {
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 10 && !isEditing) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await checkDuplicateMemoryAction(novelId, val);
          if (res.isDuplicate && res.warningMessage) {
            setDuplicateWarning(res.warningMessage);
          } else {
            setDuplicateWarning(null);
          }
        } catch {
          setDuplicateWarning(null);
        }
      }, 500);
    } else {
      setDuplicateWarning(null);
    }
  };

  const toggleChar = (charId: string) => {
    setSelectedChars((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const toggleLoc = (locId: string) => {
    setSelectedLocs((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            {isEditing ? "Edit Memori Cerita" : "Catat Memori Cerita Baru"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Simpan fakta kanon, detail karakter, atau kaidah semesta agar AI dapat mengidentifikasi kebenaran cerita.
          </p>
        </DialogHeader>

        <form action={formAction} className="space-y-4 py-2 text-xs">
          <input type="hidden" name="novel_id" value={novelId} />
          {isEditing && <input type="hidden" name="id" value={memory?.id} />}
          <input type="hidden" name="importance" value={importance} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="source_type" value={sourceType} />
          <input type="hidden" name="source_id" value={sourceId} />
          {selectedChars.map((cid) => (
            <input key={`char_${cid}`} type="hidden" name="character_ids" value={cid} />
          ))}
          {selectedLocs.map((lid) => (
            <input key={`loc_${lid}`} type="hidden" name="location_ids" value={lid} />
          ))}

          {/* Error Message */}
          {state?.error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Kategori Memori</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MEMORY_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    type === t.value
                      ? "border-primary bg-primary/10 text-foreground font-medium shadow-2xs"
                      : "border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold text-foreground text-xs">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Memory Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-foreground">
                Konten / Pernyataan Fakta <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">
                Tulis pernyataan fakta yang jelas dan objektif
              </span>
            </div>
            <Textarea
              name="content"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Contoh: Kaelen memiliki bekas luka bakar di bahu kanan akibat ledakan Oakhaven..."
              rows={3}
              required
              className="resize-none font-sans leading-relaxed text-xs"
            />
          </div>

          {/* Duplicate Warning Alert */}
          {duplicateWarning && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Potensi Duplikasi / Kemiripan Fakta
                </span>
                <p className="text-[11px] leading-relaxed">{duplicateWarning}</p>
                <p className="text-[10px] text-muted-foreground">
                  Catatan: Anda tetap dapat menyimpan fakta ini jika ini merupakan detail berbeda atau konfirmasi fakta terpisah.
                </p>
              </div>
            </div>
          )}

          {/* Importance & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Importance (1-5) */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center justify-between">
                <span>Tingkat Kepentingan:</span>
                <span className="font-semibold text-primary">Level {importance}</span>
              </label>
              <div className="flex items-center gap-1.5 p-2 rounded-lg border border-border/70 bg-card">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setImportance(lvl)}
                    className={`flex-1 py-1.5 rounded flex items-center justify-center transition-all ${
                      lvl <= importance
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={`Penting Level ${lvl}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${lvl <= importance ? "fill-primary-foreground" : ""}`} />
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {importance === 1 && "Detail kecil / observasi sekilas"}
                {importance === 2 && "Informasi latar sampingan"}
                {importance === 3 && "Fakta kanon standar"}
                {importance === 4 && "Informasi krusial bagi kelanjutan plot"}
                {importance === 5 && "Pilar absolut cerita / fondasi semesta"}
              </span>
            </div>

            {/* Status (confirmed, proposed, archived, rejected) */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Status Otoritas</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemoryStatus)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="confirmed">Terkonfirmasi (Kanon Penulis)</option>
                <option value="proposed">Usulan (Kandidat Naskah / AI)</option>
                <option value="archived">Diarsipkan (Kondisi Masa Lalu)</option>
                <option value="rejected">Ditolak (Bukan Kanon)</option>
              </select>
              <span className="text-[10px] text-muted-foreground block">
                AI hanya akan menganggap fakta &quot;Terkonfirmasi&quot; sebagai kebenaran mutlak.
              </span>
            </div>
          </div>

          {/* Source Attribution */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              <span>Sumber Asal Usul Fakta (Source Attribution)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Tipe Sumber:</span>
                <select
                  value={sourceType}
                  onChange={(e) => {
                    const newType = e.target.value as MemorySourceType;
                    setSourceType(newType);
                    if (newType !== "scene") setSourceId("");
                  }}
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none"
                >
                  <option value="manual">Manual oleh Penulis</option>
                  <option value="scene">Adegan Naskah Tertentu</option>
                  <option value="chapter">Bab Tertentu</option>
                  <option value="character">Profil Karakter</option>
                  <option value="world_rule">Aturan Dunia Semesta</option>
                  <option value="timeline_event">Peristiwa Kronologi</option>
                  <option value="ai_extraction">Hasil Ekstraksi AI</option>
                </select>
              </div>

              {sourceType === "scene" && (
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Pilih Adegan:</span>
                  <select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-2xs focus-visible:outline-none"
                  >
                    <option value="">-- Tanpa tautan adegan spesifik --</option>
                    {scenes.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.chapterTitle ? `${sc.chapterTitle}: ` : ""}
                        {sc.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Linked Entities (Characters & Locations) */}
          <div className="space-y-2.5 pt-2 border-t border-border/50">
            <div>
              <span className="font-medium text-foreground block mb-1.5">Tautkan Karakter Terkait:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-md border border-border/60 bg-muted/20">
                {characters.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground">Belum ada karakter tersimpan.</span>
                ) : (
                  characters.map((c) => {
                    const isSelected = selectedChars.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChar(c.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors border ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background text-muted-foreground border-border/60 hover:text-foreground"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{c.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <span className="font-medium text-foreground block mb-1.5">Tautkan Lokasi Terkait:</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-md border border-border/60 bg-muted/20">
                {locations.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground">Belum ada lokasi tersimpan.</span>
                ) : (
                  locations.map((loc) => {
                    const isSelected = selectedLocs.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => toggleLoc(loc.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors border ${
                          isSelected
                            ? "bg-accent text-accent-foreground border-accent font-medium"
                            : "bg-background text-muted-foreground border-border/60 hover:text-foreground"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{loc.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">Tag Kata Kunci (opsional)</label>
              <Input
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="misal: trauma, artefak, masa-lalu, faksi-ordo"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Menyimpan & Menghitung Embedding..." : isEditing ? "Simpan Perubahan" : "Simpan Memori"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 2. DELETE CONFIRMATION DIALOG
// ==========================================

interface DeleteMemoryDialogProps {
  novelId: string;
  memory: StoryMemory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteMemoryDialog({
  novelId,
  memory,
  isOpen,
  onClose,
  onSuccess,
}: DeleteMemoryDialogProps) {
  const [state, formAction, isPending] = useActionState<MemoryActionResult | null, FormData>(
    deleteMemoryAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
      onSuccess?.();
    }
  }, [state, onClose, onSuccess]);

  if (!memory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Hapus Memori Cerita?
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-xs space-y-3">
          <p className="text-muted-foreground leading-relaxed">
            Apakah Anda yakin ingin menghapus fakta ini dari Story Memory? Tindakan ini akan menghapus catatan dan vektor embedding dari basis pengetahuan.
          </p>
          <div className="p-3 rounded-lg border border-border/80 bg-muted/30 italic text-foreground text-xs leading-relaxed">
            &quot;{memory.content}&quot;
          </div>
        </div>

        {state?.error && (
          <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="novel_id" value={novelId} />
          <input type="hidden" name="id" value={memory.id} />

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus Memori"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
