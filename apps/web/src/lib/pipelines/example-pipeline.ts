/**
 * @file apps/web/src/lib/pipelines/example-pipeline.ts
 * @description Layer 3: Domain / Pipelines - Example Solana Validation Pipeline.
 * Encapsulates multi-step business logic validation for Solana RPC health.
 */

import { getSolanaRpcUrl } from "../infrastructure/solana";

/**
 * Pipeline execution context contract.
 */
export interface HealthPipelineContext {
  /** Timestamp when pipeline started */
  startedAt: number;
  /** Resolved RPC endpoint URL */
  rpcEndpoint: string;
  /** Active network target */
  network: "devnet" | "mainnet-beta";
}

/**
 * Pipeline execution result contract.
 */
export interface HealthPipelineResult {
  /** Indicates whether the health verification succeeded */
  success: boolean;
  /** Pipeline execution context snapshot */
  context: HealthPipelineContext;
  /** Error message if pipeline failed */
  error?: string;
}

/**
 * Executes the starter domain health check pipeline against Solana Devnet.
 *
 * @returns {Promise<HealthPipelineResult>} The pipeline result and diagnostic metadata.
 */
export async function executeHealthPipeline(): Promise<HealthPipelineResult> {
  // Step 1: Initialize pipeline execution context
  const context: HealthPipelineContext = {
    startedAt: Date.now(),
    rpcEndpoint: getSolanaRpcUrl(),
    network: "devnet",
  };

  try {
    // Step 2: Validate Devnet-only invariant
    if (!context.rpcEndpoint.includes("devnet") && !context.rpcEndpoint.includes("127.0.0.1")) {
      throw new Error("Violation: Non-devnet RPC endpoint configured in starter pipeline.");
    }

    // Step 3: Return verified success result
    return {
      success: true,
      context,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error in health pipeline";
    return {
      success: false,
      context,
      error: message,
    };
  }
}
