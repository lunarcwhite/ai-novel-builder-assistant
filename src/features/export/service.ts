import { NovelRepository } from "@/features/novels/repository";
import { StructureService } from "@/features/structure/service";
import { exportQuerySchema, type ExportFormat } from "@/types";
import { buildMarkdown, buildTxt, exportFilename, mimeTypeFor } from "./formatters";

export interface ExportResult {
  success: boolean;
  error?: string;
  format?: ExportFormat;
  filename?: string;
  mimeType?: string;
  body?: string;
}

// ---------------------------------------------------------------
// Export service (Phase 10 — TXT + Markdown MVP)
// ---------------------------------------------------------------
// SOUL.md #6: read-only render of data the author owns.
// Verifies ownership through novel -> user (AGENTS.md #5.3),
// then formats the structure tree. Never writes to the manuscript.

export class ExportService {
  static async exportNovel(
    novelId: string,
    userId: string,
    rawQuery: unknown
  ): Promise<ExportResult> {
    const parsed = exportQuerySchema.safeParse(rawQuery ?? {});
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Parameter ekspor tidak valid.",
      };
    }

    const novel = await NovelRepository.findById(novelId, userId);
    if (!novel) {
      return { success: false, error: "Novel tidak ditemukan atau akses ditolak." };
    }

    const tree = await StructureService.getNovelStructureTree(novelId, userId);
    const { format, includeEmpty } = parsed.data;
    const body =
      format === "txt"
        ? buildTxt(novel, tree, { includeEmpty })
        : buildMarkdown(novel, tree, { includeEmpty });

    return {
      success: true,
      format,
      filename: exportFilename(novel, format),
      mimeType: mimeTypeFor(format),
      body,
    };
  }
}
