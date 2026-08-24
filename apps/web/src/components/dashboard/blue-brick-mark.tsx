/**
 * @file apps/web/src/components/dashboard/blue-brick-mark.tsx
 * @description Layer 1: Presentation - BlueBrick brand vector logo mark component.
 * Renders the four-bar angled isometric gradient branding emblem.
 */

import React from "react";

interface BarConfig {
  h: number;
  bg: string;
}

const BRAND_BARS: readonly BarConfig[] = [
  { h: 16, bg: "linear-gradient(160deg,#F2F5F8 0%,#8E9BAA 55%,#4A5566 100%)" },
  { h: 26, bg: "linear-gradient(160deg,#F2F5F8 0%,#8E9BAA 55%,#4A5566 100%)" },
  { h: 32, bg: "linear-gradient(160deg,#F2F5F8 0%,#8E9BAA 55%,#4A5566 100%)" },
  { h: 26, bg: "linear-gradient(160deg,#F0576B 0%,#C41230 55%,#7A0E1F 100%)" },
] as const;

/**
 * BlueBrickMark renders the signature angled 4-bar brand mark.
 */
export function BlueBrickMark(): React.JSX.Element {
  // Step 1: Render stylized vertical bars with isometric rotation (-14deg)
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
        transform: "rotate(-14deg)",
        padding: "2px 4px",
      }}
      aria-hidden="true"
    >
      {BRAND_BARS.map((b, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: b.h,
            borderRadius: 3,
            background: b.bg,
            boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        />
      ))}
    </div>
  );
}
