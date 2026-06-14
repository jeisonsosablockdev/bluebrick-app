import { ImplementInput, ImplementOutput, ImplementOutputSchema, ReasoningLLM } from "../types";

export async function implementStage(
  llm: ReasoningLLM,
  input: ImplementInput
): Promise<ImplementOutput> {
  const modulesText = input.adaptedModules
    .map((m, i) => `${i + 1}. ${m.adapted}`)
    .join("\n");

  const prompt = `Task: ${input.task}

Adapted reasoning modules:
${modulesText}

Compose these modules into a step-by-step reasoning plan. Each step should:
- Reference which adapted module(s) it draws on
- Have a concrete expected output
- Build logically toward the final answer
- Keep the plan focused (3-7 steps)

Output ONLY valid JSON matching this schema:
{
  "planSteps": [
    { "stepNumber": number, "description": string, "expectedOutput": string },
    ...
  ],
  "finalAnswerFormat": string
}

Example finalAnswerFormat values:
- "Markdown feature spec with frontmatter"
- "Mermaid diagram code block"
- "Architecture design document"
- "Algorithm pseudocode"
- "Threat model analysis"`;

  const result = await llm.invokeStructured(ImplementOutputSchema, prompt, {
    temperature: 0.4,
  });

  return result;
}