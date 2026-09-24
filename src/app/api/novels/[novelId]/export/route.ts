import { NextRequest, NextResponse } from "next/server";
import { requireNovelAccess } from "@/server/auth/guards";
import { ExportService } from "@/features/export/service";
import { mimeTypeFor } from "@/features/export/formatters";

interface RouteContext {
  params: Promise<{ novelId: string }>;
}

/**
 * Download the whole novel as a file (Phase 10 TXT + Markdown; Phase 11 DOCX).
 * Read-only: renders data the author owns, never writes to the manuscript.
 *
 * GET /api/novels/:novelId/export?format=md|txt|docx&includeEmpty=0|1
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { novelId } = await context.params;
    if (!novelId) {
      return NextResponse.json({ error: "ID novel tidak valid." }, { status: 400 });
    }

    // Phase 1 Task 1.3: ownership gate before any manuscript data is read.
    let userId: string;
    try {
      ({ userId } = await requireNovelAccess(novelId, { redirectToLogin: false }));
    } catch {
      return NextResponse.json(
        { error: "Novel tidak ditemukan atau akses ditolak." },
        { status: 404 }
      );
    }

    const query: Record<string, string> = {};
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      query[key] = value;
    }

    const res = await ExportService.exportNovel(novelId, userId, query);
    const payload = res.format === "docx" ? res.buffer : res.body;
    if (!res.success || !payload || !res.format || !res.filename) {
      const denied = res.error === "Novel tidak ditemukan atau akses ditolak.";
      return NextResponse.json(
        { error: res.error || "Ekspor gagal." },
        { status: denied ? 404 : 400 }
      );
    }

    // Buffer -> Uint8Array copy: Node Buffer's generic (ArrayBufferLike)
    // is not assignable to BodyInit, a fresh Uint8Array is.
    const body = typeof payload === "string" ? payload : new Uint8Array(payload);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": res.mimeType || mimeTypeFor(res.format),
        "Content-Disposition": `attachment; filename="${res.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Ekspor gagal. Naskah Anda aman." },
      { status: 500 }
    );
  }
}
