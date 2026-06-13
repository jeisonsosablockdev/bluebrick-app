import { describe, it, expect, vi, beforeEach } from "vitest";
import { selectStage } from "@/lib/reasoning-agent/stages/select";
import { CANONICAL_MODULES } from "@/lib/reasoning-agent/module-library";

const mockLLM = {
  invokeStructured: vi.fn(),
};

describe("SELECT Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects appropriate modules for Solana PDA design task", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      selectedIds: [1, 4, 7, 9],
      selectedModules: [
        "Break the problem into sub-problems and solve each",
        "List the relevant facts, constraints, and unknowns",
        "Step-by-step reasoning from premises to conclusion",
        "Make a table, list, or diagram to organize the information",
      ],
      selectionRationale: "PDA design needs decomposition, fact listing (seeds/rent), step-by-step derivation, and account table",
    });

    const result = await selectStage(mockLLM, {
      task: "Design PDA hierarchy for escrow program",
      moduleLibrary: CANONICAL_MODULES,
      domainContext: "solana",
    });

    expect(result.selectedIds).toHaveLength(4);
    expect(result.selectedIds).toContain(1); // Break down
    expect(result.selectedIds).toContain(4); // List facts
    expect(result.selectedIds).toContain(7); // Step-by-step
    expect(result.selectedIds).toContain(9); // Make table
    expect(result.selectionRationale).toContain("PDA");
  });

  it("selects appropriate modules for architecture design task", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      selectedIds: [1, 2, 5, 11, 12],
      selectedModules: [
        "Break the problem into sub-problems and solve each",
        "Identify the type of problem (logic, math, classification, planning, ...)",
        "Consider analogies — what problem is this structurally similar to?",
        "Evaluate trade-offs between competing options explicitly",
        "Devise an algorithm or procedure that always finds the answer",
      ],
      selectionRationale: "Architecture design needs decomposition, problem classification, analogies, trade-offs, and algorithm design",
    });

    const result = await selectStage(mockLLM, {
      task: "Design event-driven architecture for payment processing",
      moduleLibrary: CANONICAL_MODULES,
    });

    expect(result.selectedIds).toHaveLength(5);
    expect(result.selectedIds).toContain(1); // Break down
    expect(result.selectedIds).toContain(2); // Identify type
    expect(result.selectedIds).toContain(11); // Trade-offs
    expect(result.selectedIds).toContain(12); // Algorithm
  });

  it("selects appropriate modules for debugging task", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      selectedIds: [4, 8, 10, 14, 15],
      selectedModules: [
        "List the relevant facts, constraints, and unknowns",
        "Consider counterexamples that would falsify a candidate answer",
        "Reverse-engineer from a candidate answer back to the premises",
        "Check consistency — does the candidate answer satisfy EVERY constraint?",
        "Self-verify — solve a second way and compare the two answers",
      ],
      selectionRationale: "Debugging needs fact listing, counterexamples, reverse-engineering, consistency check, and self-verification",
    });

    const result = await selectStage(mockLLM, {
      task: "Debug why stake transaction fails with blockhash expiry",
      moduleLibrary: CANONICAL_MODULES,
      domainContext: "solana",
    });

    expect(result.selectedIds).toHaveLength(5);
    expect(result.selectedIds).toContain(4); // List facts
    expect(result.selectedIds).toContain(8); // Counterexamples
    expect(result.selectedIds).toContain(14); // Check consistency
    expect(result.selectedIds).toContain(15); // Self-verify
  });

  it("respects domain context in selection rationale", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      selectedIds: [1, 4, 7],
      selectedModules: [
        "Break the problem into sub-problems and solve each",
        "List the relevant facts, constraints, and unknowns",
        "Step-by-step reasoning from premises to conclusion",
      ],
      selectionRationale: "NFT minting needs decomposition, fact listing (auth/royalty), and step-by-step flow",
    });

    const result = await selectStage(mockLLM, {
      task: "Design NFT minting flow with royalty",
      moduleLibrary: CANONICAL_MODULES,
      domainContext: "nft",
    });

    expect(result.selectionRationale).toContain("NFT");
  });
});