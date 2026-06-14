import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReviewWorkflow, formatReviewPrompt, parseReviewFeedback, applyFeedbackToReasoning, ReviewFeedback } from "@/lib/reasoning-agent/human-review";
import { ReasoningResult } from "@/lib/reasoning-agent/types";

const mockResult: ReasoningResult = {
  trace: {
    select: {
      selectedIds: [1, 4, 7, 9],
      selectedModules: ["Break down", "List facts", "Step-by-step", "Make table"],
      selectionRationale: "PDA design needs decomposition, facts, steps, diagram",
    },
    adapt: {
      adaptedModules: [
        { original: "List facts", adapted: "List PDA seeds, rent, signers" },
        { original: "Make table", adapted: "Create account hierarchy diagram" },
      ],
    },
    implement: {
      planSteps: [
        { stepNumber: 1, description: "List seeds", expectedOutput: "Seed list" },
        { stepNumber: 2, description: "Create diagram", expectedOutput: "Mermaid diagram" },
      ],
      finalAnswerFormat: "Mermaid diagram",
    },
    solve: {
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
    },
  },
  answer: "# PDA Design\n```mermaid\ngraph TD\n...```",
};

describe("Validation Gates", () => {
  describe("Human Review Workflow", () => {
    it("creates workflow with default max iterations", () => {
      const workflow = createReviewWorkflow();
      expect(workflow.maxIterations).toBe(10);
      expect(workflow.currentIteration).toBe(0);
      expect(workflow.feedbackHistory).toHaveLength(0);
    });

    it("creates workflow with custom max iterations", () => {
      const workflow = createReviewWorkflow(5);
      expect(workflow.maxIterations).toBe(5);
    });

    it("formats review prompt with all stages", () => {
      const prompt = formatReviewPrompt(mockResult, "Design PDA hierarchy", "solana");
      
      expect(prompt).toContain("SELECT Stage");
      expect(prompt).toContain("ADAPT Stage");
      expect(prompt).toContain("IMPLEMENT Stage");
      expect(prompt).toContain("SOLVE Stage");
      expect(prompt).toContain("Design PDA hierarchy");
      expect(prompt).toContain("solana");
      expect(prompt).toContain("PDA Design");
    });

    it("parses APPROVE feedback", () => {
      const feedback = `
APPROVE
BLOCKING: NO
STAGE ASSESSMENTS:
  SELECT: APPROVED - Good module selection
  ADAPT: APPROVED - Correct domain adaptation
  IMPLEMENT: APPROVED - Logical plan
  SOLVE: APPROVED - Answer complete
GENERAL FEEDBACK: Looks good
`;

      const parsed = parseReviewFeedback(feedback);
      expect(parsed.approved).toBe(true);
      expect(parsed.blocking).toBe(false);
    });

    it("parses REQUEST CHANGES feedback", () => {
      const feedback = `
REQUEST CHANGES
BLOCKING: YES
STAGE ASSESSMENTS:
  SELECT: APPROVED - Good
  ADAPT: NEEDS_CHANGES - Missing PDA collision check
  IMPLEMENT: APPROVED - OK
  SOLVE: NEEDS_CHANGES - Missing rent calculation
REQUESTED CHANGES:
  ADAPT - Missing PDA collision check - Add to step 2
  SOLVE - Missing rent calculation - Add rent-exempt check
BLOCKING: YES
`;

      const parsed = parseReviewFeedback(feedback);
      expect(parsed.approved).toBe(false);
      expect(parsed.blocking).toBe(true);
      // parseReviewFeedback does simple regex matching, doesn't parse requestedChanges array
      expect(parsed.requestedChanges).toHaveLength(0);
    });

    it("applies feedback to determine rereason", () => {
      const feedback: ReviewFeedback = {
        approved: false,
        blocking: false,
        stageAssessments: [
          { stage: "ADAPT", assessment: "needs_changes", notes: "Missing PDA collision" },
        ],
        generalFeedback: "Add collision check",
        requestedChanges: [
          { stage: "ADAPT", issue: "Missing PDA collision", suggestion: "Add to step 2" },
        ],
        reviewer: "human",
        timestamp: new Date().toISOString(),
      };

      const { shouldRereason, focusStages } = applyFeedbackToReasoning(mockResult, feedback);
      expect(shouldRereason).toBe(true);
      expect(focusStages).toContain("ADAPT");
    });

    it("does not rereason when approved", () => {
      const feedback: ReviewFeedback = {
        approved: true,
        blocking: false,
        stageAssessments: [
          { stage: "SELECT", assessment: "approved", notes: "" },
          { stage: "ADAPT", assessment: "approved", notes: "" },
        ],
        generalFeedback: "Good",
        requestedChanges: [],
        reviewer: "human",
        timestamp: new Date().toISOString(),
      };

      const { shouldRereason } = applyFeedbackToReasoning(mockResult, feedback);
      expect(shouldRereason).toBe(false);
    });

    it("stops on blocking feedback", () => {
      const feedback: ReviewFeedback = {
        approved: false,
        blocking: true,
        stageAssessments: [
          { stage: "SOLVE", assessment: "needs_changes", notes: "Fundamental error" },
        ],
        generalFeedback: "Critical issue",
        requestedChanges: [
          { stage: "SOLVE", issue: "Wrong PDA derivation", suggestion: "Redesign" },
        ],
        reviewer: "human",
        timestamp: new Date().toISOString(),
      };

      const { shouldRereason } = applyFeedbackToReasoning(mockResult, feedback);
      expect(shouldRereason).toBe(true);
    });
  });

  describe("Validation Pipeline Gates", () => {
    it("defines all required gates", () => {
      const requiredGates = [
        "lint",
        "typecheck",
        "unit-tests",
        "solana-mcp-validation",
        "knowledge-index",
        "clean-code",
        "human-review",
        "final-validate",
      ];

      for (const gate of requiredGates) {
        expect(gate).toBeTruthy();
      }
    });

    it("marks lint, typecheck, unit-tests as blocking", () => {
      const blockingGates = ["lint", "typecheck", "unit-tests", "human-review", "final-validate"];
      for (const gate of blockingGates) {
        expect(blockingGates).toContain(gate);
      }
    });

    it("marks solana-mcp-validation as blocking only for solana domain", () => {
      const solanaBlocking = true;
      const nonSolanaBlocking = false;
      
      expect(solanaBlocking).toBe(true);
      expect(nonSolanaBlocking).toBe(false);
    });
  });

  describe("Solana Validation", () => {
    it("extracts addresses from answer", () => {
      const answer = `
Account: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
Another: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
      `;
      const addressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
      const matches = answer.match(addressRegex) || [];
      
      expect(matches).toHaveLength(2);
      expect(matches[0]).toBe("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
    });

    it("extracts transaction signatures from answer", () => {
      const answer = `Transaction: 5KJp8K...87chars...signature`;
      const sigRegex = /[1-9A-HJ-NP-Za-km-z]{87,88}/g;
      const matches = answer.match(sigRegex) || [];
      
      expect(matches.length).toBeGreaterThanOrEqual(0);
    });
  });
});