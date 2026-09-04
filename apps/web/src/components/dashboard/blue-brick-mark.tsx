/**
 * @file apps/web/src/components/dashboard/blue-brick-mark.tsx
 * @description Layer 1: Presentation - BlueBrick official adaptive brand vector emblem component.
 * Renders the canonical 4-bar angled stadium geometry with theme-adaptive fill colors.
 */

"use client";

import React from "react";
import { useTheme } from "@/components/theme";
import {
  BRAND_BARS,
  BRAND_GEOMETRY,
  getBarFill,
  type BrandThemeMode,
} from "@/features/shared";

/**
 * Props for BlueBrickMark component (optional styling overrides).
 */
export interface BlueBrickMarkProps {
  /** Optional additional CSS class names */
  className?: string;
  /** Optional custom inline styles for root container */
  style?: React.CSSProperties;
}

/**
 * BlueBrickMark renders the signature angled 4-bar brand emblem.
 * Adapts bar fills based on light and dark mode while maintaining Crimson Red accent invariant.
 * 
 * @param props - Component props for container customisation
 * @returns Official BlueBrick vector mark JSX element
 */
export function BlueBrickMark({ className, style }: BlueBrickMarkProps = {}): React.JSX.Element {
  // Step 1: Detect active theme ('light' | 'dark') from application context
  const { theme } = useTheme();
  const activeTheme: BrandThemeMode = theme === "light" ? "light" : "dark";

  // Step 2: Render angled container with canonical -24 degree rotation
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: BRAND_GEOMETRY.barGap,
        transform: `rotate(${BRAND_GEOMETRY.angleDeg}deg)`,
        padding: "2px 4px",
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Step 3: Render each stadium capsule bar according to canonical geometry and theme fills */}
      {BRAND_BARS.map((b) => (
        <span
          key={b.id}
          style={{
            width: BRAND_GEOMETRY.barWidth,
            height: b.height,
            borderRadius: BRAND_GEOMETRY.borderRadius,
            background: getBarFill(b, activeTheme),
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
