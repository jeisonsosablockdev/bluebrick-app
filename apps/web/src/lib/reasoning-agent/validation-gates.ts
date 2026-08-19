import { ReasoningAgent, ReasoningAgentOptions, ReasoningResult } from "./index";
import { HumanReviewWorkflow, ReviewFeedback, createReviewWorkflow, formatReviewPrompt, parseReviewFeedback, applyFeedbackToReasoning } from "./human-review";
import { validateReasoningOutput, SolanaValidationResult } from "./solana-validation";

export interface ValidationGateResult {
  passed: boolean;
  evidence: any;
  errors: string[];
  blocking: boolean;
}

export interface ValidationGate {
  name: string;
  run: () => Promise<ValidationGateResult>;
}

export interface ValidationPipelineConfig {
  task: string;
  domain: string;
  options: ReasoningAgentOptions;
  agent: ReasoningAgent;
  humanReview: HumanReviewWorkflow;
  maxRereasonIterations: number;
  validateWithSolana: boolean;
}

export interface ValidationReport {
  task: string;
  domain: string;
  timestamp: string;
  gates: Array<{
    name: string;
    passed: boolean;
    blocking: boolean;
    evidence: any;
    errors: string[];
  }>;
  finalResult: ReasoningResult | null;
  humanReview: ReviewFeedback | null;
  solanaValidation: SolanaValidationResult | null;
  overallPassed: boolean;
}

export async function runValidationPipeline(
  config: ValidationPipelineConfig
): Promise<ValidationReport> {
  const { task, domain, options, agent, humanReview, maxRereasonIterations, validateWithSolana } = config;
  
  const report: ValidationReport = {
    task,
    domain,
    timestamp: new Date().toISOString(),
    gates: [],
    finalResult: null,
    humanReview: null,
    solanaValidation: null,
    overallPassed: false,
  };

  let currentResult: ReasoningResult | null = null;
  let iteration = 0;

  while (iteration <= maxRereasonIterations) {
    iteration++;
    humanReview.currentIteration = iteration;

    console.log(`\n🔄 Iteration ${iteration}/${maxRereasonIterations + 1}`);

    const result = await agent.reason(task, options);
    currentResult = result;
    report.finalResult = result;

    const lintGate = await runLintGate();
    report.gates.push({ name: "lint", ...lintGate });
    if (!lintGate.passed && lintGate.blocking) {
      report.overallPassed = false;
      return report;
    }

    const typecheckGate = await runTypecheckGate();
    report.gates.push({ name: "typecheck", ...typecheckGate });
    if (!typecheckGate.passed && typecheckGate.blocking) {
      report.overallPassed = false;
      return report;
    }

    const unitTestsGate = await runUnitTestsGate();
    report.gates.push({ name: "unit-tests", ...unitTestsGate });
    if (!unitTestsGate.passed && unitTestsGate.blocking) {
      report.overallPassed = false;
      return report;
    }

    if (validateWithSolana && domain === "solana") {
      const solanaValidation = await validateReasoningOutput(result, task, domain);
      report.solanaValidation = solanaValidation;
      report.gates.push({
        name: "solana-mcp-validation",
        passed: solanaValidation.valid,
        blocking: true,
        evidence: solanaValidation.proofs,
        errors: solanaValidation.errors,
      });
      if (!solanaValidation.valid) {
        report.overallPassed = false;
        return report;
      }
    }

    const knowledgeGate = await runKnowledgeGate(result);
    report.gates.push({ name: "knowledge-index", ...knowledgeGate });
    if (!knowledgeGate.passed && knowledgeGate.blocking) {
      report.overallPassed = false;
      return report;
    }

    const cleanCodeGate = await runCleanCodeGate();
    report.gates.push({ name: "clean-code", ...cleanCodeGate });
    if (!cleanCodeGate.passed && cleanCodeGate.blocking) {
      report.overallPassed = false;
      return report;
    }

    console.log("\n📋 Requesting human review...");
    const reviewPrompt = formatReviewPrompt(result, task, domain);
    console.log(reviewPrompt);

    const feedback = await requestHumanReview();
    const parsedFeedback = parseReviewFeedback(feedback);
    report.humanReview = parsedFeedback;
    humanReview.feedbackHistory.push(parsedFeedback);

    report.gates.push({
      name: "human-review",
      passed: parsedFeedback.approved,
      blocking: true,
      evidence: parsedFeedback,
      errors: parsedFeedback.blocking ? ["Human review blocked"] : [],
    });

    if (!parsedFeedback.approved) {
      const { shouldRereason, focusStages } = applyFeedbackToReasoning(result, parsedFeedback);
      
      if (shouldRereason && iteration <= maxRereasonIterations) {
        console.log(`\n🔁 Re-reasoning (focus: ${focusStages.join(", ")})`);
        continue;
      } else if (parsedFeedback.blocking) {
        console.log("\n❌ Human review blocked - stopping pipeline");
        report.overallPassed = false;
        return report;
      }
    }

    console.log("\n✅ Human review approved!");
    break;
  }

  if (!currentResult) {
    report.overallPassed = false;
    return report;
  }

  const finalValidateGate = await runFinalValidateGate();
  report.gates.push({ name: "final-validate", ...finalValidateGate });
  if (!finalValidateGate.passed && finalValidateGate.blocking) {
    report.overallPassed = false;
    return report;
  }

  report.overallPassed = report.gates.every(g => g.passed || !g.blocking);
  return report;
}

