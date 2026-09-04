/**
 * @file apps/web/src/features/image-detail/image-detail-modal.tsx
 * @layer Layer 1: Presentation — Accessible Lightbox Modal for Architectural Inspection.
 *
 * @description Renders a high-fidelity modal dialog for high-resolution photo examination
 *   in the project dashboard. Implements WAI-ARIA accessible dialog semantics, hardware-accelerated
 *   GPU composition, glassmorphism chrome styling, and complete lifecycle unmounting to protect
 *   memory and render performance.
 *
 * @security
 *   - Clamps image array indexing to prevent out-of-bounds access.
 *   - Uses Next.js / React synthetic event boundaries to avoid prototype pollution.
 *   - No dangerouslySetInnerHTML or unfiltered DOM injection.
 *
 * @invariants
 *   - Invariant 1 (Strict Unmount): Renders null when `isOpen` is false, releasing GPU textures.
 *   - Invariant 2 (Accessible Tree): Encapsulates dialog role, accessible title, and focus boundary.
 *   - Invariant 3 (GPU Compositing): Transformations apply strictly via translate3d and scale.
 */

"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useId,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useImageZoom } from "./use-image-zoom";

// ─── Public Contracts & Interfaces (Layer 1) ──────────────────────────────────

/**
 * Photograph collection belonging to a specific project phase for multi-phase traversal (BBC-020 SPEC-08).
 */
export interface PhasePhotoCollection {
  /** Display name of the construction phase (e.g. "1. Adquisición y Licencias"). */
  readonly phaseName: string;
  /** Photograph URLs registered for this phase. */
  readonly images: readonly string[];
}

/**
 * Props contract for the ImageDetailModal component.
 */
export interface ImageDetailModalProps {
  /** Controls modal visibility. When false, the component unmounts completely. */
  readonly isOpen: boolean;
  /** Callback triggered when user requests closing the lightbox. */
  readonly onClose: () => void;
  /** Array of photograph URLs to inspect. */
  readonly images: readonly string[];
  /** Zero-based index of the initial image to display. Defaults to 0. */
  readonly initialIndex?: number;
  /** Accessible dialog title or caption. Defaults to "Detalle de fotografía". */
  readonly title?: string;
  /** Optional construction phase name badge. */
  readonly phaseName?: string;
  /** Optional multi-phase collection of photographs for global project traversal (BBC-020 SPEC-08). */
  readonly allPhasesPhotos?: readonly PhasePhotoCollection[];
}

/**
 * Internal representation of a photo within the flattened multi-phase sequence.
 */
interface FlattenedPhoto {
  readonly url: string;
  readonly phaseName: string;
  readonly localIndex: number;
  readonly localTotal: number;
}

// ─── Presentation Component (Layer 1) ─────────────────────────────────────────

/**
 * Accessible lightbox modal dialog for high-resolution architectural image inspection.
 *
 * @param props - Component properties conforming to ImageDetailModalProps.
 * @returns The portal-rendered dialog element, or null when closed / unmounted.
 */
export function ImageDetailModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title = "Detalle de fotografía",
  phaseName,
  allPhasesPhotos,
}: ImageDetailModalProps) {
  // Step 1: Enforce Strict Unmount Invariant when closed
  if (!isOpen) {
    return null;
  }

  return (
    <ImageDetailModalPortal
      isOpen={isOpen}
      onClose={onClose}
      images={images}
      initialIndex={initialIndex}
      title={title}
      phaseName={phaseName}
      allPhasesPhotos={allPhasesPhotos}
    />
  );
}

/**
 * Internal portal implementation handling mounted lifecycle, keyboard navigation, and GPU rendering.
 */
