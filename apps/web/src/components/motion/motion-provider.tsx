/**
 * @file apps/web/src/components/motion/motion-provider.tsx
 * @description Layer 1: Presentation - Motion 12 Configuration Provider.
 */

"use client";

import React from "react";
import { MotionConfig } from "motion/react";

export interface MotionProviderProps {
  children: React.ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  // Step 1: Wrap children with MotionConfig respecting user preference
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
