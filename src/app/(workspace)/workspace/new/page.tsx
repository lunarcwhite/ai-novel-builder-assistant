"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { createNovelAction, type NovelActionResult } from "@/server/actions/novels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, BookPlus, AlertCircle, Compass } from "lucide-react";

export default function NewNovelPage() {
  const [state, formAction, isPending] = useActionState<NovelActionResult | null, FormData>(
    createNovelAction,
    null
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Koleksi Novel
        </Link>
      </div>

      <Card className="border-border/80 shadow-paper">
        <CardHeader className="space-y-1 pb-4">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
            <BookPlus className="w-4 h-4" />
          </div>
          <CardTitle className="text-xl font-serif font-normal">Rancang Novel Baru</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Definisikan fondasi cerita awal Anda. Detail ini akan menjadi sumber pemahaman konteks bagi AI Story Intelligence.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form id="create-novel-form" action={formAction} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-medium text-foreground">
                Judul Novel <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Contoh: Bayang Kota Tua"
                required
                className="text-sm font-medium"
              />
            </div>

            {/* Genre & Target Word Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="genre" className="text-xs font-medium text-foreground">
                  Genre Utama
                </label>
                <Input
                  id="genre"
                  name="genre"
                  placeholder="Contoh: Fantasy / Mystery / Sci-Fi"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="target_word_count" className="text-xs font-medium text-foreground">
                  Target Kata (Word Count)
                </label>
                <Input
                  id="target_word_count"
                  name="target_word_count"
                  type="number"
                  defaultValue={50000}
                  min={1000}
                  step={1000}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Premise */}
            <div className="space-y-1.5">
              <label htmlFor="premise" className="text-xs font-medium text-foreground">
                Premis Cerita (Logline)
              </label>
              <Textarea
                id="premise"
                name="premise"
                rows={3}
                placeholder="Apa inti konflik cerita ini? Siapa protagonisnya, apa tantangannya, dan apa taruhannya?"
                className="text-sm leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                Premis membantu AI memahami tujuan naratif utama cerita Anda saat memberikan saran.
              </p>
            </div>

            {/* Theme & Tone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="theme" className="text-xs font-medium text-foreground">
                  Tema Inti
                </label>
                <Input
                  id="theme"
                  name="theme"
                  placeholder="Contoh: Penebusan, Pengorbanan, Kebenaran"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tone" className="text-xs font-medium text-foreground">
                  Nada & Gaya Bahasa (Tone)
                </label>
                <Input
                  id="tone"
                  name="tone"
                  placeholder="Contoh: Gelap, Puitis, Cepat, Reflektif"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-1.5">
              <label htmlFor="target_audience" className="text-xs font-medium text-foreground">
                Target Pembaca
              </label>
              <Input
                id="target_audience"
                name="target_audience"
                placeholder="Contoh: Young Adult / Pembaca fiksi dewasa / Penggemar thriller"
                className="text-sm"
              />
            </div>
          </form>
        </CardContent>

        <CardFooter className="pt-2 flex justify-between border-t border-border/60">
          <Link href="/workspace">
            <Button variant="outline" size="sm" className="text-xs">
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            form="create-novel-form"
            disabled={isPending}
            className="text-xs font-medium flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            {isPending ? "Membangun Novel..." : "Buat & Masuk Ruang Kerja"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
