/**
 * @file apps/web/src/components/splash/brand-splash-screen.tsx
 * @description Layer 1: Presentation - Root client-side splash presentation component rendered
 * as a full-screen fixed overlay (z-index: 9999) using Motion 12 AnimatePresence and SplashPortal.
 */

"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import type { BrandSplashScreenProps } from "@/lib/splash/types";
import { AnimatedIsotypeVector } from "./animated-isotype-vector";
import { AnimatedWordmarkVector } from "./animated-wordmark-vector";
import { SplashPortal } from "./splash-portal";
import { useSplashScreen } from "./use-splash-screen";

/**
 * BrandSplashScreen presents the initial brand loading animation overlay.
 * Conceals page hydration, executes the 4-phase Motion 12 choreography, and cleanly unmounts.
 *
 * @param props - Presentation and completion callback options
 * @returns Splash overlay element wrapped in a portal, or null when completed
 */
export function BrandSplashScreen({
  onComplete,
  className,
  forceShow = false,
  showWordmark = true,
}: BrandSplashScreenProps): React.JSX.Element | null {
  // Step 1: Hook into the splash lifecycle state machine
  const { phase, isVisible, skipSplash } = useSplashScreen({
    onComplete,
    forceShow,
  });

  // Step 2: Render in portal with AnimatePresence for smooth exit transition
  return (
    <SplashPortal>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            id="brand-splash-curtain"
            key="brand-splash-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Application Loading"
            className={className}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#020813", // Canonical BlueBrick night sky dark background
              pointerEvents: "auto",
              userSelect: "none",
            }}
            onClick={skipSplash}
            data-testid="brand-splash-screen"
          >
            {/* Step 3: Render animated 4-piece vector mark */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
              }}
            >
              <AnimatedIsotypeVector phase={phase} size={140} />

              {/* Step 4: Render official animated vector lettermark (replaces plain font text) */}
              {showWordmark && (
                <AnimatedWordmarkVector phase={phase} width={210} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SplashPortal>
  );
}