function ImageDetailModalPortal({
  onClose,
  images,
  initialIndex = 0,
  title = "Detalle de fotografía",
  phaseName,
  allPhasesPhotos = [],
}: ImageDetailModalProps) {
  // Step 2: Hydration-safe client portal check using useSyncExternalStore
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Step 2b: Build unified flattened photo list across all phases when provided (BBC-020 SPEC-08)
  const flattenedPhotos: readonly FlattenedPhoto[] = useMemo(() => {
    if (allPhasesPhotos && allPhasesPhotos.length > 0) {
      const list = allPhasesPhotos.flatMap((group) =>
        (group.images || []).map((url, idx) => ({
          url,
          phaseName: group.phaseName,
          localIndex: idx,
          localTotal: group.images.length,
        }))
      );
      if (list.length > 0) return list;
    }

    // Fallback: Use images array from the active phase
    return images.map((url, idx) => ({
      url,
      phaseName: phaseName || "",
      localIndex: idx,
      localTotal: images.length,
    }));
  }, [allPhasesPhotos, images, phaseName]);

  const totalPhotos = flattenedPhotos.length;

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (flattenedPhotos.length === 0) return 0;
    if (allPhasesPhotos && allPhasesPhotos.length > 0) {
      const targetUrl = images[initialIndex] || images[0];
      const foundIdx = flattenedPhotos.findIndex(
        (p) => p.url === targetUrl && (!phaseName || p.phaseName === phaseName)
      );
      if (foundIdx !== -1) return foundIdx;
      const fallbackIdx = flattenedPhotos.findIndex((p) => p.url === targetUrl);
      if (fallbackIdx !== -1) return fallbackIdx;
    }
    return Math.max(0, Math.min(initialIndex, flattenedPhotos.length - 1));
  });

  const titleId = useId();

  // Step 3: Initialize zoom and pan hook
  const {
    scale,
    panOffset,
    maxScale,
    fitScale,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleZoom,
    handleImageLoad,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  } = useImageZoom();

  // Step 4: Reset zoom and handle circular navigation across flattened photos
  const goToImage = useCallback(
    (index: number) => {
      if (totalPhotos === 0) return;
      const safeIndex = (index + totalPhotos) % totalPhotos;
      setCurrentIndex(safeIndex);
      resetZoom();
    },
    [totalPhotos, resetZoom]
  );

  const handlePrev = useCallback(() => {
    goToImage(currentIndex - 1);
  }, [currentIndex, goToImage]);

  const handleNext = useCallback(() => {
    goToImage(currentIndex + 1);
  }, [currentIndex, goToImage]);

  // Step 5: Global keyboard event listeners (Escape to close, Arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && totalPhotos > 1) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" && totalPhotos > 1) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, handlePrev, handleNext, totalPhotos]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const currentPhoto = flattenedPhotos[currentIndex];
  const currentImageUrl = currentPhoto?.url || "";
  const currentPhaseName = currentPhoto?.phaseName || phaseName || "";
  const hasMultipleImages = totalPhotos > 1;

  // Step 6: Render modal portal with WAI-ARIA semantics and hardware-accelerated viewport
  return createPortal(
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center select-none"
      >
        {/* Step 7: Glassmorphism translucent blurred backdrop (BBC-020 SPEC-04) */}
        <motion.div
          data-testid="image-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 backdrop-blur-md"
          style={{
            background: "rgba(10, 18, 32, 0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        />

        {/* Step 8: Accessible Top Header Bar — Centered layout with subtle motion feedback (BBC-020 SPEC-04 / SPEC-08) */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-auto">
          {/* Centered typography and metadata container */}
          <div
            data-testid="image-detail-header-content"
            className="flex flex-wrap items-center justify-center gap-3 text-center px-12"
          >
            {/* Step 8b: Micro-animated phase identity block when changing phases */}
            <motion.div
              key={currentPhaseName}
              initial={{ opacity: 0.4, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-wrap items-center justify-center gap-3 text-center"
            >
              {currentPhaseName && (
                <motion.span
                  data-testid="image-detail-phase-badge"
                  animate={{
                    backgroundColor: [
                      "rgba(16, 185, 129, 0.35)",
                      "rgba(16, 185, 129, 0.10)",
                    ],
                    borderColor: [
                      "rgba(16, 185, 129, 0.65)",
                      "rgba(16, 185, 129, 0.30)",
                    ],
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-md"
                >
                  {currentPhaseName}
                </motion.span>
              )}
              <motion.h2
                id={titleId}
                animate={{
                  color: ["#57B98C", "#FFFFFF"],
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-sm sm:text-base font-semibold text-white tracking-wide drop-shadow-md"
              >
                {title}
              </motion.h2>
            </motion.div>
            {hasMultipleImages && (
              <span className="text-xs text-zinc-300 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                {currentIndex + 1} / {totalPhotos}
              </span>
            )}
          </div>

          {/* Close button anchored to the top-right corner */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle de imagen"
            className="absolute right-4 sm:right-6 top-4 sm:top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-zinc-300 backdrop-blur-md transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 9: Interactive Image Stage with GPU Compositing */}
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-12 cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={(e) => handlePanStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePanMove(e.clientX, e.clientY)}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          onDoubleClick={toggleZoom}
        >
          {currentImageUrl ? (
            <motion.img
              key={currentImageUrl}
              src={currentImageUrl}
              alt={title}
              onLoad={handleImageLoad}
              draggable={false}
              className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-75 ease-out"
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0px) scale(${scale})`,
              }}
            />
          ) : (
            <div className="text-sm text-zinc-400">
              No hay imagen disponible para visualización.
            </div>
          )}
        </div>

        {/* Step 10: Circular Navigation Arrows (Prev / Next) */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagen anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/50 text-zinc-300 backdrop-blur-md transition hover:bg-black/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Imagen siguiente"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/50 text-zinc-300 backdrop-blur-md transition hover:bg-black/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Step 11: Floating Glassmorphic Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-2 backdrop-blur-md shadow-2xl">
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= 1.0}
            aria-label="Reducir zoom"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Restablecer zoom"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-300 transition hover:bg-white/10 hover:text-white rounded-full"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{Math.round(scale * 100)}%</span>
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= maxScale}
            aria-label="Aumentar zoom"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
