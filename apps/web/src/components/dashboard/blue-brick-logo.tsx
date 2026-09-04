/**
 * @file apps/web/src/components/dashboard/blue-brick-logo.tsx
 * @description Layer 1: Presentation - Official BlueBrick horizontal brand logo component.
 * Renders the official brand graphic assets (/brand/bluebrick-logo-horizontal.png / white.png)
 * adapting automatically to Light Mode and Dark Mode with accessible text fallback.
 */

"use client";

import React from "react";
import Image from "next/image";
import { useTheme } from "@/components/theme";

/**
 * Props for BlueBrickLogo component.
 */
export interface BlueBrickLogoProps {
  /** Height in pixels of the logo (default: 32) */
  height?: number;
  /** Optional custom CSS class */
  className?: string;
  /** Optional inline styles for the container */
  style?: React.CSSProperties;
  /** Priority loading for LCP optimization (default: true) */
  priority?: boolean;
}

/**
 * BlueBrickLogo renders the canonical horizontal logo graphic.
 * In Dark Mode, renders the white text & structural bars version.
 * In Light Mode, renders the deep navy text & structural bars version.
 * 
 * @param props - Logo sizing and styling properties
 * @returns Official BlueBrick brand logo element
 */
export function BlueBrickLogo({
  height = 32,
  className,
  style,
  priority = true,
}: BlueBrickLogoProps = {}): React.JSX.Element {
  // Step 1: Detect active theme to choose between dark-mode white logo and light-mode navy logo
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Step 2: Determine canonical vector source based on active theme
  const src = isDark
    ? "/brand/bluebrick-logo-horizontal-white.svg"
    : "/brand/bluebrick-logo-horizontal.svg";

  // Step 3: Compute proportional width based on 892x168 aspect ratio (approx 5.31:1)
  const width = Math.round(height * 5.31);

  // Step 4: Render Next.js Image with accessible screen-reader branding text
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      <Image
        src={src}
        alt="Blue Brick"
        width={width}
        height={height}
        priority={priority}
        unoptimized
        style={{
          height: `${height}px`,
          width: "auto",
          objectFit: "contain",
          display: "block",
        }}
      />
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
        }}
      >
        Blue Brick
      </span>
    </div>
  );
}
