import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EmbeddingService,
  LocalDevEmbeddingProvider,
} from "@/server/ai/embeddings";

describe("LocalDevEmbeddingProvider (deterministic offline vectors)", () => {
  it("produces 1536-dim L2-normalized vectors", async () => {
    const provider = new LocalDevEmbeddingProvider();
    const vec = await provider.generateEmbedding("Kaelen memiliki bekas luka bakar.");
    assert.equal(vec.length, 1536);
    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
    assert.ok(Math.abs(norm - 1) < 1e-9, `expected unit norm, got ${norm}`);
  });

  it("is deterministic for the same input", async () => {
    const provider = new LocalDevEmbeddingProvider();
    const a = await provider.generateEmbedding("teks yang sama");
    const b = await provider.generateEmbedding("teks yang sama");
    assert.deepEqual(a, b);
  });
});

describe("EmbeddingService.cosineSimilarity (ranking math)", () => {
  it("returns ~1 for identical vectors and 0 for zero vectors", () => {
    const a = [1, 0, 1];
    assert.ok(EmbeddingService.cosineSimilarity(a, a) > 0.999);
    assert.equal(EmbeddingService.cosineSimilarity([0, 0], [1, 2]), 0);
    assert.equal(EmbeddingService.cosineSimilarity([], [1]), 0);
  });

  it("clamps output to the 0..1 range", () => {
    const sim = EmbeddingService.cosineSimilarity([1, 2, 3], [-1, -2, -3]);
    assert.ok(sim >= 0 && sim <= 1, `out of range: ${sim}`);
  });
});
