import { ReasoningResult, ReasoningTrace } from "./types";

export interface ReviewFeedback {
  approved: boolean;
  blocking: boolean;
  stageAssessments: Array<{
    stage: "SELECT" | "ADAPT" | "IMPLEMENT" | "SOLVE";
    assessment: "approved" | "needs_changes" | "skipped";
    notes: string;
  }>;
  generalFeedback: string;
  requestedChanges: Array<{
    stage: "SELECT" | "ADAPT" | "IMPLEMENT" | "SOLVE";
    issue: string;
    suggestion: string;
  }>;
  reviewer: string;
  timestamp: string;
}

export interface HumanReviewWorkflow {
  maxIterations: number;
  currentIteration: number;
  feedbackHistory: ReviewFeedback[];
}

export function createReviewWorkflow(maxIterations: number = 10): HumanReviewWorkflow {
  return {
    maxIterations,
    currentIteration: 0,
    feedbackHistory: [],
  };
}

export function formatReviewPrompt(result: ReasoningResult, task: string, domain: string): string {
  const trace = result.trace;
  const iteration = trace.select.selectionRationale ? "Initial" : "Re-review";

  const selectModules = trace.select.selectedIds.join(", ");
  const selectRationale = trace.select.selectionRationale;
  const adaptModules = trace.adapt.adaptedModules.map((m, i) => `${i + 1}. **${m.original}**\n   -> ${m.adapted}`).join("\n\n");
  const planSteps = trace.implement.planSteps.map((s) => `${s.stepNumber}. ${s.description}\n   Expected: ${s.expectedOutput}`).join("\n\n");
  const stepOutputs = trace.solve.stepOutputs.map((out, i) => `${i + 1}. ${out.slice(0, 300)}${out.length > 300 ? "..." : ""}`).join("\n\n");
  const finalAnswer = result.answer.slice(0, 1000) + (result.answer.length > 1000 ? "..." : "");

  let output = "";
  output += "# Reasoning Review Request\n\n";
  output += `**Task:** ${task}\n`;
  output += `**Domain:** ${domain}\n`;
  output += `**Iteration:** ${iteration}\n\n`;
  output += "## Reasoning Trace Summary\n\n";
  output += "### SELECT Stage\n";
  output += `**Modules:** [${selectModules}]  \n`;
  output += `**Rationale:** ${selectRationale}\n\n`;
  output += "### ADAPT Stage\n";
  output += adaptModules + "\n\n";
  output += "### IMPLEMENT Stage\n";
  output += `**Format:** ${trace.implement.finalAnswerFormat}  \n`;
  output += "**Plan:**\n";
  output += planSteps + "\n\n";
  output += "### SOLVE Stage\n";
  output += "**Step Outputs:**\n";
  output += stepOutputs + "\n\n";
  output += "### Final Answer\n";
  output += finalAnswer + "\n\n";
  output += "---\n\n";
  output += "## Review Checklist\n\n";
  output += "Please assess each stage:\n\n";
  output += "| Stage | Assessment | Notes |\n";
  output += "|-------|------------|-------|\n";
  output += "| SELECT | Approved / Needs Changes / Skipped | Module selection appropriate for task? |\n";
  output += "| ADAPT | Approved / Needs Changes / Skipped | Domain adaptation correct? |\n";
  output += "| IMPLEMENT | Approved / Needs Changes / Skipped | Plan logical and complete? |\n";
  output += "| SOLVE | Approved / Needs Changes / Skipped | Answer solves the task? |\n\n";
  output += "**Blocking Issues?** Yes -- must resolve / No -- optional improvements\n\n";
  output += "**General Feedback:** _______________\n\n";
  output += "**Requested Changes (if any):**\n";
  output += "| Stage | Issue | Suggestion |\n";
  output += "|-------|-------|------------|\n";
  output += "|       |       |            |\n";

  return output;
}

export function parseReviewFeedback(input: string): ReviewFeedback {
  const feedback: ReviewFeedback = {
    approved: false,
    blocking: false,
    stageAssessments: [],
    generalFeedback: "",
    requestedChanges: [],
    reviewer: "human",
    timestamp: new Date().toISOString(),
  };

  const firstLine = input.trim().split("\n")[0].toUpperCase();
  const isApprove = firstLine === "APPROVE";
  const isRequestChanges = firstLine === "REQUEST CHANGES";

  const blockingMatch = input.match(/BLOCKING:\s*YES/gi);

  feedback.approved = isApprove && !blockingMatch;
  feedback.blocking = isRequestChanges || !!blockingMatch;

  return feedback;
}

export function applyFeedbackToReasoning(
  result: ReasoningResult,
  feedback: ReviewFeedback
): { shouldRereason: boolean; focusStages: string[] } {
  const needsRereason = feedback.requestedChanges.length > 0 ||
    feedback.stageAssessments.some((a) => a.assessment === "needs_changes");

  const focusStages = feedback.requestedChanges.map((c) => c.stage);

  return {
    shouldRereason: needsRereason && !feedback.approved,
    focusStages,
  };
}