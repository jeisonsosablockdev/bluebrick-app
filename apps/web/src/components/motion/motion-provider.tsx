"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

import { MOTION_DEFAULT_TRANSITION } from "@/lib/motion";

type MotionProviderProps = {
  children: ReactNode;
};

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user" transition={MOTION_DEFAULT_TRANSITION}>
      {children}
    </MotionConfig>
  );
}
