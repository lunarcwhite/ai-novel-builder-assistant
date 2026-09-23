import React from "react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/auth/guards";
import { NovelService } from "@/features/novels/service";
import { ChapterService } from "@/features/chapters/service";
import { SceneService } from "@/features/scenes/service";
import { StructureService } from "@/features/structure/service";
import EditorWorkspace from "@/components/editor/editor-workspace";

interface SceneEditorPageProps {
  params: Promise<{ novelId: string; sceneId: string }>;
}

export default async function SceneEditorPage({ params }: SceneEditorPageProps) {
  const user = await requireAuth();
  const { novelId, sceneId } = await params;

  // 1. Fetch and verify novel ownership
  const novel = await NovelService.getNovel(novelId, user.id);
  if (!novel) {
    notFound();
  }

  // 2. Fetch and verify scene
  const scene = await SceneService.getScene(sceneId, novelId, user.id);
  if (!scene) {
    notFound();
  }

  // 3. Fetch scene's chapter
  const chapter = await ChapterService.getChapter(scene.chapter_id, novelId, user.id);
  if (!chapter) {
    notFound();
  }

  // 4. Fetch full story structure hierarchy for the Scene Navigator
  const structure = await StructureService.getNovelStructureTree(novelId, user.id);

  // 5. Fetch initial version snapshots for this scene
  const initialVersions = await SceneService.getSceneVersions(sceneId, novelId, user.id);

  return (
    <EditorWorkspace
      novel={novel}
      chapter={chapter}
      scene={scene}
      structure={structure}
      initialVersions={initialVersions}
    />
  );
}
