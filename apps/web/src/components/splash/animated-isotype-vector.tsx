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
 * Step 1: Define Motion 12 animation variants for individual isotype pieces.
 */
const pieceVariants: Variants = {
  idle: {
    opacity: 0,
    y: 24,
    scale: 0.9,
    rotateY: 0,
  },
  entering: (custom: { delay: number; duration: number }) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
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
    rotateY: 0,
    transition: {
      duration: 0.3,
    },
  },
  flipping: (custom: { delay: number }) => ({
    rotateY: 180,
    scale: 1.05,
    transition: {
      delay: custom.delay * 0.5,
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1], // Spring-like overshoot ease
    },
  }),
  exiting: {
    opacity: 0,
    scale: 0.92,
    transition: {
      duration: 0.5,
      ease: [0.7, 0, 0.84, 0],
    },
  },
  completed: {
    opacity: 0,
  },
};

/**
 * AnimatedIsotypeVector renders the 4 decomposed BlueBrick logo pieces
 * as individually animated vector elements using Motion 12.
 *
 * @param props - Presentation configuration including active animation phase
 * @returns SVG element containing choreographed isotype segments
 */
export function AnimatedIsotypeVector({
  phase,
  size = ISOTYPE_DEFAULT_SIZE,
  className,
  style,
}: AnimatedIsotypeVectorProps): React.JSX.Element {
  // Step 2: Establish SVG dimensions and 3D perspective context
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={ISOTYPE_VIEWBOX}
      width={size}
      height={size}
      className={className}
      style={{
        perspective: 800,
        transformStyle: "preserve-3d",
        overflow: "visible",
        ...style,
      }}
      aria-label="BlueBrick Brand Mark"
      role="img"
    >
      {/* Step 3: Render each decomposed segment with Motion 12 animation parameters */}
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
    </motion.svg>
  );
}
