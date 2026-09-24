"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileDown, Loader2, BookOpen } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { ExportFormat } from "@/types";

interface ExportViewProps {
  novelId: string;
  title: string;
  totalWords: number;
  totalChapters: number;
  totalScenes: number;
}

export default function ExportView({
  novelId,
  title,
  totalWords,
  totalChapters,
  totalScenes,
}: ExportViewProps) {
  const [format, setFormat] = useState<ExportFormat>("md");
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        format,
        includeEmpty: includeEmpty ? "1" : "0",
      });
      const res = await fetch(`/api/novels/${novelId}/export?${params.toString()}`);
      if (!res.ok) {
        let message = "Ekspor gagal. Naskah Anda aman.";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // Non-JSON error body — keep the safe fallback message.
        }
        setError(message);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ||
        `${title}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Ekspor gagal. Periksa koneksi Anda. Naskah Anda aman.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <FileDown className="w-4 h-4 text-primary" />
        <h1 className="font-serif text-lg font-medium">Ekspor Naskah</h1>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Unduh seluruh naskah sebagai satu berkas. Read-only: ekspor tidak mengubah
        apa pun di naskah Anda.
      </p>

      <Card className="border-border/80">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-1 space-y-4 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatNumber(totalWords)}
              </span>{" "}
              kata
            </span>
            <span>•</span>
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {totalChapters}
              </span>{" "}
              bab
            </span>
            <span>•</span>
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {totalScenes}
              </span>{" "}
              adegan
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-foreground">Format berkas</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Format ekspor">
              {(
                [
                  { value: "md", label: "Markdown", hint: ".md — heading bab & adegan" },
                  { value: "txt", label: "Teks Polos", hint: ".txt — tanpa pemformatan" },
                  { value: "docx", label: "Word", hint: ".docx — dibuka di Word & Docs" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={format === opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`flex-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    format === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    {opt.label}
                  </span>
                  <span className="block mt-1 text-[11px] text-muted-foreground">
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeEmpty}
              onChange={(e) => setIncludeEmpty(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Sertakan adegan yang belum ada naskahnya (sebagai penanda)
          </label>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleDownload} disabled={downloading || totalScenes === 0}>
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menyiapkan...
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 mr-1" /> Unduh .{format}
                </>
              )}
            </Button>
            {totalScenes === 0 && (
              <Badge variant="outline" className="text-[10px]">
                Belum ada adegan untuk diekspor
              </Badge>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground opacity-70">
            PDF dan EPUB direncanakan setelah ini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
