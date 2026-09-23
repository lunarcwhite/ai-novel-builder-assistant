/**
 * AI Provider Interface
 * Rule 7.1 (AGENTS.md): Application code must use AIProvider abstraction.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface AIProvider {
  name: string;
  generateCompletion(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<string>;
  generateStructured<T>(
    messages: AIMessage[],
    schema: unknown,
    options?: AICompletionOptions
  ): Promise<T>;
  generateEmbedding(text: string): Promise<number[]>;
}
