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
 * Canonical vector path data for the official BlueBrick brand marks and logos.
 * Extracted directly from canonical vector assets in apps/web/public/brand/.
 */
export const BRAND_LOGO_PATHS = {
  /**
   * Official horizontal brand logo combining vector emblem mark and "Blue Brick" wordmark.
   * ViewBox: 0 0 892 168 (Aspect ratio ~5.31:1).
   */
  horizontalLogo: {
    viewBox: "0 0 892 168",
    whitePath:
      "M 66.087 6.906 C 48.790 15.058, 48.612 16.486, 61.546 43.232 C 78.035 77.329, 88.744 99.588, 98.720 120.500 C 103.967 131.500, 109.259 141.546, 110.478 142.825 C 114.356 146.891, 119.291 146.728, 129.080 142.209 C 138.904 137.674, 142 134.495, 142 128.945 C 142 123.901, 86.699 8.601, 82.953 5.834 C 78.343 2.430, 75.154 2.633, 66.087 6.906 M 28 24.344 C 17.794 28.680, 14.048 31.007, 12.521 33.960 C 9.277 40.234, 7.294 35.591, 58.246 141.057 C 71.123 167.712, 72.398 168.527, 88.765 160.561 C 98.348 155.897, 101 153.052, 101 147.435 C 101 143.659, 44.189 26.170, 41.517 24.419 C 37.687 21.910, 33.780 21.888, 28 24.344 M 289.496 60.381 C 288.574 108.310, 288.876 117.371, 291.549 122.025 C 294.861 127.789, 300.601 130, 312.251 130 L 322.078 130 321.789 121.250 L 321.500 112.500 318.004 112.168 C 311.715 111.572, 312 113.768, 312 65.878 L 312 22 301.117 22 L 290.234 22 289.496 60.381 M 190 76 L 190 129 219.911 129 C 246.514 129, 250.499 128.789, 255.942 127.095 C 271.582 122.228, 280.009 106.711, 276.027 90.112 C 274.639 84.328, 267.726 75.724, 262.836 73.695 L 259.956 72.500 264.665 69 C 276.447 60.243, 277.558 42.717, 267.019 31.857 C 259.234 23.835, 254.742 23, 219.395 23 L 190 23 190 76 M 543 76.052 L 543 129.104 574.750 128.802 L 606.500 128.500 612.086 125.880 C 626.030 119.341, 632.882 104.427, 628.643 89.844 C 626.817 83.564, 620.774 75.978, 616.034 74.014 C 612.114 72.391, 612.214 72.015, 617.399 68.871 C 630.530 60.909, 630.006 38.184, 616.476 28.806 C 609.163 23.736, 603.495 23, 571.790 23 L 543 23 543 76.052 M 697 33.034 L 697 43.068 707.750 42.784 L 718.500 42.500 718.786 32.750 L 719.072 23 708.036 23 L 697 23 697 33.034 M 815 76 L 815 129 826 129 L 837 129 837 115.696 L 837 102.392 840.368 99.128 L 843.737 95.863 853.475 112.431 L 863.213 129 877.106 129 C 884.748 129, 891 128.773, 891 128.497 C 891 128.220, 883.939 117.399, 875.309 104.450 L 859.617 80.908 874.546 65.954 L 889.475 51 874.987 51.042 L 860.500 51.083 849 64.037 L 837.500 76.991 837.234 49.995 L 836.968 23 825.984 23 L 815 23 815 76 M 214 53.607 L 214 64.214 229.477 63.857 C 244.852 63.502, 244.973 63.482, 247.727 60.727 C 251.921 56.533, 251.701 49.909, 247.234 45.918 L 243.968 43 228.984 43 L 214 43 214 53.607 M 567 53.430 L 567 64 579.750 63.994 C 598.990 63.986, 603 62.147, 603 53.333 C 603 50.314, 602.313 48.312, 600.589 46.306 L 598.178 43.500 582.589 43.180 L 567 42.859 567 53.430 M 436.929 50.367 C 426.616 53.148, 416.967 61.519, 412.198 71.822 C 408.477 79.862, 408.272 99.384, 411.816 108.202 C 415.024 116.184, 421.680 123.225, 429.794 127.219 C 439.377 131.937, 456.970 132.131, 466.722 127.626 C 475.126 123.744, 486 111.820, 486 106.487 C 486 106.339, 481.051 105.895, 475.003 105.500 L 464.006 104.782 461.120 107.871 C 451.933 117.706, 435.651 113.071, 432.593 99.750 L 431.962 97 459.481 97 L 487 97 486.985 91.750 C 486.931 72.573, 476.264 55.633, 461.339 51.023 C 453.931 48.735, 443.976 48.467, 436.929 50.367 M 758.746 50.031 C 739.608 54.822, 728.900 71.353, 730.265 94 C 731.608 116.304, 744.068 129.710, 765 131.373 C 784.704 132.938, 800.874 121.868, 804.871 104.078 L 805.787 100 798.019 100 C 793.746 100, 788.947 99.739, 787.354 99.421 C 784.724 98.895, 784.335 99.185, 783.102 102.593 C 777.952 116.835, 758.903 115.515, 754.476 100.609 C 749.534 83.965, 755.980 68.188, 768.089 67.290 C 774.922 66.783, 779.448 69.331, 781.842 75.031 L 783.500 78.980 790.500 78.979 C 802.967 78.977, 805.217 78.272, 804.426 74.611 C 802.407 65.266, 795.092 56.314, 786.086 52.167 C 779.900 49.319, 765.945 48.228, 758.746 50.031 M 674.500 51.881 C 670.153 53.877, 668.113 55.867, 665.665 60.500 L 664.080 63.500 664.040 57.250 L 664 51 653.500 51 L 643 51 643 90 L 643 129 653.896 129 L 664.792 129 665.146 105.250 C 665.471 83.459, 665.669 81.212, 667.554 78.003 C 670.811 72.458, 675.294 70, 682.148 70 L 688 70 688 60 L 688 50 683.250 50.022 C 680.638 50.034, 676.700 50.870, 674.500 51.881 M 328.186 82.250 C 328.536 117.035, 328.959 119.422, 335.808 125.185 C 345.426 133.278, 363.343 132.899, 372.504 124.409 C 375.859 121.299, 376 121.343, 376 125.500 L 376 129 386.500 129 L 397 129 397 90 L 397 51 386 51 L 375 51 374.944 76.250 C 374.906 93.070, 374.489 102.657, 373.694 104.965 C 370.981 112.841, 360.009 115.659, 353.766 110.083 L 350.500 107.167 350.205 79.083 L 349.911 51 338.891 51 L 327.871 51 328.186 82.250 M 697 90 L 697 129 708 129 L 719 129 719 90 L 719 51 708 51 L 697 51 697 90 M 440.966 68.250 C 437.049 70.227, 432.080 76.334, 432.016 79.250 C 432.007 79.662, 438.975 80, 447.500 80 L 463 80 463 77.535 C 463 74.069, 457.551 68.247, 453.168 67.030 C 447.838 65.550, 445.940 65.739, 440.966 68.250 M 214 96.655 L 214 110.311 228.678 109.644 C 245.186 108.894, 248.237 107.858, 251.305 101.966 C 253.518 97.715, 253.063 90.847, 250.368 87.821 C 246.840 83.860, 242.855 83, 228.032 83 L 214 83 214 96.655 M 567 96.585 L 567 110.311 581.678 109.644 C 599.063 108.854, 601.430 107.919, 604.440 100.657 C 606.243 96.306, 606.286 95.567, 604.954 91.796 C 602.341 84.400, 600.110 83.547, 582.431 83.180 L 567 82.859 567 96.585 M 14 88.661 C 4.703 92.037, 1 95.795, 1 101.856 C 1 105.355, 25.743 156.702, 28.593 159.116 C 35.277 164.778, 51 157.678, 51 148.998 C 51 144.921, 25.935 93.027, 22.906 90.833 C 20.146 88.834, 16.185 87.868, 14 88.661",
    redPath:
      "M 116.994 9.008 C 109.338 11.111, 104 16.209, 104 21.417 C 104 24.982, 127.796 75.083, 131.223 78.735 C 137.878 85.826, 154 78.577, 154 68.493 C 154 65.551, 129.836 14.460, 127.159 11.741 C 124.881 9.428, 120.123 8.149, 116.994 9.008",
  },
  /**
   * Official standalone 4-segment brand mark emblem (3 structural ribbons + 1 crimson red accent).
   * ViewBox: 0 0 160 168 (Aspect ratio ~0.95:1).
   */
  mark: {
    viewBox: "0 0 160 168",
    whitePath:
      "M 66.087 6.906 C 48.790 15.058, 48.612 16.486, 61.546 43.232 C 78.035 77.329, 88.744 99.588, 98.720 120.500 C 103.967 131.500, 109.259 141.546, 110.478 142.825 C 114.356 146.891, 119.291 146.728, 129.080 142.209 C 138.904 137.674, 142 134.495, 142 128.945 C 142 123.901, 86.699 8.601, 82.953 5.834 C 78.343 2.430, 75.154 2.633, 66.087 6.906 M 28 24.344 C 17.794 28.680, 14.048 31.007, 12.521 33.960 C 9.277 40.234, 7.294 35.591, 58.246 141.057 C 71.123 167.712, 72.398 168.527, 88.765 160.561 C 98.348 155.897, 101 153.052, 101 147.435 C 101 143.659, 44.189 26.170, 41.517 24.419 C 37.687 21.910, 33.780 21.888, 28 24.344 M 14 88.661 C 4.703 92.037, 1 95.795, 1 101.856 C 1 105.355, 25.743 156.702, 28.593 159.116 C 35.277 164.778, 51 157.678, 51 148.998 C 51 144.921, 25.935 93.027, 22.906 90.833 C 20.146 88.834, 16.185 87.868, 14 88.661",
    redPath:
      "M 116.994 9.008 C 109.338 11.111, 104 16.209, 104 21.417 C 104 24.982, 127.796 75.083, 131.223 78.735 C 137.878 85.826, 154 78.577, 154 68.493 C 154 65.551, 129.836 14.460, 127.159 11.741 C 124.881 9.428, 120.123 8.149, 116.994 9.008",
  },
} as const;

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
