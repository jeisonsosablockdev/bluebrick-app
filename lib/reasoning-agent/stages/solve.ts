import { SolveInput, SolveOutput, SolveOutputSchema, PlanStep, ReasoningLLM } from "../types";

export async function solveStage(
  llm: ReasoningLLM,
  input: SolveInput
): Promise<SolveOutput> {
  const planText = input.planSteps
    .map((s) => `Step ${s.stepNumber}: ${s.description}\n  Expected: ${s.expectedOutput}`)
    .join("\n\n");

  const domainHint = input.domainContext
    ? `\n\nDomain context: ${input.domainContext}. Apply domain-specific knowledge.`
    : "";

  const prompt = `Task: ${input.task}${domainHint}

Reasoning plan to execute:
${planText}

Final answer format: ${input.finalAnswerFormat}

Execute the plan step by step. For each step, produce the expected output.
Then produce the final answer in the specified format.

Output ONLY valid JSON matching this schema:
{
  "stepOutputs": [string, ...],
  "finalAnswer": string,
  "reasoningTrace": {
    "selectedIds": number[],
    "selectedModules": string[],
    "selectionRationale": string,
    "adaptedModules": [{"original": string, "adapted": string}, ...],
    "planSteps": [{"stepNumber": number, "description": string, "expectedOutput": string}, ...],
    "finalAnswerFormat": string
  }
}`;

  const result = await llm.invokeStructured(SolveOutputSchema, prompt, {
    temperature: 0.4,
  });

  return result;
}