import { ReasoningLLM } from "./llm";
import { getModuleLibrary } from "./module-library";
import { selectStage } from "./stages/select";
import { adaptStage } from "./stages/adapt";
import { implementStage } from "./stages/implement";
import { solveStage } from "./stages/solve";
import { getAdapterByName, NULL_ADAPTER, DomainAdapter } from "./adapters";
import { createProvider, ProviderConfig, detectProviderFromEnv } from "./llm/provider-factory";
import {
  ReasoningAgentOptions,
  ReasoningAgentOptionsSchema,
  ReasoningResult,
  ReasoningResultSchema,
  SelectInput,
  AdaptInput,
  ImplementInput,
  SolveInput,
} from "./types";

export interface ReasoningAgentConfig {
  provider?: ProviderConfig;
  defaultOptions?: Partial<ReasoningAgentOptions>;
}

export class ReasoningAgent {
  private llm: ReasoningLLM;
  private defaultOptions: ReasoningAgentOptions;

  constructor(config: ReasoningAgentConfig = {}) {
    const providerConfig = config.provider ?? detectProviderFromEnv();
    this.llm = createProvider(providerConfig);

    this.defaultOptions = ReasoningAgentOptionsSchema.parse({
      model: providerConfig.model ?? "qwen/qwen3-235b-a22b-thinking-2507-fast",
      temperature: providerConfig.temperature ?? 0.4,
      maxTokens: providerConfig.maxTokens ?? 8192,
      ...config.defaultOptions,
    });
  }

  async reason(
    task: string,
    options: Partial<ReasoningAgentOptions> = {}
  ): Promise<ReasoningResult> {
    const opts = { ...this.defaultOptions, ...options };
    const domainContext = opts.domain;

    const moduleLibrary = getModuleLibrary();

    const selectInput: SelectInput = {
      task,
      moduleLibrary,
      domainContext,
    };
    const selectOutput = await selectStage(this.llm, selectInput);

    const adaptInput: AdaptInput = {
      task,
      selectedModules: selectOutput.selectedModules,
      domainContext,
    };
    let adapter: DomainAdapter = NULL_ADAPTER;
    if (domainContext) {
      adapter = await getAdapterByName(domainContext);
    }
    const adaptOutput = await adaptStage(this.llm, adaptInput, adapter);

    const implementInput: ImplementInput = {
      task,
      adaptedModules: adaptOutput.adaptedModules,
    };
    const implementOutput = await implementStage(this.llm, implementInput);

    const solveInput: SolveInput = {
      task,
      planSteps: implementOutput.planSteps,
      domainContext,
      finalAnswerFormat: implementOutput.finalAnswerFormat,
    };
    const solveOutput = await solveStage(this.llm, solveInput);

    const trace = {
      select: selectOutput,
      adapt: adaptOutput,
      implement: implementOutput,
      solve: solveOutput,
    };

    const result: ReasoningResult = {
      trace,
      answer: solveOutput.finalAnswer,
    };

    return ReasoningResultSchema.parse(result);
  }

  getLLM(): ReasoningLLM {
    return this.llm;
  }
}

export type { ReasoningAgentOptions, ReasoningResult } from "./types";
export type { ModuleLibrary } from "./module-library";
export { getModuleLibrary } from "./module-library";
export type { DomainAdapter } from "./adapters";
export { getAdapterByName, NULL_ADAPTER } from "./adapters";
export type { ProviderConfig, ProviderType } from "./llm/provider-factory";
export { createProvider, detectProviderFromEnv } from "./llm/provider-factory";