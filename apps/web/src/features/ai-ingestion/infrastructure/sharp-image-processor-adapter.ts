/**
 * ============================================================================
 * Layer 4: Infrastructure - Sharp Image Processor Adapter
 * ============================================================================
 * Purpose: Implements image normalization, pixel flood protection, EXIF auto-rotation,
 * GPS privacy stripping, and WebP compression using the Sharp image pipeline.
 * Invariants:
 *  - Server-only execution.
 *  - Enforces limitInputPixels (268M px max) against decompression bombs.
 *  - Strips GPS / camera EXIF metadata completely.
 *  - Rejects images with width or height < 400px per ImageQualityPolicy.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import sharp from 'sharp';
import {
  IImageProcessorPort,
  ProcessedImageResult,
  ImageProcessorDomainError,
} from '../domain/ports/image-processor-port';
import {
  evaluateImageQuality,
  IMAGE_QUALITY_LIMITS,
} from '../domain/policies/image-quality-policy';

/**
 * Adapter implementing IImageProcessorPort using Sharp.
 */
export class SharpImageProcessorAdapter implements IImageProcessorPort {
  private readonly quality: number;

  constructor(quality = IMAGE_QUALITY_LIMITS.TARGET_WEBP_QUALITY) {
    this.quality = quality;
  }

  /**
   * Evaluates image dimensions, strips EXIF/GPS, auto-rotates, downscales if >2048px,
   * and outputs optimized WebP buffer.
   */
  public async processImage(inputBuffer: Uint8Array | Buffer): Promise<ProcessedImageResult> {
    const rawBuffer = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);
    const originalSizeBytes = rawBuffer.byteLength;

    if (!rawBuffer || rawBuffer.length === 0) {
      throw new ImageProcessorDomainError(
        'CORRUPTED_IMAGE',
        'Input image buffer is empty'
      );
    }

    try {
      // Step 1: Initialize Sharp instance with decompression bomb limit protection
      const image = sharp(rawBuffer, {
        limitInputPixels: IMAGE_QUALITY_LIMITS.MAX_ALLOWED_INPUT_PIXELS,
        failOn: 'error',
      });

      // Step 2: Read metadata to inspect raw dimensions
      const metadata = await image.metadata();
      const rawWidth = metadata.width;
      const rawHeight = metadata.height;

      if (!rawWidth || !rawHeight) {
        throw new ImageProcessorDomainError(
          'CORRUPTED_IMAGE',
          'Unable to read valid image dimensions from file header'
        );
      }

      // Step 3: Evaluate Image Quality Policy Gate (min 400px, max 2048px)
      const qualityEvaluation = evaluateImageQuality(rawWidth, rawHeight);
      if (!qualityEvaluation.isValid) {
        throw new ImageProcessorDomainError(
          'IMAGE_TOO_SMALL',
          qualityEvaluation.reason || 'Image does not satisfy minimum quality dimensions'
        );
      }

      // Step 4: Execute Sharp transformation pipeline
      // - .rotate(): auto-orientates based on EXIF tag
      // - .resize(): downscales proportionally if longest side > 2048px
      // - .withMetadata({ exif: {} }): strips GPS / device metadata for privacy
      // - .webp(): encodes to WebP format at target quality
      const pipeline = sharp(rawBuffer, {
        limitInputPixels: IMAGE_QUALITY_LIMITS.MAX_ALLOWED_INPUT_PIXELS,
      })
        .rotate()
        .resize({
          width: qualityEvaluation.targetWidth,
          height: qualityEvaluation.targetHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: this.quality });

      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

      return {
        data: new Uint8Array(data),
        width: info.width,
        height: info.height,
        format: 'image/webp',
        aspectRatio: qualityEvaluation.aspectRatio,
        originalSizeBytes,
        processedSizeBytes: data.byteLength,
      };
    } catch (err: unknown) {
      if (err instanceof ImageProcessorDomainError) {
        throw err;
      }

      const message = (err as Error)?.message || '';
      if (message.includes('Input image exceeds pixel limit') || message.includes('pixel limit')) {
        throw new ImageProcessorDomainError(
          'DECOMPRESSION_BOMB_DETECTED',
          'Image rejected: exceeds maximum allowed pixel count (decompression bomb protection)',
          false,
          err
        );
      }

      throw new ImageProcessorDomainError(
        'PROCESSING_FAILED',
        `Sharp image processing failed: ${message}`,
        false,
        err
      );
    }
  }
}
