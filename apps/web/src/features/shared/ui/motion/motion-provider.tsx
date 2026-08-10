"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

type MotionProviderProps = {
  children: ReactNode;
  reducedMotion?: "user" | "always" | "never";
};

export function MotionProvider({
  children,
  reducedMotion = "user"
}: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion={reducedMotion}>
      {children}
    </MotionConfig>
  );
}
