import { z } from "zod";
import { NovelRepository } from "@/features/novels/repository";
import { ChapterRepository } from "@/features/chapters/repository";
import { SceneRepository } from "@/features/scenes/repository";
import { CharacterService } from "@/features/characters/service";
import { WorldService } from "@/features/world/service";
import { MemoryService } from "@/features/memories/service";
import { resolveAIProvider } from "@/server/ai/providers";
import { buildConsistencyValidationPrompt, CONSISTENCY_VALIDATION_SYSTEM } from "@/server/ai/prompts";
import type { AIMessage } from "@/server/ai/provider";
import { ConsistencyFindingRepository, type ConsistencyFindingDraft } from "./repository";
import {
  detectMemoryConflicts,
  detectRuleTensions,
  detectSceneMemoryTensions,
} from "./checks";
import {
  runConsistencyCheckSchema,
  type ConsistencyFinding,
  type ConsistencyScope,
  type ConsistencyStatus,
} from "@/types";

export interface RunCheckOptions {
  novelId: string;
  userId: string;
  scope: ConsistencyScope;
  sceneId?: string | null;
  chapterId?: string | null;
}

export interface RunCheckResult {
  success: boolean;
  error?: string;
  findings: ConsistencyFinding[];
  created: number;
  checkedScenes: number;
  aiValidated: boolean;
}

/** Max new findings persisted per run — recall is capped, author reviews the rest later. */
const MAX_NEW_PER_RUN = 10;

const aiVerdictSchema = z.object({
  verdicts: z
    .array(
      z.object({
        fact_key: z.string(),
        keep: z.boolean(),
        refined_description: z.string().max(1000).optional(),
      })
    )
    .max(30),
});

