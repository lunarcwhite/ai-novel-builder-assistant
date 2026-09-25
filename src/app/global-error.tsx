"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center p-6">
        <div
          role="alert"
          className="max-w-md w-full rounded-xl border border-border/80 bg-card p-8 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="font-serif text-xl font-medium">Aplikasi gagal dimuat</h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Terjadi kesalahan tak terduga. Naskah tersimpan di server tetap aman;
              muat ulang halaman ini untuk mencoba lagi.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
