"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Library } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Metadata only: never log manuscript content.
    console.error("[workspace-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="max-w-lg mx-auto my-16 rounded-xl border border-border/80 bg-card p-8 text-center space-y-4 shadow-paper"
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-medium">Studio tidak dapat dimuat</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Terjadi gangguan saat memuat halaman ini. Naskah Anda aman; tidak ada
          tulisan yang hilang atau berubah.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <Button onClick={reset} size="sm" className="text-xs flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Coba Lagi
        </Button>
        <Link href="/workspace">
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
            <Library className="w-3.5 h-3.5" />
            Koleksi Novel
          </Button>
        </Link>
      </div>
    </div>
  );
}
