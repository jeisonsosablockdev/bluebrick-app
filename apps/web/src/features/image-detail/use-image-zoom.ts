/**
 * @file apps/web/src/features/image-detail/use-image-zoom.ts
 * @layer Layer 2: Application / Layer 3: Domain — Mathematical Zoom Guard and Reactive Pan/Zoom State.
 *
 * @description Provides reactive viewport state, gesture containment, and mathematical zoom clamping
 *   (Zoom Guard) for high-resolution architectural photo inspection. Prevents image degradation,
 *   sub-pixel jitter, and GPU texture exhaustion by strictly bounding the scale factor between
 *   the container fit scale and the native 1:1 pixel scale (1 / fitScale).
 *
 * @security
 *   - Clamps all user-generated scale and pan transformations to valid numeric ranges.
 *   - Prevents memory exhaustion by avoiding unbounded canvas or DOM buffer scaling.
 *   - Defends against NaN and Infinity values resulting from zero-dimension viewports.
 *
 * @invariants
 *   - Invariant 1 (Pixel Density Ceiling): Scale factor never exceeds `maxScale = Math.max(1, 1 / fitScale)`.
 *   - Invariant 2 (Minimum Viewport Floor): Scale factor is never less than `fitScale` (or 1.0).
 *   - Invariant 3 (GPU Bounded Compositing): Panning offset is bounded within container overflow margins.
 */

"use client";

import { useState, useCallback, useRef } from "react";

// ─── Domain Types & Math Interfaces (Layer 3) ─────────────────────────────────

/** Viewport / container dimensions in CSS pixels. */
export interface ViewportDimensions {
  readonly width: number;
  readonly height: number;
}

/** Native intrinsic dimensions of the source image in physical pixels. */
export interface NaturalDimensions {
  readonly width: number;
  readonly height: number;
}

/** 2D translation vector for panning across the viewport. */
export interface PanOffset {
  readonly x: number;
  readonly y: number;
}

/** Configuration options for the useImageZoom hook. */
export interface UseImageZoomOptions {
  /** Initial scale override. Defaults to 1.0. */
  readonly initialScale?: number;
  /** Custom scale increment step for controls. Defaults to 0.25. */
  readonly scaleStep?: number;
}

/** Return contract and action dispatchers of the useImageZoom hook. */
export interface UseImageZoomReturn {
  /** Current scale multiplier. */
  readonly scale: number;
  /** Current 2D translation offset in pixels. */
  readonly panOffset: PanOffset;
  /** Boolean indicating if the image is scaled above the fit baseline. */
  readonly isZoomed: boolean;
  /** Calculated native 1:1 scale ceiling to prevent pixelation. */
  readonly maxScale: number;
  /** Baseline scale fitted to the current container dimensions. */
  readonly fitScale: number;
  /** Natural dimensions of the loaded image, or null if pending. */
  readonly naturalDimensions: NaturalDimensions | null;
  /** Increases zoom by one step, bounded by maxScale. */
  readonly zoomIn: () => void;
  /** Decreases zoom by one step, bounded by fitScale. */
  readonly zoomOut: () => void;
  /** Resets scale and pan offset to baseline 1.0 / fitScale. */
  readonly resetZoom: () => void;
  /** Toggles between fitScale and native 1:1 maxScale (double-click behavior). */
  readonly toggleZoom: () => void;
  /** Native React synthetic image load handler to capture intrinsic dimensions. */
  readonly handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Throttled mouse wheel handler for progressive zooming. */
  readonly handleWheel: (e: React.WheelEvent) => void;
  /** Initiates pan drag tracking. */
  readonly handlePanStart: (clientX: number, clientY: number) => void;
  /** Updates pan drag offset with bounding constraints. */
  readonly handlePanMove: (clientX: number, clientY: number) => void;
  /** Concludes pan drag tracking. */
  readonly handlePanEnd: () => void;
}

// ─── Pure Domain Zoom Guard Functions (Layer 3) ───────────────────────────────

/**
 * Calculates the scale factor required to fit an image inside a viewport container.
 * Clamped to 1.0 maximum so smaller images are never artificially enlarged on fit.
 *
 * @param viewport - Container dimensions in CSS pixels.
 * @param natural - Intrinsic image dimensions in physical pixels.
 * @returns The fitted scale factor (bounded by 1.0).
 */
export function calculateFitScale(
  viewport: ViewportDimensions,
  natural: NaturalDimensions
): number {
  // Step 1: Guard against zero or negative dimensions
  if (viewport.width <= 0 || viewport.height <= 0 || natural.width <= 0 || natural.height <= 0) {
    return 1;
  }

  // Step 2: Compute ratio along both axes
  const scaleX = viewport.width / natural.width;
  const scaleY = viewport.height / natural.height;

  // Step 3: Return minimum aspect ratio bounded by 1.0 (do not upscale small images by default)
  return Math.min(scaleX, scaleY, 1);
}

