import { describe, it, expect } from "vitest";
import { generateLinearSlicePlan, formatLinearSlicePlan } from "@/lib/reasoning-agent/linear-integration";
import { ReasoningResult } from "@/lib/reasoning-agent/types";

const mockResult: ReasoningResult = {
  trace: {
    select: {
      selectedIds: [1, 4, 7, 9],
      selectedModules: ["Break down", "List facts", "Step-by-step", "Make table"],
      selectionRationale: "Test",
    },
    adapt: { adaptedModules: [] },
    implement: {
      planSteps: [
        { stepNumber: 1, description: "Step 1", expectedOutput: "Output 1" },
        { stepNumber: 2, description: "Step 2", expectedOutput: "Output 2" },
      ],
      finalAnswerFormat: "Markdown",
    },
    solve: {
      stepOutputs: ["Output 1", "Output 2"],
      finalAnswer: "Answer",
      reasoningTrace: {
        selectedIds: [1, 4, 7, 9],
        selectedModules: ["Break down", "List facts", "Step-by-step", "Make table"],
        selectionRationale: "Test",
        adaptedModules: [],
        planSteps: [
          { stepNumber: 1, description: "Step 1", expectedOutput: "Output 1" },
          { stepNumber: 2, description: "Step 2", expectedOutput: "Output 2" },
        ],
        finalAnswerFormat: "Markdown",
      },
    },
  },
  answer: "Test answer",
};

describe("Workflow Integration", () => {
  it("generates Linear slice plan with 6 slices", () => {
    const plan = generateLinearSlicePlan(mockResult, "Test task", "BRI-177", "test-feature");

    expect(plan.slices).toHaveLength(6);
    expect(plan.parentIssue).toBe("BRI-177");
    expect(plan.featureSlug).toBe("test-feature");
  });

  it("includes all required slice types", () => {
    const plan = generateLinearSlicePlan(mockResult, "Test task", "BRI-177", "test-feature");

    const specSlices = plan.slices.filter((s) => s.type === "spec");
    const deliverySlices = plan.slices.filter((s) => s.type === "delivery");

    expect(specSlices).toHaveLength(1);
    expect(specSlices[0].id).toBe("S01");
    expect(deliverySlices).toHaveLength(5);
  });

  it("formats slice plan as markdown table", () => {
    const plan = generateLinearSlicePlan(mockResult, "Test task", "BRI-177", "test-feature");
    const formatted = formatLinearSlicePlan(plan);

    expect(formatted).toContain("# Linear Slice Plan");
    expect(formatted).toContain("| Slice | Type | Slug |");
    expect(formatted).toContain("S01");
    expect(formatted).toContain("S02");
    expect(formatted).toContain("S03");
    expect(formatted).toContain("S04");
    expect(formatted).toContain("S05");
    expect(formatted).toContain("S06");
  });

  it("has correct dependencies", () => {
    const plan = generateLinearSlicePlan(mockResult, "Test task", "BRI-177", "test-feature");

    expect(plan.slices[0].dependsOn).toEqual([]);
    expect(plan.slices[1].dependsOn).toContain("S01");
    expect(plan.slices[2].dependsOn).toContain("S01");
    expect(plan.slices[2].dependsOn).toContain("S02");
    expect(plan.slices[3].dependsOn).toContain("S01");
    expect(plan.slices[3].dependsOn).toContain("S02");
  });
});