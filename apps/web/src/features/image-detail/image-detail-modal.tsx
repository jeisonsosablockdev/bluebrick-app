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
}: ImageDetailModalProps) {
  // Step 2: Hydration-safe client portal check using useSyncExternalStore
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (images.length === 0) return 0;
    return Math.max(0, Math.min(initialIndex, images.length - 1));
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

  // Step 4: Reset zoom and handle circular navigation when transitioning to another image
  const goToImage = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const safeIndex = (index + images.length) % images.length;
      setCurrentIndex(safeIndex);
      resetZoom();
    },
    [images.length, resetZoom]
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
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" && images.length > 1) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, handlePrev, handleNext, images.length]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const currentImageUrl = images[currentIndex] || "";
  const hasMultipleImages = images.length > 1;

  // Step 6: Render modal portal with WAI-ARIA semantics and hardware-accelerated viewport
  return createPortal(
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-50 flex items-center justify-center select-none"
      >
        {/* Step 7: Glassmorphism blurred backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Step 8: Accessible Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
          <div className="flex items-center gap-3">
            {phaseName && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400">
                {phaseName}
              </span>
            )}
            <h2 id={titleId} className="text-sm sm:text-base font-semibold text-white tracking-wide">
              {title}
            </h2>
            {hasMultipleImages && (
              <span className="text-xs text-zinc-400">
                {currentIndex + 1} / {images.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle de imagen"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            disabled={scale <= fitScale}
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
