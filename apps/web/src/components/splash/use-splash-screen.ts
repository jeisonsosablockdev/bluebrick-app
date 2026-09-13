/**
 * @file apps/web/src/components/splash/use-splash-screen.ts
 * @description Layer 2: Application / Consumption - Custom state machine orchestration hook
 * governing the startup splash screen lifecycle, phase transitions, and session gating.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateSplashSchedule,
  DEFAULT_SPLASH_OPTIMIZATION_CONFIG,
  prefetchCriticalRoutes,
  shouldBypassSplash,
} from "@/lib/splash/load-optimizer";
import { splashStorage } from "@/lib/splash/splash-storage";
import type {
  SplashPhase,
  UseSplashScreenOptions,
  UseSplashScreenResult,
} from "@/lib/splash/types";

/**
 * Orchestrates the multi-phase splash screen animation lifecycle:
 * idle -> entering -> holding -> flipping -> exiting -> completed.
 *
 * @param options - Configuration overrides and completion callback
 * @returns State and controls for splash presentation
 */
export function useSplashScreen(
  options: UseSplashScreenOptions = {}
): UseSplashScreenResult {
  const { config: customConfig, onComplete, forceShow = false } = options;

  // Step 1: Merge user configuration with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_SPLASH_OPTIMIZATION_CONFIG,
      ...customConfig,
    }),
    [customConfig]
  );

  const schedule = useMemo(
    () => calculateSplashSchedule(config.holdDurationMs),
    [config.holdDurationMs]
  );

  // Step 2: Check session bypass eligibility synchronously during initial mount (zero-frame ghost mount elimination)
  const checkInitialBypass = useCallback((): boolean => {
    const alreadyViewed = splashStorage.hasViewed();
    return shouldBypassSplash(alreadyViewed, forceShow, config.bypassOnRepeatVisit);
  }, [config.bypassOnRepeatVisit, forceShow]);

  const isBypassedSync = checkInitialBypass();

  const [phase, setPhase] = useState<SplashPhase>(isBypassedSync ? "completed" : "idle");
  const [isVisible, setIsVisible] = useState<boolean>(!isBypassedSync);
  const [isCompleted, setIsCompleted] = useState<boolean>(isBypassedSync);
  const activeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Step 3: Fast-forward / manual skip handler
  const skipSplash = useCallback(() => {
    // Clear all pending transition timers
    activeTimersRef.current.forEach(clearTimeout);
    activeTimersRef.current = [];

    splashStorage.markAsViewed();
    setPhase("completed");
    setIsVisible(false);
    setIsCompleted(true);
    onComplete?.();
  }, [onComplete]);

  // Step 4: Primary lifecycle and timer progression effect
  useEffect(() => {
    // Check session bypass eligibility - if already bypassed synchronously, trigger completion callback and exit
    if (checkInitialBypass()) {
      onComplete?.();
      return;
    }

    // Begin Phase A: entering
    const startTimer = setTimeout(() => {
      setPhase("entering");
    }, 0);
    activeTimersRef.current.push(startTimer);

    const enteringTimer = setTimeout(() => {
      // Begin Phase B: holding
      setPhase("holding");
      // Trigger background prefetch during hold
      void prefetchCriticalRoutes(config.criticalRoutes);

      const holdingTimer = setTimeout(() => {
        // Begin Phase C: flipping (3D axial rotation)
        setPhase("flipping");

        const flippingTimer = setTimeout(() => {
          // Begin Phase D: exiting (curtain reveal)
          setPhase("exiting");

          const exitingTimer = setTimeout(() => {
            // Lifecycle terminal state: completed
            splashStorage.markAsViewed();
            setPhase("completed");
            setIsVisible(false);
            setIsCompleted(true);
            onComplete?.();
          }, schedule.exitingDurationMs);

          activeTimersRef.current.push(exitingTimer);
        }, schedule.flippingDurationMs);

        activeTimersRef.current.push(flippingTimer);
      }, schedule.holdDurationMs);

      activeTimersRef.current.push(holdingTimer);
    }, schedule.enteringDurationMs);

    activeTimersRef.current.push(enteringTimer);

    // Fallback safety timeout
    const fallbackTimer = setTimeout(() => {
      skipSplash();
    }, config.fallbackTimeoutMs);
    activeTimersRef.current.push(fallbackTimer);

    // Step 5: Clean up timers on unmount
    return () => {
      activeTimersRef.current.forEach(clearTimeout);
      activeTimersRef.current = [];
    };
  }, [
    checkInitialBypass,
    config.bypassOnRepeatVisit,
    config.criticalRoutes,
    config.fallbackTimeoutMs,
    forceShow,
    onComplete,
    schedule.enteringDurationMs,
    schedule.exitingDurationMs,
    schedule.flippingDurationMs,
    schedule.holdDurationMs,
    skipSplash,
  ]);

  return {
    phase,
    isCompleted,
    isVisible,
    skipSplash,
  };
}
