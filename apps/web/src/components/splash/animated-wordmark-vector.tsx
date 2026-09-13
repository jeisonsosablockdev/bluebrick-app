/**
 * @file apps/web/src/components/splash/animated-wordmark-vector.tsx
 * @description Layer 1: Presentation - Official BlueBrick typographic wordmark vector component
 * animated using Motion 12 with phase-synchronized appearance and color adaptation.
 */

"use client";

import React from "react";
import { motion, type Variants } from "motion/react";
import {
  ISOTYPE_COLORS,
  WORDMARK_PATH_DATA,
  WORDMARK_VIEWBOX,
} from "@/lib/splash/isotype-geometry";
import type { AnimatedWordmarkVectorProps } from "@/lib/splash/types";

/**
 * Step 1: Define Motion 12 animation variants for the official typographic lettermark.
 */
const wordmarkVariants: Variants = {
  idle: {
    opacity: 0,
    y: 10,
    scale: 0.96,
  },
  entering: {
    opacity: 0,
    y: 10,
    scale: 0.96,
  },
  holding: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  flipping: {
    opacity: 1,
    y: 0,
    scale: 1.02,
    transition: {
      duration: 0.6,
    },
  },
  exiting: {
    opacity: 0,
    scale: 0.94,
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
 * AnimatedWordmarkVector renders the official brand typography ("BLUE BRICK")
 * using the extracted vector paths rather than standard system fonts.
 *
 * @param props - Presentation configuration including active animation phase
 * @returns SVG element rendering the official vector brand lettermark
 */
export function AnimatedWordmarkVector({
  phase,
  width = 210,
  className,
  style,
}: AnimatedWordmarkVectorProps): React.JSX.Element {
  // Step 2: Calculate proportional SVG height based on 710x115 aspect ratio (~6.17:1)
  const height = Math.round(width / 6.17);

  // Step 3: Adapt fill color based on the active animation phase
  const isFlipped = phase === "flipping" || phase === "exiting" || phase === "completed";
  const currentFill = isFlipped ? ISOTYPE_COLORS.whiteSecondary : ISOTYPE_COLORS.whitePrimary;

  // Step 4: Render SVG vector with Motion 12 orchestration
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={WORDMARK_VIEWBOX}
      width={width}
      height={height}
      className={className}
      variants={wordmarkVariants}
      initial="idle"
      animate={phase}
      style={{
        display: "block",
        overflow: "visible",
        ...style,
      }}
      aria-label="BlueBrick Brand Wordmark"
      role="img"
      data-testid="animated-wordmark-vector"
    >
      <path d={WORDMARK_PATH_DATA} fill={currentFill} fillRule="evenodd" />
    </motion.svg>
  );
}
