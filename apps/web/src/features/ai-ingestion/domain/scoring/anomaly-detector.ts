/**
 * ============================================================================
 * Layer 3: Domain - Anomaly Detector & Invariant Guard
 * ============================================================================
 * Purpose: Inspects extracted canonical client/investment records for critical
 * anomalies (NIT checksum mismatches, abnormal financial values, missing data)
 * to trigger Hard Anomaly Vetoes.
 * Invariants:
 *  - Critical anomaly triggers Hard Anomaly Veto (caps confidence at 50%, forces NEEDS_REVIEW).
 *  - Pure domain rules, zero external dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { CanonicalClient } from '../schemas/canonical-client-schema';
import { NitValidationResult } from '../validators/nit-validator';

/**
 * Severity levels for detected anomalies.
 */
export type AnomalySeverity = 'CRITICAL' | 'WARNING' | 'INFO';

/**
 * Detected anomaly record.
 */
export interface DetectedAnomaly {
  readonly code: string;
  readonly message: string;
  readonly severity: AnomalySeverity;
  readonly field: string;
}

/**
 * Complete anomaly detection report.
 */
export interface AnomalyDetectionReport {
  readonly hasCriticalAnomalies: boolean;
  readonly anomalies: readonly DetectedAnomaly[];
}

/**
 * Maximum threshold for single real-estate transaction without compliance review (50 Billion COP).
 */
const HIGH_VALUE_THRESHOLD = 50000000000;

/**
 * Inspects a client entity and optional NIT validation for data integrity anomalies.
 * 
 * @param client - Extracted canonical client entity
 * @param nitValidation - Optional NIT validation result
 * @returns AnomalyDetectionReport
 */
export function detectAnomalies(
  client: CanonicalClient,
  nitValidation?: NitValidationResult
): AnomalyDetectionReport {
  const anomalies: DetectedAnomaly[] = [];

  // Step 1: Check client name presence
  if (!client.name || client.name.trim().length === 0 || client.name.toLowerCase().includes('no identificado')) {
    anomalies.push({
      code: 'MISSING_CLIENT_NAME',
      message: 'Client legal name is missing or unidentified',
      severity: 'CRITICAL',
      field: 'name',
    });
  }

  // Step 2: Check NIT Modulo 11 validation result
  if (nitValidation && !nitValidation.isValid) {
    anomalies.push({
      code: 'INVALID_NIT_CHECKSUM',
      message: nitValidation.reason || 'NIT check digit does not match DIAN Modulo 11 formula',
      severity: 'CRITICAL',
      field: 'taxId',
    });
  }

  // Step 3: Check financial contract amount boundaries
  if (client.contractAmount) {
    const numericAmount = parseFloat(client.contractAmount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      anomalies.push({
        code: 'INVALID_FINANCIAL_AMOUNT',
        message: 'Contract amount must be a non-negative number',
        severity: 'CRITICAL',
        field: 'contractAmount',
      });
    } else if (numericAmount > HIGH_VALUE_THRESHOLD) {
      anomalies.push({
        code: 'HIGH_VALUE_TRANSACTION',
        message: `Contract amount exceeds standard threshold ($${numericAmount.toLocaleString('es-CO')}); requires compliance review`,
        severity: 'WARNING',
        field: 'contractAmount',
      });
    }
  } else {
    anomalies.push({
      code: 'MISSING_CONTRACT_AMOUNT',
      message: 'No contract monetary amount was detected',
      severity: 'WARNING',
      field: 'contractAmount',
    });
  }

  // Step 4: Check contact info
  if (!client.email && !client.phone) {
    anomalies.push({
      code: 'NO_CONTACT_INFO',
      message: 'Neither email nor phone number is provided',
      severity: 'WARNING',
      field: 'email',
    });
  }

  const hasCriticalAnomalies = anomalies.some((a) => a.severity === 'CRITICAL');

  return {
    hasCriticalAnomalies,
    anomalies,
  };
}
