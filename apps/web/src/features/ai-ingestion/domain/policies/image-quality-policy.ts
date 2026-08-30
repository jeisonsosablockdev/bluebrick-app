/**
 * ============================================================================
 * Layer 3: Domain - Image Quality Policy & Invariants
 * ============================================================================
 * Purpose: Defines domain quality rules, minimum/maximum dimension boundaries,
 * and aspect ratio classifications for architectural property images.
 * Invariants:
 *  - Minimum dimension: Reject width < 400px or height < 400px (prevents pixelation).
 *  - Maximum dimension: Downscale longest side to 2048px (prevents oversized payloads).
 *  - Pure domain calculations, zero external framework or image library dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Image dimension boundaries.
 */
export const IMAGE_QUALITY_LIMITS = {
  MIN_DIMENSION_PX: 400,
  MAX_DIMENSION_PX: 2048,
  TARGET_WEBP_QUALITY: 85,
  MAX_ALLOWED_INPUT_PIXELS: 268402689, // 268M px protection against decompression bombs
} as const;

/**
 * Aspect ratio classification result.
 */
export type StandardAspectRatio = '16:9' | '4:3' | '1:1' | 'CUSTOM';

/**
 * Image dimension validation result.
 */
export interface ImageValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
  readonly targetWidth?: number;
  readonly targetHeight?: number;
  readonly aspectRatio: StandardAspectRatio;
}

/**
 * Evaluates whether an image's raw dimensions satisfy quality standards
 * and calculates target resized dimensions.
 * 
 * @param width - Raw pixel width
 * @param height - Raw pixel height
 * @returns ImageValidationResult with pass/fail and target resizing metrics
 */
export function evaluateImageQuality(width: number, height: number): ImageValidationResult {
  // Step 1: Validate positive integer dimensions
  if (!width || !height || width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
    return {
      isValid: false,
      reason: 'Invalid dimensions: width and height must be positive integers',
      aspectRatio: 'CUSTOM',
    };
  }

  // Step 2: Quality Gate - Reject low-resolution images (< 400px)
  if (width < IMAGE_QUALITY_LIMITS.MIN_DIMENSION_PX || height < IMAGE_QUALITY_LIMITS.MIN_DIMENSION_PX) {
    return {
      isValid: false,
      reason: `Image too small: ${width}x${height}px is below minimum required ${IMAGE_QUALITY_LIMITS.MIN_DIMENSION_PX}px`,
      aspectRatio: classifyAspectRatio(width, height),
    };
  }

  // Step 3: Calculate Aspect Ratio classification (with ±3% tolerance)
  const aspectRatio = classifyAspectRatio(width, height);

  // Step 4: Calculate Target Resized Dimensions (downscale if longest side > 2048px)
  const longestSide = Math.max(width, height);
  if (longestSide > IMAGE_QUALITY_LIMITS.MAX_DIMENSION_PX) {
    const scaleFactor = IMAGE_QUALITY_LIMITS.MAX_DIMENSION_PX / longestSide;
    const targetWidth = Math.round(width * scaleFactor);
    const targetHeight = Math.round(height * scaleFactor);
    return {
      isValid: true,
      targetWidth,
      targetHeight,
      aspectRatio,
    };
  }

  return {
    isValid: true,
    targetWidth: width,
    targetHeight: height,
    aspectRatio,
  };
}

/**
 * Classifies an image's aspect ratio into standard categories.
 */
export function classifyAspectRatio(width: number, height: number): StandardAspectRatio {
  const ratio = width / height;

  // 16:9 = 1.777... (tolerance 1.70 - 1.85)
  if (ratio >= 1.70 && ratio <= 1.85) {
    return '16:9';
  }

  // 4:3 = 1.333... (tolerance 1.28 - 1.38)
  if (ratio >= 1.28 && ratio <= 1.38) {
    return '4:3';
  }

  // 1:1 = 1.0 (tolerance 0.95 - 1.05)
  if (ratio >= 0.95 && ratio <= 1.05) {
    return '1:1';
  }

  return 'CUSTOM';
}
