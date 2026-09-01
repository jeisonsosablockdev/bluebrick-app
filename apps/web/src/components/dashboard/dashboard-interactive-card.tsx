/**
 * @file apps/web/src/components/dashboard/dashboard-interactive-card.tsx
 * @description Layer 1: Presentation - Reusable Hardware-Accelerated Interactive Dashboard Card.
 * Wraps dashboard cards with smooth Motion 12 spring physics, proximity hover scaling,
 * subtle dopamine perimeter glow, and full Core Web Vitals (CLS = 0) compliance.
 */

"use client";

import React from "react";
import { motion } from "motion/react";
import { MICRO_ANIMATION_TOKENS } from "@/lib/pipelines/micro-animation-tokens";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

/**
 * Props for the DashboardInteractiveCard component.
 */
export interface DashboardInteractiveCardProps {
  /** Child React nodes contained within the card */
  readonly children: React.ReactNode;
  /** Optional additional CSS classes */
  readonly className?: string;
  /** Optional inline CSS styles */
  readonly style?: React.CSSProperties;
  /** Visual accent color token for perimeter glow ('emerald' | 'crimson' | 'subtle') */
  readonly accent?: "emerald" | "crimson" | "subtle";
  /** Optional custom scale factor multiplier (defaults to heroCard: 1.008) */
  readonly scaleFactor?: number;
  /** Optional data-testid for end-to-end and integration testing */
  readonly "data-testid"?: string;
}

const GLOW_ACCENT_MAP = {
  emerald: MICRO_ANIMATION_TOKENS.glows.emerald,
  crimson: MICRO_ANIMATION_TOKENS.glows.crimson,
  subtle: MICRO_ANIMATION_TOKENS.glows.subtleCard,
} as const;

/**
 * DashboardInteractiveCard provides subtle, dopamine-inducing micro-interactions
 * on hover without causing layout shifts or violating Web Core Vitals.
 */
export function DashboardInteractiveCard({
  children,
  className = "",
  style,
  accent = "emerald",
  scaleFactor = MICRO_ANIMATION_TOKENS.scales.heroCard,
  "data-testid": testId,
}: DashboardInteractiveCardProps): React.JSX.Element {
  // Step 1: Detect accessibility preferences
  const prefersReduced = useReducedMotion();

  // Step 2: Resolve accent glow based on luxury theme tokens
  const glowShadow = GLOW_ACCENT_MAP[accent] ?? GLOW_ACCENT_MAP.emerald;

  // Step 3: Configure Motion 12 animation variants respecting reduced motion
  const hoverAnimation = prefersReduced
    ? { boxShadow: glowShadow }
    : {
        y: -2,
        scale: scaleFactor,
        boxShadow: glowShadow,
      };

  return (
    <motion.div
      data-testid={testId}
      className={`dash-interactive-card ${className}`.trim()}
      style={{
        transform: "translateZ(0)",
        willChange: "transform, box-shadow",
        transition: "box-shadow 0.28s ease, border-color 0.28s ease",
        ...style,
      }}
      whileHover={hoverAnimation}
      transition={MICRO_ANIMATION_TOKENS.spring.tactile}
    >
      {children}
    </motion.div>
  );
}
