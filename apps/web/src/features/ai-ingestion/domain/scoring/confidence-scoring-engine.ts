/**
 * ============================================================================
 * Layer 3: Domain - Confidence Scoring Engine (80/20 Deterministic Formula)
 * ============================================================================
 * Purpose: Evaluates extraction confidence based on 80% deterministic validation
 * rules and 20% LLM self-confidence, applying Hard Anomaly Vetoes.
 * Invariants:
 *  - 80% weight on deterministic rules + 20% weight on LLM score (sum = 100%).
 *  - Auto-approve threshold: score >= 90% AND zero critical anomalies -> 'PROCESSED'.
 *  - Hard Anomaly Veto: Any critical anomaly caps score at 50% and forces 'NEEDS_REVIEW'.
 *  - Pure domain calculations, zero external dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { CanonicalClient } from '../schemas/canonical-client-schema';
import { NitValidationResult } from '../validators/nit-validator';
import {
  detectAnomalies,
  AnomalyDetectionReport,
} from './anomaly-detector';

/**
 * Score evaluation result.
 */
export interface ScoringEvaluationResult {
  readonly finalScore: number;
  readonly deterministicPoints: number;
  readonly llmPoints: number;
  readonly autoApproveQualified: boolean;
  readonly recommendedStatus: 'PROCESSED' | 'NEEDS_REVIEW';
  readonly anomalyReport: AnomalyDetectionReport;
  readonly breakdown: {
    readonly hasValidName: boolean;
    readonly hasValidNit: boolean;
    readonly hasValidContact: boolean;
    readonly hasValidAmount: boolean;
  };
}

/**
 * Evaluates the confidence score of an extracted client record using the 80/20 formula.
 * 
 * @param client - Extracted client entity
 * @param llmConfidenceScore - Raw LLM confidence score (0 to 100)
 * @param nitValidation - Optional NIT validation result
 * @returns ScoringEvaluationResult
 */
export function calculateConfidenceScore(
  client: CanonicalClient,
  llmConfidenceScore: number,
  nitValidation?: NitValidationResult
): ScoringEvaluationResult {
  // Step 1: Detect data anomalies
  const anomalyReport = detectAnomalies(client, nitValidation);

  // Step 2: Calculate Deterministic Score (80% Max)
  let deterministicPoints = 0;

  // 2a. Valid non-empty legal name (+25%)
  const hasValidName = Boolean(client.name && client.name.trim().length > 2 && !client.name.toLowerCase().includes('no identificado'));
  if (hasValidName) {
    deterministicPoints += 25;
  }

  // 2b. Valid Tax ID / NIT (+25%)
  const hasValidNit = Boolean(client.taxId && (!nitValidation || nitValidation.isValid));
  if (hasValidNit) {
    deterministicPoints += 25;
  }

  // 2c. Valid Contact Email or Phone (+15%)
  const hasValidContact = Boolean(client.email || client.phone);
  if (hasValidContact) {
    deterministicPoints += 15;
  }

  // 2d. Valid Monetary Decimal Amount (+15%)
  const hasValidAmount = Boolean(client.contractAmount && parseFloat(client.contractAmount) > 0);
  if (hasValidAmount) {
    deterministicPoints += 15;
  }

  // Step 3: Calculate LLM Confidence Component (20% Max)
  const clampedLlmScore = Math.min(Math.max(llmConfidenceScore || 0, 0), 100);
  const llmPoints = Math.round((clampedLlmScore / 100) * 20);

  // Step 4: Compute Total Raw Score
  let rawScore = deterministicPoints + llmPoints;

  // Step 5: Apply Hard Anomaly Veto
  if (anomalyReport.hasCriticalAnomalies) {
    // Critical anomaly forces score cap at 50%
    rawScore = Math.min(rawScore, 50);
  }

  const finalScore = Math.min(Math.max(rawScore, 0), 100);

  // Step 6: Determine Auto-Approve Qualification (>= 90% and no critical anomalies)
  const autoApproveQualified = finalScore >= 90 && !anomalyReport.hasCriticalAnomalies;
  const recommendedStatus: 'PROCESSED' | 'NEEDS_REVIEW' = autoApproveQualified ? 'PROCESSED' : 'NEEDS_REVIEW';

  return {
    finalScore,
    deterministicPoints,
    llmPoints,
    autoApproveQualified,
    recommendedStatus,
    anomalyReport,
    breakdown: {
      hasValidName,
      hasValidNit,
      hasValidContact,
      hasValidAmount,
    },
  };
}
