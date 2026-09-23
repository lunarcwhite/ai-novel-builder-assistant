"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChapterAction, updateChapterAction } from "@/server/actions/structure";
import type { Chapter, Act } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, X, Plus, Edit2 } from "lucide-react";

interface ChapterDialogProps {
  novelId: string;
  acts?: Act[];
  chapter?: Chapter;
  defaultActId?: string | null;
  trigger?: React.ReactNode;
}

export default function ChapterDialog({
  novelId,
  acts = [],
  chapter,
  defaultActId,
  trigger,
}: ChapterDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!chapter;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = isEditing
          ? await updateChapterAction(null, formData)
          : await createChapterAction(null, formData);

        if (res?.success) {
          setIsOpen(false);
          router.refresh();
        } else if (res?.error) {
          setError(res.error);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan bab.");
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
          id="open-create-chapter-btn"
          onClick={() => setIsOpen(true)}
          variant={isEditing ? "ghost" : "outline"}
          size="sm"
          className="text-xs h-8 flex items-center gap-1.5"
        >
          {isEditing ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isEditing ? "Edit Bab" : "Tambah Bab"}</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-paper overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h2 className="text-base font-serif font-medium">
                {isEditing ? "Edit Informasi Bab" : "Tambah Bab Baru"}
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
                {isEditing && <input type="hidden" name="id" value={chapter.id} />}

                <div className="space-y-1.5">
                  <label htmlFor="ch-title" className="font-medium text-foreground">
                    Judul Bab <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="ch-title"
                    name="title"
                    defaultValue={chapter?.title || ""}
                    placeholder="Contoh: Bab 1: Segel Bertinta Perak"
                    required
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="ch-act" className="font-medium text-foreground">
                      Babak / Act
                    </label>
                    <select
                      id="ch-act"
                      name="act_id"
                      defaultValue={chapter?.act_id || defaultActId || ""}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="" className="bg-card text-foreground">
                        — Tanpa Babak (Unassigned) —
                      </option>
                      {acts.map((act) => (
                        <option key={act.id} value={act.id} className="bg-card text-foreground">
                          {act.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ch-status" className="font-medium text-foreground">
                      Status Bab
                    </label>
                    <select
                      id="ch-status"
                      name="status"
                      defaultValue={chapter?.status || "planned"}
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
                  <label htmlFor="ch-summary" className="font-medium text-foreground">
                    Ringkasan Bab
                  </label>
                  <Textarea
                    id="ch-summary"
                    name="summary"
                    defaultValue={chapter?.summary || ""}
                    placeholder="Gambaran umum peristiwa yang terjadi dalam bab ini..."
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="ch-objective" className="font-medium text-foreground">
                      Tujuan (Objective)
                    </label>
                    <Input
                      id="ch-objective"
                      name="objective"
                      defaultValue={chapter?.objective || ""}
                      placeholder="Apa yang ingin dicapai tokoh..."
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ch-conflict" className="font-medium text-foreground">
                      Konflik / Hambatan
                    </label>
                    <Input
                      id="ch-conflict"
                      name="conflict"
                      defaultValue={chapter?.conflict || ""}
                      placeholder="Apa yang menghalangi tujuan..."
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="ch-beat" className="font-medium text-foreground">
                      Emotional Beat
                    </label>
                    <Input
                      id="ch-beat"
                      name="emotional_beat"
                      defaultValue={chapter?.emotional_beat || ""}
                      placeholder="Nada emosi adegan/bab..."
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ch-outcome" className="font-medium text-foreground">
                      Hasil / Outcome
                    </label>
                    <Input
                      id="ch-outcome"
                      name="outcome"
                      defaultValue={chapter?.outcome || ""}
                      placeholder="Bagaimana bab ini berakhir..."
                      className="text-sm"
                    />
                  </div>
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
                  <Button id="submit-chapter-btn" type="submit" size="sm" disabled={isPending}>
                    {isPending ? "Menyimpan..." : isEditing ? "Perbarui Bab" : "Buat Bab"}
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
