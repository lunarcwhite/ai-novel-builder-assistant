import Link from "next/link";
import { Compass, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full rounded-xl border border-border/80 bg-card p-8 text-center space-y-4 shadow-paper">
        <div className="w-12 h-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Halaman 404
          </p>
          <h1 className="font-serif text-xl font-medium">
            Halaman ini tidak ada dalam naskah
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Tautan yang Anda buka sudah dipindahkan atau tidak pernah ditulis.
            Naskah-naskah Anda tetap aman di perpustakaan.
          </p>
        </div>
        <Link href="/workspace" className="inline-block pt-2">
          <Button size="sm" className="text-xs flex items-center gap-1.5">
            <Library className="w-4 h-4" />
            Kembali ke Koleksi Novel
          </Button>
        </Link>
      </div>
    </main>
  );
}
