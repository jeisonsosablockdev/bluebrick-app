import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SelectInputSchema,
  SelectOutputSchema,
  AdaptInputSchema,
  AdaptOutputSchema,
  ImplementInputSchema,
  ImplementOutputSchema,
  SolveInputSchema,
  SolveOutputSchema,
  ReasoningAgentOptionsSchema,
  ReasoningResultSchema,
  ModuleLibrarySchema,
} from "@/lib/reasoning-agent/types";
import { CANONICAL_MODULES, getModuleLibrary } from "@/lib/reasoning-agent/module-library";
import { NULL_ADAPTER, getAdapterByName, adaptWithDomain } from "@/lib/reasoning-agent/adapters";

describe("Reasoning Agent - Core Engine Types", () => {
  describe("Module Library", () => {
    it("has 16 canonical modules", () => {
      expect(CANONICAL_MODULES).toHaveLength(16);
    });

    it("each module has id 0-15 and description", () => {
      CANONICAL_MODULES.forEach((m, i) => {
        expect(m.id).toBe(i);
        expect(m.description).toBeTruthy();
        expect(m.description.length).toBeGreaterThan(10);
      });
    });

    it("validates against schema", () => {
      const result = ModuleLibrarySchema.safeParse(CANONICAL_MODULES);
      expect(result.success).toBe(true);
    });

    it("getModuleLibrary returns all modules", () => {
      const lib = getModuleLibrary();
      expect(lib).toHaveLength(16);
    });
  });

  describe("Stage Input/Output Schemas", () => {
    it("SELECT input validates", () => {
      const input = {
        task: "Design PDA hierarchy",
        moduleLibrary: CANONICAL_MODULES,
        domainContext: "solana",
      };
      const result = SelectInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("SELECT output validates with 3-6 modules", () => {
      const output = {
        selectedIds: [1, 4, 7, 9],
        selectedModules: [
          "Break the problem into sub-problems and solve each",
          "List the relevant facts, constraints, and unknowns",
          "Step-by-step reasoning from premises to conclusion",
          "Make a table, list, or diagram to organize the information",
        ],
        selectionRationale: "Need decomposition, fact listing, step reasoning, and diagram",
      };
      const result = SelectOutputSchema.safeParse(output);
      expect(result.success).toBe(true);
    });

    it("SELECT output rejects <2 modules", () => {
      const output = {
        selectedIds: [1],
        selectedModules: ["Break the problem into sub-problems"],
        selectionRationale: "Too few",
      };
      const result = SelectOutputSchema.safeParse(output);
      expect(result.success).toBe(false);
    });

    it("SELECT output rejects >8 modules", () => {
      const output = {
        selectedIds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        selectedModules: Array(9).fill("module"),
        selectionRationale: "Too many",
      };
      const result = SelectOutputSchema.safeParse(output);
      expect(result.success).toBe(false);
    });

    it("ADAPT input/output validates", () => {
      const adaptInput = {
        task: "Design PDA hierarchy",
        selectedModules: ["List facts", "Make table"],
        domainContext: "solana",
      };
      expect(AdaptInputSchema.safeParse(adaptInput).success).toBe(true);

      const adaptOutput = {
        adaptedModules: [
          { original: "List facts", adapted: "List PDA seeds, rent, signers" },
          { original: "Make table", adapted: "Create account table with seeds, owner, space" },
        ],
      };
      expect(AdaptOutputSchema.safeParse(adaptOutput).success).toBe(true);
    });

    it("IMPLEMENT input/output validates", () => {
      const implementInput = {
        task: "Design PDA hierarchy",
        adaptedModules: [
          { original: "List facts", adapted: "List PDA seeds, rent, signers" },
        ],
      };
      expect(ImplementInputSchema.safeParse(implementInput).success).toBe(true);

      const implementOutput = {
        planSteps: [
          { stepNumber: 1, description: "List PDA seeds", expectedOutput: "List of seeds" },
          { stepNumber: 2, description: "Create diagram", expectedOutput: "Mermaid diagram" },
        ],
        finalAnswerFormat: "Mermaid diagram code block",
      };
      expect(ImplementOutputSchema.safeParse(implementOutput).success).toBe(true);
    });

    it("SOLVE input/output validates", () => {
      const solveInput = {
        task: "Design PDA hierarchy",
        planSteps: [
          { stepNumber: 1, description: "List PDA seeds", expectedOutput: "List of seeds" },
        ],
        domainContext: "solana",
        finalAnswerFormat: "Mermaid diagram",
      };
      expect(SolveInputSchema.safeParse(solveInput).success).toBe(true);

      const solveOutput = {
        stepOutputs: ["PDA seeds: [escrow, user, amount]"],
        finalAnswer: "```mermaid\ngraph TD\n...```",
        reasoningTrace: {
          selectedIds: [1, 4],
          selectedModules: ["Break down", "List facts"],
          selectionRationale: "Need decomposition and facts",
          adaptedModules: [{ original: "List facts", adapted: "List PDA seeds" }],
          planSteps: [{ stepNumber: 1, description: "List PDA seeds", expectedOutput: "List" }],
          finalAnswerFormat: "Mermaid diagram",
        },
      };
      expect(SolveOutputSchema.safeParse(solveOutput).success).toBe(true);
    });
  });

  describe("ReasoningAgentOptions", () => {
    it("validates with defaults", () => {
      const opts = { model: "test", temperature: 0.5 };
      const result = ReasoningAgentOptionsSchema.safeParse(opts);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputMode).toBe("both");
        expect(result.data.maxTokens).toBe(8192);
      }
    });

    it("rejects invalid temperature", () => {
      const opts = { temperature: 1.5 };
      const result = ReasoningAgentOptionsSchema.safeParse(opts);
      expect(result.success).toBe(false);
    });

    it("rejects invalid outputMode", () => {
      const opts = { outputMode: "invalid" };
      const result = ReasoningAgentOptionsSchema.safeParse(opts);
      expect(result.success).toBe(false);
    });
  });

  describe("Domain Adapters", () => {
    it("NULL_ADAPTER returns empty hints", () => {
      expect(NULL_ADAPTER.getAdaptationHints()).toBe("");
      expect(NULL_ADAPTER.name).toBe("null");
    });

    it("adaptWithDomain returns original when no enhancer", () => {
      const output = {
        adaptedModules: [{ original: "test", adapted: "adapted" }],
      };
      const result = adaptWithDomain(output, NULL_ADAPTER);
      expect(result).toEqual(output);
    });

    it("getAdapterByName returns NULL_ADAPTER for unknown", async () => {
      const adapter = await getAdapterByName("unknown");
      expect(adapter).toBe(NULL_ADAPTER);
    });
  });

  describe("ReasoningResult", () => {
    it("validates complete result", () => {
      const result = {
        trace: {
          select: {
            selectedIds: [1, 4],
            selectedModules: ["Break down", "List facts"],
            selectionRationale: "Need decomposition and facts",
          },
          adapt: {
            adaptedModules: [{ original: "List facts", adapted: "List PDA seeds" }],
          },
          implement: {
            planSteps: [{ stepNumber: 1, description: "Step 1", expectedOutput: "Output 1" }],
            finalAnswerFormat: "Markdown",
          },
          solve: {
            stepOutputs: ["Output 1"],
            finalAnswer: "Final answer",
            reasoningTrace: {
              selectedIds: [1, 4],
              selectedModules: ["Break down", "List facts"],
              selectionRationale: "Need decomposition and facts",
              adaptedModules: [{ original: "List facts", adapted: "List PDA seeds" }],
              planSteps: [{ stepNumber: 1, description: "Step 1", expectedOutput: "Output 1" }],
              finalAnswerFormat: "Markdown",
            },
          },
        },
        answer: "Final answer",
      };
      expect(ReasoningResultSchema.safeParse(result).success).toBe(true);
    });
  });
});