import { AdaptInput, AdaptOutput, AdaptOutputSchema, AdaptedModule, ReasoningLLM } from "../types";
import { DomainAdapter, adaptWithDomain } from "../adapters";

export async function adaptStage(
  llm: ReasoningLLM,
  input: AdaptInput,
  domainAdapter?: DomainAdapter
): Promise<AdaptOutput> {
  const modulesText = input.selectedModules.map((m, i) => `${i + 1}. ${m}`).join("\n");

  const domainHint = input.domainContext
    ? `\n\nDomain: ${input.domainContext}. Rephrase each module in language specific to this domain.`
    : "";

  const adapterHint = domainAdapter
    ? `\n\nUse the following domain adaptation patterns:\n${domainAdapter.getAdaptationHints()}`
    : "";

  const prompt = `Task: ${input.task}${domainHint}${adapterHint}

Selected modules to adapt:
${modulesText}

For each module, rewrite it in task-specific language. The adapted version should be directly actionable for this specific task.

Output ONLY valid JSON matching this schema:
{
  "adaptedModules": [
    { "original": string, "adapted": string },
    ...
  ]
}`;

  const result = await llm.invokeStructured(AdaptOutputSchema, prompt, {
    temperature: 0.4,
  });

  if (domainAdapter) {
    return adaptWithDomain(result, domainAdapter);
  }

  return result;
}