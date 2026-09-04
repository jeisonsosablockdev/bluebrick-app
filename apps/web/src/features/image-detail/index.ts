/**
 * @file apps/web/src/features/image-detail/index.ts
 * @layer Public API Boundary — Feature Entrypoint for Image Detail & Inspection.
 *
 * @description Serves as the strict public barrel export for the `image-detail` vertical slice,
 *   exposing the presentation modal, application zoom hook, and canonical contracts to dashboard
 *   consumers while encapsulating internal state and mathematical guards.
 *
 * @security
 *   - Encapsulates internal DOM references, avoiding external leakage of component internals.
 *
 * @invariants
 *   - Consumers must only import from this public entrypoint (`@/features/image-detail`).
 */

// ─── Layer 1: Presentation Modal & Contracts ──────────────────────────────────
export { ImageDetailModal } from "./image-detail-modal";
export type { ImageDetailModalProps, PhasePhotoCollection } from "./image-detail-modal";

// ─── Layer 2 & 3: Application Hook, Domain Zoom Guard & Mathematical Types ─────
export {
  useImageZoom,
  calculateFitScale,
  calculateMaxScale,
  clampScale,
} from "./use-image-zoom";
export type {
  ViewportDimensions,
  NaturalDimensions,
  PanOffset,
  UseImageZoomOptions,
  UseImageZoomReturn,
} from "./use-image-zoom";
