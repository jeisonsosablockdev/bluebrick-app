/**
 * @file apps/web/src/components/dashboard/project-phase-media-card.tsx
 * @layer Layer 1: Presentation — Modular Media Preview Card for Project Phase Progress.
 *
 * @description Renders the right-column media preview card inside the AVANCE DE OBRA POR FASES
 *   section. When a phase has real photograph URLs (imagen_url_1/2/3 from dashboard_project_phases),
 *   displays the image with object-fit cover, motion fade transitions, overlay gradient for
 *   text legibility, and an interactive carousel with pagination dots.
 *   Falls back to the emerald gradient placeholder with ImageIcon when no photos are available
 *   or when a photo URL fails to load.
 *
 * @security
 *   - Image URLs are already filtered by the infrastructure layer (investment-repository.ts)
 *     to ensure only non-empty, trimmed strings are passed; no additional sanitization needed here.
 *   - No dangerouslySetInnerHTML usage.
 *
 * @invariants
 *   - `images` array is always a filtered, non-null string array (empty = fallback state).
 *   - The component is stateless regarding auto-timer; the parent manages carousel timing.
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Image as ImageIcon } from "lucide-react";

// ─── Public Props Contract ────────────────────────────────────────────────────

/** Props contract for the ProjectPhaseMediaCard component. */
export interface ProjectPhaseMediaCardProps {
  /** Display name of the active construction phase (e.g. "6. Construcción de estructuras y muros"). */
  readonly phaseName: string;
  /** Ordered array of photograph URLs for the current phase. Empty = fallback placeholder shown. */
  readonly images: readonly string[];
  /** Whether the dashboard is in dark theme mode (controls overlay and text colors). */
  readonly isDark: boolean;
  /** Callback to notify the parent when hover state changes (pause/resume auto-carousel). */
  readonly onHoverChange: (hovered: boolean) => void;
  /** Currently active image index controlled by the parent (for auto-rotation). Defaults to 0. */
  readonly activeIndex?: number;
  /** Callback to request parent to set a specific image index (for dot click). */
  readonly onIndexChange?: (index: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ProjectPhaseMediaCard renders the media preview section for a single construction phase.
 * Supports real photographic images from Supabase/GCS URLs or a luxury fallback placeholder.
 *
 * When `activeIndex` and `onIndexChange` are both provided, operates in controlled mode
 * (parent manages carousel index — e.g. for auto-rotation timer).
 * When not provided, operates in uncontrolled / self-contained mode (internal state).
 *
 * @param props - {@link ProjectPhaseMediaCardProps}
 * @returns React.JSX.Element
 */
export function ProjectPhaseMediaCard({
  phaseName,
  images,
  isDark,
  onHoverChange,
  activeIndex,
  onIndexChange,
}: ProjectPhaseMediaCardProps): React.JSX.Element {
  // Step 1: Derive display state from images prop
  const hasAnyImage = images.length > 0;
  const hasMultipleImages = images.length > 1;

  // Step 2: Internal index state — used when parent does not control carousel
  const [internalIndex, setInternalIndex] = useState<number>(0);

  // Step 3: Determine effective index (controlled vs uncontrolled)
  // Invariant: if both activeIndex and onIndexChange are provided → controlled by parent.
  const isControlled = activeIndex !== undefined && onIndexChange !== undefined;
  const safeIndex = hasAnyImage
    ? Math.min(isControlled ? activeIndex! : internalIndex, images.length - 1)
    : 0;

  // Step 4: Local state for error fallback (image URL failed to load)
  const [imageError, setImageError] = useState<boolean>(false);

  // Step 5: Compute current photo URL — null triggers fallback
  const currentSrc = hasAnyImage && !imageError ? images[safeIndex] : null;

  // Step 6: Show image only when we have a valid URL and no load error
  const showRealImage = Boolean(currentSrc);

  /**
   * Step 7: Handle image load errors gracefully.
   * Sets error state so the fallback placeholder is shown instead of a broken image.
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Step 8: Handle pagination dot click.
   * Resets error state when switching images (new URL may succeed).
   * Delegates to parent callback in controlled mode; updates internal state in uncontrolled mode.
   */
  const handleDotClick = (idx: number) => {
    setImageError(false);
    if (isControlled) {
      onIndexChange!(idx);
    } else {
      setInternalIndex(idx);
    }
  };


  // Step 9: Compute image counter label (e.g. "2/3")
  const counterLabel = hasMultipleImages ? `${safeIndex + 1}/${images.length}` : null;

  return (
    <motion.div
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      whileHover={{ scale: 1.025, y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{
        borderRadius: 12,
        // Fallback background — always set; image covers this when available
        background: "linear-gradient(135deg, #1C4D38 0%, #0F3124 100%)",
        border: showRealImage
          ? "1px solid rgba(87, 185, 140, 0.45)"
          : "1px solid rgba(87, 185, 140, 0.3)",
        minHeight: 120,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        position: "relative",
        overflow: "hidden",
        transform: "translateZ(0)",
        willChange: "transform",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Step 8: Real photograph layer — rendered ONLY when a valid URL is available */}
      {showRealImage && (
        <motion.img
          key={`phase-img-${safeIndex}`}
          data-testid="phase-real-image"
          src={currentSrc!}
          alt={`Foto de avance ${safeIndex + 1} de ${phaseName} — obra en construcción`}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
      )}

      {/* Step 9: Dark overlay gradient — only over real photos for text legibility */}
      {showRealImage && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(10,18,32,0.82) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Step 10: Content layer — counter badge, phase label, pagination dots */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "18px 14px",
          gap: 8,
          width: "100%",
        }}
      >
        {/* Step 10a: Icon + counter row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {/* Fallback icon — visible only when no real photo is displayed */}
          {!showRealImage && (
            <ImageIcon size={22} color="rgba(237, 241, 245, 0.85)" />
          )}

          {/* Image counter badge (e.g. "1/3") — only for multi-image */}
          {counterLabel && (
            <span
              data-testid="phase-image-counter"
              style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(237, 241, 245, 0.9)",
                background: "rgba(0, 0, 0, 0.45)",
                padding: "2px 7px",
                borderRadius: 4,
                fontWeight: 600,
                backdropFilter: "blur(4px)",
              }}
            >
              {counterLabel}
            </span>
          )}
        </div>

        {/* Step 10b: Phase name label */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#EDF1F5",
            maxWidth: 220,
            lineHeight: 1.3,
            textShadow: showRealImage ? "0 1px 4px rgba(0,0,0,0.7)" : "none",
          }}
        >
          {hasMultipleImages
            ? `${phaseName} · foto ${safeIndex + 1} de ${images.length}`
            : currentSrc
            ? `${phaseName} · foto avance`
            : `${phaseName} · avance 1`}
        </span>

        {/* Step 10c: Pagination dots — ONLY for multi-image carousels */}
        {hasMultipleImages && (
          <div
            data-testid="phase-images-pagination"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 4,
              zIndex: 5,
            }}
          >
            {images.map((_, imgIdx) => {
              const isActiveDot = imgIdx === safeIndex;
              return (
                <button
                  key={imgIdx}
                  type="button"
                  data-testid={`phase-image-dot-${imgIdx}`}
                  aria-label={`Ver imagen ${imgIdx + 1} de ${images.length}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(imgIdx);
                  }}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    width: isActiveDot ? 14 : 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: isActiveDot
                      ? "#E8495F"
                      : "rgba(237, 241, 245, 0.35)",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
