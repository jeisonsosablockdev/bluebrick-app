#!/usr/bin/env node
import { ReasoningAgent } from "./index";
import { ReasoningAgentOptions } from "./types";
import { ProviderConfig, ProviderType, detectProviderFromEnv } from "./llm/provider-factory";

function printUsage() {
  console.log(`
Usage: reasoning-agent "task" [options]

Options:
  --domain <name>        Domain context (solana, nft, compliance, security, architecture, debugging, or custom)
  --provider <type>      LLM provider: openrouter, anthropic, openai, ollama, local (default: auto-detect from env)
  --model <name>         LLM model (provider-specific defaults)
  --temperature <num>    Temperature 0-1 (default: 0.4)
  --max-tokens <num>     Max tokens (default: 8192)
  --output <mode>        Output mode: trace, answer, both (default: both)
  --api-key <key>        API key for the selected provider
  --base-url <url>       Custom base URL for provider (OpenRouter, Ollama, etc.)
  --help                 Show this help

Environment Variables (auto-detected):
  OPENROUTER_API_KEY     OpenRouter API key
  ANTHROPIC_API_KEY      Anthropic API key
  OPENAI_API_KEY         OpenAI API key
  OLLAMA_BASE_URL        Ollama base URL (default: http://localhost:11434)
  OLLAMA_MODEL           Ollama model (default: qwen2.5:32b)

Examples:
  reasoning-agent "Design PDA hierarchy for escrow program" --domain solana
  reasoning-agent "Create threat model for CPI" --domain security --provider anthropic
  reasoning-agent "Design rate limiter" --provider ollama --model llama3.1:70b --output answer
  reasoning-agent "Plan feature slices" --domain nft --output both
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const task = args[0];
  if (!task || task.startsWith("--")) {
    console.error("Error: Task description required as first argument");
    printUsage();
    process.exit(1);
  }

  const options: ReasoningAgentOptions = {
    model: "qwen/qwen3-235b-a22b-thinking-2507-fast",
    temperature: 0.4,
    maxTokens: 8192,
    outputMode: "both",
  };

  let providerConfig: ProviderConfig = detectProviderFromEnv();
  let providerOverridden = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--domain":
        options.domain = next;
        i++;
        break;
      case "--provider":
        providerConfig = { ...providerConfig, type: next as ProviderType };
        providerOverridden = true;
        i++;
        break;
      case "--model":
        providerConfig = { ...providerConfig, model: next };
        options.model = next;
        i++;
        break;
      case "--temperature":
        providerConfig = { ...providerConfig, temperature: parseFloat(next) };
        options.temperature = parseFloat(next);
        i++;
        break;
      case "--max-tokens":
        providerConfig = { ...providerConfig, maxTokens: parseInt(next, 10) };
        options.maxTokens = parseInt(next, 10);
        i++;
        break;
      case "--output":
        options.outputMode = next as any;
        i++;
        break;
      case "--api-key":
        providerConfig = { ...providerConfig, apiKey: next };
        i++;
        break;
      case "--base-url":
        providerConfig = { ...providerConfig, baseUrl: next };
        i++;
        break;
    }
  }

  if (!providerOverridden && providerConfig.type === "local") {
    console.error("Error: No LLM provider configured. Set API key env var or use --provider/--api-key");
    console.error("Supported providers: openrouter, anthropic, openai, ollama, local");
    process.exit(1);
  }

  if (providerConfig.type !== "local" && !providerConfig.apiKey) {
    console.error(`Error: ${providerConfig.type} provider requires --api-key or corresponding env var`);
    process.exit(1);
  }

  const agent = new ReasoningAgent({ provider: providerConfig, defaultOptions: options });

  console.log(`\n🧠 Reasoning Agent - Task: ${task}\n`);
  console.log(`Domain: ${options.domain ?? "general"}`);
  console.log(`Provider: ${providerConfig.type}${providerConfig.model ? ` (${providerConfig.model})` : ""}`);
  console.log(`Output: ${options.outputMode}\n`);

  try {
    const startTime = Date.now();
    const result = await agent.reason(task, options);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (options.outputMode === "trace" || options.outputMode === "both") {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 REASONING TRACE");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      console.log("SELECT:");
      console.log(`  Modules: [${result.trace.select.selectedIds.join(", ")}]`);
      console.log(`  Rationale: ${result.trace.select.selectionRationale}\n`);

      console.log("ADAPT:");
      result.trace.adapt.adaptedModules.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.adapted}`);
      });
      console.log("");

      console.log("IMPLEMENT:");
      result.trace.implement.planSteps.forEach((s) => {
        console.log(`  Step ${s.stepNumber}: ${s.description}`);
        console.log(`    → ${s.expectedOutput}`);
      });
      console.log(`  Format: ${result.trace.implement.finalAnswerFormat}\n`);

      console.log("SOLVE:");
      result.trace.solve.stepOutputs.forEach((out, i) => {
        console.log(`  Step ${i + 1}: ${out.slice(0, 200)}${out.length > 200 ? "..." : ""}`);
      });
      console.log("");
    }

    if (options.outputMode === "answer" || options.outputMode === "both") {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ FINAL ANSWER");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      console.log(result.answer);
    }

    console.log(`\n⏱️  Completed in ${elapsed}s`);
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();