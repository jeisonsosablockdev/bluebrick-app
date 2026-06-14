import { ReasoningLLM } from "../types";
import { z } from "zod";

export class LocalReasoningProvider implements ReasoningLLM {
  private systemPrompt: string;

  constructor(systemPrompt?: string) {
    this.systemPrompt = systemPrompt || `You are a structured reasoning agent implementing the SELECT→ADAPT→IMPLEMENT→SOLVE pipeline.
Output ONLY valid JSON matching the provided schema. No markdown, no explanation.`;
  }

  async invokeStructured<T extends z.ZodTypeAny>(
    schema: T,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<z.infer<T>> {
    throw new Error(
      "LocalReasoningProvider requires external LLM invocation. " +
      "Use the reasoning agent via the opencode agent runtime which provides the LLM capability. " +
      "For standalone CLI usage, set OPENROUTER_API_KEY or use --provider flag."
    );
  }
}

export function createLocalProvider(systemPrompt?: string): ReasoningLLM {
  return new LocalReasoningProvider(systemPrompt);
}