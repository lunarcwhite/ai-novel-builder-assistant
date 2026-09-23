import type {
  Act,
  ActWithChapters,
  Chapter,
  ChapterWithScenes,
  NovelStructureTree,
  Scene,
} from "@/types";

/**
 * Pure hierarchy builder: Novel -> Acts -> Chapters -> Scenes.
 * No I/O, no auth. Services fetch rows, this function assembles the tree.
 * Extracted so the grouping/sorting/aggregation logic is unit-testable.
 */
export function buildStructureTree(
  acts: Act[],
  chapters: Chapter[],
  scenes: Scene[]
): NovelStructureTree {
  // Group scenes by chapter_id
  const scenesByChapterId = new Map<string, Scene[]>();
  for (const scene of scenes) {
    const list = scenesByChapterId.get(scene.chapter_id) || [];
    list.push(scene);
    scenesByChapterId.set(scene.chapter_id, list);
  }

  // Attach scenes to chapters
  const chaptersWithScenes: ChapterWithScenes[] = chapters.map((chapter) => {
    const chapterScenes = (scenesByChapterId.get(chapter.id) || []).sort(
      (a, b) => a.position - b.position
    );
    // Word count from scenes if any exist
    const computedWordCount =
      chapterScenes.length > 0
        ? chapterScenes.reduce((sum, s) => sum + (s.word_count || 0), 0)
        : chapter.word_count;

    return {
      ...chapter,
      word_count: computedWordCount,
      scenes: chapterScenes,
    };
  });

  // Group chapters by act_id
  const chaptersByActId = new Map<string, ChapterWithScenes[]>();
  const unassignedChapters: ChapterWithScenes[] = [];

  for (const ch of chaptersWithScenes) {
    if (ch.act_id) {
      const list = chaptersByActId.get(ch.act_id) || [];
      list.push(ch);
      chaptersByActId.set(ch.act_id, list);
    } else {
      unassignedChapters.push(ch);
    }
  }

  // Attach chapters to acts
  const actsWithChapters: ActWithChapters[] = acts.map((act) => {
    const actChapters = (chaptersByActId.get(act.id) || []).sort(
      (a, b) => a.position - b.position
    );
    return {
      ...act,
      chapters: actChapters,
    };
  });

  const totalWords = chaptersWithScenes.reduce(
    (acc, c) => acc + (c.word_count || 0),
    0
  );

  return {
    acts: actsWithChapters,
    unassignedChapters,
    totalActs: acts.length,
    totalChapters: chapters.length,
    totalScenes: scenes.length,
    totalWords,
  };
}
