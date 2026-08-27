/**
 * ============================================================================
 * Layer 3: Domain - Confidence Scoring & Anomaly Veto Test Suite
 * ============================================================================
 * Tests 80/20 scoring formula, Hard Anomaly Veto, auto-approval gates,
 * and anomaly classification.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateConfidenceScore,
} from './confidence-scoring-engine';
import {
  detectAnomalies,
} from './anomaly-detector';
import { CanonicalClient } from '../schemas/canonical-client-schema';
import { NitValidationResult } from '../validators/nit-validator';

describe('Confidence Scoring & Anomaly Detection Engine', () => {
  const perfectClient: CanonicalClient = {
    name: 'Constructora del Valle S.A.S.',
    taxId: '900123456-8',
    email: 'contacto@valle.co',
    phone: '+57 310 555 1234',
    contractAmount: '1200000000.00',
    status: 'PENDING',
    metadata: {},
  };

  const validNitResult: NitValidationResult = {
    isValid: true,
    cleanedNit: '900123456-8',
    baseNumber: '900123456',
    calculatedCheckDigit: 8,
    providedCheckDigit: 8,
    formattedNit: '900123456-8',
  };

  describe('detectAnomalies()', () => {
    it('detects critical anomaly when NIT checksum is invalid', () => {
      const invalidNitResult: NitValidationResult = {
        isValid: false,
        cleanedNit: '900123456-9',
        baseNumber: '900123456',
        calculatedCheckDigit: 8,
        providedCheckDigit: 9,
        formattedNit: '900123456-8',
        reason: 'Check digit mismatch',
      };

      const report = detectAnomalies(perfectClient, invalidNitResult);
      expect(report.hasCriticalAnomalies).toBe(true);
      expect(report.anomalies.some((a) => a.code === 'INVALID_NIT_CHECKSUM')).toBe(true);
    });

    it('detects warning when contact info is completely missing', () => {
      const noContactClient: CanonicalClient = {
        name: 'Inversionista Anonimo',
        status: 'PENDING',
        metadata: {},
      };

      const report = detectAnomalies(noContactClient);
      expect(report.hasCriticalAnomalies).toBe(false);
      expect(report.anomalies.some((a) => a.code === 'NO_CONTACT_INFO')).toBe(true);
    });
  });

  describe('calculateConfidenceScore()', () => {
    it('awards auto-approve status (PROCESSED) for high quality complete record', () => {
      const result = calculateConfidenceScore(perfectClient, 95, validNitResult);

      expect(result.deterministicPoints).toBe(80); // 25 + 25 + 15 + 15
      expect(result.llmPoints).toBe(19); // 95% of 20 = 19
      expect(result.finalScore).toBe(99);
      expect(result.autoApproveQualified).toBe(true);
      expect(result.recommendedStatus).toBe('PROCESSED');
    });

    it('applies Hard Anomaly Veto capping score at 50% on NIT mismatch', () => {
      const invalidNitResult: NitValidationResult = {
        isValid: false,
        cleanedNit: '900123456-9',
        baseNumber: '900123456',
        calculatedCheckDigit: 8,
        providedCheckDigit: 9,
        formattedNit: '900123456-8',
      };

      // Even with 100% LLM confidence, Hard Veto caps at 50%
      const result = calculateConfidenceScore(perfectClient, 100, invalidNitResult);

      expect(result.finalScore).toBeLessThanOrEqual(50);
      expect(result.autoApproveQualified).toBe(false);
      expect(result.recommendedStatus).toBe('NEEDS_REVIEW');
    });

    it('relegates incomplete records (<90%) to NEEDS_REVIEW', () => {
      const partialClient: CanonicalClient = {
        name: 'Cliente Parcial',
        status: 'PENDING',
        metadata: {},
      };

      const result = calculateConfidenceScore(partialClient, 80);

      expect(result.deterministicPoints).toBe(25); // Only name
      expect(result.llmPoints).toBe(16); // 80% of 20
      expect(result.finalScore).toBe(41);
      expect(result.autoApproveQualified).toBe(false);
      expect(result.recommendedStatus).toBe('NEEDS_REVIEW');
    });
  });
});
