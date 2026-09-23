import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { CharacterService } from "@/features/characters/service";
import { StructureService } from "@/features/structure/service";
import NovelNavigationBar from "@/components/novel-navigation-bar";
import CharacterStudioView from "./character-studio-view";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ novelId: string }>;
}

export default async function CharactersPage({ params }: PageProps) {
  const user = await requireAuth();
  const { novelId } = await params;

  const novel = await NovelService.getNovel(novelId, user.id);
  if (!novel) {
    notFound();
  }

  // Fetch full character data, relationships, and appearances
  const [characters, relationships, structure] = await Promise.all([
    CharacterService.getCharacters(novelId, user.id),
    CharacterService.getRelationships(novelId, user.id),
    StructureService.getNovelStructureTree(novelId, user.id),
  ]);

  // Fetch scene appearances for each character in parallel
  const appearancesList = await Promise.all(
    characters.map(async (c) => {
      const apps = await CharacterService.getCharacterAppearances(c.id, novelId, user.id);
      return { characterId: c.id, appearances: apps };
    })
  );

  const appearancesMap = appearancesList.reduce<
    Record<
      string,
      Array<{
        sceneId: string;
        sceneTitle: string;
        chapterId: string;
        isPov: boolean;
      }>
    >
  >((acc, cur) => {
    acc[cur.characterId] = cur.appearances;
    return acc;
  }, {});

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
        <span className="text-foreground font-medium">Karakter & Relasi</span>
      </div>

      {/* Sub-Navigation Bar */}
      <NovelNavigationBar novelId={novel.id} firstSceneId={firstScene?.id} />

      {/* Interactive Character Studio Canvas */}
      <CharacterStudioView
        novel={novel}
        characters={characters}
        relationships={relationships}
        appearancesMap={appearancesMap}
      />
    </div>
  );
}
