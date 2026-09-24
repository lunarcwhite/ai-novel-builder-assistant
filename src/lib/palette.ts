// ---------------------------------------------------------------
// Command palette data + filtering (Phase 11 — Polish)
// ---------------------------------------------------------------
// Pure module: no DOM, no router. Builds navigation/action commands
// and filters them for the palette UI. Tested in tests/unit/palette.test.ts.

export type PaletteGroup = "Navigasi" | "Adegan" | "Aksi";

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  /** Client route to open. Mutually exclusive with actionId. */
  href?: string;
  /** Editor action id, resolved by the host via registered callbacks. */
  actionId?: string;
  group: PaletteGroup;
}

export interface PaletteScene {
  id: string;
  title: string;
  chapterTitle?: string | null;
}

export function buildGlobalCommands(): PaletteCommand[] {
  return [
    {
      id: "go-workspace",
      label: "Koleksi Novel",
      hint: "Daftar semua novel",
      keywords: "workspace home library koleksi daftar novel",
      href: "/workspace",
      group: "Navigasi",
    },
    {
      id: "go-new-novel",
      label: "Buat Novel Baru",
      hint: "Rancang novel",
      keywords: "baru new create tambah novel",
      href: "/workspace/new",
      group: "Aksi",
    },
  ];
}

const NOVEL_TABS: Array<{ id: string; label: string; hint: string; keywords: string; suffix: string }> = [
  { id: "overview", label: "Garis Besar & Naskah", hint: "Struktur novel", keywords: "outline garis besar overview struktur naskah bab adegan", suffix: "" },
  { id: "characters", label: "Karakter & Relasi", hint: "Tokoh & relasi", keywords: "karakter character tokoh relasi relationship pov", suffix: "/characters" },
  { id: "world", label: "Dunia & Aturan", hint: "Lokasi & aturan", keywords: "dunia world lokasi location aturan lore setting", suffix: "/world" },
  { id: "memories", label: "Memori Cerita", hint: "Fakta cerita", keywords: "memori memory fakta story fact ingatan", suffix: "/memories" },
  { id: "plot", label: "Plot & Timeline", hint: "Thread & peristiwa", keywords: "plot timeline thread alur peristiwa event", suffix: "/plot" },
  { id: "summaries", label: "Ringkasan", hint: "Sintesis cerita", keywords: "ringkasan summary ringkas sintesis", suffix: "/summaries" },
  { id: "doctor", label: "Story Doctor", hint: "Diagnosis cerita", keywords: "doctor dokter diagnosis analisis observasi", suffix: "/doctor" },
  { id: "export", label: "Ekspor", hint: "Unduh naskah", keywords: "ekspor export unduh download docx md txt", suffix: "/export" },
];

export function buildNovelCommands(novelId: string): PaletteCommand[] {
  return NOVEL_TABS.map((t) => ({
    id: `go-${t.id}`,
    label: t.label,
    hint: t.hint,
    keywords: t.keywords,
    href: `/workspace/${novelId}${t.suffix}`,
    group: "Navigasi" as PaletteGroup,
  }));
}

export function buildSceneCommands(novelId: string, scenes: PaletteScene[]): PaletteCommand[] {
  return scenes.map((s) => ({
    id: `go-scene-${s.id}`,
    label: s.title,
    hint: s.chapterTitle ? `Tulis • ${s.chapterTitle}` : "Tulis adegan",
    keywords: `adegan scene tulis write ${s.title} ${s.chapterTitle ?? ""}`,
    href: `/workspace/${novelId}/write/${s.id}`,
    group: "Adegan" as PaletteGroup,
  }));
}

export function buildEditorActionCommands(): PaletteCommand[] {
  return [
    {
      id: "action-save",
      label: "Simpan Sekarang",
      hint: "Ctrl+S",
      keywords: "simpan save simpan sekarang",
      actionId: "save-now",
      group: "Aksi",
    },
    {
      id: "action-focus",
      label: "Mode Fokus",
      hint: "F11",
      keywords: "fokus focus distraksi fullscreen konsentrasi",
      actionId: "toggle-focus",
      group: "Aksi",
    },
    {
      id: "action-versions",
      label: "Riwayat Versi",
      hint: "Snapshot adegan",
      keywords: "versi version history snapshot riwayat pulihkan",
      actionId: "open-versions",
      group: "Aksi",
    },
  ];
}

/**
 * Case-insensitive substring filter with simple ranking:
 * label prefix (0) < label contains (1) < hint/keywords only (2).
 * Stable: ties keep input order.
 */
export function filterCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...commands];
  const scored: Array<{ cmd: PaletteCommand; rank: number }> = [];
  for (const cmd of commands) {
    const label = cmd.label.toLowerCase();
    const hay = `${cmd.label} ${cmd.hint ?? ""} ${cmd.keywords ?? ""}`.toLowerCase();
    if (!hay.includes(q)) continue;
    const rank = label.startsWith(q) ? 0 : label.includes(q) ? 1 : 2;
    scored.push({ cmd, rank });
  }
  return scored.sort((a, b) => a.rank - b.rank).map((s) => s.cmd);
}

/** Extracts novelId from /workspace/[novelId]/* paths. Null on library/new/unknown. */
export function parseNovelIdFromPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const m = pathname.match(/^\/workspace\/([^/?#]+)/);
  if (!m || m[1] === "new") return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}
