import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { deleteNovelAction } from "@/server/actions/novels";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BookOpen, 
  Feather, 
  Users, 
  BrainCircuit, 
  Compass, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  BarChart3
} from "lucide-react";
import NovelEditDialog from "./edit-dialog";

interface PageProps {
  params: Promise<{ novelId: string }>;
}

export default async function NovelWorkspacePage({ params }: PageProps) {
  const user = await requireAuth();
  const { novelId } = await params;

  const novel = await NovelService.getNovel(novelId, user.id);
  if (!novel) {
    notFound();
  }

  const { progressPercent, readingTimeMinutes } = NovelService.calculateStats(
    novel.word_count,
    novel.target_word_count
  );

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/workspace" className="hover:text-foreground inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Koleksi Novel
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-xs">{novel.title}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <NovelEditDialog novel={novel} />
          <form action={deleteNovelAction}>
            <input type="hidden" name="id" value={novel.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Novel Master Header Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-paper relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="capitalize text-[10px]">
                {novel.status.replace("_", " ")}
              </Badge>
              {novel.genre && (
                <Badge variant="outline" className="text-[10px]">
                  {novel.genre}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-normal text-foreground">
              {novel.title}
            </h1>

            {novel.premise && (
              <p className="text-sm text-muted-foreground leading-relaxed italic font-serif">
                &ldquo;{novel.premise}&rdquo;
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="p-4 rounded-lg bg-muted/40 border border-border/60 min-w-[220px] space-y-3 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Jumlah Kata:
              </span>
              <span className="font-semibold text-foreground">
                {novel.word_count.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Target Kata:
              </span>
              <span className="font-semibold text-foreground">
                {novel.target_word_count.toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{progressPercent}% tercapai</span>
                <span>±{readingTimeMinutes} mnt baca</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Structure & Future Phase Subsystems */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Story Overview */}
        <Card className="border-border/80 md:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              Fondasi Naratif Novel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-4 text-xs">
            <div className="space-y-1">
              <span className="font-medium text-foreground">Premis Cerita:</span>
              <p className="text-muted-foreground leading-relaxed">
                {novel.premise || "Belum ada premis yang ditulis. Klik tombol 'Edit Informasi' di atas untuk melengkapinya."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/40">
              <div>
                <span className="text-muted-foreground">Tema Inti:</span>
                <p className="font-medium text-foreground mt-0.5">{novel.theme || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nada (Tone):</span>
                <p className="font-medium text-foreground mt-0.5">{novel.tone || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target Pembaca:</span>
                <p className="font-medium text-foreground mt-0.5">{novel.target_audience || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 3 Teaser: Acts & Chapters */}
        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Struktur Cerita
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Phase 3</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-3 text-xs text-muted-foreground">
            <p>
              Hierarki Act, Chapter, dan Scene akan aktif di tahap selanjutnya (Phase 3).
            </p>
            <div className="p-3 rounded-md bg-muted/40 border border-border/40 space-y-1 text-[11px]">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-primary" />
                Bab & Naskah
              </div>
              <p>Mendukung pembagian Act I, II, III dan perincian adegan demi adegan.</p>
            </div>
          </CardContent>
        </Card>

        {/* Phase 5 Teaser: Character Bible */}
        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Character Bible
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Phase 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-2 text-xs text-muted-foreground">
            <p>
              Pelacak tokoh, motivasi, peta relasi antar karakter, dan POV.
            </p>
          </CardContent>
        </Card>

        {/* Phase 6 Teaser: Story Memory */}
        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                Story Memory
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Phase 6</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-2 text-xs text-muted-foreground">
            <p>
              Penyimpanan fakta dunia, hukum sihir/lore, dan kronologi kejadian naskah.
            </p>
          </CardContent>
        </Card>

        {/* Manuscript Safety info */}
        <Card className="border-border/80">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Manuscript Safety
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">Aktif</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Naskah Aman & Terisolasi</span>
            </div>
            <p className="text-[11px]">
              Setiap perubahan selalu diverifikasi kepemilikannya oleh sistem.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
