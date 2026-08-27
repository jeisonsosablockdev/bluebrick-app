/**
 * ============================================================================
 * Layer 3: Domain - Image Processor Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for normalizing, resizing, auto-rotating,
 * stripping GPS privacy metadata, and converting architectural images to WebP.
 * Invariants:
 *  - Explicit typed domain errors for undersized images and decompression bombs.
 *  - Pure domain representation, zero external Sharp SDK types in signatures.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { StandardAspectRatio } from '../policies/image-quality-policy';

/**
 * Domain error codes for image processing.
 */
export type ImageProcessorErrorCode =
  | 'IMAGE_TOO_SMALL'
  | 'DECOMPRESSION_BOMB_DETECTED'
  | 'CORRUPTED_IMAGE'
  | 'PROCESSING_FAILED';

/**
 * Domain Error for Image Processing operations.
 */
export class ImageProcessorDomainError extends Error {
  public readonly code: ImageProcessorErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: ImageProcessorErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[ImageProcessorDomainError:${code}] ${message}`);
    this.name = 'ImageProcessorDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ImageProcessorDomainError.prototype);
  }
}

/**
 * Result payload from image processing.
 */
export interface ProcessedImageResult {
  readonly data: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly format: 'image/webp';
  readonly aspectRatio: StandardAspectRatio;
  readonly originalSizeBytes: number;
  readonly processedSizeBytes: number;
}

/**
 * Port interface for Image Normalization & Quality Gate.
 */
export interface IImageProcessorPort {
  /**
   * Evaluates image dimensions against quality gates, strips EXIF/GPS,
   * auto-rotates, downscales if >2048px, and outputs optimized WebP.
   * 
   * @param inputBuffer - Raw binary image buffer
   * @returns ProcessedImageResult with normalized WebP buffer and metadata
   * @throws {ImageProcessorDomainError} If image is <400px or exceeds pixel limits
   */
  processImage(inputBuffer: Uint8Array | Buffer): Promise<ProcessedImageResult>;
}
