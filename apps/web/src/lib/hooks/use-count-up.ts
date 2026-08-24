/**
 * @file apps/web/src/lib/hooks/use-count-up.ts
 * @description Layer 2: Application - Custom React hook for animating numerical values (Count-Up).
 */

"use client";

import { useEffect, useState } from "react";

export interface UseCountUpOptions {
  durationMs?: number;
  decimals?: number;
}

/**
 * useCountUp smoothly animates a number from 0 to target value.
 *
 * @param target - Target numeric value to count up to.
 * @param options - Duration and decimal precision options.
 * @returns Current animated numerical value.
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { durationMs = 1200, decimals = 0 } = options;
  const [currentValue, setCurrentValue] = useState<number>(0);

  useEffect(() => {
    // Step 1: Guard against invalid targets
    if (Number.isNaN(target)) {
      return;
    }

    // Step 2: Set up requestAnimationFrame timer loop
    const startTime = performance.now();

    let animationFrameId: number;

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Step 3: Apply cubic ease-out easing curve (1 - (1 - t)^3)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = easeOutProgress * target;

      const factor = Math.pow(10, decimals);
      setCurrentValue(Math.round(nextValue * factor) / factor);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateFrame);
      } else {
        setCurrentValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(updateFrame);

    // Step 4: Clean up animation frame on unmount or target change
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [target, durationMs, decimals]);

  return currentValue;
}
