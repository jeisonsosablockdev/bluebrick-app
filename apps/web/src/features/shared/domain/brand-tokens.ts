/**
 * @file apps/web/src/features/shared/domain/brand-tokens.ts
 * @description Layer 3: Domain - Immutable BlueBrick Brand Visual Identity Tokens.
 * Defines canonical brand color codes, stadium bar geometry, aspect ratios,
 * and theme-adaptive fill specifications according to the BlueBrick Brand Style Guide.
 */

/**
 * Valid color keys defined in the BlueBrick brand design system.
 */
export type BrandColorKey = "crimsonRed" | "deepNavy" | "pureWhite" | "canvasGrey" | "typographyNavy";

/**
 * Functional role of an individual stadium bar within the BlueBrick emblem.
 */
export type BrandBarRole = "structural" | "accent";

/**
 * Supported theme modes for theme-adaptive brand assets.
 */
export type BrandThemeMode = "light" | "dark";

/**
 * Invariant specifications for each of the 4 stadium bars in the BlueBrick mark.
 */
export interface BrandBarConfig {
  /** Sequential identifier (1 to 4 from left to right) */
  readonly id: 1 | 2 | 3 | 4;
  /** Functional role: structural bars adapt to theme; accent bar remains Crimson Red */
  readonly role: BrandBarRole;
  /** Relative height of the bar in grid units / pixels */
  readonly height: number;
  /** Standard capsule width */
  readonly width: number;
  /** Corner border radius to form stadium pill capsules */
  readonly borderRadius: number;
  /** Fill hex color in Light Mode */
  readonly lightFill: string;
  /** Fill hex color in Dark Mode */
  readonly darkFill: string;
  /** Descriptive human-readable label */
  readonly label: string;
}

/**
 * Structural geometric invariants of the BlueBrick vector mark.
 */
export interface BrandGeometryConfig {
  /** Counter-clockwise angle of inclination in degrees */
  readonly angleDeg: number;
  /** Spacing in pixels between adjacent stadium bars */
  readonly barGap: number;
  /** Standard stadium bar width in pixels */
  readonly barWidth: number;
  /** Corner border radius to form stadium pill capsules */
  readonly borderRadius: number;
  /** Minimum rendered container width */
  readonly minWidth: number;
  /** Minimum rendered container height */
  readonly minHeight: number;
  /** Canonical aspect ratio */
  readonly aspectRatio: string;
  /** Public asset URLs for static serving */
  readonly assets: {
    readonly horizontalLogo: string;
    readonly markDark: string;
    readonly markWhite: string;
  };
}

/**
 * Immutable BlueBrick color palette sampled directly from official brand master assets.
 * 
 * - Crimson Red (#FC040C): Accent bar and high-priority brand indicators.
 * - Deep Navy (#04283C): Structural bars on light backgrounds and luxury containers.
 * - Pure White (#FFFFFF): Structural bars on dark backgrounds.
 * - Canvas Grey (#F7F7F7): Neutral canvas background.
 * - Typography Navy (#102838): Official wordmark typography color.
 */
export const BRAND_COLORS = {
  crimsonRed: "#FC040C",
  deepNavy: "#04283C",
  pureWhite: "#FFFFFF",
  canvasGrey: "#F7F7F7",
  typographyNavy: "#102838",
} as const;

/**
 * Immutable stadium bar definitions for the BlueBrick vector emblem.
 * Contains the 4 capsule bars ordered from left to right:
 * 1. Bar 1: Left short bar (Structural)
 * 2. Bar 2: Center-left medium bar (Structural)
 * 3. Bar 3: Center-right tall bar - maximum height (Structural)
 * 4. Bar 4: Top-right medium bar - high energy accent (Crimson Red)
 */
export const BRAND_BARS: readonly BrandBarConfig[] = [
  {
    id: 1,
    role: "structural",
    height: 16,
    width: 6,
    borderRadius: 3,
    lightFill: BRAND_COLORS.deepNavy,
    darkFill: BRAND_COLORS.pureWhite,
    label: "Bar 1 - Left Short (Structural)",
  },
  {
    id: 2,
    role: "structural",
    height: 26,
    width: 6,
    borderRadius: 3,
    lightFill: BRAND_COLORS.deepNavy,
    darkFill: BRAND_COLORS.pureWhite,
    label: "Bar 2 - Center-Left Medium (Structural)",
  },
  {
    id: 3,
    role: "structural",
    height: 32,
    width: 6,
    borderRadius: 3,
    lightFill: BRAND_COLORS.deepNavy,
    darkFill: BRAND_COLORS.pureWhite,
    label: "Bar 3 - Center-Right Tall (Structural)",
  },
  {
    id: 4,
    role: "accent",
    height: 26,
    width: 6,
    borderRadius: 3,
    lightFill: BRAND_COLORS.crimsonRed,
    darkFill: BRAND_COLORS.crimsonRed,
    label: "Bar 4 - Top-Right Accent (Crimson Red)",
  },
] as const;

/**
 * Geometric constraints and asset paths for the BlueBrick brand mark.
 */
export const BRAND_GEOMETRY: BrandGeometryConfig = {
  // Step 1: Incline angle of -24 degrees per official specification
  angleDeg: -24,
  // Step 2: Interstitial bar spacing, bar width, and capsule border radius
  barGap: 3,
  barWidth: 6,
  borderRadius: 3,
  minWidth: 33,
  minHeight: 32,
  aspectRatio: "1:1",
  // Step 3: Public static brand asset routes
  assets: {
    horizontalLogo: "/brand/bluebrick-logo-horizontal.svg",
    markDark: "/brand/bluebrick-mark-dark.svg",
    markWhite: "/brand/bluebrick-mark-white.svg",
  },
} as const;

/**
 * Resolves the appropriate fill color for a given bar based on current theme mode.
 * 
 * @param bar - The brand bar configuration item
 * @param theme - Active theme mode ('light' | 'dark')
 * @returns Hex color string for SVG/CSS fill
 */
export function getBarFill(bar: BrandBarConfig, theme: BrandThemeMode): string {
  // Step 1: For accent bars, always return the immutable Crimson Red token
  if (bar.role === "accent") {
    return BRAND_COLORS.crimsonRed;
  }

  // Step 2: For structural bars, adaptively select light or dark fill
  return theme === "dark" ? bar.darkFill : bar.lightFill;
}

/**
 * Retrieves a brand color token by key.
 * 
 * @param key - The brand color identifier
 * @returns The hex color string
 */
export function getBrandColor(key: BrandColorKey): string {
  // Step 1: Return the immutable hex value from domain tokens
  return BRAND_COLORS[key];
}
