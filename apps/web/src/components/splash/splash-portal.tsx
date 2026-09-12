/**
 * @file apps/web/src/components/splash/splash-portal.tsx
 * @description Layer 1: Presentation - SSR-safe React Portal wrapper ensuring the splash screen
 * mounts cleanly directly into document.body, isolating it from root DOM hierarchy and layout flows.
 */

"use client";

import React, { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { SplashPortalProps } from "@/lib/splash/types";

const emptySubscribe = () => () => {};

/**
 * SplashPortal safely mounts children into document.body on the client.
 * Returns null during SSR and before client hydration without cascading renders.
 *
 * @param props - Child nodes to portal into the document body
 * @returns React Portal or null when unmounted/SSR
 */
export function SplashPortal({ children }: SplashPortalProps): React.JSX.Element | null {
  // Step 1: Track client-side mount state safely via useSyncExternalStore (SSR-friendly hydration)
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Step 2: Guard against server-side rendering
  if (!isClient || typeof document === "undefined") {
    return null;
  }

  // Step 3: Render children into document.body portal
  return createPortal(children, document.body);
}
