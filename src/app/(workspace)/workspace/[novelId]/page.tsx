import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { StructureService } from "@/features/structure/service";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import { deleteNovelAction } from "@/server/actions/novels";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Users, 
  BrainCircuit, 
  Compass, 
  FileText, 
  Trash2, 
  BarChart3,
  Feather,
  Globe,
  ArrowRight
} from "lucide-react";
import NovelEditDialog from "./edit-dialog";
import OutlineTree from "@/components/outline/outline-tree";
import NovelNavigationBar from "@/components/novel-navigation-bar";
import { formatNumber } from "@/lib/utils";

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

  // Retrieve complete hierarchical structure & story knowledge in parallel
  const [structure, characters, locations, worldRules, memoryStats] = await Promise.all([
    StructureService.getNovelStructureTree(novelId, user.id),
    CharacterService.getCharacters(novelId, user.id),
    WorldService.getLocations(novelId, user.id),
    WorldService.getWorldRules(novelId, user.id),
    MemoryService.getStats(novelId, user.id),
  ]);

  // First available scene for quick continue writing
  const firstScene =
    structure.acts.flatMap((a) => a.chapters).flatMap((c) => c.scenes)[0] ||
    structure.unassignedChapters.flatMap((c) => c.scenes)[0];

  // Live word count preferring actual scene manuscript words if structured
  const effectiveWordCount = structure.totalWords > 0 ? structure.totalWords : novel.word_count;

  const { progressPercent, readingTimeMinutes } = NovelService.calculateStats(
    effectiveWordCount,
    novel.target_word_count
  );

  const protagonist = characters.find((c) => c.role === "protagonist");
  const antagonist = characters.find((c) => c.role === "antagonist");

  return (
    <div className="space-y-6">
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

      {/* Sub-Navigation Bar */}
      <NovelNavigationBar novelId={novel.id} firstSceneId={firstScene?.id} />

      {/* Novel Master Header Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 md:p-8 shadow-paper relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
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

            {firstScene && (
              <div className="pt-1">
                <Link
                  href={`/workspace/${novel.id}/write/${firstScene.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-subtle transition-all group"
                >
                  <Feather className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span>Lanjut Menulis: {firstScene.title}</span>
                </Link>
              </div>
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
                {formatNumber(effectiveWordCount)}
              </span>
            </div>

            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Target Kata:
              </span>
              <span className="font-semibold text-foreground">
                {formatNumber(novel.target_word_count)}
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

      {/* Narrative Foundation Card */}
      <Card className="border-border/80">
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

      {/* Main Narrative Structure (Phase 3 Core Feature) */}
      <OutlineTree novelId={novel.id} structure={structure} />

      {/* Story Knowledge & Bible Subsystems (Phase 5 Active) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Character Studio Card (Phase 5 Active) */}
        <Card className="border-border/80 flex flex-col justify-between shadow-subtle hover:border-accent/60 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Character Studio
              </CardTitle>
              <Badge variant="accent" className="text-[10px]">Aktif</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-3 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-muted-foreground">
              <p>
                {characters.length > 0
                  ? `Tersedia ${characters.length} tokoh cerita dengan busur karakter dan peta relasi.`
                  : "Mulai rancang tokoh cerita, motivasi, dan busur emosional."}
              </p>
              {protagonist && (
                <div className="text-[11px] text-foreground">
                  <span className="text-muted-foreground">Protagonis:</span> {protagonist.name}
                  {antagonist && (
                    <>
                      {" "}• <span className="text-muted-foreground">Antagonis:</span> {antagonist.name}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border/40">
              <Link
                href={`/workspace/${novel.id}/characters`}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                <span>Buka Character Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Worldbuilding Studio Card (Phase 5 Active) */}
        <Card className="border-border/80 flex flex-col justify-between shadow-subtle hover:border-accent/60 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                World Studio
              </CardTitle>
              <Badge variant="accent" className="text-[10px]">Aktif</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-3 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-muted-foreground">
              <p>
                {locations.length > 0 || worldRules.length > 0
                  ? `${locations.length} lokasi geografis dan ${worldRules.length} aturan dunia tersimpan.`
                  : "Katalog lokasi, hukum semesta cerita, dan ensiklopedia lore."}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-foreground">
                <span>{locations.length} Lokasi</span>
                <span>•</span>
                <span>{worldRules.length} Aturan Dunia</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <Link
                href={`/workspace/${novel.id}/world`}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                <span>Buka World Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Story Memory Studio Card */}
        <Card className="border-border/80 flex flex-col justify-between hover:border-border transition-colors">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                Story Memory
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                Phase 6 Aktif
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-3 text-xs text-muted-foreground flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <p>
                {memoryStats.total > 0
                  ? `${memoryStats.confirmed} fakta kanon terkonfirmasi dan ${memoryStats.proposed} usulan baru tersimpan.`
                  : "Basis pengetahuan kanon cerita, fakta karakter, dan retrieval semantik."}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-foreground">
                <span>{memoryStats.confirmed} Terkonfirmasi</span>
                <span>•</span>
                <span>{memoryStats.proposed} Usulan</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <Link
                href={`/workspace/${novel.id}/memories`}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                <span>Buka Memory Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

