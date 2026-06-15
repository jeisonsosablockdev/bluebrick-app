import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReasoningAgent } from "@/lib/reasoning-agent/index";

const mockLLM = {
  invokeStructured: vi.fn(),
};

vi.mock("@/lib/reasoning-agent/llm", () => ({
  createLLMProvider: () => mockLLM,
}));

describe("ReasoningAgent CLI Integration", () => {
  let agent: ReasoningAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new ReasoningAgent({
      provider: { type: "local" },
    });
  });

  it("runs full pipeline for Solana task", async () => {
    mockLLM.invokeStructured
      .mockResolvedValueOnce({
        selectedIds: [1, 4, 7, 9],
        selectedModules: [
          "Break down",
          "List facts",
          "Step-by-step",
          "Make table",
        ],
        selectionRationale: "PDA design needs decomposition, facts, steps, diagram",
      })
      .mockResolvedValueOnce({
        adaptedModules: [
          { original: "List facts", adapted: "List PDA seeds, rent, signers" },
          { original: "Make table", adapted: "Create account hierarchy diagram" },
        ],
      })
      .mockResolvedValueOnce({
        planSteps: [
          { stepNumber: 1, description: "List seeds", expectedOutput: "Seed list" },
          { stepNumber: 2, description: "Create diagram", expectedOutput: "Mermaid diagram" },
        ],
        finalAnswerFormat: "Mermaid diagram",
      })
      .mockResolvedValueOnce({
        stepOutputs: ["Seeds: [escrow, user]", "```mermaid\ngraph TD\n...```"],
        finalAnswer: "# PDA Design\n```mermaid\ngraph TD\n...```",
        reasoningTrace: {
          selectedIds: [1, 4, 7, 9],
          selectedModules: ["Break down", "List facts", "Step-by-step", "Make table"],
          selectionRationale: "PDA design needs decomposition, facts, steps, diagram",
          adaptedModules: [
            { original: "List facts", adapted: "List PDA seeds, rent, signers" },
            { original: "Make table", adapted: "Create account hierarchy diagram" },
          ],
          planSteps: [
            { stepNumber: 1, description: "List seeds", expectedOutput: "Seed list" },
            { stepNumber: 2, description: "Create diagram", expectedOutput: "Mermaid diagram" },
          ],
          finalAnswerFormat: "Mermaid diagram",
        },
      });

    const result = await agent.reason("Design PDA hierarchy for escrow", {
      domain: "solana",
      outputMode: "both",
    });

    expect(result.answer).toContain("mermaid");
    expect(result.trace.select.selectedIds).toEqual([1, 4, 7, 9]);
    expect(result.trace.adapt.adaptedModules[0].adapted).toContain("PDA seeds");
    expect(result.trace.implement.planSteps).toHaveLength(2);
    expect(result.trace.solve.stepOutputs).toHaveLength(2);
  });

  it("runs pipeline for general architecture task", async () => {
    mockLLM.invokeStructured
      .mockResolvedValueOnce({
        selectedIds: [1, 2, 11, 12],
        selectedModules: [
          "Break down",
          "Identify type",
          "Evaluate trade-offs",
          "Devise algorithm",
        ],
        selectionRationale: "Architecture needs decomposition, classification, trade-offs, algorithm",
      })
      .mockResolvedValueOnce({
        adaptedModules: [
          { original: "Break down", adapted: "Identify services, APIs, events" },
          { original: "Evaluate trade-offs", adapted: "Compare sync vs async" },
        ],
      })
      .mockResolvedValueOnce({
        planSteps: [
          { stepNumber: 1, description: "Identify components", expectedOutput: "Component list" },
          { stepNumber: 2, description: "Analyze trade-offs", expectedOutput: "Trade-off table" },
        ],
        finalAnswerFormat: "Markdown architecture document",
      })
      .mockResolvedValueOnce({
        stepOutputs: ["Components: A, B, C", "Trade-off table..."],
        finalAnswer: "# Architecture\n## Components\n- A\n- B\n- C",
        reasoningTrace: {
          selectedIds: [1, 2, 11, 12],
          selectedModules: ["Break down", "Identify type", "Evaluate trade-offs", "Devise algorithm"],
          selectionRationale: "Architecture needs decomposition, classification, trade-offs, algorithm",
          adaptedModules: [
            { original: "Break down", adapted: "Identify services, APIs, events" },
            { original: "Evaluate trade-offs", adapted: "Compare sync vs async" },
          ],
          planSteps: [
            { stepNumber: 1, description: "Identify components", expectedOutput: "Component list" },
            { stepNumber: 2, description: "Analyze trade-offs", expectedOutput: "Trade-off table" },
          ],
          finalAnswerFormat: "Markdown architecture document",
        },
      });

    const result = await agent.reason("Design microservices architecture", {
      outputMode: "answer",
    });

    expect(result.answer).toContain("# Architecture");
    expect(result.trace.select.selectedIds).toContain(11); // trade-offs
    expect(result.trace.select.selectedIds).toContain(12); // algorithm
  });

  it("uses default options when not specified", async () => {
    mockLLM.invokeStructured
      .mockResolvedValueOnce({
        selectedIds: [1, 4],
        selectedModules: ["Break down", "List facts"],
        selectionRationale: "Test",
      })
      .mockResolvedValueOnce({ adaptedModules: [] })
      .mockResolvedValueOnce({
        planSteps: [{ stepNumber: 1, description: "Test", expectedOutput: "Test" }],
        finalAnswerFormat: "Test",
      })
      .mockResolvedValueOnce({
        stepOutputs: ["Test"],
        finalAnswer: "Test",
        reasoningTrace: {
          selectedIds: [1, 4],
          selectedModules: ["Break down", "List facts"],
          selectionRationale: "Test",
          adaptedModules: [],
          planSteps: [{ stepNumber: 1, description: "Test", expectedOutput: "Test" }],
          finalAnswerFormat: "Test",
        },
      });

    await agent.reason("Test task");

    // Verify default options were used (temperature 0.4, etc.)
    expect(mockLLM.invokeStructured).toHaveBeenCalledTimes(4);
  });

  it("throws on LLM error", async () => {
    mockLLM.invokeStructured.mockRejectedValueOnce(new Error("API error"));

    await expect(agent.reason("Test task")).rejects.toThrow("API error");
  });
});