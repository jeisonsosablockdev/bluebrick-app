/**
 * @file apps/web/src/components/splash/splash-portal.tsx
 * @description Layer 1: Presentation - SSR-safe React Portal wrapper ensuring the splash screen
 * mounts cleanly directly into document.body, isolating it from root DOM hierarchy and layout flows.
 */

"use client";

import React, { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { SplashPortalProps } from "@/lib/splash/types";

export function SplashPortal({ children }: SplashPortalProps): React.JSX.Element | null {
  // Step 1: Guard against environments where document is unavailable
  if (typeof document === "undefined" || !document.body) {
    return null;
  }

  // Step 2: Render children directly into document.body portal
  return createPortal(children, document.body);
}