function stripHtml(html: string | null | undefined): string {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export class ConsistencyService {
  static async runCheck(opts: RunCheckOptions): Promise<RunCheckResult> {
    const parsed = runConsistencyCheckSchema.safeParse({
      scope: opts.scope,
      sceneId: opts.sceneId,
      chapterId: opts.chapterId,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Cakupan pemeriksaan tidak valid.",
        findings: [],
        created: 0,
        checkedScenes: 0,
        aiValidated: false,
      };
    }

    const novel = await NovelRepository.findById(opts.novelId, opts.userId);
    if (!novel) {
      return {
        success: false,
        error: "Novel tidak ditemukan atau akses ditolak.",
        findings: [],
        created: 0,
        checkedScenes: 0,
        aiValidated: false,
      };
    }

    // Resolve target scenes for the scope.
    let sceneIds: string[] = [];
    let sceneChapterId: string | null = null;
    if (opts.scope === "scene") {
      if (!opts.sceneId) {
        return {
          success: false,
          error: "Pilih adegan yang ingin diperiksa.",
          findings: [],
          created: 0,
          checkedScenes: 0,
          aiValidated: false,
        };
      }
      const scene = await SceneRepository.findById(opts.sceneId, opts.novelId, opts.userId);
      if (!scene) {
        return {
          success: false,
          error: "Adegan tidak ditemukan atau akses ditolak.",
          findings: [],
          created: 0,
          checkedScenes: 0,
          aiValidated: false,
        };
      }
      sceneIds = [scene.id];
      sceneChapterId = scene.chapter_id;
    } else {
      if (!opts.chapterId) {
        return {
          success: false,
          error: "Pilih bab yang ingin diperiksa.",
          findings: [],
          created: 0,
          checkedScenes: 0,
          aiValidated: false,
        };
      }
      const chapter = await ChapterRepository.findById(opts.chapterId, opts.novelId, opts.userId);
      if (!chapter) {
        return {
          success: false,
          error: "Bab tidak ditemukan atau akses ditolak.",
          findings: [],
          created: 0,
          checkedScenes: 0,
          aiValidated: false,
        };
      }
      const scenes = await SceneRepository.findManyByChapter(opts.chapterId, opts.novelId, opts.userId);
      sceneIds = scenes.map((s) => s.id);
      sceneChapterId = opts.chapterId;
    }

    if (sceneIds.length === 0) {
      const open = await ConsistencyFindingRepository.listByNovel(opts.novelId, opts.userId, {
        status: "open",
      });
      return { success: true, findings: open, created: 0, checkedScenes: 0, aiValidated: false };
    }

    // Gather evidence: texts, involved characters, confirmed facts, world rules.
    const [allScenes, rules, memories] = await Promise.all([
      opts.scope === "scene"
        ? SceneRepository.findById(sceneIds[0], opts.novelId, opts.userId).then((s) => (s ? [s] : []))
        : SceneRepository.findManyByChapter(sceneChapterId!, opts.novelId, opts.userId),
      WorldService.getWorldRules(opts.novelId, opts.userId),
      MemoryService.getMemories(opts.novelId, opts.userId, { status: "confirmed", limit: 100 }),
    ]);

    const contexts = await Promise.all(
      allScenes.map((s) => CharacterService.getSceneContext(s.id, opts.novelId, opts.userId))
    );
    const involvedByScene = new Map<string, string[]>();
    allScenes.forEach((s, i) => {
      const ctx = contexts[i];
      involvedByScene.set(
        s.id,
        [
          ...(ctx.pov_character_id ? [ctx.pov_character_id] : []),
          ...ctx.involved_characters.map((c) => c.id),
        ]
      );
    });
    // Local deterministic pass — no network, no cost, no invented facts.
    const drafts: ConsistencyFindingDraft[] = [];
    drafts.push(...detectMemoryConflicts(memories, opts.scope));
    for (const s of allScenes) {
      const text = stripHtml(s.content);
      const involved = involvedByScene.get(s.id) || [];
      const ref = { id: s.id, title: s.title };
      drafts.push(...detectSceneMemoryTensions(text, ref, memories, involved, opts.scope));
      drafts.push(...detectRuleTensions(text, ref, rules, opts.scope));
    }

    // In-batch dedupe on fact_key; cap per run.
    const seen = new Set<string>();
    const unique = drafts.filter((d) => {
      const key = String(d.metadata?.fact_key || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Remote-AI confirmation pass (structured, validated). Local-dev provider
    // skips it: deterministic drafts are the result. Failures fall back to
    // local drafts — a failed AI call must never lose the check.
    let approved = unique.slice(0, MAX_NEW_PER_RUN);
    let aiValidated = false;
    const provider = resolveAIProvider();
    if (provider.name !== "local-dev-draft" && approved.length > 0) {
      try {
        const prompt = buildConsistencyValidationPrompt(
          approved.map((d, i) => ({
            index: i,
            type: d.type,
            description: d.description,
            factKey: String(d.metadata?.fact_key || ""),
            sources: (d.source_ids || []).map((s) => ({
              label: s.label || s.type,
              excerpt: (s.excerpt || "").slice(0, 300),
            })),
          }))
        );
        const messages: AIMessage[] = [
          { role: "system", content: CONSISTENCY_VALIDATION_SYSTEM },
          { role: "user", content: prompt },
        ];
        const raw = await provider.generateStructured<unknown>(messages, null, {
          temperature: 0.3,
          maxTokens: 1500,
        });
        const verdictParsed = aiVerdictSchema.safeParse(raw);
        if (verdictParsed.success) {
          const keepByKey = new Map(
            verdictParsed.data.verdicts.map((v) => [v.fact_key, v] as const)
          );
          approved = approved
            .map((d) => {
              const key = String(d.metadata?.fact_key || "");
              const v = keepByKey.get(key);
              if (!v) return d; // no verdict: keep the local observation
              if (!v.keep) return null;
              return {
                ...d,
                description: v.refined_description?.trim()
                  ? tentative(v.refined_description.trim())
                  : d.description,
                metadata: { ...(d.metadata || {}), ai_generated: true },
              };
            })
            .filter(Boolean) as ConsistencyFindingDraft[];
          aiValidated = true;
        }
      } catch {
        aiValidated = false; // fall through with local drafts
      }
    }

    // Persist only genuinely new findings (skip already-open fact_keys).
    let created = 0;
    for (const d of approved) {
      const key = String(d.metadata?.fact_key || "");
      const existing = key
        ? await ConsistencyFindingRepository.findOpenByFactKey(opts.novelId, opts.userId, key)
        : null;
      if (existing) continue;
      const saved = await ConsistencyFindingRepository.create(opts.novelId, opts.userId, d);
      if (saved) created += 1;
    }

    const open = await ConsistencyFindingRepository.listByNovel(opts.novelId, opts.userId, {
      status: "open",
    });
    return { success: true, findings: open, created, checkedScenes: allScenes.length, aiValidated };
  }

  static async listFindings(
    novelId: string,
    userId: string,
    filters: { status?: ConsistencyStatus | "all"; type?: ConsistencyFinding["type"] | "all" } = {}
  ): Promise<ConsistencyFinding[]> {
    return ConsistencyFindingRepository.listByNovel(novelId, userId, filters);
  }

  static async review(
    id: string,
    novelId: string,
    userId: string,
    status: Exclude<ConsistencyStatus, "open">
  ): Promise<{ success: boolean; finding?: ConsistencyFinding; error?: string }> {
    if (!["reviewed", "dismissed", "resolved"].includes(status)) {
      return { success: false, error: "Status temuan tidak valid." };
    }
    const finding = await ConsistencyFindingRepository.updateStatus(id, novelId, userId, status);
    if (!finding) return { success: false, error: "Temuan tidak ditemukan atau akses ditolak." };
    return { success: true, finding };
  }

  static async remove(
    id: string,
    novelId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const ok = await ConsistencyFindingRepository.delete(id, novelId, userId);
    if (!ok) return { success: false, error: "Temuan tidak ditemukan atau akses ditolak." };
    return { success: true };
  }

  static async countOpen(novelId: string, userId: string): Promise<number> {
    return ConsistencyFindingRepository.countOpen(novelId, userId);
  }
}

/** Ensure AI-refined wording keeps tentative observation language (SOUL.md #13). */
function tentative(text: string): string {
  if (/mungkin|potensi|kemungkinan|nampaknya|sepertinya|indikasi/i.test(text)) return text;
  return `Potensi temuan (perlu tinjauan penulis): ${text}`;
}
