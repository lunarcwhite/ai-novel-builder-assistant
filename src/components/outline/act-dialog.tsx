"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createActAction, updateActAction } from "@/server/actions/structure";
import type { Act } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, X, Plus, Edit2 } from "lucide-react";

interface ActDialogProps {
  novelId: string;
  act?: Act;
  trigger?: React.ReactNode;
}

export default function ActDialog({ novelId, act, trigger }: ActDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!act;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = isEditing
          ? await updateActAction(null, formData)
          : await createActAction(null, formData);

        if (res?.success) {
          setIsOpen(false);
          router.refresh();
        } else if (res?.error) {
          setError(res.error);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan babak.");
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
          id="open-create-act-btn"
          onClick={() => setIsOpen(true)}
          variant={isEditing ? "ghost" : "outline"}
          size="sm"
          className="text-xs h-8 flex items-center gap-1.5"
        >
          {isEditing ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isEditing ? "Edit Babak" : "Tambah Act"}</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-xl shadow-paper overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h2 className="text-base font-serif font-medium">
                {isEditing ? "Edit Babak (Act)" : "Tambah Babak Baru (Act)"}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <input type="hidden" name="novel_id" value={novelId} />
                {isEditing && <input type="hidden" name="id" value={act.id} />}

                <div className="space-y-1.5">
                  <label htmlFor="act-title" className="font-medium text-foreground">
                    Judul Babak / Act <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="act-title"
                    name="title"
                    defaultValue={act?.title || ""}
                    placeholder="Contoh: Act I — Permulaan & Titik Balik"
                    required
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="act-desc" className="font-medium text-foreground">
                    Deskripsi / Tujuan Naratif Babak
                  </label>
                  <Textarea
                    id="act-desc"
                    name="description"
                    defaultValue={act?.description || ""}
                    placeholder="Jelaskan peran babak ini dalam perjalanan protagonis..."
                    rows={3}
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
                  <Button id="submit-act-btn" type="submit" size="sm" disabled={isPending}>
                    {isPending ? "Menyimpan..." : isEditing ? "Perbarui Babak" : "Buat Babak"}
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