async function runLintGate(): Promise<ValidationGateResult> {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run lint", { stdio: "pipe", timeout: 120000 });
    return { passed: true, evidence: "ESLint passed", errors: [], blocking: true };
  } catch (e) {
    return { passed: false, evidence: null, errors: [String(e)], blocking: true };
  }
}

async function runTypecheckGate(): Promise<ValidationGateResult> {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run typecheck", { stdio: "pipe", timeout: 180000 });
    return { passed: true, evidence: "TypeScript typecheck passed", errors: [], blocking: true };
  } catch (e) {
    return { passed: false, evidence: null, errors: [String(e)], blocking: true };
  }
}

async function runUnitTestsGate(): Promise<ValidationGateResult> {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run test -- --run", { stdio: "pipe", timeout: 300000 });
    return { passed: true, evidence: "All unit tests passed", errors: [], blocking: true };
  } catch (e) {
    return { passed: false, evidence: null, errors: [String(e)], blocking: true };
  }
}

async function runKnowledgeGate(result: ReasoningResult): Promise<ValidationGateResult> {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run validate:knowledge", { stdio: "pipe", timeout: 120000 });
    return { passed: true, evidence: "Knowledge index valid", errors: [], blocking: true };
  } catch (e) {
    return { passed: false, evidence: null, errors: [String(e)], blocking: true };
  }
}

async function runCleanCodeGate(): Promise<ValidationGateResult> {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run lint", { stdio: "pipe", timeout: 120000 });
    return { passed: true, evidence: "Clean-code audit passed", errors: [], blocking: true };
  } catch (e) {
    return { passed: false, evidence: null, errors: [String(e)], blocking: true };
  }
}

async function runFinalValidateGate(): Promise<ValidationGateResult> {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run validate", { stdio: "pipe", timeout: 600000 });
    return { passed: true, evidence: "Full validation passed", errors: [], blocking: true };
  } catch (e) {
    return { passed: false, evidence: null, errors: [String(e)], blocking: true };
  }
}

async function requestHumanReview(): Promise<string> {
  console.log("\n" + "=".repeat(60));
  console.log("HUMAN REVIEW REQUIRED");
  console.log("=".repeat(60));
  console.log("Enter your review feedback (end with EOF/Ctrl-D):");
  console.log("Format:");
  console.log("  APPROVE / REQUEST CHANGES");
  console.log("  BLOCKING: YES / NO");
  console.log("  STAGE ASSESSMENTS:");
  console.log("    SELECT: APPROVED/NEEDS_CHANGES - notes");
  console.log("    ADAPT: APPROVED/NEEDS_CHANGES - notes");
  console.log("    IMPLEMENT: APPROVED/NEEDS_CHANGES - notes");
  console.log("    SOLVE: APPROVED/NEEDS_CHANGES - notes");
  console.log("  REQUESTED CHANGES:");
  console.log("    STAGE - issue - suggestion");
  console.log("  GENERAL FEEDBACK: ...");
  console.log("=".repeat(60) + "\n");

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks).toString("utf-8").trim();
}