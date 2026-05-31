"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";

import { clearNavigationOrigin, getNavigationOrigin } from "@/components/motion/navigation-origin";
import {
  createNavigationFallbackMotionVariants,
  createNavigationOriginMotionVariants,
  createPageMotionVariants,
  type MotionDirection,
  type RouteTransitionMode
} from "@/lib/motion";

type RouteTransitionProps = {
  children: ReactNode;
  className?: string;
  direction?: MotionDirection;
  mode?: RouteTransitionMode;
  routeKey: string;
};

export function RouteTransition({
  children,
  className,
  direction = "forward",
  mode = "page",
  routeKey
}: RouteTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const navigationOrigin = mode === "navigation-origin" ? getNavigationOrigin() : null;

  useEffect(() => {
    if (navigationOrigin) {
      clearNavigationOrigin();
    }
  }, [navigationOrigin]);

  const variants = useMemo(() => {
    if (mode === "navigation-origin" && navigationOrigin && !prefersReducedMotion) {
      const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
      const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
      const radius = Math.max(viewportWidth, viewportHeight) * 1.25 || 1200;

      return createNavigationOriginMotionVariants({
        x: navigationOrigin.x,
        y: navigationOrigin.y,
        radius
      });
    }

    if (mode === "navigation-origin") {
      return createNavigationFallbackMotionVariants();
    }

    return createPageMotionVariants(direction);
  }, [direction, mode, navigationOrigin, prefersReducedMotion]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        className={className}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
