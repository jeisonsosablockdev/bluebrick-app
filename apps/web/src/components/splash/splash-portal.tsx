/**
 * @file apps/web/src/components/splash/splash-portal.tsx
 * @description Layer 1: Presentation - SSR-safe React Portal wrapper ensuring the splash screen
 * mounts cleanly directly into document.body, isolating it from root DOM hierarchy and layout flows.
 */

"use client";

import React from "react";
import { createPortal } from "react-dom";
import type { SplashPortalProps } from "@/lib/splash/types";

/**
 * SSR-safe portal wrapper mounting children into document.body.
 * Falls back to direct in-tree rendering during SSR or before DOM readiness.
 *
 * @param props - Children to portal
 * @returns Portaled elements or in-tree fallback
 */
export function SplashPortal({ children }: SplashPortalProps): React.JSX.Element | null {
  // Step 1: In SSR or environments without document.body, render children directly in-tree
  if (typeof document === "undefined" || !document.body) {
    return <>{children}</>;
  }

  // Step 2: Render children directly into document.body portal on client
  return createPortal(children, document.body);
}
