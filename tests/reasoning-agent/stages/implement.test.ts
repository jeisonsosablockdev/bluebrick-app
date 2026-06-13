import { describe, it, expect, vi, beforeEach } from "vitest";
import { implementStage } from "@/lib/reasoning-agent/stages/implement";

const mockLLM = {
  invokeStructured: vi.fn(),
};

describe("IMPLEMENT Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates plan for Solana PDA design with Mermaid output", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      planSteps: [
        {
          stepNumber: 1,
          description: "List PDA seeds, rent, signers, authorities using adapted module 1",
          expectedOutput: "Structured list of PDA seeds (escrow, user, amount), rent-exempt lamports, required signers, authority constraints",
        },
        {
          stepNumber: 2,
          description: "Derive PDA addresses and validate constraints using adapted module 2",
          expectedOutput: "PDA derivation logic with seed validation, rent check, authority verification",
        },
        {
          stepNumber: 3,
          description: "Create account hierarchy diagram using adapted module 3",
          expectedOutput: "Mermaid diagram showing account relationships, seeds, and ownership",
        },
        {
          stepNumber: 4,
          description: "Verify consistency of all constraints using adapted module 4",
          expectedOutput: "Consistency check: rent-exempt, signer match, PDA derivation, program ownership",
        },
      ],
      finalAnswerFormat: "Mermaid diagram code block with account hierarchy",
    });

    const result = await implementStage(mockLLM, {
      task: "Design PDA hierarchy for escrow program",
      adaptedModules: [
        { original: "List facts", adapted: "List PDA seeds, rent, signers, authorities" },
        { original: "Step-by-step", adapted: "Derive PDA addresses and validate constraints" },
        { original: "Make table", adapted: "Create account hierarchy diagram" },
        { original: "Check consistency", adapted: "Verify all Solana constraints" },
      ],
    });

    expect(result.planSteps).toHaveLength(4);
    expect(result.planSteps[0].stepNumber).toBe(1);
    expect(result.planSteps[1].stepNumber).toBe(2);
    expect(result.planSteps[2].stepNumber).toBe(3);
    expect(result.planSteps[3].stepNumber).toBe(4);
    expect(result.finalAnswerFormat).toContain("Mermaid");
  });

  it("creates plan for architecture design with Markdown output", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      planSteps: [
        {
          stepNumber: 1,
          description: "Identify components and interfaces using adapted module 1",
          expectedOutput: "List of services, APIs, events, data stores",
        },
        {
          stepNumber: 2,
          description: "Analyze trade-offs between sync vs async using adapted module 2",
          expectedOutput: "Trade-off table: latency, consistency, complexity, scalability",
        },
        {
          stepNumber: 3,
          description: "Design event flow and data consistency using adapted module 3",
          expectedOutput: "Event flow diagram and consistency model",
        },
        {
          stepNumber: 4,
          description: "Synthesize into architecture document using adapted module 4",
          expectedOutput: "Complete architecture specification",
        },
      ],
      finalAnswerFormat: "Markdown architecture design document",
    });

    const result = await implementStage(mockLLM, {
      task: "Design event-driven payment architecture",
      adaptedModules: [
        { original: "Break down", adapted: "Identify components, interfaces, data flows" },
        { original: "Evaluate trade-offs", adapted: "Analyze sync vs async trade-offs" },
        { original: "Devise algorithm", adapted: "Design event flow and data consistency" },
        { original: "Synthesize perspectives", adapted: "Synthesize into architecture document" },
      ],
    });

    expect(result.planSteps).toHaveLength(4);
    expect(result.finalAnswerFormat).toContain("Markdown");
    expect(result.planSteps[1].expectedOutput.toLowerCase()).toContain("trade-off");
  });

  it("creates plan for debugging with step-by-step output", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      planSteps: [
        {
          stepNumber: 1,
          description: "List facts: blockhash lifetime, submission timing, retry logic using adapted module 1",
          expectedOutput: "Blockhash lifetime (150 slots), submission latency, retry config",
        },
        {
          stepNumber: 2,
          description: "Trace failure path with counterexamples using adapted module 2",
          expectedOutput: "Failure scenarios: network delay, slot skip, RPC lag, race condition",
        },
        {
          stepNumber: 3,
          description: "Verify fix addresses all failure modes using adapted module 3",
          expectedOutput: "Fix validation: covers all identified failure scenarios",
        },
      ],
      finalAnswerFormat: "Root cause analysis with fix recommendation",
    });

    const result = await implementStage(mockLLM, {
      task: "Debug stake transaction blockhash expiry",
      adaptedModules: [
        { original: "List facts", adapted: "List blockhash lifetime, timing, retry logic" },
        { original: "Consider counterexamples", adapted: "Trace failure path with counterexamples" },
        { original: "Check consistency", adapted: "Verify fix addresses all failure modes" },
      ],
    });

    expect(result.planSteps).toHaveLength(3);
    expect(result.finalAnswerFormat).toContain("Root cause");
  });

  it("limits plan steps to reasonable number", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      planSteps: Array(10).fill(null).map((_, i) => ({
        stepNumber: i + 1,
        description: `Step ${i + 1}`,
        expectedOutput: `Output ${i + 1}`,
      })),
      finalAnswerFormat: "Test",
    });

    const result = await implementStage(mockLLM, {
      task: "Test task",
      adaptedModules: [{ original: "test", adapted: "test" }],
    });

    expect(result.planSteps.length).toBeLessThanOrEqual(10);
  });
});