import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { ExportService } from "@/features/export/service";
import { mimeTypeFor } from "@/features/export/formatters";

interface RouteContext {
  params: Promise<{ novelId: string }>;
}

/**
 * Download the whole novel as a file (Phase 10 — TXT + Markdown MVP).
 * Read-only: renders data the author owns, never writes to the manuscript.
 *
 * GET /api/novels/:novelId/export?format=md|txt&includeEmpty=0|1
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth({ redirectToLogin: false });
    const { novelId } = await context.params;
    if (!novelId) {
      return NextResponse.json({ error: "ID novel tidak valid." }, { status: 400 });
    }

    const query: Record<string, string> = {};
    for (const [key, value] of request.nextUrl.searchParams.entries()) {
      query[key] = value;
    }

    const res = await ExportService.exportNovel(novelId, user.id, query);
    if (!res.success || !res.body || !res.format || !res.filename) {
      const denied = res.error === "Novel tidak ditemukan atau akses ditolak.";
      return NextResponse.json(
        { error: res.error || "Ekspor gagal." },
        { status: denied ? 404 : 400 }
      );
    }

    return new NextResponse(res.body, {
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