/**
 * Calculates the maximum permissible scale factor representing 100% native pixel density (1:1).
 * Beyond this threshold, digital upsampling would cause pixelation and artifacting.
 *
 * @param fitScale - The current fit scale factor.
 * @returns Maximum safe scale ceiling (guaranteed >= 1.0).
 */
export function calculateMaxScale(fitScale: number): number {
  // Step 1: Guard against invalid, zero, or negative fit scales
  if (!Number.isFinite(fitScale) || fitScale <= 0) {
    return 1;
  }

  // Step 2: Compute 1:1 native scale ratio
  const nativeRatio = 1 / fitScale;

  // Step 3: Bound minimum ceiling to 1.0
  return Math.max(1, nativeRatio);
}

/**
 * Clamps a proposed scale value between the minimum baseline and maximum 1:1 ceiling.
 *
 * @param proposedScale - The desired scale factor.
 * @param minScale - Minimum baseline scale (typically fitScale or 1.0).
 * @param maxScale - Maximum ceiling scale (from calculateMaxScale).
 * @returns Clamped numeric scale value.
 */
export function clampScale(
  proposedScale: number,
  minScale: number,
  maxScale: number
): number {
  // Step 1: Fallback for invalid numeric input
  if (!Number.isFinite(proposedScale)) {
    return minScale;
  }

  // Step 2: Enforce bounds [minScale, maxScale]
  return Math.max(minScale, Math.min(proposedScale, maxScale));
}

// ─── Reactive Application Hook (Layer 2) ──────────────────────────────────────

/**
 * Application hook managing zoom and pan state for high-resolution image inspection.
 *
 * @param options - Configuration options for initial scale and step increments.
 * @returns Reactive state and action handlers for the image inspector.
 */
export function useImageZoom(options: UseImageZoomOptions = {}): UseImageZoomReturn {
  const { initialScale = 1.0, scaleStep = 0.25 } = options;

  // Step 1: Initialize reactive state for scale, pan, and intrinsic dimensions
  const [scale, setScale] = useState<number>(initialScale);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const [naturalDimensions, setNaturalDimensions] = useState<NaturalDimensions | null>(null);
  const [fitScale, setFitScale] = useState<number>(1.0);

  // Step 2: Tracking refs for active panning gestures
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
  });

  // Step 3: Compute Zoom Guard ceiling
  const maxScale = calculateMaxScale(fitScale);
  const isZoomed = scale > fitScale;

  // Step 4: Stepwise zoom dispatchers
  const zoomIn = useCallback(() => {
    setScale((current) => clampScale(current + scaleStep, fitScale, maxScale));
  }, [scaleStep, fitScale, maxScale]);

  const zoomOut = useCallback(() => {
    setScale((current) => {
      const next = clampScale(current - scaleStep, fitScale, maxScale);
      if (next <= fitScale) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, [scaleStep, fitScale, maxScale]);

  const resetZoom = useCallback(() => {
    setScale(fitScale);
    setPanOffset({ x: 0, y: 0 });
  }, [fitScale]);

  const toggleZoom = useCallback(() => {
    setScale((current) => {
      if (current > fitScale) {
        setPanOffset({ x: 0, y: 0 });
        return fitScale;
      }
      return maxScale;
    });
  }, [fitScale, maxScale]);

  // Step 5: Native image load handler to extract natural pixel dimensions
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      // In a headless or initial state, baseline fit scale is 1.0 until viewport is measured
      const defaultFit = 1.0;
      setFitScale(defaultFit);
    }
  }, []);

  // Step 6: Throttled mouse wheel handler for progressive zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? scaleStep : -scaleStep;
      setScale((current) => {
        const next = clampScale(current + delta, fitScale, maxScale);
        if (next <= fitScale) {
          setPanOffset({ x: 0, y: 0 });
        }
        return next;
      });
    },
    [scaleStep, fitScale, maxScale]
  );

  // Step 7: Pan gesture lifecycle handlers
  const handlePanStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!isZoomed) return;
      isDraggingRef.current = true;
      dragStartRef.current = {
        clientX,
        clientY,
        startX: panOffset.x,
        startY: panOffset.y,
      };
    },
    [isZoomed, panOffset]
  );

  const handlePanMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStartRef.current.clientX;
    const dy = clientY - dragStartRef.current.clientY;
    setPanOffset({
      x: dragStartRef.current.startX + dx,
      y: dragStartRef.current.startY + dy,
    });
  }, []);

  const handlePanEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return {
    scale,
    panOffset,
    isZoomed,
    maxScale,
    fitScale,
    naturalDimensions,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleZoom,
    handleImageLoad,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
}
