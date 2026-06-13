import { ModuleLibrary, ModuleLibrarySchema } from "./types";

export type { ModuleLibrary } from "./types";

export const CANONICAL_MODULES: ModuleLibrary = [
  {
    id: 0,
    description:
      "Critical thinking — question the question's assumptions and surface biases",
  },
  {
    id: 1,
    description: "Break the problem into sub-problems and solve each",
  },
  {
    id: 2,
    description:
      "Identify the type of problem (logic, math, classification, planning, ...)",
  },
  {
    id: 3,
    description: "Identify the goal — what specifically must the final answer contain",
  },
  {
    id: 4,
    description: "List the relevant facts, constraints, and unknowns",
  },
  {
    id: 5,
    description: "Consider analogies — what problem is this structurally similar to?",
  },
  {
    id: 6,
    description: "Brainstorm alternative interpretations of the question",
  },
  {
    id: 7,
    description: "Step-by-step reasoning from premises to conclusion",
  },
  {
    id: 8,
    description: "Consider counterexamples that would falsify a candidate answer",
  },
  {
    id: 9,
    description: "Make a table, list, or diagram to organize the information",
  },
  {
    id: 10,
    description: "Reverse-engineer from a candidate answer back to the premises",
  },
  {
    id: 11,
    description: "Evaluate trade-offs between competing options explicitly",
  },
  {
    id: 12,
    description: "Devise an algorithm or procedure that always finds the answer",
  },
  {
    id: 13,
    description: "Synthesize multiple perspectives or stakeholder views",
  },
  {
    id: 14,
    description: "Check consistency — does the candidate answer satisfy EVERY constraint?",
  },
  {
    id: 15,
    description: "Self-verify — solve a second way and compare the two answers",
  },
];

export function getModuleLibrary(): ModuleLibrary {
  return CANONICAL_MODULES;
}

export function getModuleById(id: number): ModuleLibrary[0] | undefined {
  return CANONICAL_MODULES.find((m) => m.id === id);
}

export function getModulesByIds(ids: number[]): ModuleLibrary {
  return ids.map((id) => getModuleById(id)!).filter(Boolean);
}

export function formatModuleLibrary(library: ModuleLibrary = CANONICAL_MODULES): string {
  return library
    .map((m) => `[${m.id.toString().padStart(2, " ")}] ${m.description}`)
    .join("\n");
}

export function validateModuleLibrary(library: unknown): ModuleLibrary {
  return ModuleLibrarySchema.parse(library);
}