"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSceneAction, updateSceneAction } from "@/server/actions/structure";
import type { Scene, Chapter } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, X, Plus, Edit2 } from "lucide-react";

interface SceneDialogProps {
  novelId: string;
  chapters?: Chapter[];
  scene?: Scene;
  defaultChapterId?: string;
  trigger?: React.ReactNode;
}

export default function SceneDialog({
  novelId,
  chapters = [],
  scene,
  defaultChapterId,
  trigger,
}: SceneDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!scene;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = isEditing
          ? await updateSceneAction(null, formData)
          : await createSceneAction(null, formData);

        if (res?.success) {
          setIsOpen(false);
          router.refresh();
        } else if (res?.error) {
          setError(res.error);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan adegan.");
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
          id="open-create-scene-btn"
          onClick={() => setIsOpen(true)}
          variant={isEditing ? "ghost" : "outline"}
          size="sm"
          className="text-xs h-7 flex items-center gap-1.5"
        >
          {isEditing ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isEditing ? "Edit Adegan" : "Tambah Adegan"}</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-paper overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h2 className="text-base font-serif font-medium">
                {isEditing ? "Edit Informasi Adegan" : "Tambah Adegan Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <input type="hidden" name="novel_id" value={novelId} />
                {isEditing && <input type="hidden" name="id" value={scene.id} />}

                <div className="space-y-1.5">
                  <label htmlFor="sc-title" className="font-medium text-foreground">
                    Judul Adegan <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="sc-title"
                    name="title"
                    defaultValue={scene?.title || ""}
                    placeholder="Contoh: Adegan 1: Penemuan di Arsip Terlarang"
                    required
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="sc-chapter" className="font-medium text-foreground">
                      Bab Pemilik <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="sc-chapter"
                      name="chapter_id"
                      defaultValue={scene?.chapter_id || defaultChapterId || chapters[0]?.id || ""}
                      required
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id} className="bg-card text-foreground">
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sc-status" className="font-medium text-foreground">
                      Status Adegan
                    </label>
                    <select
                      id="sc-status"
                      name="status"
                      defaultValue={scene?.status || "planned"}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="planned" className="bg-card text-foreground">Planned</option>
                      <option value="draft" className="bg-card text-foreground">Draft</option>
                      <option value="in_progress" className="bg-card text-foreground">In Progress</option>
                      <option value="revising" className="bg-card text-foreground">Revising</option>
                      <option value="completed" className="bg-card text-foreground">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sc-summary" className="font-medium text-foreground">
                    Ringkasan Adegan
                  </label>
                  <Textarea
                    id="sc-summary"
                    name="summary"
                    defaultValue={scene?.summary || ""}
                    placeholder="Apa aksi utama atau kejadian penting dalam adegan ini..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sc-purpose" className="font-medium text-foreground">
                    Tujuan Naratif (Purpose)
                  </label>
                  <Textarea
                    id="sc-purpose"
                    name="purpose"
                    defaultValue={scene?.purpose || ""}
                    placeholder="Mengapa adegan ini harus ada dalam naskah? Perubahan status/emosi apa yang terjadi..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

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
                  <Button id="submit-scene-btn" type="submit" size="sm" disabled={isPending}>
                    {isPending ? "Menyimpan..." : isEditing ? "Perbarui Adegan" : "Buat Adegan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
