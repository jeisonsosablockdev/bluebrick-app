/**
 * ============================================================================
 * Layer 3: Domain - Focal Point Detector Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for detecting architectural focal point coordinates
 * using AI vision models with resilient timeout fallbacks.
 * Invariants:
 *  - Explicit typed domain errors.
 *  - Fallback flag to identify whether center default (0.5, 0.5) was applied.
 *  - Pure domain representation, zero external SDK imports.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { FocalPoint } from '../math/smart-crop-calculator';

/**
 * Domain error codes for focal point detection.
 */
export type FocalPointErrorCode =
  | 'INFERENCE_FAILED'
  | 'TIMEOUT'
  | 'API_KEY_MISSING'
  | 'INVALID_IMAGE';

/**
 * Domain Error for Focal Point operations.
 */
export class FocalPointDomainError extends Error {
  public readonly code: FocalPointErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: FocalPointErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[FocalPointDomainError:${code}] ${message}`);
    this.name = 'FocalPointDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, FocalPointDomainError.prototype);
  }
}

/**
 * Result payload from focal point detection.
 */
export interface FocalPointDetectionResult {
  readonly focalPoint: FocalPoint;
  readonly description: string;
  readonly isFallback: boolean;
  readonly confidence: number;
}

/**
 * Port interface for Focal Point Detection.
 */
export interface IFocalPointDetectorPort {
  /**
   * Analyzes an image thumbnail (256x256) and predicts the optimal focal point.
   * Falls back to center (0.5, 0.5) if inference fails or times out.
   * 
   * @param imageThumbnail - 256x256 WebP or JPEG binary buffer
   * @param timeoutMs - Max execution time in ms (default: 3000ms)
   * @returns FocalPointDetectionResult with clamped coordinates
   */
  detectFocalPoint(
    imageThumbnail: Uint8Array | Buffer,
    timeoutMs?: number
  ): Promise<FocalPointDetectionResult>;
}
