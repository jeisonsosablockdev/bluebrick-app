/**
 * @file apps/web/src/components/splash/animated-isotype-vector.tsx
 * @description Layer 1: Presentation - Motion 12 animatable vector component rendering the 4 decomposed
 * BlueBrick isotype segments with staggered entrance and 3D axial rotation flip choreography.
 */

"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import {
  ISOTYPE_DEFAULT_SIZE,
  ISOTYPE_PIECES,
  ISOTYPE_VIEWBOX,
} from "@/lib/splash/isotype-geometry";
import type { AnimatedIsotypeVectorProps } from "@/lib/splash/types";

/**
 * Step 1: Define Motion 12 animation variants for the hardware-accelerated 3D stage container.
 * Moves the 3D axial rotation (rotateY: 180deg) to an outer GPU compositor layer, eliminating
 * CPU-bound SVG and path re-rasterization on every frame.
 */
const stageVariants: Variants = {
  idle: {
    rotateY: 0,
    scale: 1,
  },
  entering: {
    rotateY: 0,
    scale: 1,
  },
  holding: {
    rotateY: 0,
    scale: 1,
  },
  flipping: {
    rotateY: 180,
    scale: 1.05,
    transition: {
      duration: 0.45,
      ease: [0.34, 1.56, 0.64, 1], // Spring-like overshoot ease
    },
  },
  exiting: {
    rotateY: 180,
    scale: 0.92,
    transition: {
      duration: 0.28,
      ease: [0.7, 0, 0.84, 0],
    },
  },
  completed: {
    rotateY: 180,
    opacity: 0,
  },
};

/**
 * Step 2: Define Motion 12 animation variants for individual isotype pieces (entrance and exit).
 */
const pieceVariants: Variants = {
  idle: {
    opacity: 0,
    y: 24,
    scale: 0.9,
  },
  entering: (custom: { delay: number; duration: number }) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: custom.delay,
      duration: custom.duration,
      ease: [0.16, 1, 0.3, 1], // Custom cubic bezier curve
    },
  }),
  holding: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
  flipping: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exiting: {
    opacity: 0,
    scale: 0.92,
    transition: {
      duration: 0.28,
      ease: [0.7, 0, 0.84, 0],
    },
  },
  completed: {
    opacity: 0,
  },
};

/**
 * AnimatedIsotypeVector renders the 4 decomposed BlueBrick logo pieces
 * wrapped inside a hardware-accelerated 3D stage container.
 *
 * @param props - Presentation configuration including active animation phase and size
 * @returns 3D DOM stage containing the choreographed isotype SVG
 */
export function AnimatedIsotypeVector({
  phase,
  size = ISOTYPE_DEFAULT_SIZE,
  className,
  style,
}: AnimatedIsotypeVectorProps): React.JSX.Element {
  // Step 3: Wrap SVG in GPU-promoted 3D stage container for hardware composition
  return (
    <motion.div
      data-testid="isotype-3d-stage"
      variants={stageVariants}
      initial="idle"
      animate={phase}
      className={className}
      style={{
        perspective: 800,
        transformStyle: "preserve-3d",
        willChange: "transform",
        backfaceVisibility: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {/* Step 4: Render SVG graphic canvas without expensive per-frame SVG matrix transforms */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={ISOTYPE_VIEWBOX}
        width={size}
        height={size}
        style={{
          overflow: "visible",
          display: "block",
        }}
        aria-label="BlueBrick Brand Mark"
        role="img"
      >
        {/* Step 5: Render each decomposed segment with Motion 12 entrance and fill transitions */}
        {ISOTYPE_PIECES.map((piece) => {
          const isFlipped = phase === "flipping" || phase === "exiting" || phase === "completed";
          const currentFill = isFlipped ? piece.secondaryFill : piece.initialFill;

          return (
            <motion.path
              key={piece.id}
              d={piece.pathData}
              fill={currentFill}
              fillRule="evenodd"
              custom={{ delay: piece.delaySeconds, duration: piece.durationSeconds }}
              variants={pieceVariants}
              initial="idle"
              animate={phase}
              style={{
                transformOrigin: "center",
              }}
              data-testid={`isotype-piece-${piece.id}`}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}
