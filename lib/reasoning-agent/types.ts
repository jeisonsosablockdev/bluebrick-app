import { z } from "zod";

export const ModuleSchema = z.object({
  id: z.number().int().min(0).max(15),
  description: z.string(),
});

export const ModuleLibrarySchema = z.array(ModuleSchema);

export type Module = z.infer<typeof ModuleSchema>;
export type ModuleLibrary = z.infer<typeof ModuleLibrarySchema>;

export const SelectInputSchema = z.object({
  task: z.string().min(1),
  moduleLibrary: ModuleLibrarySchema,
  domainContext: z.string().optional(),
});

export const SelectOutputSchema = z.object({
  selectedIds: z.array(z.number().int().min(0).max(15)).min(2).max(8),
  selectedModules: z.array(z.string()),
  selectionRationale: z.string().min(1),
});

export type SelectInput = z.infer<typeof SelectInputSchema>;
export type SelectOutput = z.infer<typeof SelectOutputSchema>;

export const AdaptedModuleSchema = z.object({
  original: z.string(),
  adapted: z.string(),
});

export const AdaptInputSchema = z.object({
  task: z.string().min(1),
  selectedModules: z.array(z.string()),
  domainContext: z.string().optional(),
});

export const AdaptOutputSchema = z.object({
  adaptedModules: z.array(AdaptedModuleSchema),
});

export type AdaptInput = z.infer<typeof AdaptInputSchema>;
export type AdaptOutput = z.infer<typeof AdaptOutputSchema>;
export type AdaptedModule = z.infer<typeof AdaptedModuleSchema>;

export const PlanStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1),
  expectedOutput: z.string().min(1),
});

export const ImplementInputSchema = z.object({
  task: z.string().min(1),
  adaptedModules: z.array(AdaptedModuleSchema),
});

export const ImplementOutputSchema = z.object({
  planSteps: z.array(PlanStepSchema).min(1).max(10),
  finalAnswerFormat: z.string().min(1),
});

export type ImplementInput = z.infer<typeof ImplementInputSchema>;
export type ImplementOutput = z.infer<typeof ImplementOutputSchema>;
export type PlanStep = z.infer<typeof PlanStepSchema>;

export const SolveInputSchema = z.object({
  task: z.string().min(1),
  planSteps: z.array(PlanStepSchema),
  domainContext: z.string().optional(),
  finalAnswerFormat: z.string().min(1),
});

export const SolveOutputSchema = z.object({
  stepOutputs: z.array(z.string()),
  finalAnswer: z.string(),
  reasoningTrace: z.object({
    selectedIds: z.array(z.number().int()),
    selectedModules: z.array(z.string()),
    selectionRationale: z.string(),
    adaptedModules: z.array(AdaptedModuleSchema),
    planSteps: z.array(PlanStepSchema),
    finalAnswerFormat: z.string(),
  }),
});

export type SolveInput = z.infer<typeof SolveInputSchema>;
export type SolveOutput = z.infer<typeof SolveOutputSchema>;

export const ReasoningAgentOptionsSchema = z.object({
  model: z.string().default("qwen/qwen3-235b-a22b-thinking-2507-fast"),
  temperature: z.number().min(0).max(1).default(0.4),
  domain: z.string().optional(),
  outputMode: z.enum(["trace", "answer", "both"]).default("both"),
  maxTokens: z.number().int().positive().default(8192),
});

export type ReasoningAgentOptions = z.infer<typeof ReasoningAgentOptionsSchema>;

export const ReasoningResultSchema = z.object({
  trace: z.object({
    select: SelectOutputSchema,
    adapt: AdaptOutputSchema,
    implement: ImplementOutputSchema,
    solve: SolveOutputSchema,
  }),
  answer: z.string(),
});

export type ReasoningResult = z.infer<typeof ReasoningResultSchema>;

export interface ReasoningLLM {
  invokeStructured<T extends z.ZodTypeAny>(
    schema: T,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<z.infer<T>>;
}