/**
 * Embedding Infrastructure & Provider Abstraction
 * Rule 7.1 (AGENTS.md): Application code must use provider abstraction.
 */

export interface EmbeddingProvider {
  name: string;
  dimensions: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * LocalDevEmbeddingProvider
 * Deterministic 1536-dimensional feature-hashed vectorizer.
 * Provides offline cosine similarity and deduplication without requiring external API keys.
 */
export class LocalDevEmbeddingProvider implements EmbeddingProvider {
  name = "local-deterministic-1536";
  dimensions = 1536;

  async generateEmbedding(text: string): Promise<number[]> {
    return this.hashVector(text, this.dimensions);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.hashVector(t, this.dimensions));
  }

  private hashVector(text: string, dim: number): number[] {
    const vector = new Array<number>(dim).fill(0);
    const cleaned = text.toLowerCase().trim();
    if (!cleaned) return vector;

    // 1. Word tokens
    const words = cleaned.split(/[\s,.;:!?()"'[\]{}]+/g).filter(Boolean);

    // 2. Character n-grams (3-grams and 4-grams) to capture subwords and typos
    const ngrams: string[] = [];
    for (let i = 0; i < cleaned.length - 2; i++) {
      ngrams.push(cleaned.slice(i, i + 3));
      if (i < cleaned.length - 3) {
        ngrams.push(cleaned.slice(i, i + 4));
      }
    }

    // Hash words with higher weight
    for (const word of words) {
      const idx = Math.abs(this.stringHash(word)) % dim;
      const sign = (this.stringHash(word + "_sign") % 2 === 0) ? 1 : -1;
      vector[idx] += 2.5 * sign;
    }

    // Hash n-grams
    for (const ng of ngrams) {
      const idx = Math.abs(this.stringHash(ng)) % dim;
      const sign = (this.stringHash(ng + "_sign") % 2 === 0) ? 1 : -1;
      vector[idx] += 1.0 * sign;
    }

    // 3. L2 unit normalization (so dot product equals cosine similarity)
    let norm = 0;
    for (let i = 0; i < dim; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < dim; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  private stringHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  }
}

/**
 * OpenAIEmbeddingProvider
 * Production provider using text-embedding-3-small (1536 dimensions)
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = "openai-text-embedding-3-small";
  dimensions = 1536;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "text-embedding-3-small") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const results = await this.generateBatchEmbeddings([text]);
    return results[0] || new Array(this.dimensions).fill(0);
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Embedding API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }
}

/**
 * EmbeddingService
 * Unified service resolving the active provider and calculating vector similarities
 */
export class EmbeddingService {
  private static providerInstance: EmbeddingProvider | null = null;

  static getProvider(): EmbeddingProvider {
    if (this.providerInstance) {
      return this.providerInstance;
    }

    const openaiKey = process.env.OPENAI_API_KEY || (process.env.AI_PROVIDER === "openai" ? process.env.AI_API_KEY : undefined);

    if (openaiKey && !openaiKey.includes("sk-placeholder") && !openaiKey.startsWith("your-")) {
      this.providerInstance = new OpenAIEmbeddingProvider(openaiKey);
    } else {
      this.providerInstance = new LocalDevEmbeddingProvider();
    }

    return this.providerInstance;
  }

  static async generateEmbedding(text: string): Promise<number[]> {
    const provider = this.getProvider();
    return provider.generateEmbedding(text);
  }

  static async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const provider = this.getProvider();
    return provider.generateBatchEmbeddings(texts);
  }

  /**
   * Cosine Similarity calculation between two numerical vectors.
   * Returns a float between -1.0 and 1.0 (clamped to 0..1 for standard similarity scores).
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA <= 0 || normB <= 0) return 0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity));
  }
}
