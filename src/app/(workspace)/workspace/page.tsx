import { requireAuth } from "@/server/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  BookOpen, 
  ShieldCheck, 
  UserCheck, 
  Layers
} from "lucide-react";

export default async function WorkspacePage() {
  const user = await requireAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-paper flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="text-[10px]">
              Sesi Terautentikasi
            </Badge>
            <span className="text-xs text-muted-foreground">ID Penulis: {user.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-normal text-foreground">
            Selamat datang di Studio, {user.displayName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ini adalah ruang kerja pribadi Anda. Semua draf naskah, karakter, dan memori cerita terisolasi khusus untuk akun Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button className="text-xs flex items-center gap-1.5 shadow-subtle">
            <Plus className="w-4 h-4" />
            Novel Baru (Phase 2)
          </Button>
        </div>
      </div>

      {/* Auth & Security Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
              <UserCheck className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-medium">Profil Penulis Aktif</CardTitle>
            <CardDescription className="text-xs">Identitas dan data sesi author</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs space-y-2 text-muted-foreground">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>Nama Tampilan:</span>
              <span className="font-medium text-foreground">{user.displayName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span>Email:</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Status Akun:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terverifikasi</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-medium">Isolasi Tenant & Naskah</CardTitle>
            <CardDescription className="text-xs">Aturan keamanan Rule 5.3 AGENTS.md</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs space-y-2 text-muted-foreground">
            <p>
              Setiap entitas cerita (Novel, Bab, Scene, Karakter) terverifikasi server-side melalui <code className="text-foreground">requireNovelAccess()</code>.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Otorisasi Server-Side Aktif</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-1">
              <Layers className="w-4 h-4" />
            </div>
            <CardTitle className="text-base font-medium">Tahap Selanjutnya: Phase 2</CardTitle>
            <CardDescription className="text-xs">Persiapan Manajemen Koleksi Novel</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs space-y-2 text-muted-foreground">
            <p>
              Setelah autentikasi dan profil pengguna selesai, langkah selanjutnya adalah membangun migrasi dan repositori <code className="text-foreground">novels</code>.
            </p>
            <div className="pt-1 text-[11px] text-primary font-medium">
              Siap untuk implementasi Phase 2
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State / Novel Library Placeholder */}
      <div className="border border-dashed border-border/80 rounded-xl p-10 text-center space-y-3 bg-card/30">
        <div className="w-12 h-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-medium">Belum Ada Novel yang Dibuat</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Sistem otentikasi Phase 1 telah aktif dan siap menampung data novel Anda yang akan dibangun di Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
