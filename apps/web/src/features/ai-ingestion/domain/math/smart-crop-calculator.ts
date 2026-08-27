/**
 * ============================================================================
 * Layer 3: Domain - Smart Crop Geometry & Coordinate Calculator
 * ============================================================================
 * Purpose: Computes optimal bounding box crop geometries for architectural images
 * based on normalized focal point coordinates and target aspect ratios.
 * Invariants:
 *  - Focal coordinates strictly clamped to [0.0, 1.0].
 *  - Output crop bounding box strictly contained within [0, originalWidth] and [0, originalHeight].
 *  - Pure deterministic math calculations, zero external framework dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Normalized focal point coordinates in range [0.0, 1.0].
 */
export interface FocalPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Bounding box crop coordinates in integer pixels.
 */
export interface CropBoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Clamps an arbitrary number into the valid [0.0, 1.0] normalized coordinate range.
 * 
 * @param val - Raw input coordinate
 * @returns Number clamped between 0.0 and 1.0
 */
export function clampCoordinate(val: number): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return 0.5; // Fallback to center
  }
  return Math.min(Math.max(val, 0.0), 1.0);
}

/**
 * Calculates optimal pixel bounding box for a target aspect ratio centered around a focal point.
 * 
 * @param originalWidth - Source image width in pixels
 * @param originalHeight - Source image height in pixels
 * @param focal - Normalized focal point (x, y in [0.0, 1.0])
 * @param targetRatio - Target aspect ratio (e.g. 16/9, 4/3, 1/1)
 * @returns Bounding box with (x, y, width, height) in pixels
 */
export function calculateSmartCrop(
  originalWidth: number,
  originalHeight: number,
  focal: FocalPoint,
  targetRatio: number
): CropBoundingBox {
  // Step 1: Validate and clamp input parameters
  const width = Math.max(1, Math.round(originalWidth));
  const height = Math.max(1, Math.round(originalHeight));
  const focalX = clampCoordinate(focal?.x);
  const focalY = clampCoordinate(focal?.y);
  const ratio = targetRatio > 0 ? targetRatio : 1.0;

  // Step 2: Determine maximum crop dimensions matching targetRatio inside image
  let cropWidth = width;
  let cropHeight = Math.round(cropWidth / ratio);

  if (cropHeight > height) {
    cropHeight = height;
    cropWidth = Math.round(cropHeight * ratio);
  }

  // Step 3: Calculate focal point location in original pixel space
  const pixelFocalX = focalX * width;
  const pixelFocalY = focalY * height;

  // Step 4: Center crop window around focal point
  let cropX = Math.round(pixelFocalX - cropWidth / 2);
  let cropY = Math.round(pixelFocalY - cropHeight / 2);

  // Step 5: Clamp crop window within source image bounds
  cropX = Math.max(0, Math.min(cropX, width - cropWidth));
  cropY = Math.max(0, Math.min(cropY, height - cropHeight));

  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
  };
}
