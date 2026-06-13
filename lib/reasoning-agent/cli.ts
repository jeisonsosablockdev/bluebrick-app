#!/usr/bin/env node
import { ReasoningAgent } from "./index";
import { ReasoningAgentOptions } from "./types";

function printUsage() {
  console.log(`
Usage: reasoning-agent "task" [options]

Options:
  --domain <name>        Domain context (solana, nft, compliance, or custom)
  --model <name>         LLM model (default: qwen/qwen3-235b-a22b-thinking-2507-fast)
  --temperature <num>    Temperature 0-1 (default: 0.4)
  --max-tokens <num>     Max tokens (default: 8192)
  --output <mode>        Output mode: trace, answer, both (default: both)
  --api-key <key>        OpenRouter API key (or set OPENROUTER_API_KEY env)
  --help                 Show this help

Examples:
  reasoning-agent "Design PDA hierarchy for escrow program" --domain solana
  reasoning-agent "Create threat model for cross-program invocation" --domain security
  reasoning-agent "Design rate limiter with sliding window" --output answer
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

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--domain":
        options.domain = next;
        i++;
        break;
      case "--model":
        options.model = next;
        i++;
        break;
      case "--temperature":
        options.temperature = parseFloat(next);
        i++;
        break;
      case "--max-tokens":
        options.maxTokens = parseInt(next, 10);
        i++;
        break;
      case "--output":
        options.outputMode = next as any;
        i++;
        break;
      case "--api-key":
        process.env.OPENROUTER_API_KEY = next;
        i++;
        break;
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Error: OPENROUTER_API_KEY environment variable or --api-key required");
    process.exit(1);
  }

  const agent = new ReasoningAgent({ apiKey });

  console.log(`\n🧠 Reasoning Agent - Task: ${task}\n`);
  console.log(`Domain: ${options.domain ?? "general"}`);
  console.log(`Model: ${options.model}`);
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