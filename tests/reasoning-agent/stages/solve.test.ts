import { describe, it, expect, vi, beforeEach } from "vitest";
import { solveStage } from "@/lib/reasoning-agent/stages/solve";

const mockLLM = {
  invokeStructured: vi.fn(),
};

describe("SOLVE Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes plan and produces Mermaid diagram for PDA design", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      stepOutputs: [
        "PDA Seeds: [escrow, user_pubkey, amount], [escrow, vault, token_mint]",
        "PDA Derivation: findProgramAddress(seeds, programId) → validates rent-exempt, signer match",
        "```mermaid\ngraph TD\n  A[Escrow Program] --> B[Escrow Account: seeds=[escrow, user, amount]]\n  A --> C[Vault Account: seeds=[escrow, vault, mint]]\n  B --> D[Owner: Escrow Program]\n  C --> D\n  B --> E[Space: 8 + 32 + 8 + 1]\n  C --> E\n```",
        "Consistency: All PDAs rent-exempt ✓, seeds unique ✓, program owns accounts ✓, signers match ✓",
      ],
      finalAnswer: "# Escrow PDA Hierarchy\n\n## Account Structure\n\n```mermaid\ngraph TD\n  A[Escrow Program] --> B[Escrow Account: seeds=[escrow, user, amount]]\n  A --> C[Vault Account: seeds=[escrow, vault, mint]]\n  B --> D[Owner: Escrow Program]\n  C --> D\n  B --> E[Space: 8 + 32 + 8 + 1]\n  C --> E\n```\n\n## Constraints Verified\n- Rent-exempt lamports calculated\n- Signer requirements matched\n- PDA seeds derive uniquely\n- Program owns all accounts",
      reasoningTrace: {
        selectedIds: [1, 4, 7, 9],
        selectedModules: [
          "Break the problem into sub-problems and solve each",
          "List the relevant facts, constraints, and unknowns",
          "Step-by-step reasoning from premises to conclusion",
          "Make a table, list, or diagram to organize the information",
        ],
        selectionRationale: "PDA design needs decomposition, fact listing, step-by-step derivation, and diagram",
        adaptedModules: [
          { original: "List facts", adapted: "List PDA seeds, rent, signers" },
          { original: "Step-by-step", adapted: "Derive PDA addresses" },
          { original: "Make table", adapted: "Create account hierarchy diagram" },
          { original: "Check consistency", adapted: "Verify all constraints" },
        ],
        planSteps: [
          { stepNumber: 1, description: "List PDA seeds", expectedOutput: "List of seeds" },
          { stepNumber: 2, description: "Derive PDAs", expectedOutput: "Derivation logic" },
          { stepNumber: 3, description: "Create diagram", expectedOutput: "Mermaid diagram" },
          { stepNumber: 4, description: "Verify consistency", expectedOutput: "Consistency check" },
        ],
        finalAnswerFormat: "Mermaid diagram code block",
      },
    });

    const result = await solveStage(mockLLM, {
      task: "Design PDA hierarchy for escrow program",
      planSteps: [
        { stepNumber: 1, description: "List PDA seeds", expectedOutput: "List of seeds" },
        { stepNumber: 2, description: "Derive PDAs", expectedOutput: "Derivation logic" },
        { stepNumber: 3, description: "Create diagram", expectedOutput: "Mermaid diagram" },
        { stepNumber: 4, description: "Verify consistency", expectedOutput: "Consistency check" },
      ],
      domainContext: "solana",
      finalAnswerFormat: "Mermaid diagram code block",
    });

    expect(result.stepOutputs).toHaveLength(4);
    expect(result.finalAnswer).toContain("mermaid");
    expect(result.finalAnswer).toContain("Escrow Account");
    expect(result.finalAnswer).toContain("Vault Account");
    expect(result.reasoningTrace.selectedIds).toEqual([1, 4, 7, 9]);
  });

  it("executes plan for architecture design with Markdown output", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      stepOutputs: [
        "Components: Payment Service, Ledger Service, Notification Service, Event Bus",
        "Trade-offs: Async (higher throughput, eventual consistency) vs Sync (lower latency, strong consistency)",
        "Event flow: PaymentCreated → LedgerUpdated → NotificationSent, with idempotency keys",
        "Architecture: Event-driven, CQRS for ledger, outbox pattern for reliability",
      ],
      finalAnswer: "# Event-Driven Payment Architecture\n\n## Components\n- Payment Service: handles payment initiation\n- Ledger Service: CQRS read/write models\n- Notification Service: async notifications\n- Event Bus: Kafka/RabbitMQ\n\n## Trade-offs\n| Aspect | Async | Sync |\n|--------|-------|------|\n| Throughput | High | Low |\n| Consistency | Eventual | Strong |\n| Complexity | Higher | Lower |\n\n## Event Flow\nPaymentCreated → LedgerUpdated → NotificationSent",
      reasoningTrace: {
        selectedIds: [1, 2, 5, 11, 12],
        selectedModules: [
          "Break the problem into sub-problems and solve each",
          "Identify the type of problem",
          "Consider analogies",
          "Evaluate trade-offs",
          "Devise an algorithm",
        ],
        selectionRationale: "Architecture needs decomposition, classification, analogies, trade-offs, algorithm",
        adaptedModules: [],
        planSteps: [
          { stepNumber: 1, description: "Identify components", expectedOutput: "Component list" },
          { stepNumber: 2, description: "Analyze trade-offs", expectedOutput: "Trade-off table" },
          { stepNumber: 3, description: "Design event flow", expectedOutput: "Event flow diagram" },
          { stepNumber: 4, description: "Synthesize architecture", expectedOutput: "Architecture document" },
        ],
        finalAnswerFormat: "Markdown architecture design document",
      },
    });

    const result = await solveStage(mockLLM, {
      task: "Design event-driven payment architecture",
      planSteps: [
        { stepNumber: 1, description: "Identify components", expectedOutput: "Component list" },
        { stepNumber: 2, description: "Analyze trade-offs", expectedOutput: "Trade-off table" },
        { stepNumber: 3, description: "Design event flow", expectedOutput: "Event flow diagram" },
        { stepNumber: 4, description: "Synthesize architecture", expectedOutput: "Architecture document" },
      ],
      finalAnswerFormat: "Markdown architecture design document",
    });

    expect(result.stepOutputs).toHaveLength(4);
    expect(result.finalAnswer).toContain("# Event-Driven Payment Architecture");
    expect(result.finalAnswer).toContain("Trade-offs");
    expect(result.finalAnswer).toContain("Event Flow");
  });

  it("produces structured trace for debugging task", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      stepOutputs: [
        "Blockhash lifetime: 150 slots (~75-90 seconds). Transaction submission: ~2-5s. Retry: 3 attempts with 2s delay.",
        "Failure scenarios: 1) Network delay >75s, 2) Slot skip during submission, 3) RPC lag causes stale blockhash, 4) Race condition between fetch and sign",
        "Fix: Increase blockhash fetch-to-submit window, add durable nonce for long operations, implement exponential backoff",
        "Validation: Fix covers all 4 scenarios. Nonce eliminates blockhash expiry. Backoff handles RPC lag. Monitoring added for slot skips.",
      ],
      finalAnswer: "# Root Cause: Blockhash Expiry in Stake Transactions\n\n## Analysis\nBlockhash lifetime (150 slots) insufficient for stake transaction flow with retries.\n\n## Failure Scenarios\n1. Network delay exceeds blockhash lifetime\n2. Slot skip during submission\n3. RPC lag returns stale blockhash\n4. Race condition fetch→sign→submit\n\n## Fix\n- Use durable nonce for long operations\n- Exponential backoff with jitter\n- Pre-fetch blockhash closer to submit\n- Add slot skip monitoring",
      reasoningTrace: {
        selectedIds: [4, 8, 10, 14, 15],
        selectedModules: [
          "List facts",
          "Consider counterexamples",
          "Reverse-engineer",
          "Check consistency",
          "Self-verify",
        ],
        selectionRationale: "Debugging needs facts, counterexamples, reverse-engineering, consistency, self-verify",
        adaptedModules: [],
        planSteps: [],
        finalAnswerFormat: "Root cause analysis",
      },
    });

    const result = await solveStage(mockLLM, {
      task: "Debug stake transaction blockhash expiry",
      planSteps: [
        { stepNumber: 1, description: "List blockhash facts", expectedOutput: "Blockhash lifetime, timing" },
        { stepNumber: 2, description: "Trace failure scenarios", expectedOutput: "Failure scenarios" },
        { stepNumber: 3, description: "Propose fix", expectedOutput: "Fix recommendation" },
        { stepNumber: 4, description: "Validate fix", expectedOutput: "Fix validation" },
      ],
      domainContext: "solana",
      finalAnswerFormat: "Root cause analysis with fix recommendation",
    });

    expect(result.stepOutputs).toHaveLength(4);
    expect(result.finalAnswer).toContain("Root Cause");
    expect(result.finalAnswer).toContain("durable nonce");
    expect(result.reasoningTrace.selectedIds).toContain(4);
    expect(result.reasoningTrace.selectedIds).toContain(8);
  });
});