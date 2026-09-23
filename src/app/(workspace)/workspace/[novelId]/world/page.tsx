import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { WorldService } from "@/features/world/service";
import { StructureService } from "@/features/structure/service";
import NovelNavigationBar from "@/components/novel-navigation-bar";
import WorldStudioView from "./world-studio-view";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ novelId: string }>;
}

export default async function WorldPage({ params }: PageProps) {
  const user = await requireAuth();
  const { novelId } = await params;

  const novel = await NovelService.getNovel(novelId, user.id);
  if (!novel) {
    notFound();
  }

  // Fetch full worldbuilding data and structure
  const [locations, worldRules, worldLore, structure] = await Promise.all([
    WorldService.getLocations(novelId, user.id),
    WorldService.getWorldRules(novelId, user.id),
    WorldService.getWorldLoreList(novelId, user.id),
    StructureService.getNovelStructureTree(novelId, user.id),
  ]);

  const firstScene =
    structure.acts.flatMap((a) => a.chapters).flatMap((c) => c.scenes)[0] ||
    structure.unassignedChapters.flatMap((c) => c.scenes)[0];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
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
        <span className="text-foreground font-medium">Dunia & Aturan</span>
      </div>

      {/* Sub-Navigation Bar */}
      <NovelNavigationBar novelId={novel.id} firstSceneId={firstScene?.id} />

      {/* Interactive World Studio Canvas */}
      <WorldStudioView
        novel={novel}
        locations={locations}
        worldRules={worldRules}
        worldLore={worldLore}
      />
    </div>
  );
}
