/**
 * @file apps/web/src/components/splash/splash-curtain.tsx
 * @description Layer 1: Presentation - Static SSR Shell Curtain.
 * Renders an immediate opaque canonical background (#020813) covering the viewport
 * at Frame 0 (SSR) with z-index: 9999 to guarantee zero FOUC before hydration.
 */

import React from "react";
import type { SplashCurtainProps } from "@/lib/splash/types";

/**
 * Static SSR Shell Curtain rendered directly in the HTML tree.
 * Prevents landing page flash on Frame 0 before client-side hydration.
 *
 * @param props - Presentation and children properties
 * @returns Full-viewport fixed curtain element
 */
export function SplashCurtain({
  className,
  style,
  children,
}: SplashCurtainProps): React.JSX.Element {
  // Step 1: Render full-screen fixed container covering Frame 0
  return (
    <div
      id="brand-splash-curtain"
      role="presentation"
      aria-hidden="true"
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#020813",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        userSelect: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
