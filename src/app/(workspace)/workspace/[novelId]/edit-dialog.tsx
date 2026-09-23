"use client";

import React, { useState, useActionState } from "react";
import { updateNovelAction, type NovelActionResult } from "@/server/actions/novels";
import type { Novel } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, AlertCircle, X } from "lucide-react";

interface NovelEditDialogProps {
  novel: Novel;
}

export default function NovelEditDialog({ novel }: NovelEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction, isPending] = useActionState<NovelActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await updateNovelAction(prev, formData);
      if (res?.success) {
        setIsOpen(false);
      }
      return res;
    },
    null
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="text-xs h-8 flex items-center gap-1.5"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Edit Informasi
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-xl shadow-paper overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h2 className="text-base font-serif font-medium">Edit Informasi Novel</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {state?.error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <form id="edit-novel-form" action={formAction} className="space-y-4 text-xs">
                <input type="hidden" name="id" value={novel.id} />

                <div className="space-y-1.5">
                  <label htmlFor="edit-title" className="font-medium text-foreground">
                    Judul Novel
                  </label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={novel.title}
                    required
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-genre" className="font-medium text-foreground">
                      Genre
                    </label>
                    <Input
                      id="edit-genre"
                      name="genre"
                      defaultValue={novel.genre || ""}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-status" className="font-medium text-foreground">
                      Status Penulisan
                    </label>
                    <select
                      id="edit-status"
                      name="status"
                      defaultValue={novel.status}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="planning" className="bg-card text-foreground">Planning</option>
                      <option value="in_progress" className="bg-card text-foreground">In Progress</option>
                      <option value="first_draft" className="bg-card text-foreground">First Draft</option>
                      <option value="revising" className="bg-card text-foreground">Revising</option>
                      <option value="completed" className="bg-card text-foreground">Completed</option>
                      <option value="archived" className="bg-card text-foreground">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-target-word-count" className="font-medium text-foreground">
                    Target Kata
                  </label>
                  <Input
                    id="edit-target-word-count"
                    name="target_word_count"
                    type="number"
                    defaultValue={novel.target_word_count}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-premise" className="font-medium text-foreground">
                    Premis Cerita
                  </label>
                  <Textarea
                    id="edit-premise"
                    name="premise"
                    rows={3}
                    defaultValue={novel.premise || ""}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-theme" className="font-medium text-foreground">
                      Tema
                    </label>
                    <Input
                      id="edit-theme"
                      name="theme"
                      defaultValue={novel.theme || ""}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-tone" className="font-medium text-foreground">
                      Nada (Tone)
                    </label>
                    <Input
                      id="edit-tone"
                      name="tone"
                      defaultValue={novel.tone || ""}
                      className="text-sm"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-border/60 flex justify-end gap-2 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                form="edit-novel-form"
                size="sm"
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
