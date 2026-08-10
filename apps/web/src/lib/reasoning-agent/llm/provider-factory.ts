import { ReasoningLLM } from "../types";
import { createLLMProvider as createOpenRouterProvider } from "./index";
import { createLocalProvider } from "./local-provider";

export type ProviderType = "openrouter" | "anthropic" | "openai" | "nvidia" | "local" | "ollama";

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export function createProvider(config: ProviderConfig): ReasoningLLM {
  switch (config.type) {
    case "openrouter": {
      if (!config.apiKey) {
        throw new Error("OpenRouter provider requires apiKey");
      }
      return createOpenRouterProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || "https://openrouter.ai/api/v1",
        model: config.model || "qwen/qwen3-235b-a22b-thinking-2507-fast",
        temperature: config.temperature ?? 0.4,
        maxTokens: config.maxTokens ?? 8192,
      });
    }

    case "anthropic": {
      if (!config.apiKey) {
        throw new Error("Anthropic provider requires apiKey");
      }
      return createAnthropicProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || "https://api.anthropic.com",
        model: config.model || "claude-3-5-sonnet-20241022",
        temperature: config.temperature ?? 0.4,
        maxTokens: config.maxTokens ?? 8192,
      });
    }

    case "openai": {
      if (!config.apiKey) {
        throw new Error("OpenAI provider requires apiKey");
      }
      return createOpenAIProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || "https://api.openai.com/v1",
        model: config.model || "gpt-4o",
        temperature: config.temperature ?? 0.4,
        maxTokens: config.maxTokens ?? 8192,
      });
    }

    case "nvidia": {
      if (!config.apiKey) {
        throw new Error("NVIDIA provider requires apiKey");
      }
      return createNVIDIAProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || "https://integrate.api.nvidia.com/v1",
        model: config.model || "nvidia/nemotron-3-ultra",
        temperature: config.temperature ?? 0.4,
        maxTokens: config.maxTokens ?? 8192,
      });
    }

    case "ollama": {
      return createOllamaProvider({
        baseUrl: config.baseUrl || "http://localhost:11434",
        model: config.model || "qwen2.5:32b",
        temperature: config.temperature ?? 0.4,
        maxTokens: config.maxTokens ?? 8192,
      });
    }

    case "local":
    default: {
      return createLocalProvider(config.systemPrompt);
    }
  }
}

function createAnthropicProvider(config: {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): ReasoningLLM {
  return {
    async invokeStructured<T extends { parse: (json: string) => any }>(
      schema: T,
      prompt: string,
      options?: { temperature?: number; maxTokens?: number }
    ): Promise<any> {
      const response = await fetch(`${config.baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: options?.maxTokens ?? config.maxTokens,
          temperature: options?.temperature ?? config.temperature,
          system: "You are a structured reasoning agent. Output ONLY valid JSON matching the provided schema. No markdown, no explanation.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error("Empty response from Anthropic");
      }

      try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (e) {
        throw new Error(`Failed to parse/validate Anthropic response: ${e instanceof Error ? e.message : String(e)}\nRaw: ${content}`);
      }
    },
  };
}

function createOpenAIProvider(config: {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): ReasoningLLM {
  return {
    async invokeStructured<T extends { parse: (json: string) => any }>(
      schema: T,
      prompt: string,
      options?: { temperature?: number; maxTokens?: number }
    ): Promise<any> {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
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
          temperature: options?.temperature ?? config.temperature,
          max_tokens: options?.maxTokens ?? config.maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (e) {
        throw new Error(`Failed to parse/validate OpenAI response: ${e instanceof Error ? e.message : String(e)}\nRaw: ${content}`);
      }
    },
  };
}

function createNVIDIAProvider(config: {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): ReasoningLLM {
  return {
    async invokeStructured<T extends { parse: (json: string) => any }>(
      schema: T,
      prompt: string,
      options?: { temperature?: number; maxTokens?: number }
    ): Promise<any> {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
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
          temperature: options?.temperature ?? config.temperature,
          max_tokens: options?.maxTokens ?? config.maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from NVIDIA");
      }

      try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (e) {
        throw new Error(`Failed to parse/validate NVIDIA response: ${e instanceof Error ? e.message : String(e)}\nRaw: ${content}`);
      }
    },
  };
}

function createOllamaProvider(config: {
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}): ReasoningLLM {
  return {
    async invokeStructured<T extends { parse: (json: string) => any }>(
      schema: T,
      prompt: string,
      options?: { temperature?: number; maxTokens?: number }
    ): Promise<any> {
      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
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
          options: {
            temperature: options?.temperature ?? config.temperature,
            num_predict: options?.maxTokens ?? config.maxTokens,
          },
          format: "json",
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.message?.content;

      if (!content) {
        throw new Error("Empty response from Ollama");
      }

      try {
        const parsed = JSON.parse(content);
        return schema.parse(parsed);
      } catch (e) {
        throw new Error(`Failed to parse/validate Ollama response: ${e instanceof Error ? e.message : String(e)}\nRaw: ${content}`);
      }
    },
  };
}

export function detectProviderFromEnv(): ProviderConfig {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      type: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b-thinking-2507-fast",
      temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || "0.4"),
      maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || "8192"),
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      type: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || "0.4"),
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || "8192"),
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o",
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.4"),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "8192"),
    };
  }

  if (process.env.NVIDIA_API_KEY) {
    return {
      type: "nvidia",
      apiKey: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra",
      temperature: parseFloat(process.env.NVIDIA_TEMPERATURE || "0.4"),
      maxTokens: parseInt(process.env.NVIDIA_MAX_TOKENS || "8192"),
    };
  }

  if (process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL) {
    return {
      type: "ollama",
      baseUrl: process.env.OLLAMA_BASE_URL || process.env.OLLAMA_HOST || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "qwen2.5:32b",
      temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || "0.4"),
      maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || "8192"),
    };
  }

  return { type: "local" };
}