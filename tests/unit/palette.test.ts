import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEditorActionCommands,
  buildGlobalCommands,
  buildNovelCommands,
  buildSceneCommands,
  filterCommands,
  parseNovelIdFromPath,
  type PaletteCommand,
} from "@/lib/palette";
import { isFocusShortcut, isPaletteShortcut, isSaveShortcut } from "@/lib/shortcuts";
import { filterNovelsForLibrary } from "@/lib/library-search";

describe("palette command builders", () => {
  it("global commands cover library and new novel", () => {
    const cmds = buildGlobalCommands();
    assert.ok(cmds.some((c) => c.href === "/workspace"));
    assert.ok(cmds.some((c) => c.href === "/workspace/new"));
  });

  it("novel commands mirror the 8 navigation tabs", () => {
    const cmds = buildNovelCommands("nov_1");
    assert.equal(cmds.length, 8);
    const hrefs = cmds.map((c) => c.href);
    assert.ok(hrefs.includes("/workspace/nov_1"));
    assert.ok(hrefs.includes("/workspace/nov_1/characters"));
    assert.ok(hrefs.includes("/workspace/nov_1/export"));
  });

  it("scene commands deep-link into the editor", () => {
    const cmds = buildSceneCommands("nov_1", [
      { id: "sc_1", title: "Adegan 1", chapterTitle: "Bab 1" },
    ]);
    assert.equal(cmds[0].href, "/workspace/nov_1/write/sc_1");
    assert.equal(cmds[0].group, "Adegan");
  });

  it("editor action commands expose save, focus, versions", () => {
    const cmds = buildEditorActionCommands();
    assert.deepEqual(
      cmds.map((c) => c.actionId),
      ["save-now", "toggle-focus", "open-versions"]
    );
  });
});

describe("filterCommands (ranking + matching)", () => {
  const cmds: PaletteCommand[] = [
    { id: "a", label: "Koleksi Novel", hint: "Daftar", keywords: "workspace", group: "Navigasi" },
    { id: "b", label: "Ekspor", hint: "Unduh naskah docx", keywords: "export", group: "Navigasi" },
    { id: "c", label: "Cerita Baru", hint: "Novel", keywords: "ekspor draft", group: "Aksi" },
  ];

  it("empty query returns all in input order", () => {
    assert.deepEqual(filterCommands(cmds, "  ").map((c) => c.id), ["a", "b", "c"]);
  });

  it("ranks label prefix above label contains above hint/keyword only", () => {
    const set: PaletteCommand[] = [
      { id: "kw", label: "Unduh Berkas", hint: "opsi ekspor", group: "Aksi" },
      { id: "contains", label: "Menu Ekspor Cepat", group: "Aksi" },
      { id: "prefix", label: "Ekspor Naskah", group: "Aksi" },
    ];
    assert.deepEqual(filterCommands(set, "ekspor").map((c) => c.id), [
      "prefix",
      "contains",
      "kw",
    ]);
  });

  it("matches hint and keywords, case-insensitive", () => {
    assert.deepEqual(filterCommands(cmds, "DOCX").map((c) => c.id), ["b"]);
  });

  it("returns empty when nothing matches (never invents commands)", () => {
    assert.deepEqual(filterCommands(cmds, "zzzz-tidak-ada"), []);
  });
});

describe("parseNovelIdFromPath", () => {
  it("extracts novelId from novel-scoped paths", () => {
    assert.equal(parseNovelIdFromPath("/workspace/nov_1"), "nov_1");
    assert.equal(parseNovelIdFromPath("/workspace/nov_1/characters"), "nov_1");
    assert.equal(parseNovelIdFromPath("/workspace/nov_1/write/sc_9"), "nov_1");
  });

  it("returns null outside novel scope", () => {
    assert.equal(parseNovelIdFromPath("/workspace"), null);
    assert.equal(parseNovelIdFromPath("/workspace/new"), null);
    assert.equal(parseNovelIdFromPath("/login"), null);
    assert.equal(parseNovelIdFromPath(null), null);
  });
});

describe("shortcut matchers", () => {
  it("Ctrl/Cmd+K opens palette, plain k does not", () => {
    assert.equal(isPaletteShortcut({ key: "k", ctrlKey: true }), true);
    assert.equal(isPaletteShortcut({ key: "K", metaKey: true }), true);
    assert.equal(isPaletteShortcut({ key: "k" }), false);
    assert.equal(isPaletteShortcut({ key: "k", ctrlKey: true, shiftKey: true }), false);
  });

  it("Ctrl/Cmd+S triggers save, plain s does not", () => {
    assert.equal(isSaveShortcut({ key: "s", ctrlKey: true }), true);
    assert.equal(isSaveShortcut({ key: "S", metaKey: true }), true);
    assert.equal(isSaveShortcut({ key: "s" }), false);
  });

  it("bare F11 toggles focus, modified F11 does not", () => {
    assert.equal(isFocusShortcut({ key: "F11" }), true);
    assert.equal(isFocusShortcut({ key: "F11", ctrlKey: true }), false);
    assert.equal(isFocusShortcut({ key: "F12" }), false);
  });
});

describe("filterNovelsForLibrary (workspace ?q=)", () => {
  const novels = [
    { title: "Bayang Kota Tua", genre: "Misteri", premise: "Detektif kembali ke kota" },
    { title: "Laut Sunyi", genre: "Fantasi", premise: null },
    { title: "Catatan Arsitek", genre: null, premise: null },
  ];

  it("empty query returns all in input order", () => {
    assert.deepEqual(filterNovelsForLibrary(novels, "  ").map((n) => n.title), [
      "Bayang Kota Tua",
      "Laut Sunyi",
      "Catatan Arsitek",
    ]);
  });

  it("matches title, genre, and premise case-insensitively", () => {
    assert.deepEqual(filterNovelsForLibrary(novels, "bayang").map((n) => n.title), ["Bayang Kota Tua"]);
    assert.deepEqual(filterNovelsForLibrary(novels, "FANTASI").map((n) => n.title), ["Laut Sunyi"]);
    assert.deepEqual(filterNovelsForLibrary(novels, "detektif").map((n) => n.title), ["Bayang Kota Tua"]);
  });

  it("returns empty when nothing matches", () => {
    assert.deepEqual(filterNovelsForLibrary(novels, "zzzz-tidak-ada"), []);
  });
});
