"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { createPageMotionVariants, type MotionDirection } from "@/lib/motion";

type RouteTransitionProps = {
  children: ReactNode;
  className?: string;
  direction?: MotionDirection;
  routeKey: string;
};

export function RouteTransition({ children, className, direction = "forward", routeKey }: RouteTransitionProps) {
  const variants = createPageMotionVariants(direction);

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
