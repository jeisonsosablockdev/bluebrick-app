import { SelectInput, SelectOutput, SelectInputSchema, SelectOutputSchema, ModuleLibrary, ReasoningLLM } from "../types";

export async function selectStage(
  llm: ReasoningLLM,
  input: SelectInput
): Promise<SelectOutput> {
  const libraryText = input.moduleLibrary
    .map((m) => `[${m.id.toString().padStart(2, " ")}] ${m.description}`)
    .join("\n");

  const domainHint = input.domainContext
    ? `\n\nDomain context: ${input.domainContext}. Adapt module selection to this domain.`
    : "";

  const prompt = `Task: ${input.task}${domainHint}

Available reasoning modules (pick 3-6):
${libraryText}

Select the most relevant modules for this task. Consider:
- What type of reasoning does this task need?
- Which modules will help structure the reasoning effectively?
- Pick enough modules to cover the reasoning (3-6), few enough to stay focused.

Output ONLY valid JSON matching this schema:
{
  "selectedIds": number[],
  "selectedModules": string[],
  "selectionRationale": string
}`;

  const result = await llm.invokeStructured(SelectOutputSchema, prompt, {
    temperature: 0.4,
  });

  return result;
}