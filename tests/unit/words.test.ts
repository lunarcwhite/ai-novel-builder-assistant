import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countWords } from "@/lib/words";

describe("countWords (shared manuscript helper)", () => {
  it("returns 0 for empty / null / whitespace-only input", () => {
    assert.equal(countWords(""), 0);
    assert.equal(countWords(null), 0);
    assert.equal(countWords(undefined), 0);
    assert.equal(countWords("   \n\t  "), 0);
  });

  it("counts plain words with irregular spacing", () => {
    assert.equal(countWords("Dia membuka pintu"), 3);
    assert.equal(countWords("  dua   spasi  ganda "), 3);
  });

  it("strips HTML tags without merging words across tag boundaries", () => {
    assert.equal(countWords("<p>Dua kata</p>"), 2);
    assert.equal(countWords("<p>Satu</p><p>Dua</p>"), 2);
    assert.equal(countWords("<h1>Judul</h1><p>isi adegan pertama</p>"), 4);
  });

  it("decodes common entities TipTap may emit", () => {
    assert.equal(countWords("<p>A&nbsp;&amp;&nbsp;B</p>"), 3);
  });

  it("behavior matches legacy plain-text splitting (regression guard)", () => {
    // Legacy code did: trimmed.split(/\s+/).length on plain text.
    const samples = [
      "Lilin kedua hampir padam",
      "  spasi di kedua sisi  ",
      "satu",
      "Asap tembakau murahan memenuhi kedai sempit",
    ];
    for (const s of samples) {
      const legacy = s.trim() ? s.trim().split(/\s+/).length : 0;
      assert.equal(countWords(s), legacy, `mismatch on: ${JSON.stringify(s)}`);
    }
  });
});
