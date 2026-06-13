import { ReasoningLLM } from "../types";

export type { ReasoningLLM } from "../types";

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export function createLLMProvider(config: LLMProviderConfig): ReasoningLLM {
  const { apiKey, baseUrl = "https://openrouter.ai/api/v1", model, temperature = 0.4, maxTokens = 8192 } = config;

  return {
    async invokeStructured<T extends { parse: (json: string) => any }>(
      schema: T,
      prompt: string,
      options?: { temperature?: number; maxTokens?: number }
    ): Promise<any> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/brids",
          "X-Title": "BRIDS Reasoning Agent",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a structured reasoning agent. Output ONLY valid JSON matching the provided schema. No markdown, no explanation.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options?.temperature ?? temperature,
          max_tokens: options?.maxTokens ?? maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from LLM");
      }

      try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (e) {
        throw new Error(`Failed to parse/validate LLM response: ${e instanceof Error ? e.message : String(e)}\nRaw: ${content}`);
      }
    },
  };
}