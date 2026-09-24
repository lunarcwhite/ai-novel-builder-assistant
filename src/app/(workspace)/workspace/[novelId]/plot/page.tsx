import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { PlotThreadService } from "@/features/plot/service";
import { TimelineService } from "@/features/timeline/service";
import { WorldService } from "@/features/world/service";
import { StructureService } from "@/features/structure/service";
import NovelNavigationBar from "@/components/novel-navigation-bar";
import PlotStudioView from "./plot-studio-view";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ novelId: string }>;
}

export default async function PlotPage({ params }: PageProps) {
  const user = await requireAuth();
  const { novelId } = await params;

  const novel = await NovelService.getNovel(novelId, user.id);
  if (!novel) {
    notFound();
  }

  const [threads, counts, events, locations, structure] = await Promise.all([
    PlotThreadService.listThreads(novelId, user.id),
    PlotThreadService.getStatusCounts(novelId, user.id),
    TimelineService.listEvents(novelId, user.id),
    WorldService.getLocations(novelId, user.id),
    StructureService.getNovelStructureTree(novelId, user.id),
  ]);

  const chapters = [
    ...structure.acts.flatMap((a) => a.chapters),
    ...structure.unassignedChapters,
  ].map((c) => ({ id: c.id, title: c.title }));

  const firstScene =
    structure.acts.flatMap((a) => a.chapters).flatMap((c) => c.scenes)[0] ||
    structure.unassignedChapters.flatMap((c) => c.scenes)[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/workspace"
          className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Koleksi Novel
        </Link>
        <span>/</span>
        <Link
          href={`/workspace/${novel.id}`}
          className="hover:text-foreground truncate max-w-xs transition-colors"
        >
          {novel.title}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Plot & Timeline</span>
      </div>

      <NovelNavigationBar novelId={novel.id} firstSceneId={firstScene?.id} />

      <PlotStudioView
        novelId={novel.id}
        initialThreads={threads}
        statusCounts={counts}
        initialEvents={events}
        chapters={chapters}
        locations={locations}
      />
    </div>
  );
}
